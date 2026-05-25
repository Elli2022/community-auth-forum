import type { Express, RequestHandler } from "express";

interface Route {
  path: string;
  method: "get" | "post" | "put" | "delete" | "patch";
  component: RequestHandler;
}

interface ServerOptions {
  json: () => RequestHandler;
  urlencoded: (options: { extended: boolean }) => RequestHandler;
  app: Express;
  handler: { routes: Route[] };
  cors: typeof import("cors");
  compression: typeof import("compression");
  helmet: () => RequestHandler;
  listen?: boolean;
  hostname?: string;
  port?: number;
  logger?: { info: (message: string) => void };
}

export default function configureApp(options: ServerOptions) {
  options.app.use(options.helmet());
  options.app.use(options.cors());
  options.app.use(options.compression());
  options.app.use(options.json());
  options.app.use(options.urlencoded({ extended: true }));

  options.app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  for (const route of options.handler.routes) {
    options.app[route.method](route.path, route.component);
  }

  if (options.listen !== false && options.logger) {
    const hostname = options.hostname ?? "127.0.0.1";
    const port = options.port ?? 3000;
    options.app.listen(port, hostname, () => {
      options.logger?.info(
        `[EXPRESS] Server running at http://${hostname}:${port}`
      );
    });
  }
}
