import path from "node:path";

const isServerless = Boolean(
  process.env.NETLIFY ||
    process.env.NETLIFY_DEV ||
    process.env.AWS_LAMBDA_FUNCTION_NAME
);

const PROJECT_ROOT = isServerless
  ? "/tmp"
  : path.resolve(__dirname, "../..");

const FILE_FOLDER_NAME = "data";
const FILE_FOLDER_PATH = path.join(PROJECT_ROOT, FILE_FOLDER_NAME);
const FILE_DB_NAME = "users.json";
const FILE_DB_PATH = path.join(FILE_FOLDER_PATH, FILE_DB_NAME);

const ERROR_MSG = {
  post: {
    NO_DATA: "no data to insert",
    EXISTING_USER: "user already exists",
    INVALID_EMAIL: "Provided email is invalid",
    INVALID_STRING: "Invalid string for ",
    MISSING_PARAMETER: "Needed parameter missing.",
  },
};

const TEST_DATA = {
  user1: { username: "user1", password: "password" },
  user2: { username: "user2", password: "password" },
  user3: { username: "user3", password: "password" },
};

export default Object.freeze({
  APP_NAME: process.env.NODE_NAME ?? "authentication-ms",
  ERROR_MSG,
  NODE_ENV: process.env.NODE_ENV ?? "development",
  NODE_HOSTNAME: process.env.NODE_HOSTNAME ?? "127.0.0.1",
  NODE_PORT: Number(process.env.NODE_PORT ?? 3000),
  FILE_FOLDER_NAME,
  FILE_FOLDER_PATH,
  FILE_DB_NAME,
  FILE_DB_PATH,
  TEST_DATA,
});
