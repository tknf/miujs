export function json<Data = {}>(data: Data, init?: number | ResponseInit): Response {
  let responseInit: any = init;
  if (typeof init === "number") {
    responseInit = {
      status: init
    };
  }

  const headers = new Headers(responseInit?.headers);
  if (!headers.has(getContentTypeHeader())) {
    headers.set(getContentTypeHeader(), ApplicationJson());
  }

  return new Response(JSON.stringify(data), {
    ...responseInit,
    headers
  });
}

export function redirect(url: string, init: number | ResponseInit = 302): Response {
  let responseInit = init;
  if (typeof responseInit === "number") {
    responseInit = {
      status: responseInit
    };
  } else if (typeof responseInit.status === "undefined") {
    responseInit.status = 302;
  }

  const headers = new Headers(responseInit.headers);
  headers.set("Location", url);

  return new Response(null, {
    ...responseInit,
    headers
  });
}

export function render(content: string, init: number | ResponseInit = 200): Response {
  let responseInit = init;
  if (typeof responseInit === "number") {
    responseInit = {
      status: responseInit
    };
  } else if (typeof responseInit.status === "undefined") {
    responseInit.status = 200;
  }

  const headers = new Headers(responseInit.headers);
  if (!headers.has(getContentTypeHeader())) {
    headers.set(getContentTypeHeader(), TextHtml());
  }

  return new Response(content, {
    ...responseInit,
    headers
  });
}

/**
 * Utilities
 */

export function isResponse(value: any): value is Response {
  return (
    value != null &&
    typeof value.status === "number" &&
    typeof value.statusText === "string" &&
    typeof value.headers === "object" &&
    value.body !== "undefined"
  );
}

const REDIRECT_CODES = new Set([301, 302, 303, 307, 308]);

export function isRedirectResponse(response: Response): boolean {
  return REDIRECT_CODES.has(response.status);
}

export function isCatchResponse(response: Response): boolean {
  return response.headers.get("X-Sheba-Catch") != null;
}

export function extractData(response: Response): Promise<unknown> {
  const contentType = response.headers.get("Content-Type");
  const jsonRegex = /\bapplication\/json\b/;

  if (contentType && jsonRegex.test(contentType)) {
    return response.json();
  }

  return response.text();
}

export function getContentTypeHeader() {
  return "content-type";
}

export function TextHtml() {
  return `text/html; charset=utf-8`;
}

export function TextPlain() {
  return `text/plain; charset=utf-8`;
}

export function ApplicationJson() {
  return `application/json; charset=utf-8`;
}

export function ApplicationPdf() {
  return `application/pdf; charset=utf-8`;
}

export function ApplicationXml() {
  return `application/xml; charset=utf-8`;
}

export enum ContentTypeHeader {
  Html = `text/html; charset=utf-8`,
  PlainText = `text/plain; charset=utf-8`,
  Json = `application/json`
}
