import type { ServerEntryModuleHandler } from "./types/server-entry";

export function createServerRequest(fn: ServerEntryModuleHandler) {
  return fn;
}
