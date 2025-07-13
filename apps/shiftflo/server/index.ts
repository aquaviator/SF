// server/index.ts
import "dotenv/config"; // Loads .env.* files
import express, { Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { cronScheduler } from "./cron-scheduler";
import { reminderScheduler } from "./reminder-scheduler";
import { setupDomainConfiguration } from "./setup/domainSetup";
import path from "path";

// Dynamic import Vite middleware only in DEV/LOCAL (not in prod builds)
let setupVite: (app: express.Express, server: any) => Promise<void>;
let serveStatic: (app: express.Express) => void;

const env = process.env.NODE_ENV || "production";
const isDev = env === "development" || env === "local";

if (isDev) {
  // Only import Vite middleware in dev/local
  (async () => {
    const vite = await import("./vite");
    setupVite = vite.setupVite;
    serveStatic = vite.serveStatic;
  })();
} else {
  // Only import serveStatic in production
  (async () => {
    const vite = await import("./vite");
    serveStatic = vite.serveStatic;
  })();
}

// Simple timestamped logger
export function log(msg: string) {
  const t = new Date().toLocaleTimeString();
  console.log(`${t} [express] ${msg}`);
}

const app = express();
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false, limit: "10mb" }));

// Log /api requests (method, path, status, timing)
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
  // 1. Setup any domain config (db, URLs, etc)
  await setupDomainConfiguration();

  // 2. Register all app/server routes (returns the HTTP server object)
  const server = await registerRoutes(app);

  // 3. Serve service worker for PWA support, BEFORE static/Vite
  app.get("/sw.js", (_req, res) => {
    res
      .type("application/javascript")
      .sendFile(path.resolve("./public/sw.js"));
  });

  // 4. 404 for missing API endpoints
  app.use("/api/*", (_req, res) =>
    res.status(404).json({ message: "API route not found" })
  );

  // 5. Express error handler (always last)
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    res.status(status).json({ message: err.message || "Internal Server Error" });
    throw err;
  });

  // 6. Attach dev middleware or static middleware depending on environment
  if (isDev) {
    // Wait for our dynamic import (setupVite)
    while (!setupVite) await new Promise(res => setTimeout(res, 10));
    await setupVite(app, server);
  } else {
    // Wait for dynamic import (serveStatic)
    while (!serveStatic) await new Promise(res => setTimeout(res, 10));
    serveStatic(app);
  }

  // 7. PORT: environment variable or fallback (5000 local, 8080 prod)
  const port =
    parseInt(
      process.env.PORT ??
        (isDev ? "5000" : "8080"),
      10
    );

  server.listen({ port, host: "0.0.0.0", reusePort: true }, () => {
    log(`🚀 listening on port ${port}`);
    cronScheduler.start();
    reminderScheduler.start();
  });
})();
