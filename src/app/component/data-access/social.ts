import { getSql } from "../../db/client";
import makeSocialRepository from "../../db/social-repository";

const socialRepository = makeSocialRepository({ sql: getSql() });

export { socialRepository };
