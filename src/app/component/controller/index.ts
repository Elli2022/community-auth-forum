import type { Response } from "express";
import { logger } from "../../libs/logger";
import {
  post,
  get,
  getWall,
  postWall,
  login,
  getProfile,
  updateProfile,
  deleteProfile,
} from "../use-cases";
import {
  requireAuth,
  requireSelf,
  type AuthedRequest,
} from "../../middleware/require-auth";
import { optionalAuth } from "../../middleware/optional-auth";

const baseUrl = "/api/v1";

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "Ett oväntat fel inträffade";
}

function stripPassword<T extends Record<string, unknown>>(user: T): Omit<T, "password"> {
  const { password: _removed, ...safe } = user;
  return safe;
}

function stripPasswords(users: unknown): unknown[] {
  if (!Array.isArray(users)) return [];
  return users.map((u) =>
    typeof u === "object" && u !== null
      ? stripPassword(u as Record<string, unknown>)
      : u
  );
}

const getEP = async (_req: AuthedRequest, res: Response) => {
  try {
    const results = await get();
    res.json({ err: 0, data: stripPasswords(results) });
  } catch (err) {
    logger.info(`[EP][GET] ${errorMessage(err)}`);
    res.status(400).json({ err: 1, message: errorMessage(err) });
  }
};

const postEP = async (req: AuthedRequest, res: Response) => {
  try {
    const results = await post({ params: req.body });
    res.status(201).json({
      err: 0,
      data: stripPassword(results as Record<string, unknown>),
    });
  } catch (err) {
    logger.info(`[EP][POST] ${errorMessage(err)}`);
    res.status(400).json({ err: 1, message: errorMessage(err) });
  }
};

const loginEP = async (req: AuthedRequest, res: Response) => {
  try {
    const results = await login({ params: req.body });
    res.json({ err: 0, data: results });
  } catch (err) {
    const msg = errorMessage(err);
    const invalid =
      msg === "Invalid credentials" || msg.includes("Invalid credentials");
    res.status(invalid ? 401 : 400).json({
      err: 1,
      message: invalid ? "Fel användarnamn eller lösenord" : msg,
    });
  }
};

function routeUsername(req: AuthedRequest): string {
  const u = req.params.username;
  return Array.isArray(u) ? u[0] : u;
}

const getProfileEP = async (req: AuthedRequest, res: Response) => {
  try {
    const username = routeUsername(req);
    const results = await getProfile(username, req.authUsername);
    res.json({ err: 0, data: results });
  } catch (err) {
    const msg = errorMessage(err);
    res.status(msg.includes("not found") ? 404 : 400).json({
      err: 1,
      message: msg.includes("not found") ? "Användaren finns inte" : msg,
    });
  }
};

const patchProfileEP = async (req: AuthedRequest, res: Response) => {
  try {
    const results = await updateProfile(routeUsername(req), req.body);
    res.json({ err: 0, data: results });
  } catch (err) {
    res.status(400).json({ err: 1, message: errorMessage(err) });
  }
};

const deleteProfileEP = async (req: AuthedRequest, res: Response) => {
  try {
    const results = await deleteProfile(routeUsername(req), req.body);
    res.json({ err: 0, data: results });
  } catch (err) {
    const msg = errorMessage(err);
    res.status(400).json({ err: 1, message: msg });
  }
};

const getWallEP = async (_req: AuthedRequest, res: Response) => {
  try {
    const results = await getWall();
    res.json({ err: 0, data: results });
  } catch (err) {
    res.status(400).json({ err: 1, message: errorMessage(err) });
  }
};

const postWallEP = async (req: AuthedRequest, res: Response) => {
  try {
    const results = await postWall({ params: req.body });
    res.status(201).json({ err: 0, data: results });
  } catch (err) {
    res.status(400).json({ err: 1, message: errorMessage(err) });
  }
};

const routes = [
  { path: `${baseUrl}/auth/login`, method: "post" as const, component: loginEP },
  {
    path: `${baseUrl}/users/:username`,
    method: "get" as const,
    component: [optionalAuth, getProfileEP],
  },
  {
    path: `${baseUrl}/users/:username`,
    method: "patch" as const,
    component: [requireAuth, requireSelf, patchProfileEP],
  },
  {
    path: `${baseUrl}/users/:username`,
    method: "delete" as const,
    component: [requireAuth, requireSelf, deleteProfileEP],
  },
  { path: `${baseUrl}/wall`, method: "get" as const, component: getWallEP },
  { path: `${baseUrl}/wall`, method: "post" as const, component: postWallEP },
  { path: `${baseUrl}/`, method: "get" as const, component: getEP },
  { path: `${baseUrl}/`, method: "post" as const, component: postEP },
];

export { routes };
