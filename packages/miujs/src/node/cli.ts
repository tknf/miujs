import type { Server } from "http";
import path from "path";
import os from "os";
import { cac } from "cac";
import exitHook from "exit-hook";
import prettyMs from "pretty-ms";
import getPort from "get-port";
import fse from "fs-extra";
import express from "express";
import WebSocket from "ws";
import { loadConfig } from "./config";
import * as logger from "./logger";
import { loadEnv } from "./env";
import { createServer as createMiuServer } from "./servers/builtin";
import { build, watch, isBuildMode } from "./compiler/build";
import type { MiuConfig } from "./types/config";

/**
 * ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 *  commands
 * ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 */

type DevCallbacks = {
  onRebuildStart?(): void;
  onInitialBuild?(): void;
};

export async function dev(config: MiuConfig, modeArg?: string, callbacks?: DevCallbacks): Promise<void> {
  const { onInitialBuild, onRebuildStart } = callbacks || {};

  const mode = isBuildMode(modeArg) ? modeArg : "development";
  logger.info(`Watching MiuJS in ${mode} mode...`);

  let start = Date.now();

  const wss = new WebSocket.Server({ port: 8002 });
  function broadcast(event: { type: string; [key: string]: any }) {
    setTimeout(() => {
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(event));
        }
      });
    }, 10);
  }

  function log(message: string) {
    logger.info(message);
    broadcast({ type: "LOG", message });
  }

  const closeWatcher = await watch(config, {
    mode,
    onInitialBuild,
    onRebuildStart() {
      start = Date.now();
      onRebuildStart?.();
      log(`Rebuilding...`);
    },
    onRebuildFinish() {
      log(`Rebuilt in ${prettyMs(Date.now() - start)}`);
      broadcast({ type: "RELOAD" });
    },
    onFileCreated(file) {
      log(`File created: ${path.relative(process.cwd(), file)}`);
    },
    onFileChanged(file) {
      log(`File changed: ${path.relative(process.cwd(), file)}`);
    },
    onFileDeleted(file) {
      log(`File deleted: ${path.relative(process.cwd(), file)}`);
    }
  });

  log(`Built in ${prettyMs(Date.now() - start)}`);

  let resolve = () => {};
  exitHook(() => {
    resolve();
  });
  return new Promise<void>((r) => {
    resolve = r;
  }).then(async () => {
    wss.close();
    await closeWatcher();
    fse.emptyDirSync(config.clientBuildDirectory);
    fse.rmSync(config.serverBuildPath);
  });
}

/**
 * ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 *  cli
 * ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 */

const cli = cac("miu");

cli
  .command("build", `Build`)
  .option(`--mode [mode]`, `[string] build mode`)
  .option(`--sourcemap`, `[boolean] generate sourcemap`)
  .action(async (options) => {
    const mode = options.mode ?? "production";
    process.env.NODE_ENV = mode;

    const start = Date.now();
    const config = await loadConfig();

    await build(config, { mode, sourcemap: options.sourcemap });

    logger.success(`Built in ${prettyMs(Date.now() - start)}`);
  });

cli
  .command("watch", `Watch`)
  .option(`--mode [mode]`, `[string] dev server mode`)
  .option(`--port [port]`, `[number] specify port`)
  .option(`--open`, `[boolean] open browser on startup`)
  .action(async (options) => {
    const mode = options.mode ?? "development";
    const config = await loadConfig();
    await loadEnv(config.rootDirectory);

    await dev(config, mode, {
      onInitialBuild: () => {
        console.log(`Miu watching ...`);
      }
    });
  });

cli
  .command("dev", `Start dev server`)
  .alias("dev")
  .option(`--mode [mode]`, `[string] dev server mode`)
  .option(`--port [port]`, `[number] specify port`)
  .option(`--open`, `[boolean] open browser on startup`)
  .action(async (options) => {
    const mode = options.mode ?? "development";
    const config = await loadConfig();
    await loadEnv(config.rootDirectory);

    if (config.serverEntryPoint) {
      throw new Error(`Miu dev command is not supported custom server entrypoint.`);
    }

    const port = await getPort({ port: process.env.PORT ? Number(process.env.PORT) : 3000 });

    const app = express();
    app.use((_, __, next) => {
      purgeAppRequireCache(config.serverBuildPath);
      next();
    });

    app.use(createMiuServer(config, mode));

    let server: Server | null = null;

    try {
      await dev(config, mode, {
        onInitialBuild: () => {
          const onListen = () => {
            const address =
              process.env.HOST ||
              Object.values(os.networkInterfaces())
                .flat()
                .find((ip) => ip?.family === "IPv4" && !ip.internal)?.address;

            if (!address) {
              console.log(`Miu Server started at http://localhost:${port}`);
            } else {
              console.log(`Miu Server started at http://localhost:${port} (http://${address}:${port})`);
            }
          };

          server = process.env.HOST ? app.listen(port, process.env.HOST, onListen) : app.listen(port, onListen);
        }
      });
    } finally {
      server!.close?.();
    }
  });

cli
  .command("serve", `Start MiuJS builtin server`)
  .alias("start")
  .option(`--port [port]`, `[number] specify port`)
  .action(async (options) => {
    process.env.NODE_ENV = "production";

    const config = await loadConfig();
    await loadEnv(config.rootDirectory);

    const mode = process.env.NODE_ENV;
    const port = await getPort({ port: process.env.PORT ? Number(process.env.PORT) : Number(options.port) || 3000 });
    const app = createMiuServer(config, mode);

    let server: Server | null = null;

    try {
      const onListen = () => {
        const address =
          process.env.HOST ||
          Object.values(os.networkInterfaces())
            .flat()
            .find((ip) => ip?.family === "IPv4" && !ip.internal)?.address;

        if (!address) {
          console.log(`Miu Server started at http://localhost:${port}`);
        } else {
          console.log(`Miu Server started at http://localhost:${port} (http://${address}:${port})`);
        }
      };

      server = process.env.HOST ? app.listen(port, process.env.HOST, onListen) : app.listen(port, onListen);

      ["SIGTERM", "SIGINT"].forEach((signal) => {
        process.once(signal, () => server?.close(console.error));
      });
    } catch (e) {
      console.error(e);
      process.exit(1);
    }
  });

function purgeAppRequireCache(buildPath: string) {
  for (const key in require.cache) {
    if (key.startsWith(buildPath)) {
      delete require.cache[key];
    }
  }
}

cli.help();
cli.version(require("../../package.json").version);

cli.parse();
