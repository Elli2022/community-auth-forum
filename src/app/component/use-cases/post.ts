import sanitizeHtml from "sanitize-html";
import { parseDataUrl } from "../../libs/image";
import { mapUserToResponse } from "../../db/map-user";
import type makeUsersRepository from "../../db/users-repository";

type UsersRepository = ReturnType<typeof makeUsersRepository>;

const sanitize = (text: string) =>
  sanitizeHtml(text, { allowedTags: [], allowedAttributes: {} });

function parseAvatarId(value: unknown): number {
  const n = Number(value ?? 1);
  if (!Number.isInteger(n) || n < 1 || n > 5) {
    throw new Error("avatar_id must be between 1 and 5");
  }
  return n;
}

export default function createPost({
  makeInputObj,
  usersRepository,
  makeDataManipulation,
  logger,
}: {
  makeInputObj: (args: { params: Record<string, unknown> }) => {
    username: () => string;
    password: () => string;
    email: () => string;
    name: () => string;
    surname: () => string;
    created: () => unknown;
    modified: () => unknown;
  };
  usersRepository: UsersRepository;
  makeDataManipulation: () => { transformDate: (ts: number) => string };
  logger: { info: (message: string) => void };
}) {
  const dataManipulation = makeDataManipulation();

  return Object.freeze({ post });

  async function post({
    params,
    errorMsgs,
  }: {
    params: Record<string, unknown>;
    errorMsgs: Record<string, string>;
  }) {
    try {
      logger.info("[USE-CASE][POST] Inserting user to database - START");

      if (!params || Object.keys(params).length === 0) {
        throw new Error(errorMsgs.NO_DATA);
      }

      const userFactory = makeInputObj({ params });
      const avatar_id = parseAvatarId(params.avatar_id);
      const bio =
        typeof params.bio === "string"
          ? sanitize(params.bio).slice(0, 280)
          : "";

      const createdMs = Number(userFactory.created());
      const modifiedMs = Number(userFactory.modified());

      let avatar_type = "preset";
      let avatar_image: string | null = null;
      if (
        typeof params.avatar_image === "string" &&
        params.avatar_image.trim()
      ) {
        parseDataUrl(params.avatar_image);
        avatar_type = "custom";
        avatar_image = params.avatar_image.trim();
      }

      const userInput = {
        username: userFactory.username(),
        password: userFactory.password(),
        avatar_id,
        avatar_type,
        avatar_image,
        bio,
        created: new Date(createdMs).toISOString(),
        modified: new Date(modifiedMs).toISOString(),
      } as {
        username: string;
        password: string;
        avatar_id: number;
        avatar_type: string;
        avatar_image: string | null;
        bio: string;
        created: string;
        modified: string;
        email?: string;
        name?: string;
        surname?: string;
      };

      if (params.email !== undefined) userInput.email = userFactory.email();
      if (params.name !== undefined) userInput.name = userFactory.name();
      if (params.surname !== undefined) userInput.surname = userFactory.surname();

      const existingUser = await usersRepository.findByUsername(userInput.username);
      if (existingUser) {
        throw new Error(errorMsgs.EXISTING_USER);
      }

      if (userInput.email) {
        const existingEmail = await usersRepository.findByEmail(userInput.email);
        if (existingEmail) {
          throw new Error(errorMsgs.EXISTING_EMAIL);
        }
      }

      const row = await usersRepository.create(userInput);
      logger.info("[USE-CASE][POST] Inserting user to database - DONE");
      return mapUserToResponse(row, dataManipulation.transformDate);
    } catch (e) {
      logger.info("[USE-CASE][POST] Inserting user to database - FAILED");
      throw e;
    }
  }
}
