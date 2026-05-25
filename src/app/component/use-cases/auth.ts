import bcrypt from "bcrypt";
import { signAuthToken } from "../../libs/auth";
import { mapUserToResponse } from "../../db/map-user";
import type makeUsersRepository from "../../db/users-repository";

type UsersRepository = ReturnType<typeof makeUsersRepository>;

export function createAuthLogin({
  usersRepository,
  makeDataManipulation,
  logger,
}: {
  usersRepository: UsersRepository;
  makeDataManipulation: () => { transformDate: (ts: number) => string };
  logger: { info: (message: string) => void };
}) {
  const dataManipulation = makeDataManipulation();

  return Object.freeze({
    login: async ({
      params,
      errorMsgs,
    }: {
      params: Record<string, unknown>;
      errorMsgs: Record<string, string>;
    }) => {
      const username =
        typeof params.username === "string" ? params.username.trim() : "";
      const password =
        typeof params.password === "string" ? params.password : "";

      if (!username || !password) {
        throw new Error(errorMsgs.MISSING_PARAMETER + "username/password");
      }

      logger.info(`[AUTH] login attempt @${username}`);
      const user = await usersRepository.findByUsername(username);
      if (!user) {
        throw new Error(errorMsgs.INVALID_CREDENTIALS);
      }

      const ok = bcrypt.compareSync(password, user.password_hash);
      if (!ok) {
        throw new Error(errorMsgs.INVALID_CREDENTIALS);
      }

      const token = signAuthToken(username);
      const profile = mapUserToResponse(user, dataManipulation.transformDate);

      return { token, user: profile };
    },
  });
}
