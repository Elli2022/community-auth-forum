import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { expect } from "chai";
import {
  checkDir,
  readFromFile,
  writeToFile,
} from "../../app/component/data-access/index";
import createGet from "../../app/component/use-cases/get";
import { logger } from "../../app/libs/logger";
import config from "../../config";

const get = (params: { params?: unknown }) =>
  createGet({
    checkDir,
    readFromFile,
    logger,
  }).get(params, config.FILE_DB_PATH, config.FILE_DB_NAME);

describe("get", () => {
  before(async () => {
    const users = [config.TEST_DATA.user1, config.TEST_DATA.user2];
    await mkdir(config.FILE_FOLDER_PATH, { recursive: true });
    await writeFile(config.FILE_DB_PATH, JSON.stringify(users));
  });

  after(async () => rm(config.FILE_FOLDER_PATH, { recursive: true, force: true }));

  it("should return a list of users", async () => {
    const results = await get({ params: undefined });
    expect(results).to.have.length(2);
  });
});
