import sanitizeHtml from "sanitize-html";
import { parseDataUrl } from "../../libs/image";
import { enrichPosts } from "../../db/enrich-posts";
import type makeUsersRepository from "../../db/users-repository";
import type makeWallRepository from "../../db/wall-repository";
import type makeSocialRepository from "../../db/social-repository";

type UsersRepository = ReturnType<typeof makeUsersRepository>;
type WallRepository = ReturnType<typeof makeWallRepository>;
type SocialRepository = ReturnType<typeof makeSocialRepository>;

const sanitize = (text: string) =>
  sanitizeHtml(text, { allowedTags: [], allowedAttributes: {} });

export function createWallGet({
  wallRepository,
  usersRepository,
  socialRepository,
  makeDataManipulation,
  logger,
}: {
  wallRepository: WallRepository;
  usersRepository: UsersRepository;
  socialRepository: SocialRepository;
  makeDataManipulation: () => { transformDate: (ts: number) => string };
  logger: { info: (message: string) => void };
}) {
  const dataManipulation = makeDataManipulation();

  return Object.freeze({
    get: async (viewerUsername?: string) => {
      logger.info("[USE-CASE][WALL][GET] - START");
      const posts = await wallRepository.findAll();
      const authors = [...new Set(posts.map((p) => p.username))];
      const users = await usersRepository.findByUsernames(authors);
      const usersByName = new Map(users.map((u) => [u.username, u]));
      const result = await enrichPosts({
        posts,
        usersByName,
        socialRepository,
        viewerUsername,
        transformDate: dataManipulation.transformDate,
      });
      logger.info("[USE-CASE][WALL][GET] - DONE");
      return result;
    },
  });
}

export function createWallPost({
  wallRepository,
  usersRepository,
  socialRepository,
  makeDataManipulation,
  logger,
}: {
  wallRepository: WallRepository;
  usersRepository: UsersRepository;
  socialRepository: SocialRepository;
  makeDataManipulation: () => { transformDate: (ts: number) => string };
  logger: { info: (message: string) => void };
}) {
  const dataManipulation = makeDataManipulation();

  return Object.freeze({
    post: async ({
      authUsername,
      params,
      errorMsgs,
    }: {
      authUsername: string;
      params: Record<string, unknown>;
      errorMsgs: Record<string, string>;
    }) => {
      const rawMessage =
        typeof params.message === "string" ? params.message.trim() : "";
      const imageRaw =
        typeof params.image_data === "string" ? params.image_data.trim() : "";

      if (!rawMessage && !imageRaw) {
        throw new Error(errorMsgs.WALL_MESSAGE_REQUIRED);
      }
      if (rawMessage.length > 500) {
        throw new Error("message must be 500 characters or less");
      }

      const user = await usersRepository.findByUsername(authUsername);
      if (!user) {
        throw new Error(errorMsgs.WALL_USER_NOT_FOUND);
      }

      let image_data: string | null = null;
      if (imageRaw) {
        parseDataUrl(imageRaw);
        image_data = imageRaw;
      }

      const message = rawMessage ? sanitize(rawMessage) : "";
      logger.info(`[USE-CASE][WALL][POST] @${authUsername} - START`);
      const row = await wallRepository.create({
        username: authUsername,
        message: message || " ",
        image_data,
      });
      logger.info(`[USE-CASE][WALL][POST] @${authUsername} - DONE`);

      const usersByName = new Map([[user.username, user]]);
      const enriched = await enrichPosts({
        posts: [row],
        usersByName,
        socialRepository,
        viewerUsername: authUsername,
        transformDate: dataManipulation.transformDate,
      });
      return enriched[0];
    },
  });
}
