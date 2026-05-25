const ERROR_MSG = {
  post: {
    NO_DATA: "no data to insert",
    EXISTING_USER: "user already exists",
    EXISTING_EMAIL: "email already registered",
    WALL_USER_NOT_FOUND: "username must be registered before posting",
    WALL_MESSAGE_REQUIRED: "message is required",
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
  TEST_DATA,
});
