import { randomBytes } from "crypto";
import { createReadStream, createWriteStream, statSync } from "fs";
import { rm, mkdir, stat as statAsync } from "fs/promises";
import { tmpdir } from "os";
import { basename, dirname, extname, resolve as resolvePath } from "path";
import type { Readable } from "stream";
import { finished } from "stream";
import { promisify } from "util";
// @ts-expect-error
import * as streamSlice from "stream-slice";

import { UploadHandler } from "../types/upload";
import { createReadableStreamFromReadable, readableStreamToString } from "./stream";

export class MaxPartSizeExceededError extends Error {
  constructor(public field: string, public maxBytes: number) {
    super(`Field "${field}" exceeded upload size of ${maxBytes} bytes.`);
  }
}

export type FileUploadHandlerFilterArgs = {
  filename: string;
  contentType: string;
  name: string;
};

export type FileUploadHandlerPathResolverArgs = {
  filename: string;
  contentType: string;
  name: string;
};

/**
 * Chooses the path of the file to be uploaded. If a string is not
 * returned the file will not be written.
 */
export type FileUploadHandlerPathResolver = (args: FileUploadHandlerPathResolverArgs) => string | undefined;

export type FileUploadHandlerOptions = {
  /**
   * Avoid file conflicts by appending a count on the end of the filename
   * if it already exists on disk. Defaults to `true`.
   */
  avoidFileConflicts?: boolean;
  /**
   * The directory to write the upload.
   */
  directory?: string | FileUploadHandlerPathResolver;
  /**
   * The name of the file in the directory. Can be a relative path, the directory
   * structure will be created if it does not exist.
   */
  file?: FileUploadHandlerPathResolver;
  /**
   * The maximum upload size allowed. If the size is exceeded an error will be thrown.
   * Defaults to 3000000B (3MB).
   */
  maxPartSize?: number;
  /**
   *
   * @param filename
   * @param mimetype
   * @param encoding
   */
  filter?(args: FileUploadHandlerFilterArgs): boolean | Promise<boolean>;
};

const defaultFilePathResolver: FileUploadHandlerPathResolver = ({ filename }) => {
  const ext = filename ? extname(filename) : "";
  return `upload_${randomBytes(4).readUInt32LE(0)}${ext}`;
};

async function uniqueFile(filepath: string) {
  const ext = extname(filepath);
  let uniqueFilepath = filepath;

  for (
    let i = 1;
    await statAsync(uniqueFilepath)
      .then(() => true)
      .catch(() => false);
    i++
  ) {
    uniqueFilepath = `${ext ? filepath.slice(0, -ext.length) : filepath}-${new Date().getTime()}${ext}`;
  }

  return uniqueFilepath;
}

export function createFileUploadHandler({
  directory = tmpdir(),
  avoidFileConflicts = true,
  file = defaultFilePathResolver,
  filter,
  maxPartSize = 3000000
}: FileUploadHandlerOptions = {}): UploadHandler {
  return async ({ name, filename, contentType, data }) => {
    if (!filename || (filter && !(await filter({ name, filename, contentType })))) {
      return undefined;
    }

    const dir = typeof directory === "string" ? directory : directory({ name, filename, contentType });

    if (!dir) {
      return undefined;
    }

    const filedir = resolvePath(dir);
    const path = typeof file === "string" ? file : file({ name, filename, contentType });

    if (!path) {
      return undefined;
    }

    let filepath = resolvePath(filedir, path);

    if (avoidFileConflicts) {
      filepath = await uniqueFile(filepath);
    }

    await mkdir(dirname(filepath), { recursive: true }).catch(() => {});

    const writeFileStream = createWriteStream(filepath);
    let size = 0;
    let deleteFile = false;
    try {
      for await (const chunk of data) {
        size += chunk.byteLength;
        if (size > maxPartSize) {
          deleteFile = true;
          throw new MaxPartSizeExceededError(name, maxPartSize);
        }
        writeFileStream.write(chunk);
      }
    } finally {
      writeFileStream.end();
      await promisify(finished)(writeFileStream);

      if (deleteFile) {
        await rm(filepath).catch(() => {});
      }
    }

    return new NodeOnDiskFile(filepath, contentType);
  };
}

export class NodeOnDiskFile implements File {
  name: string;
  lastModified = 0;
  webkitRelativePath = "";

  constructor(private filepath: string, public type: string, private slicer?: { start: number; end: number }) {
    this.name = basename(filepath);
  }

  get size(): number {
    const stats = statSync(this.filepath);

    if (this.slicer) {
      const slice = this.slicer.end - this.slicer.start;
      return slice < 0 ? 0 : slice > stats.size ? stats.size : slice;
    }

    return stats.size;
  }

  slice(start?: number, end?: number, type?: string): Blob {
    if (typeof start === "number" && start < 0) start = this.size + start;
    if (typeof end === "number" && end < 0) end = this.size + end;

    const startOffset = this.slicer?.start || 0;

    start = startOffset + (start || 0);
    end = startOffset + (end || this.size);
    return new NodeOnDiskFile(this.filepath, typeof type === "string" ? type : this.type, {
      start,
      end
    });
  }

  async arrayBuffer(): Promise<ArrayBuffer> {
    let stream: Readable = createReadStream(this.filepath);
    if (this.slicer) {
      stream = stream.pipe(streamSlice.slice(this.slicer.start, this.slicer.end));
    }

    return new Promise((resolve, reject) => {
      const buf: any[] = [];
      stream.on("data", (chunk) => buf.push(chunk));
      stream.on("end", () => resolve(Buffer.concat(buf)));
      stream.on("error", (err) => reject(err));
    });
  }

  stream(): ReadableStream<any>;
  stream(): NodeJS.ReadableStream;
  stream(): ReadableStream<any> | NodeJS.ReadableStream {
    let stream: Readable = createReadStream(this.filepath);
    if (this.slicer) {
      stream = stream.pipe(streamSlice.slice(this.slicer.start, this.slicer.end));
    }
    return createReadableStreamFromReadable(stream);
  }

  async text(): Promise<string> {
    return readableStreamToString(this.stream());
  }

  public get [Symbol.toStringTag]() {
    return "File";
  }
}
