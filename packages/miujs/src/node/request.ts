export function isActionRequest(request: Request): boolean {
  const method = request.method.toLowerCase();
  return method === "get" || method === "post" || method === "put" || method === "patch" || method === "delete";
}

export function isHeadRequest(request: Request): boolean {
  return request.method.toLowerCase() === "head";
}

export function isValidRequestMethod(request: Request): boolean {
  return request.method.toLowerCase() === "get" || isHeadRequest(request) || isActionRequest(request);
}
