import type { Readable } from "stream";

export type UploadHandlerArgs = {
  name: string;
  stream: Readable;
  filename: string;
  encoding: string;
  mimetype: string;
};

export type UploadHandler = (args: UploadHandlerArgs) => Promise<string | File | undefined>;

class NodeFormData implements FormData {
  private _fields: Record<string, (File | string)[]>;

  constructor(form?: any) {
    if (typeof form !== "undefined") {
      throw new Error(`Form data on the server is not supported.`);
    }

    this._fields = {};
  }

  public append(name: string, value: string | Blob, fileName?: string): void {
    if (typeof value !== "string" && !isBlob(value)) {
      throw new Error(`formData.append can only accept a string or Blob`);
    }

    this._fields[name] = this._fields[name] || [];
    if (typeof value === "string" || isFile(value)) {
      this._fields[name].push(value);
    } else {
      this._fields[name].push(new File([value], fileName || "unknown"));
    }
  }

  public delete(name: string): void {
    delete this._fields[name];
  }

  public get(name: string): FormDataEntryValue | null {
    return this._fields[name]?.slice(-1)[0] ?? null;
  }

  public getAll(name: string): FormDataEntryValue[] {
    return this._fields[name] ?? [];
  }

  public has(name: string): boolean {
    return name in this._fields;
  }

  public set(name: string, value: string | Blob, fileName?: string): void {
    if (typeof value !== "string" && !isBlob(value)) {
      throw new Error(`formData.set can only accept a string or Blob`);
    }

    if (typeof value === "string" || isFile(value)) {
      this._fields[name] = [value];
    } else {
      this._fields[name] = [new File([value], fileName || "unknown")];
    }
  }

  public forEach(callbackfn: (value: FormDataEntryValue, key: string, parent: FormData) => void, thisArg?: any): void {
    Object.entries(this._fields).forEach(([name, values]) => {
      values.forEach((value) => callbackfn(value, name, thisArg), thisArg);
    });
  }

  public entries(): IterableIterator<[string, FormDataEntryValue]> {
    return Object.entries(this._fields)
      .reduce((entries, [name, values]) => {
        values.forEach((value) => entries.push([name, value]));
        return entries;
      }, [] as [string, FormDataEntryValue][])
      .values();
  }

  public keys(): IterableIterator<string> {
    return Object.keys(this._fields).values();
  }

  public values(): IterableIterator<FormDataEntryValue> {
    return Object.entries(this._fields)
      .reduce((results, [name, values]) => {
        values.forEach((value) => results.push(value));
        return results;
      }, [] as FormDataEntryValue[])
      .values();
  }

  public *[Symbol.iterator](): IterableIterator<[string, FormDataEntryValue]> {
    yield* this.entries();
  }
}

export { NodeFormData as FormData };

/** Utilities */

export function isBlob(value: any): value is Blob {
  return (
    typeof value === "object" &&
    (typeof value.arrayBuffer === "function" ||
      typeof value.size === "number" ||
      typeof value.slice === "function" ||
      typeof value.stream === "function" ||
      typeof value.text === "function" ||
      typeof value.type === "string")
  );
}

export function isFile(blob: Blob): blob is File {
  const file = blob as File;
  return typeof file.name === "string";
}
