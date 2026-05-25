import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET ?? "change-me-in-production";

export interface AuthPayload {
  sub: string;
}

export function signAuthToken(username: string): string {
  return jwt.sign({ sub: username }, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyAuthToken(token: string): AuthPayload {
  const payload = jwt.verify(token, JWT_SECRET) as AuthPayload;
  if (!payload?.sub) {
    throw new Error("Invalid token");
  }
  return payload;
}
