/* eslint-disable no-inner-declarations, no-async-promise-executor */
import { Readable } from "stream";
import Busboy from "busboy";

import type { Request as NodeRequest } from "./fetch";
import type { UploadHandler } from "./form-data";
import { FormData as NodeFormData } from "./form-data";

export function parseMultipartFormData(request: Request, uploadHandler: UploadHandler) {
  return (request as unknown as NodeRequest).formData(uploadHandler);
}

export async function internalParseFormData(
  contentType: string,
  body: string | Buffer | Readable,
  abortController?: AbortController,
  uploadHandler?: UploadHandler
) {
  const formData = new NodeFormData();
  const fileWorkQueue: Promise<void>[] = [];

  let stream: Readable;
  if (typeof body === "string" || Buffer.isBuffer(body)) {
    stream = Readable.from(body);
  } else {
    stream = body;
  }

  await new Promise<void>(async (resolve, reject) => {
    try {
      const busboy = new Busboy({
        highWaterMark: 2 * 1024 * 1024,
        headers: {
          "content-type": contentType
        }
      });

      let aborted = false;
      function abort(error?: Error) {
        if (aborted) return;
        aborted = true;

        stream.unpipe();
        stream.removeAllListeners();
        busboy.removeAllListeners();

        abortController?.abort();
        reject(error || new Error("failed to parse form data"));
      }

      busboy.on("field", (name, value) => {
        formData.append(name, value);
      });

      busboy.on("file", (name, filestream, filename, encoding, mimetype) => {
        if (uploadHandler) {
          fileWorkQueue.push(
            (async () => {
              try {
                const value = await uploadHandler({
                  name,
                  stream: filestream,
                  filename,
                  encoding,
                  mimetype
                });

                if (typeof value !== "undefined") {
                  formData.append(name, value);
                }
              } catch (error: any) {
                busboy.emit("error", error);
                throw error;
              } finally {
                filestream.resume();
              }
            })()
          );
        } else {
          filestream.resume();
        }

        if (!uploadHandler) {
          console.warn(`Tried to parse multipart file upload for field "${name}" but no uploadHandler was provided.`);
        }
      });

      stream.on("error", abort);
      stream.on("aborted", abort);
      busboy.on("error", abort);
      busboy.on("finish", resolve);

      stream.pipe(busboy);
    } catch (err) {
      reject(err);
    }
  });

  await Promise.all(fileWorkQueue);

  return formData;
}
