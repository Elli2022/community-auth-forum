import config from "../../../config";
import { logger } from "../../libs/logger";
import { createApp } from "../../create-app";

const server = ({
  hostname,
  port,
}: {
  hostname?: string;
  port?: number;
} = {}) => {
  const app = createApp();
  const listenHost = hostname ?? config.NODE_HOSTNAME;
  const listenPort = port ?? config.NODE_PORT;

  app.listen(listenPort, listenHost, () => {
    logger.info(`[EXPRESS] Server running at http://${listenHost}:${listenPort}`);
  });
};

export { server, createApp };
