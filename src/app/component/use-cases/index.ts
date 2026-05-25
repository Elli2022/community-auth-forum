import config from "../../../config";
import { checkDir, readFromFile, writeToFile } from "../data-access";
import { makeInputObj } from "../entities";
import makeDataManipulation from "../entities/data-manipulation";
import { logger } from "../../libs/logger";
import createGet from "./get";
import createPost from "./post";

const fileDirName = config.FILE_FOLDER_NAME;
const fileDirPath = config.FILE_FOLDER_PATH;
const filename = config.FILE_DB_NAME;
const filePath = config.FILE_DB_PATH;
const errorMsgs = config.ERROR_MSG;

const post = ({ params }: { params: Record<string, unknown> }) =>
  createPost({
    makeDataManipulation,
    makeInputObj,
    checkDir,
    writeToFile,
    readFromFile,
    logger,
  }).post({ params, filename, fileDirPath, fileDirName, filePath, errorMsgs });

const get = ({ params }: { params: unknown }) =>
  createGet({
    checkDir,
    readFromFile,
    logger,
  }).get(params, filePath, filename);

export { post, get };
