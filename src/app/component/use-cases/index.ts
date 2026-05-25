import config from "../../../config";
import { usersRepository } from "../data-access";
import { wallRepository } from "../data-access/wall";
import { makeInputObj } from "../entities";
import makeDataManipulation from "../entities/data-manipulation";
import { logger } from "../../libs/logger";
import createGet from "./get";
import createPost from "./post";
import { createWallGet, createWallPost } from "./wall";
import { createAuthLogin } from "./auth";
import {
  createProfileGet,
  createProfileUpdate,
  createProfileDelete,
} from "./profile";

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

const login = ({ params }: { params: Record<string, unknown> }) =>
  createAuthLogin({ usersRepository, makeDataManipulation, logger }).login({
    params,
    errorMsgs: errorMsgs.post,
  });

const getProfile = (username: string, viewer?: string) =>
  createProfileGet({
    usersRepository,
    wallRepository,
    makeDataManipulation,
  }).get(username, viewer);

const updateProfile = (
  username: string,
  params: Record<string, unknown>
) =>
  createProfileUpdate({ usersRepository, makeDataManipulation }).update({
    username,
    params,
  });

const deleteProfile = (
  username: string,
  params: Record<string, unknown>
) =>
  createProfileDelete({ usersRepository }).delete({
    username,
    params,
    errorMsgs: errorMsgs.post,
  });

export {
  post,
  get,
  getWall,
  postWall,
  login,
  getProfile,
  updateProfile,
  deleteProfile,
};
