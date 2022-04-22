import * as fs from "fs";
import * as path from "path";
import type { MiuConfig } from "../types/config";

type PackageDependencies = { [packageName: string]: string };

export function getPackageDependencies(packageJsonFile: string): PackageDependencies {
  const pkg = JSON.parse(fs.readFileSync(packageJsonFile, "utf8"));
  return pkg?.dependencies || {};
}

export function getDependencies(config: MiuConfig): PackageDependencies {
  return getPackageDependencies(path.resolve(config.rootDirectory, "package.json"));
}

export function getVersion(config: MiuConfig): string {
  const pkgJsonPath = path.resolve(config.rootDirectory, "package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, "utf-8"));
  return `v${pkg?.version || ""}`;
}
