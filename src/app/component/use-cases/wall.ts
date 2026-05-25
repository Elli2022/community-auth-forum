import sanitizeHtml from "sanitize-html";
import type makeUsersRepository from "../../db/users-repository";
import type makeWallRepository from "../../db/wall-repository";

type UsersRepository = ReturnType<typeof makeUsersRepository>;
type WallRepository = ReturnType<typeof makeWallRepository>;

const sanitize = (text: string) =>
  sanitizeHtml(text, { allowedTags: [], allowedAttributes: {} });

export function createWallGet({
  wallRepository,
  logger,
}: {
  wallRepository: WallRepository;
  logger: { info: (message: string) => void };
}) {
  return Object.freeze({
    get: async () => {
      logger.info("[USE-CASE][WALL][GET] - START");
      const posts = await wallRepository.findAll();
      logger.info("[USE-CASE][WALL][GET] - DONE");
      return posts.map((post) => ({
        id: post.id,
        username: post.username,
        message: post.message,
        created: formatWallDate(post.created_at),
      }));
    },
  });
}

export function createWallPost({
  wallRepository,
  usersRepository,
  logger,
}: {
  wallRepository: WallRepository;
  usersRepository: UsersRepository;
  logger: { info: (message: string) => void };
}) {
  return Object.freeze({
    post: async ({
      params,
      errorMsgs,
    }: {
      params: Record<string, unknown>;
      errorMsgs: Record<string, string>;
    }) => {
      const username =
        typeof params.username === "string" ? params.username.trim() : "";
      const rawMessage =
        typeof params.message === "string" ? params.message.trim() : "";

      if (!username) {
        throw new Error(`${errorMsgs.MISSING_PARAMETER}username`);
      }
      if (!rawMessage) {
        throw new Error(errorMsgs.WALL_MESSAGE_REQUIRED);
      }
      if (rawMessage.length > 500) {
        throw new Error("message must be 500 characters or less");
      }

      const user = await usersRepository.findByUsername(username);
      if (!user) {
        throw new Error(errorMsgs.WALL_USER_NOT_FOUND);
      }

      const message = sanitize(rawMessage);
      logger.info(`[USE-CASE][WALL][POST] @${username} - START`);
      const row = await wallRepository.create({ username, message });
      logger.info(`[USE-CASE][WALL][POST] @${username} - DONE`);

      return {
        id: row.id,
        username: row.username,
        message: row.message,
        created: formatWallDate(row.created_at),
      };
    },
  });
}

function formatWallDate(value: Date | string) {
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleString("sv-SE");
}
