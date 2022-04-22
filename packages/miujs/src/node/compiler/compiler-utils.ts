import path from "path";
import { promises as fsp } from "fs";
import type { BinaryLike } from "crypto";
import { createHash } from "crypto";

export function createUrl(publicPath: string, file: string): string {
  return publicPath + file.split(path.win32.sep).join("/");
}

export function getHash(source: BinaryLike): string {
  return createHash("sha256").update(source).digest("hex");
}

export async function writeFileSafe(file: string, contents: string): Promise<string> {
  await fsp.mkdir(path.dirname(file), { recursive: true });
  await fsp.writeFile(file, contents);
  return file;
}
