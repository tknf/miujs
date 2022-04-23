import { createServerRequest } from "miujs/node";

export default createServerRequest((request, responseStatusCode, responseHeaders, markup, context) => {
  console.log(markup);
  return new Response(markup, {
    status: responseStatusCode,
    headers: responseHeaders
  });
});
