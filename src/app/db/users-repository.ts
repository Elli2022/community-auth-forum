import type { SqlClient } from "./client";

export interface UserRecord {
  id: number;
  username: string;
  password_hash: string;
  email: string | null;
  name: string | null;
  surname: string | null;
  avatar_id: number;
  bio: string | null;
  avatar_type: string;
  avatar_image: string | null;
  cover_color: string;
  created_at: Date | string;
  modified_at: Date | string;
}

export interface CreateUserInput {
  username: string;
  password: string;
  email?: string;
  name?: string;
  surname?: string;
  avatar_id?: number;
  avatar_type?: string;
  avatar_image?: string | null;
  bio?: string;
  created: string;
  modified: string;
}

export interface UpdateUserInput {
  avatar_id?: number;
  avatar_type?: string;
  avatar_image?: string | null;
  cover_color?: string;
  bio?: string;
  name?: string;
  surname?: string;
  modified: string;
}

type Logger = { info: (message: string) => void };

export default function makeUsersRepository({
  sql,
  logger,
}: {
  sql: SqlClient;
  logger: Logger;
}) {
  return Object.freeze({
    findAll,
    findByUsername,
    findByUsernames,
    findByEmail,
    create,
    updateProfile,
    updatePassword,
    getAvatarImage,
    deleteByUsername,
    truncateAll,
  });

  async function findAll(): Promise<UserRecord[]> {
    logger.info("[DB][USERS] findAll - START");
    const rows = await sql`
      SELECT id, username, password_hash, email, name, surname,
             avatar_id, bio, avatar_type, avatar_image, cover_color,
             created_at, modified_at
      FROM users
      ORDER BY id ASC
    `;
    logger.info("[DB][USERS] findAll - DONE");
    return rows as UserRecord[];
  }

  async function findByUsername(username: string): Promise<UserRecord | null> {
    const rows = await sql`
      SELECT id, username, password_hash, email, name, surname,
             avatar_id, bio, avatar_type, avatar_image, cover_color,
             created_at, modified_at
      FROM users
      WHERE username = ${username}
      LIMIT 1
    `;
    return (rows[0] as UserRecord | undefined) ?? null;
  }

  async function findByUsernames(usernames: string[]): Promise<UserRecord[]> {
    if (usernames.length === 0) return [];
    const rows = await sql`
      SELECT id, username, password_hash, email, name, surname,
             avatar_id, bio, avatar_type, avatar_image, cover_color,
             created_at, modified_at
      FROM users
      WHERE username = ANY(${usernames})
    `;
    return rows as UserRecord[];
  }

  async function findByEmail(email: string): Promise<UserRecord | null> {
    const rows = await sql`
      SELECT id, username, password_hash, email, name, surname,
             avatar_id, bio, avatar_type, avatar_image, cover_color,
             created_at, modified_at
      FROM users
      WHERE LOWER(email) = LOWER(${email})
      LIMIT 1
    `;
    return (rows[0] as UserRecord | undefined) ?? null;
  }

  async function create(user: CreateUserInput): Promise<UserRecord> {
    logger.info(`[DB][USERS] create ${user.username} - START`);
    const rows = await sql`
      INSERT INTO users (
        username, password_hash, email, name, surname,
        avatar_id, bio, avatar_type, avatar_image, created_at, modified_at
      )
      VALUES (
        ${user.username},
        ${user.password},
        ${user.email ?? null},
        ${user.name ?? null},
        ${user.surname ?? null},
        ${user.avatar_id ?? 1},
        ${user.bio ?? ""},
        ${user.avatar_type ?? "preset"},
        ${user.avatar_image ?? null},
        ${user.created},
        ${user.modified}
      )
      RETURNING id, username, password_hash, email, name, surname,
                avatar_id, bio, avatar_type, avatar_image, cover_color,
                created_at, modified_at
    `;
    logger.info(`[DB][USERS] create ${user.username} - DONE`);
    return rows[0] as UserRecord;
  }

  async function updateProfile(
    username: string,
    data: UpdateUserInput
  ): Promise<UserRecord> {
    const current = await findByUsername(username);
    if (!current) throw new Error("user not found");

    const avatar_id = data.avatar_id ?? current.avatar_id;
    const avatar_type = data.avatar_type ?? current.avatar_type;
    const avatar_image =
      data.avatar_image !== undefined ? data.avatar_image : current.avatar_image;
    const cover_color = data.cover_color ?? current.cover_color;
    const bio = data.bio !== undefined ? data.bio : current.bio;
    const name = data.name !== undefined ? data.name : current.name;
    const surname = data.surname !== undefined ? data.surname : current.surname;

    const rows = await sql`
      UPDATE users
      SET
        avatar_id = ${avatar_id},
        avatar_type = ${avatar_type},
        avatar_image = ${avatar_image},
        cover_color = ${cover_color},
        bio = ${bio ?? ""},
        name = ${name},
        surname = ${surname},
        modified_at = ${data.modified}
      WHERE username = ${username}
      RETURNING id, username, password_hash, email, name, surname,
                avatar_id, bio, avatar_type, avatar_image, cover_color,
                created_at, modified_at
    `;
    return rows[0] as UserRecord;
  }

  async function updatePassword(username: string, password_hash: string): Promise<void> {
    await sql`
      UPDATE users
      SET password_hash = ${password_hash}, modified_at = NOW()
      WHERE username = ${username}
    `;
  }

  async function getAvatarImage(username: string): Promise<string | null> {
    const rows = await sql`
      SELECT avatar_image FROM users
      WHERE username = ${username} AND avatar_type = 'custom' AND avatar_image IS NOT NULL
      LIMIT 1
    `;
    return (rows[0] as { avatar_image: string } | undefined)?.avatar_image ?? null;
  }

  async function deleteByUsername(username: string): Promise<void> {
    await sql`DELETE FROM users WHERE username = ${username}`;
  }

  async function truncateAll(): Promise<void> {
    await sql`TRUNCATE TABLE users RESTART IDENTITY CASCADE`;
  }
}
