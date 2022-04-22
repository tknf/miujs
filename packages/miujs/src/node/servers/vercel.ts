import { VercelRequest, VercelResponse } from "@vercel/node";
import { installGlobals } from "../node-globals";
import type { RequestInit as NodeRequestInit, Response as NodeResponse } from "../isomorphic";
import type { ServerBuild } from "../types/server-build";
import { Headers as NodeHeaders, Request as NodeRequest } from "../isomorphic";
import { createRequestHandler as createMiuHandler } from "../server-handler";

installGlobals();

export type VercelRequestHandler = (req: VercelRequest, res: VercelResponse) => Promise<void>;

export function createVercelRequestHandler({
  build,
  mode,
  context
}: {
  build: ServerBuild;
  mode?: string;
  context?: any;
}): VercelRequestHandler {
  const handleRequest = createMiuHandler(build, mode, context);

  return async (req, res) => {
    const request = createRequest(req);
    const response = (await handleRequest(request as unknown as Request)) as unknown as NodeResponse;

    sendResponse(res, response);
  };
}

function createHeaders(requestHeaders: VercelRequest["headers"]): NodeHeaders {
  const headers = new NodeHeaders();
  for (const key in requestHeaders) {
    const header = requestHeaders[key]!;
    if (Array.isArray(header)) {
      for (const value of header) {
        headers.append(key, value);
      }
    } else {
      headers.append(key, header);
    }
  }

  return headers;
}

function createRequest(req: VercelRequest): NodeRequest {
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const protocol = req.headers["x-forwarded-proto"] || "https";
  const url = new URL(req.url!, `${protocol}://${host}`);

  const init: NodeRequestInit = {
    method: req.method,
    headers: createHeaders(req.headers)
  };

  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = req;
  }

  return new NodeRequest(url.href, init);
}

function sendResponse(res: VercelResponse, nodeResponse: NodeResponse): void {
  const headerArray = new Map();
  for (const [key, value] of nodeResponse.headers.entries()) {
    if (headerArray.has(key)) {
      const newValue = headerArray.get(key)?.concat?.(value);
      res.setHeader(key, newValue);
      headerArray.set(key, value);
    } else {
      res.setHeader(key, value);
      headerArray.set(key, [value]);
    }
  }

  res.statusMessage = nodeResponse.statusText;
  res.writeHead(nodeResponse.status, nodeResponse.headers.raw());

  if (Buffer.isBuffer(nodeResponse.body)) {
    res.end(nodeResponse.body);
  } else if (nodeResponse.body?.pipe) {
    nodeResponse.body.pipe(res);
  } else {
    res.end();
  }
}
