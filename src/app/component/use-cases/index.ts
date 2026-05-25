import config from "../../../config";
import { usersRepository } from "../data-access";
import { wallRepository } from "../data-access/wall";
import { makeInputObj } from "../entities";
import makeDataManipulation from "../entities/data-manipulation";
import { logger } from "../../libs/logger";
import createGet from "./get";
import createPost from "./post";
import { createWallGet, createWallPost } from "./wall";

const errorMsgs = config.ERROR_MSG;

const post = ({ params }: { params: Record<string, unknown> }) =>
  createPost({
    makeDataManipulation,
    makeInputObj,
    usersRepository,
    logger,
  }).post({ params, errorMsgs: errorMsgs.post });

const get = () =>
  createGet({
    usersRepository,
    makeDataManipulation,
    logger,
  }).get();

const getWall = () =>
  createWallGet({ wallRepository, logger }).get();

const postWall = ({ params }: { params: Record<string, unknown> }) =>
  createWallPost({ wallRepository, usersRepository, logger }).post({
    params,
    errorMsgs: errorMsgs.post,
  });

export { post, get, getWall, postWall };
