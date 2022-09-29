import { VercelRequest, VercelResponse } from "@vercel/node";
import { installGlobals } from "../node-globals";
import {
  RequestInit as NodeRequestInit,
  Response as NodeResponse,
  writeReadableStreamToWritable,
  Headers as NodeHeaders,
  Request as NodeRequest,
  AbortController as NodeAbortController
} from "../isomorphic";
import type { ServerBuild } from "../types/server-build";
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
    const request = createRequest(req, res);
    const response = (await handleRequest(request)) as unknown as NodeResponse;

    return await sendResponse(res, response);
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

function createRequest(req: VercelRequest, res: VercelResponse): NodeRequest {
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const protocol = req.headers["x-forwarded-proto"] || "https";
  const url = new URL(req.url!, `${protocol}://${host}`);
  const controller = new NodeAbortController();
  res.on("close", () => controller.abort());

  const init: NodeRequestInit = {
    method: req.method,
    headers: createHeaders(req.headers),
    signal: controller.signal as NodeRequestInit["signal"]
  };

  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = req;
  }

  return new NodeRequest(url.href, init);
}

async function sendResponse(res: VercelResponse, nodeResponse: NodeResponse): Promise<void> {
  res.statusMessage = nodeResponse.statusText;
  const multiValueHeaders = nodeResponse.headers.raw();
  res.writeHead(nodeResponse.status, nodeResponse.statusText, multiValueHeaders);

  if (nodeResponse.body) {
    await writeReadableStreamToWritable(nodeResponse.body, res);
  } else {
    res.end();
  }
}
