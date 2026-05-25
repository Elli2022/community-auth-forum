import bcrypt from "bcrypt";
import sanitizeHtml from "sanitize-html";
import config from "../../../config";
import makeInputObjFactory from "./make-input-object";

const errorMsgs = config.ERROR_MSG.post;

const sanitize = (text: string) =>
  sanitizeHtml(text, { allowedTags: [], allowedAttributes: {} });

const hashPassword = (text: string) => bcrypt.hashSync(text, 12);

const makeInputObj = ({ params }: { params: Record<string, unknown> }) =>
  makeInputObjFactory({ hashPassword, sanitize }).inputObj({
    params,
    errorMsgs,
  });

export { makeInputObj };
