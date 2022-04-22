import { createServerRequest } from "miujs/node";

export default createServerRequest((request, responseStatusCode, responseHeaders, markup, context) => {
  // Your custom server process.

  responseHeaders.set("Content-Type", "text/html; charset=utf-8");

  return new Response(markup, {
    status: responseStatusCode,
    headers: responseHeaders
  });
});
