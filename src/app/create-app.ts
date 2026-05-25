import compression from "compression";
import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import { routes } from "./component/controller";
import configureApp from "./initializers/express/libs/express";

export function createApp(): Express {
  const app = express();

  configureApp({
    json: express.json,
    urlencoded: express.urlencoded,
    app,
    handler: { routes },
    cors,
    compression,
    helmet,
    listen: false,
  });

  return app;
}
