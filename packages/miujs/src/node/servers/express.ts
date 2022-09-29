import { PassThrough } from "stream";
import type * as express from "express";
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

export type ExpressRequestHandler = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => Promise<void>;

export function createExpressRequestHandler({
  build,
  mode,
  context
}: {
  build: ServerBuild;
  mode?: string;
  context?: any;
}): ExpressRequestHandler {
  const handleRequest = createMiuHandler(build, mode, context);

  return async (req, res, next) => {
    try {
      const request = createRequest(req, res);
      const response = (await handleRequest(request as unknown as Request)) as unknown as NodeResponse;

      sendResponse(res, response);
    } catch (err) {
      next(err);
    }
  };
}

function createHeaders(requestHeaders: express.Request["headers"]): NodeHeaders {
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

function createRequest(req: express.Request, res: express.Response): NodeRequest {
  const origin = `${req.protocol}://${req.get("host")}`;
  const url = new URL(req.url, origin);
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

async function sendResponse(res: express.Response, nodeResponse: NodeResponse): Promise<void> {
  res.statusMessage = nodeResponse.statusText;
  res.status(nodeResponse.status);

  for (const [key, values] of Object.entries(nodeResponse.headers.raw())) {
    for (const value of values) {
      res.append(key, value);
    }
  }

  if (nodeResponse.body) {
    await writeReadableStreamToWritable(nodeResponse.body, res);
  } else {
    res.end();
  }
}
