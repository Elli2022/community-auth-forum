import bcrypt from "bcrypt";
import sanitizeHtml from "sanitize-html";
import { mapUserToResponse } from "../../db/map-user";
import type makeUsersRepository from "../../db/users-repository";
import type makeWallRepository from "../../db/wall-repository";

type UsersRepository = ReturnType<typeof makeUsersRepository>;
type WallRepository = ReturnType<typeof makeWallRepository>;

const sanitize = (text: string) =>
  sanitizeHtml(text, { allowedTags: [], allowedAttributes: {} });

function formatWallDate(value: Date | string) {
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleString("sv-SE");
}

export function createProfileGet({
  usersRepository,
  wallRepository,
  makeDataManipulation,
}: {
  usersRepository: UsersRepository;
  wallRepository: WallRepository;
  makeDataManipulation: () => { transformDate: (ts: number) => string };
}) {
  const dataManipulation = makeDataManipulation();

  return Object.freeze({
    get: async (username: string, viewerUsername?: string) => {
      const user = await usersRepository.findByUsername(username);
      if (!user) {
        throw new Error("user not found");
      }

      const posts = await wallRepository.findByUsername(username);
      const profile = mapUserToResponse(user, dataManipulation.transformDate);

      return {
        ...profile,
        posts: posts.map((p) => ({
          id: p.id,
          username: p.username,
          message: p.message,
          created: formatWallDate(p.created_at),
        })),
        isOwner: viewerUsername === username,
      };
    },
  });
}

export function createProfileUpdate({
  usersRepository,
  makeDataManipulation,
}: {
  usersRepository: UsersRepository;
  makeDataManipulation: () => { transformDate: (ts: number) => string };
}) {
  const dataManipulation = makeDataManipulation();

  return Object.freeze({
    update: async ({
      username,
      params,
    }: {
      username: string;
      params: Record<string, unknown>;
    }) => {
      const avatarRaw = params.avatar_id;
      const avatar_id =
        avatarRaw !== undefined ? Number(avatarRaw) : undefined;
      if (
        avatar_id !== undefined &&
        (!Number.isInteger(avatar_id) || avatar_id < 1 || avatar_id > 5)
      ) {
        throw new Error("avatar_id must be between 1 and 5");
      }

      const bio =
        typeof params.bio === "string"
          ? sanitize(params.bio).slice(0, 280)
          : undefined;
      const name =
        typeof params.name === "string" ? sanitize(params.name) : undefined;
      const surname =
        typeof params.surname === "string"
          ? sanitize(params.surname)
          : undefined;

      const row = await usersRepository.updateProfile(username, {
        avatar_id,
        bio,
        name,
        surname,
        modified: new Date().toISOString(),
      });

      return mapUserToResponse(row, dataManipulation.transformDate);
    },
  });
}

export function createProfileDelete({
  usersRepository,
}: {
  usersRepository: UsersRepository;
}) {
  return Object.freeze({
    delete: async ({
      username,
      params,
      errorMsgs,
    }: {
      username: string;
      params: Record<string, unknown>;
      errorMsgs: Record<string, string>;
    }) => {
      const password =
        typeof params.password === "string" ? params.password : "";
      if (!password) {
        throw new Error(errorMsgs.MISSING_PARAMETER + "password");
      }

      const user = await usersRepository.findByUsername(username);
      if (!user) {
        throw new Error("user not found");
      }

      const ok = bcrypt.compareSync(password, user.password_hash);
      if (!ok) {
        throw new Error(errorMsgs.INVALID_CREDENTIALS);
      }

      await usersRepository.deleteByUsername(username);
      return { deleted: true, username };
    },
  });
}
