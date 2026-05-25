import type { SqlClient } from "./client";
import { randomBytes } from "crypto";

export interface ResetTokenRecord {
  id: number;
  username: string;
  token: string;
  expires_at: Date | string;
  used_at: Date | string | null;
}

function asRows<T>(result: unknown): T[] {
  return Array.isArray(result) ? (result as T[]) : [];
}

export default function makeRecoveryRepository({ sql }: { sql: SqlClient }) {
  return Object.freeze({
    createResetToken,
    findValidToken,
    markTokenUsed,
  });

  async function createResetToken(username: string): Promise<string> {
    const token = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    await sql`
      UPDATE password_reset_tokens SET used_at = NOW()
      WHERE username = ${username} AND used_at IS NULL
    `;
    await sql`
      INSERT INTO password_reset_tokens (username, token, expires_at)
      VALUES (${username}, ${token}, ${expires})
    `;
    return token;
  }

  async function findValidToken(token: string): Promise<ResetTokenRecord | null> {
    const rows = asRows<ResetTokenRecord>(await sql`
      SELECT id, username, token, expires_at, used_at
      FROM password_reset_tokens
      WHERE token = ${token} AND used_at IS NULL
        AND expires_at > NOW()
      LIMIT 1
    `);
    return rows[0] ?? null;
  }

  async function markTokenUsed(token: string): Promise<void> {
    await sql`
      UPDATE password_reset_tokens SET used_at = NOW() WHERE token = ${token}
    `;
  }
}
