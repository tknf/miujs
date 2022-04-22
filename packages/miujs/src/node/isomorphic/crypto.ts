import cookieSignature from "cookie-signature";
import type { SignFunction, UnsignFunction } from "../types/crypto";

export const sign: SignFunction = async (value, secret) => {
  return cookieSignature.sign(value, secret);
};

export const unsign: UnsignFunction = async (signed, secret) => {
  return cookieSignature.unsign(signed, secret);
};
