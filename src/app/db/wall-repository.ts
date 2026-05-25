import type { SqlClient } from "./client";

export interface WallPostRecord {
  id: number;
  username: string;
  message: string;
  created_at: Date | string;
}

type Logger = { info: (message: string) => void };

export default function makeWallRepository({
  sql,
  logger,
}: {
  sql: SqlClient;
  logger: Logger;
}) {
  return Object.freeze({ findAll, findByUsername, create });

  async function findAll(): Promise<WallPostRecord[]> {
    logger.info("[DB][WALL] findAll - START");
    const rows = await sql`
      SELECT id, username, message, created_at
      FROM wall_posts
      ORDER BY created_at DESC
      LIMIT 100
    `;
    logger.info("[DB][WALL] findAll - DONE");
    return rows as WallPostRecord[];
  }

  async function findByUsername(username: string): Promise<WallPostRecord[]> {
    const rows = await sql`
      SELECT id, username, message, created_at
      FROM wall_posts
      WHERE username = ${username}
      ORDER BY created_at DESC
      LIMIT 50
    `;
    return rows as WallPostRecord[];
  }

  async function create({
    username,
    message,
  }: {
    username: string;
    message: string;
  }): Promise<WallPostRecord> {
    logger.info(`[DB][WALL] create @${username} - START`);
    const rows = await sql`
      INSERT INTO wall_posts (username, message)
      VALUES (${username}, ${message})
      RETURNING id, username, message, created_at
    `;
    logger.info(`[DB][WALL] create @${username} - DONE`);
    return rows[0] as WallPostRecord;
  }
}
