import type { Response, NextFunction } from "express";
import { verifyAuthToken } from "../libs/auth";
import type { AuthedRequest } from "./require-auth";

export function optionalAuth(
  req: AuthedRequest,
  _res: Response,
  next: NextFunction
) {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    try {
      req.authUsername = verifyAuthToken(header.slice(7)).sub;
    } catch {
      req.authUsername = undefined;
    }
  }
  next();
}
