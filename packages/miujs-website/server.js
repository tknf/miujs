import { createVercelRequestHandler } from "miujs/vercel";
import * as build from "miujs-server-build";

export default createVercelRequestHandler({ build, mode: process.env.NODE_ENV });
