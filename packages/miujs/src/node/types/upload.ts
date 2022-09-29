export type UploadHandlerPart = {
  name: string;
  filename?: string;
  contentType: string;
  data: AsyncIterable<Uint8Array>;
};

export type UploadHandler = (part: UploadHandlerPart) => Promise<File | string | null | undefined>;
