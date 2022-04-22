import path from "path";
import fse from "fs-extra";
import dashify from "dashify";
import type { ApplicationConfig, MiuConfig, ConfigRoute, ConfigTemplate } from "./types/config";
import type { ServerMode } from "./types/server-mode";
import { isServerMode } from "./server-mode";
import { SERVER_BUILD_VIRTUAL_MODULE } from "./compiler/virtual-modules";

export async function loadConfig(root?: string, serverMode: ServerMode = "production"): Promise<MiuConfig> {
  if (!root) {
    root = process.cwd();
  }

  if (!isServerMode(serverMode)) {
    throw new Error(`Invalid server mode "${serverMode}"`);
  }

  const rootDirectory = path.resolve(root);
  const configFile = path.resolve(root, `miu.config.js`);

  let appConfig: ApplicationConfig;
  try {
    appConfig = require(configFile);
  } catch {
    throw new Error(`Error reading MiuJS config in "${configFile}"`);
  }

  /**
   * Directory
   */
  const sourceDirectory = path.resolve(root, appConfig.sourceDirectory ?? "src");
  const relativePath = {
    routes: appConfig.routesDirectory ?? `routes`,
    layouts: appConfig.layoutsDirectory ?? `layouts`,
    sections: appConfig.sectionsDirectory ?? `sections`,
    partials: appConfig.partialsDirectory ?? `partials`,
    entryClient: appConfig.entryClientFile ?? `src/entry-client`
  };
  const routesDirectory = path.join(sourceDirectory, appConfig.routesDirectory ?? "routes");
  const layoutsDirectory = path.join(sourceDirectory, appConfig.layoutsDirectory ?? "layouts");
  const sectionsDirectory = path.join(sourceDirectory, appConfig.sectionsDirectory ?? "sections");
  const partialsDirectory = path.join(sourceDirectory, appConfig.partialsDirectory ?? "partials");
  const themeDirectory = path.join(sourceDirectory, appConfig.themeDirectory ?? "theme");

  /**
   * Server build
   */
  const serverBuildTarget = appConfig.serverBuildTarget ?? "node";
  const serverModuleFormat = appConfig.serverModuleFormat ?? "cjs";

  const entryServerFilename = appConfig.entryServerFile ?? "src/entry-server";
  const entryServerFile = findEntryFile(root, entryServerFilename);
  if (!entryServerFile) {
    throw new Error(`Cannot find file "${entryServerFilename}" in ${root}`);
  }

  const serverEntryPoint = appConfig.server;
  let serverBuildDirectory = appConfig.serverBuildDirectory ?? `.miubuild/server`;
  let serverBuildPath = `${serverBuildDirectory}/index.js`;
  switch (serverBuildTarget) {
    case "node":
      break;
    case "vercel":
      serverBuildPath = "api/index.js";
      break;
    case "netlify":
      serverBuildPath = ".netlify/functions-internal/server.js";
      break;
  }
  serverBuildDirectory = path.resolve(root, serverBuildDirectory);
  serverBuildPath = path.resolve(root, serverBuildPath);

  /**
   * Browser build
   */
  const entryClientFilename = relativePath.entryClient;
  const entryClientFile = findEntryFile(root, entryClientFilename);

  if (!entryClientFile) {
    throw new Error(`Cannot find file "${entryClientFilename}" in ${root}`);
  }
  relativePath.entryClient = entryClientFile;

  const clientBuildDirectory = path.resolve(root, appConfig.clientBuildDirectory ?? `.miubuild/browser`);
  const clientPublicPath = "/assets/";

  const serverBuildTargetEntryModule = `export * from ${JSON.stringify(SERVER_BUILD_VIRTUAL_MODULE.id)}`;

  /**
   * Templates & routes
   */
  const routes = createRouteMap(routesDirectory);
  const templates = {
    layouts: createTemplateMap(layoutsDirectory),
    sections: createTemplateMap(sectionsDirectory),
    partials: createTemplateMap(partialsDirectory)
  };

  const customWatchDirectories = appConfig.customWatchDirectories;

  const config: MiuConfig = {
    rootDirectory,
    sourceDirectory,
    routesDirectory,
    layoutsDirectory,
    sectionsDirectory,
    partialsDirectory,
    themeDirectory,
    serverBuildPath,
    serverBuildDirectory,
    serverModuleFormat,
    serverBuildTarget,
    serverBuildTargetEntryModule,
    serverEntryPoint,
    clientBuildDirectory,
    clientPublicPath,
    entryClientFile,
    entryServerFile,
    routes,
    templates,
    relativePath,
    customWatchDirectories
  };

  return config;
}

function findEntryFile(dir: string, basename: string): string | undefined {
  for (const ext of ["ts", "js"]) {
    const file = path.resolve(dir, `${basename}.${ext}`);
    if (fse.existsSync(file)) return path.relative(dir, file);
  }

  return undefined;
}

function createTemplateMap(dir: string) {
  const templates: Record<string, ConfigTemplate> = {};
  if (fse.existsSync(dir)) {
    fse
      .readdirSync(dir)
      .filter((file) => path.extname(file) === ".html")
      .forEach((file) => {
        const name = dashify(file.replace(path.extname(file), "").replace(".", "-"));
        templates[name] = {
          file: path.resolve(dir, file)
        };
      });
  }
  return templates;
}

function createRouteMap(dir: string) {
  const routes: Record<string, ConfigRoute> = {};
  if (fse.existsSync(dir)) {
    visitRouteFiles(dir, ({ id, path, file }) => {
      routes[id] = {
        id,
        path,
        file
      };
    });
  }
  return routes;
}

function visitRouteFiles(
  dir: string,
  visitor: (routeData: { id: string; path: string; file: string }) => void,
  baseDir = dir,
  parentDirname = "/"
) {
  for (const filename of fse.readdirSync(dir)) {
    const file = path.resolve(dir, filename);
    const stat = fse.lstatSync(file);

    if (stat.isDirectory()) {
      parentDirname = parentDirname + file.split("/").pop() ?? "";
      visitRouteFiles(file, visitor, baseDir, parentDirname);
    } else if (stat.isFile()) {
      if (!/\.(j|t)s$/.test(filename)) {
        continue;
      }

      const basePathname = `${parentDirname}/${filename}`;

      let pathname = basePathname
        .replace(/\.(j|t)s$/, "")
        .replace(/\index$/i, "")
        .replace(/\b[A-Z]/, (firstletter) => firstletter.toLowerCase())
        .replace(/\[(?:[.]{3})?(\w+?)\]/g, (_match, param: string) => `:${param}`);
      if (pathname.endsWith("/") && pathname !== "/") {
        pathname = pathname.substring(0, pathname.length - 1);
      }

      let id = createRouteId(basePathname);
      if (id.startsWith("//")) {
        id = id.replace(/\//, "");
      }
      if (id.startsWith("/")) {
        id = id.replace(/\//, "");
      }

      if (/\index$/i.test(id)) {
        // console.log(id);
      }

      visitor({
        id,
        path: pathname,
        file: path.resolve(baseDir, file)
      });
    }
  }
}

function createRouteId(file: string) {
  return normalizeSlashes(stripFileExtension(file));
}

function normalizeSlashes(file: string) {
  return file.split(path.win32.sep).join("/");
}

function stripFileExtension(file: string) {
  return file.replace(/\.[a-z0-9]+$/i, "");
}
