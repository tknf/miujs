import { PassThrough } from "stream";
import type { ServerResponse } from "http";
import type * as connect from "connect";
import { installGlobals } from "../node-globals";
import type { RequestInit as NodeRequestInit, Response as NodeResponse } from "../isomorphic";
import type { ServerBuild } from "../types/server-build";
import { AbortController, Headers as NodeHeaders, Request as NodeRequest } from "../isomorphic";
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
      const abortController = new AbortController();
      const request = createRequest(req, abortController, mode);
      const response = (await handleRequest(request as unknown as Request)) as unknown as NodeResponse;

      sendResponse(res, response, abortController);
    } catch (err) {
      next(err);
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

function createRequest(req: connect.IncomingMessage, abortController?: AbortController, mode?: string): NodeRequest {
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const protocol = req.headers["x-forwarded-proto"] || mode === "production" ? "https" : "http";
  const origin = `${protocol}://${host}`;
  const url = new URL(req.url!, origin);

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

function sendResponse(res: ServerResponse, nodeResponse: NodeResponse, abortController: AbortController): void {
  res.statusMessage = nodeResponse.statusText;
  res.statusCode = nodeResponse.status;

  for (const [key, values] of Object.entries(nodeResponse.headers.raw())) {
    for (const value of values) {
      res.setHeader(key, value);
    }
  }

  if (abortController.signal.aborted) {
    res.setHeader("Connection", "close");
  }

  if (Buffer.isBuffer(nodeResponse.body)) {
    res.end(nodeResponse.body);
  } else if (nodeResponse.body?.pipe) {
    nodeResponse.body.pipe(res);
  } else {
    res.end();
  }
}
