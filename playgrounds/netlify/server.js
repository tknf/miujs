import { createNetlifyRequestHandler } from "miujs/netlify";
import * as build from "miujs-server-build";

export const handler = createNetlifyRequestHandler({ build, mode: process.env.NODE_ENV });
