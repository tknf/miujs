import { createNetlifyRequestHandler } from "miujs/netlify";
import * as build from "miujs-server-build";

export default createNetlifyRequestHandler({ build, mode: process.env.NODE_ENV });
