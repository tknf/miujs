import { PassThrough } from "stream";
import type { ServerResponse } from "http";
import type * as connect from "connect";
import { installGlobals } from "../node-globals";
import {
  RequestInit as NodeRequestInit,
  Response as NodeResponse,
  writeReadableStreamToWritable,
  AbortController as NodeAbortController,
  Headers as NodeHeaders,
  Request as NodeRequest
} from "../isomorphic";
import type { ServerBuild } from "../types/server-build";
import { createRequestHandler as createMiuHandler } from "../server-handler";

installGlobals();

export type ConnectRequestHandler = (
  req: connect.IncomingMessage,
  res: ServerResponse,
  next: connect.NextFunction
) => Promise<void>;

export function createConnectRequestHandler({
  build,
  mode,
  context
}: {
  build: ServerBuild;
  mode?: string;
  context?: any;
}): ConnectRequestHandler {
  const handleRequest = createMiuHandler(build, mode, context);

  return async (req, res, next) => {
    try {
      const request = createRequest(req, res, mode);
      const response = (await handleRequest(request as unknown as Request)) as unknown as NodeResponse;

      return await sendResponse(res, response);
    } catch (err) {
      return next(err);
    }
  };
}

function createHeaders(requestHeaders: connect.IncomingMessage["headers"]): NodeHeaders {
  const headers = new NodeHeaders();

  for (const [key, values] of Object.entries(requestHeaders)) {
    if (values) {
      if (Array.isArray(values)) {
        for (const value of values) {
          headers.append(key, value);
        }
      } else {
        headers.set(key, values);
      }
    }
  }

  return headers;
}

function createRequest(req: connect.IncomingMessage, res: ServerResponse, mode?: string): NodeRequest {
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const protocol = req.headers["x-forwarded-proto"] || mode === "production" ? "https" : "http";
  const origin = `${protocol}://${host}`;
  const url = new URL(req.url!, origin);

  const controller = new NodeAbortController();
  res.on("close", () => controller.abort());

  const init: NodeRequestInit = {
    method: req.method,
    headers: createHeaders(req.headers),
    signal: controller.signal as NodeRequestInit["signal"]
  };

  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = req.pipe(new PassThrough({ highWaterMark: 16384 }));
  }

  return new NodeRequest(url.href, init);
}

async function sendResponse(res: ServerResponse, nodeResponse: NodeResponse): Promise<void> {
  res.statusMessage = nodeResponse.statusText;
  res.statusCode = nodeResponse.status;

  for (const [key, values] of Object.entries(nodeResponse.headers.raw())) {
    for (const value of values) {
      res.setHeader(key, value);
    }
  }

  if (nodeResponse.body) {
    await writeReadableStreamToWritable(nodeResponse.body, res);
  } else {
    res.end();
  }
}
