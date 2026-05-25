import { getSql } from "../../db/client";
import makeWallRepository from "../../db/wall-repository";
import { logger } from "../../libs/logger";

const wallRepository = makeWallRepository({
  sql: getSql(),
  logger,
});

export { wallRepository };
