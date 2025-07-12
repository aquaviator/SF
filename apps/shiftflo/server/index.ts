import "dotenv/config"; // ← load .env when present
import express, { Request, Response, NextFunction } from "express";

// only load our Vite middleware in DEV
let setupVite: (app: express.Express, server: any) => Promise<void>;
let serveStatic: (app: express.Express) => void;
if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "local") {
  // dynamic import so we don’t pull in @vitejs/plugin-react in prod
  ;(async () => {
    ({ setupVite, serveStatic } = await import("./vite"));
  })();
} else {
  // in prod we only need the static‐server
  ;(async () => {
    ({ serveStatic } = await import("./vite"));
  })();
}

// common logger
export function log(msg: string) {
  const t = new Date().toLocaleTimeString();
  console.log(`${t} [express] ${msg}`);
}

import { registerRoutes } from "./routes";
import { cronScheduler } from "./cron-scheduler";
import { reminderScheduler } from "./reminder-scheduler";
import { setupDomainConfiguration } from "./setup/domainSetup";
import path from "path";

const app = express();
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false, limit: "10mb" }));

// simple /api logger
app.use((req, res, next) => {
  const start = Date.now();
  let payload: any;
  const _json = res.json.bind(res);
  res.json = (body: any, ...args: any[]) => {
    payload = body;
    return _json(body, ...args);
  };
  res.once("finish", () => {
    if (req.path.startsWith("/api")) {
      let line = `${req.method} ${req.path} ${res.statusCode} in ${Date.now() - start}ms`;
      if (payload) line += ` :: ${JSON.stringify(payload)}`;
      log(line);
    }
  });
  next();
});

;(async () => {
  await setupDomainConfiguration();
  const server = await registerRoutes(app);

  // serve service worker
  app.get("/sw.js", (_req, res) => {
    res
      .type("application/javascript")
      .sendFile(path.resolve("./public/sw.js"));
  });

  // 404 for missing API
  app.use("/api/*", (_req, res) =>
    res.status(404).json({ message: "API route not found" })
  );

  // error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    res.status(status).json({ message: err.message || "Internal Server Error" });
    throw err;
  });

  // dev vs prod
  const env = process.env.NODE_ENV;
  if (env === "development" || env === "local") {
    // wait for our dynamic import
    while (!setupVite) await new Promise(res => setTimeout(res, 10));
    await setupVite(app, server);
  } else {
    while (!serveStatic) await new Promise(res => setTimeout(res, 10));
    serveStatic(app);
  }

  // PORT from env or default 8080
  const port = parseInt(process.env.PORT ?? "8080", 10);
  server.listen({ port, host: "0.0.0.0", reusePort: true }, () => {
    log(`🚀 listening on port ${port}`);
    cronScheduler.start();
    reminderScheduler.start();
  });
})();
