import { PassThrough } from "stream";
import type * as express from "express";
import { installGlobals } from "../node-globals";
import type { RequestInit as NodeRequestInit, Response as NodeResponse } from "../isomorphic";
import type { ServerBuild } from "../types/server-build";
import { AbortController, Headers as NodeHeaders, Request as NodeRequest } from "../isomorphic";
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
      const abortController = new AbortController();
      const request = createRequest(req, abortController);
      const response = (await handleRequest(request as unknown as Request)) as unknown as NodeResponse;

      sendResponse(res, response, abortController);
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

function createRequest(req: express.Request, abortController?: AbortController): NodeRequest {
  const origin = `${req.protocol}://${req.get("host")}`;
  const url = new URL(req.url, origin);

  const init: NodeRequestInit = {
    method: req.method,
    headers: createHeaders(req.headers),
    signal: abortController?.signal,
    abortController
  };

  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = req.pipe(new PassThrough({ highWaterMark: 16384 }));
  }

  return new NodeRequest(url.href, init);
}

function sendResponse(res: express.Response, nodeResponse: NodeResponse, abortController: AbortController): void {
  res.statusMessage = nodeResponse.statusText;
  res.status(nodeResponse.status);

  for (const [key, values] of Object.entries(nodeResponse.headers.raw())) {
    for (const value of values) {
      res.append(key, value);
    }
  }

  if (abortController.signal.aborted) {
    res.set("Connection", "close");
  }

  if (Buffer.isBuffer(nodeResponse.body)) {
    res.end(nodeResponse.body);
  } else if (nodeResponse.body?.pipe) {
    nodeResponse.body.pipe(res);
  } else {
    res.end();
  }
}
