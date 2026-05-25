import "dotenv/config";
import config from "../config";
import { server } from "./initializers/express";
import { logger } from "./libs/logger";

try {
  logger.info(`[${config.APP_NAME}] Bootstrapping microservice`);
  server({ hostname: config.NODE_HOSTNAME, port: config.NODE_PORT });
} catch (error) {
  logger.error(`[${config.APP_NAME}] Caught exception: ${error}`);
}
