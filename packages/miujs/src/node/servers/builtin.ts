import connect from "connect";
import compression from "compression";
import serveStatic from "serve-static";
import morgan from "morgan";
import type { MiuConfig } from "../types/config";
import { createConnectRequestHandler } from "./connect";

export function createServer(config: MiuConfig, mode = "production") {
  const app = connect();

  app.use(compression() as any);

  app.use(
    config.clientPublicPath,
    serveStatic(config.clientBuildDirectory, {
      immutable: true,
      maxAge: "1y"
    })
  );

  app.use(serveStatic("public", { maxAge: "1h" }));
  app.use((_, res, next) => {
    res.removeHeader("x-powered-by");
    next();
  });
  app.use(morgan("tiny"));

  app.use(
    mode === "production"
      ? createConnectRequestHandler({ build: require(config.serverBuildPath), mode })
      : (req, res, next) => {
          const build = require(config.serverBuildPath);
          return createConnectRequestHandler({ build, mode })(req, res, next);
        }
  );

  return app;
}
