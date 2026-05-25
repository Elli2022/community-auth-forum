import serverless from "serverless-http";
import { createApp } from "../../build/app/create-app";

const app = createApp();

export const handler = serverless(app);
