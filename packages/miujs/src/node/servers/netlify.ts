import { Handler, HandlerEvent, HandlerResponse } from "@netlify/functions";
import type { Response as NodeResponse, RequestInit as NodeRequestInit } from "../isomorphic";
import { Headers as NodeHeaders, Request as NodeRequest } from "../isomorphic";
import type { ServerBuild } from "../types/server-build";
import { createRequestHandler as createMiuHandler } from "../server-handler";
import { installGlobals } from "../node-globals";

installGlobals();

export type NetlifyRequestHandler = Handler;

export function createNetlifyRequestHandler({
  build,
  mode,
  context
}: {
  build: ServerBuild;
  mode?: string;
  context?: string;
}): NetlifyRequestHandler {
  const handleRequest = createMiuHandler(build, mode, context);

  return async (event, context) => {
    const request = createRequest(event);
    const response = (await handleRequest(request as unknown as Request)) as unknown as NodeResponse;

    return sendResponse(response);
  };
}

function createHeaders(requestHeaders: HandlerEvent["multiValueHeaders"]): NodeHeaders {
  const headers = new NodeHeaders();

  for (const [key, values] of Object.entries(requestHeaders)) {
    if (values) {
      for (const value of values) {
        headers.append(key, value);
      }
    }
  }

  return headers;
}

function createRequest(event: HandlerEvent): NodeRequest {
  let url: URL;

  if (process.env.NODE_ENV !== "development") {
    url = new URL(event.rawUrl);
  } else {
    const origin = event.headers.host;
    const rawPath = getRawPath(event);
    url = new URL(rawPath, `http://${origin}`);
  }

  const init: NodeRequestInit = {
    method: event.httpMethod,
    headers: createHeaders(event.multiValueHeaders)
  };

  if (event.httpMethod !== "GET" && event.httpMethod !== "HEAD" && event.body) {
    const isFormData = event.headers["content-type"]?.includes("multipart/form-data");
    init.body = event.isBase64Encoded
      ? isFormData
        ? Buffer.from(event.body, "base64")
        : Buffer.from(event.body, "base64").toString()
      : event.body;
  }

  return new NodeRequest(url.href, init);
}

async function sendResponse(nodeResponse: NodeResponse): Promise<HandlerResponse> {
  const contentType = nodeResponse.headers.get("Content-Type");
  const isBinary = isBinaryType(contentType);
  let body;
  let isBase64Encoded = false;

  if (isBinary) {
    const blob = await nodeResponse.arrayBuffer();
    body = Buffer.from(blob).toString("base64");
    isBase64Encoded = true;
  } else {
    body = await nodeResponse.text();
  }

  return {
    statusCode: nodeResponse.status,
    multiValueHeaders: nodeResponse.headers.raw(),
    body,
    isBase64Encoded
  };
}

//

function getRawPath(event: HandlerEvent): string {
  let rawPath = event.path;
  const searchParams = new URLSearchParams();

  if (!event.multiValueQueryStringParameters) {
    return rawPath;
  }

  const paramKeys = Object.keys(event.multiValueQueryStringParameters);
  for (const key of paramKeys) {
    const values = event.multiValueQueryStringParameters[key];
    if (!values) continue;
    for (const val of values) {
      searchParams.append(key, val);
    }
  }

  const rawParams = searchParams.toString();

  if (rawParams) {
    rawPath += `?${rawParams}`;
  }

  return rawPath;
}

const binaryTypes = [
  "application/octet-stream",

  "application/epub+zip",
  "application/msword",
  "application/pdf",
  "application/rtf",
  "application/vnd.amazon.ebook",
  "application/vnd.ms-excel",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

  "font/otf",
  "font/woff",
  "font/woff2",

  "image/bmp",
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/tiff",
  "image/vnd.microsoft.icon",
  "image/webp",

  "audio/3gpp",
  "audio/aac",
  "audio/basic",
  "audio/mpeg",
  "audio/ogg",
  "audio/wavaudio/webm",
  "audio/x-aiff",
  "audio/x-midi",
  "audio/x-wav",

  "video/3gpp",
  "video/mp2t",
  "video/mpeg",
  "video/ogg",
  "video/quicktime",
  "video/webm",
  "video/x-msvideo",

  "application/java-archive",
  "application/vnd.apple.installer+xml",
  "application/x-7z-compressed",
  "application/x-apple-diskimage",
  "application/x-bzip",
  "application/x-bzip2",
  "application/x-gzip",
  "application/x-java-archive",
  "application/x-rar-compressed",
  "application/x-tar",
  "application/x-zip",
  "application/zip"
];

function isBinaryType(contentType: string | null | undefined) {
  if (!contentType) return false;
  return binaryTypes.some((t) => contentType.includes(t));
}
