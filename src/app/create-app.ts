import compression from "compression";
import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import path from "path";
import { routes } from "./component/controller";
import configureApp from "./initializers/express/libs/express";

export function createApp(): Express {
  const app = express();

  configureApp({
    json: () => express.json({ limit: "3mb" }),
    urlencoded: express.urlencoded,
    app,
    handler: { routes },
    cors,
    compression,
    helmet: () =>
      helmet({
        crossOriginResourcePolicy: { policy: "cross-origin" },
      }),
    listen: false,
  });

  if (!process.env.NETLIFY) {
    const publicDir = path.join(process.cwd(), "public");
    app.use(express.static(publicDir));
  }

  return app;
}
