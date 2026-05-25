import type { Request, Response, NextFunction } from "express";
import { verifyAuthToken } from "../libs/auth";

export interface AuthedRequest extends Request {
  authUsername?: string;
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ err: 1, message: "Inloggning krävs" });
    return;
  }
  try {
    const payload = verifyAuthToken(header.slice(7));
    req.authUsername = payload.sub;
    next();
  } catch {
    res.status(401).json({ err: 1, message: "Ogiltig eller utgången session" });
  }
}

export function requireSelf(
  req: AuthedRequest,
  res: Response,
  next: NextFunction
) {
  const raw = req.params.username;
  const target = Array.isArray(raw) ? raw[0] : raw;
  if (!req.authUsername || req.authUsername !== target) {
    res.status(403).json({
      err: 1,
      message: "Du kan bara ändra eller radera din egen profil",
    });
    return;
  }
  next();
}
