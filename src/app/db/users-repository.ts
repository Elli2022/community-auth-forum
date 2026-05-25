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
  bio?: string;
  created: string;
  modified: string;
}

export interface UpdateUserInput {
  avatar_id?: number;
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
    findByEmail,
    create,
    updateProfile,
    deleteByUsername,
    truncateAll,
  });

  async function findAll(): Promise<UserRecord[]> {
    logger.info("[DB][USERS] findAll - START");
    const rows = await sql`
      SELECT id, username, password_hash, email, name, surname,
             avatar_id, bio, created_at, modified_at
      FROM users
      ORDER BY id ASC
    `;
    logger.info("[DB][USERS] findAll - DONE");
    return rows as UserRecord[];
  }

  async function findByUsername(username: string): Promise<UserRecord | null> {
    const rows = await sql`
      SELECT id, username, password_hash, email, name, surname,
             avatar_id, bio, created_at, modified_at
      FROM users
      WHERE username = ${username}
      LIMIT 1
    `;
    return (rows[0] as UserRecord | undefined) ?? null;
  }

  async function findByEmail(email: string): Promise<UserRecord | null> {
    const rows = await sql`
      SELECT id, username, password_hash, email, name, surname,
             avatar_id, bio, created_at, modified_at
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
        avatar_id, bio, created_at, modified_at
      )
      VALUES (
        ${user.username},
        ${user.password},
        ${user.email ?? null},
        ${user.name ?? null},
        ${user.surname ?? null},
        ${user.avatar_id ?? 1},
        ${user.bio ?? ""},
        ${user.created},
        ${user.modified}
      )
      RETURNING id, username, password_hash, email, name, surname,
                avatar_id, bio, created_at, modified_at
    `;
    logger.info(`[DB][USERS] create ${user.username} - DONE`);
    return rows[0] as UserRecord;
  }

  async function updateProfile(
    username: string,
    data: UpdateUserInput
  ): Promise<UserRecord> {
    const rows = await sql`
      UPDATE users
      SET
        avatar_id = COALESCE(${data.avatar_id ?? null}, avatar_id),
        bio = COALESCE(${data.bio ?? null}, bio),
        name = COALESCE(${data.name ?? null}, name),
        surname = COALESCE(${data.surname ?? null}, surname),
        modified_at = ${data.modified}
      WHERE username = ${username}
      RETURNING id, username, password_hash, email, name, surname,
                avatar_id, bio, created_at, modified_at
    `;
    return rows[0] as UserRecord;
  }

  async function deleteByUsername(username: string): Promise<void> {
    await sql`DELETE FROM users WHERE username = ${username}`;
  }

  async function truncateAll(): Promise<void> {
    await sql`TRUNCATE TABLE users RESTART IDENTITY CASCADE`;
  }
}
