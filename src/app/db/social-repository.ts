import type { SqlClient } from "./client";

export interface CommentRecord {
  id: number;
  post_id: number;
  username: string;
  message: string;
  created_at: Date | string;
}

export interface DeletedCommentRecord {
  id: number;
  post_id: number;
}

export interface FriendshipRecord {
  id: number;
  user_a: string;
  user_b: string;
  status: string;
  requested_by: string;
  created_at: Date | string;
}

function pairKey(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

function asRows<T>(result: unknown): T[] {
  return Array.isArray(result) ? (result as T[]) : [];
}

export default function makeSocialRepository({ sql }: { sql: SqlClient }) {
  return Object.freeze({
    toggleLike,
    getLikeCounts,
    getLikedByViewer,
    addComment,
    deleteCommentByIdForUser,
    getCommentsForPosts,
    sendFriendRequest,
    acceptFriendRequest,
    removeFriendship,
    listFriends,
    listPendingIncoming,
    listPendingOutgoing,
    areFriends,
    getFriendUsernames,
  });

  async function toggleLike(postId: number, username: string): Promise<boolean> {
    const existing = asRows<{ ok: number }>(await sql`
      SELECT 1 FROM post_likes
      WHERE post_id = ${postId} AND username = ${username}
      LIMIT 1
    `);
    if (existing.length > 0) {
      await sql`
        DELETE FROM post_likes
        WHERE post_id = ${postId} AND username = ${username}
      `;
      return false;
    }
    await sql`
      INSERT INTO post_likes (post_id, username)
      VALUES (${postId}, ${username})
    `;
    return true;
  }

  async function getLikeCounts(
    postIds: number[]
  ): Promise<Map<number, number>> {
    const map = new Map<number, number>();
    if (postIds.length === 0) return map;
    const rows = asRows<{ post_id: number; cnt: number }>(await sql`
      SELECT post_id, COUNT(*)::int AS cnt
      FROM post_likes
      WHERE post_id = ANY(${postIds})
      GROUP BY post_id
    `);
    for (const r of rows) {
      map.set(r.post_id, r.cnt);
    }
    return map;
  }

  async function getLikedByViewer(
    postIds: number[],
    username?: string
  ): Promise<Set<number>> {
    const set = new Set<number>();
    if (!username || postIds.length === 0) return set;
    const rows = asRows<{ post_id: number }>(await sql`
      SELECT post_id FROM post_likes
      WHERE post_id = ANY(${postIds}) AND username = ${username}
    `);
    for (const r of rows) set.add(r.post_id);
    return set;
  }

  async function addComment({
    postId,
    username,
    message,
  }: {
    postId: number;
    username: string;
    message: string;
  }): Promise<CommentRecord> {
    const rows = await sql`
      INSERT INTO post_comments (post_id, username, message)
      VALUES (${postId}, ${username}, ${message})
      RETURNING id, post_id, username, message, created_at
    `;
    return rows[0] as CommentRecord;
  }

  async function getCommentsForPosts(
    postIds: number[]
  ): Promise<Map<number, CommentRecord[]>> {
    const map = new Map<number, CommentRecord[]>();
    if (postIds.length === 0) return map;
    const rows = asRows<CommentRecord>(await sql`
      SELECT id, post_id, username, message, created_at
      FROM post_comments
      WHERE post_id = ANY(${postIds})
      ORDER BY created_at ASC
    `);
    for (const r of rows) {
      const list = map.get(r.post_id) ?? [];
      list.push(r);
      map.set(r.post_id, list);
    }
    return map;
  }

  async function deleteCommentByIdForUser(
    commentId: number,
    username: string
  ): Promise<DeletedCommentRecord | null> {
    const rows = asRows<DeletedCommentRecord>(await sql`
      DELETE FROM post_comments
      WHERE id = ${commentId} AND username = ${username}
      RETURNING id, post_id
    `);
    return rows[0] ?? null;
  }

  async function sendFriendRequest(
    from: string,
    to: string
  ): Promise<FriendshipRecord> {
    if (from === to) throw new Error("Du kan inte lägga till dig själv");
    const [user_a, user_b] = pairKey(from, to);
    const existing = asRows<FriendshipRecord>(await sql`
      SELECT id, user_a, user_b, status, requested_by, created_at
      FROM friendships
      WHERE user_a = ${user_a} AND user_b = ${user_b}
      LIMIT 1
    `);
    if (existing.length > 0) {
      const row = existing[0];
      if (row.status === "accepted") throw new Error("Ni är redan vänner");
      throw new Error("Vänförfrågan finns redan");
    }
    const rows = await sql`
      INSERT INTO friendships (user_a, user_b, status, requested_by)
      VALUES (${user_a}, ${user_b}, 'pending', ${from})
      RETURNING id, user_a, user_b, status, requested_by, created_at
    `;
    return rows[0] as FriendshipRecord;
  }

  async function acceptFriendRequest(
    accepter: string,
    other: string
  ): Promise<void> {
    const [user_a, user_b] = pairKey(accepter, other);
    const rows = asRows<{ id: number }>(await sql`
      UPDATE friendships
      SET status = 'accepted'
      WHERE user_a = ${user_a} AND user_b = ${user_b}
        AND status = 'pending'
        AND requested_by = ${other}
      RETURNING id
    `);
    if (rows.length === 0) {
      throw new Error("Ingen väntande förfrågan hittades");
    }
  }

  async function removeFriendship(a: string, b: string): Promise<void> {
    const [user_a, user_b] = pairKey(a, b);
    await sql`
      DELETE FROM friendships
      WHERE user_a = ${user_a} AND user_b = ${user_b}
    `;
  }

  async function listFriends(username: string): Promise<string[]> {
    const rows = asRows<{ user_a: string; user_b: string }>(await sql`
      SELECT user_a, user_b FROM friendships
      WHERE status = 'accepted'
        AND (${username} = user_a OR ${username} = user_b)
    `);
    return rows.map((r) =>
      r.user_a === username ? r.user_b : r.user_a
    );
  }

  async function listPendingIncoming(username: string): Promise<string[]> {
    const rows = asRows<{ user_a: string; user_b: string }>(await sql`
      SELECT user_a, user_b, requested_by FROM friendships
      WHERE status = 'pending'
        AND (${username} = user_a OR ${username} = user_b)
        AND requested_by != ${username}
    `);
    return rows.map((r) => (r.user_a === username ? r.user_b : r.user_a));
  }

  async function listPendingOutgoing(username: string): Promise<string[]> {
    const rows = asRows<{ user_a: string; user_b: string }>(await sql`
      SELECT user_a, user_b FROM friendships
      WHERE status = 'pending' AND requested_by = ${username}
    `);
    return rows.map((r) =>
      r.user_a === username ? r.user_b : r.user_a
    );
  }

  async function areFriends(a: string, b: string): Promise<boolean> {
    const [user_a, user_b] = pairKey(a, b);
    const rows = asRows<{ ok: number }>(await sql`
      SELECT 1 FROM friendships
      WHERE user_a = ${user_a} AND user_b = ${user_b} AND status = 'accepted'
      LIMIT 1
    `);
    return rows.length > 0;
  }

  async function getFriendUsernames(username: string): Promise<string[]> {
    const friends: string[] = await listFriends(username);
    return [username, ...friends];
  }
}
