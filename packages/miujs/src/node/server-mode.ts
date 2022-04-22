import type { ServerMode } from "./types/server-mode";

export function isServerMode(value: any): value is ServerMode {
  return value === "development" || value === "production" || value === "test";
}
