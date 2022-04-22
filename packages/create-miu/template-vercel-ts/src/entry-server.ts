import { createServerRequest } from "miujs/node";

export default createServerRequest((request, responseStatusCode, responseHeaders, markup, context) => {
  return new Response(markup, {
    status: responseStatusCode,
    headers: responseHeaders
  });
});
