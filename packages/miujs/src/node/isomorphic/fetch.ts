import type { Readable } from "stream";
import { PassThrough } from "stream";
import type AbortController from "abort-controller";
import FormStream from "form-data";
import type { RequestInfo, RequestInit, Response } from "node-fetch";
import nodeFetch, { Request as BaseNodeRequest } from "node-fetch";

import { FormData as NodeFormData, isFile } from "./form-data";
import type { UploadHandler } from "./form-data";
import { internalParseFormData } from "./parse-multipart-form-data";

export type { HeadersInit, RequestInfo, ResponseInit } from "node-fetch";
export { Headers, Response } from "node-fetch";

function formDataToStream(formData: NodeFormData): FormStream {
  const formStream = new FormStream();

  function toNodeStream(input: any) {
    // The input is either a Node stream or a web stream, if it has
    //  a `on` method it's a node stream so we can just return it
    if (typeof input?.on === "function") {
      return input;
    }

    const passthrough = new PassThrough();
    const stream = input as ReadableStream<any>;
    const reader = stream.getReader();
    reader
      .read()
      .then(async ({ done, value }) => {
        while (!done) {
          passthrough.push(value);
          ({ done, value } = await reader.read());
        }
        passthrough.push(null);
      })
      .catch((error) => {
        passthrough.emit("error", error);
      });

    return passthrough;
  }

  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") {
      formStream.append(key, value);
    } else if (isFile(value)) {
      const stream = toNodeStream(value.stream());
      formStream.append(key, stream, {
        filename: value.name,
        contentType: value.type,
        knownLength: value.size
      });
    } else {
      const file = value as File;
      const stream = toNodeStream(file.stream());
      formStream.append(key, stream, {
        filename: "unknown"
      });
    }
  }

  return formStream;
}

interface NodeRequestInit extends RequestInit {
  abortController?: AbortController;
}

class NodeRequest extends BaseNodeRequest {
  private abortController?: AbortController;

  constructor(input: RequestInfo, init?: NodeRequestInit | undefined) {
    if (init?.body instanceof NodeFormData) {
      init = {
        ...init,
        body: formDataToStream(init.body)
      };
    }

    super(input, init);

    const anyInput = input as any;
    const anyInit = init as any;

    this.abortController = anyInput?.abortController || anyInit?.abortController;
  }

  public async formData(uploadHandler?: UploadHandler): Promise<FormData> {
    const contentType = this.headers.get("Content-Type");
    if (
      contentType &&
      (/application\/x-www-form-urlencoded/.test(contentType) || /multipart\/form-data/.test(contentType))
    ) {
      return await internalParseFormData(contentType, this.body as Readable, this.abortController, uploadHandler);
    }

    throw new Error("Invalid MIME type");
  }

  public clone(): NodeRequest {
    return new NodeRequest(this);
  }
}

export { NodeRequest as Request, NodeRequestInit as RequestInit };

/**
 * A `fetch` function for node that matches the web Fetch API. Based on
 * `node-fetch`.
 *
 * @see https://github.com/node-fetch/node-fetch
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
 */
export function fetch(input: RequestInfo, init?: RequestInit): Promise<Response> {
  init = { compress: false, ...init };

  if (init?.body instanceof NodeFormData) {
    init = {
      ...init,
      body: formDataToStream(init.body)
    };
  }

  // Default to { compress: false } so responses can be proxied through more
  // easily in actions. Otherwise the response stream encoding will not match
  // the Content-Encoding response header.
  return nodeFetch(input, init);
}
