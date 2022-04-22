import chalk, { supportsColor } from "chalk";

const useColor = supportsColor;
const K = (x: any) => x;

const colors = {
  error: useColor ? chalk.red : K,
  warn: useColor ? chalk.yellow : K,
  info: useColor ? chalk.white : K,
  success: useColor ? chalk.green : K
};

const prefix = `✨ [Miu]: `;

const loggerStore: {
  [message: string]: boolean;
} = {};

export function error(message: string) {
  console.log(`${prefix}${colors.error(message)}`);
}

export function errorOnce(condition: boolean, message: string) {
  if (!condition && !loggerStore[message]) {
    loggerStore[message] = true;
    console.log(`${prefix}${colors.error(message)}`);
  }
}

export function warn(message: string) {
  console.log(`${prefix}${colors.warn(message)}`);
}

export function warnOnce(condition: boolean, message: string) {
  if (!condition && !loggerStore[message]) {
    loggerStore[message] = true;
    console.log(`${prefix}${colors.warn(message)}`);
  }
}

export function info(message: string) {
  console.log(`${prefix}${colors.info(message)}`);
}

export function invariant(value: any, message?: string) {
  if (value === false || value === null || typeof value === "undefined") {
    error(`The following error is a bug in MiuJS;` + `Please open an issue: https://github.com/miujs/miujs/issues/new`);
    throw new Error(message);
  }
}

export function success(message: string) {
  console.log(`${prefix}${colors.success(message)}`);
}
