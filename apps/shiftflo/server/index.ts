// server/index.ts
import "dotenv/config";               // Loads .env.* files
import express, { Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { cronScheduler } from "./cron-scheduler";
import { reminderScheduler } from "./reminder-scheduler";
import { setupDomainConfiguration } from "./setup/domainSetup";
import path from "path";
import { fileURLToPath } from "url";

// Figure out __dirname under ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dynamic import Vite middleware only in DEV/LOCAL
let setupVite: (app: express.Express, server: any) => Promise<void>;

const env = process.env.NODE_ENV || "production";
const isDev = env === "development" || env === "local";

if (isDev) {
  (async () => {
    const vite = await import("./vite");
    setupVite = vite.setupVite;
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

// Log /api requests
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
  // 1. Setup domain config
  await setupDomainConfiguration();

  // 2. Register routes
  const server = await registerRoutes(app);

  // 3. Serve service worker
  app.get("/sw.js", (_req, res) => {
    res
      .type("application/javascript")
      .sendFile(path.resolve(__dirname, "./public/sw.js"));
  });

  // 4. 404 for missing API endpoints
  app.use("/api/*", (_req, res) =>
    res.status(404).json({ message: "API route not found" })
  );

  // 5. Error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    res.status(status).json({ message: err.message || "Internal Server Error" });
    throw err;
  });

  // 6. Attach dev Vite middleware or serve built UI in production
  if (isDev) {
    // wait for dynamic import
    while (!setupVite) await new Promise(r => setTimeout(r, 10));
    await setupVite(app, server);
  } else {
    // production: serve your built SPA from dist/public
    const publicDir = path.join(__dirname, "public");
    app.use(express.static(publicDir));

    // (optional) SPA fallback: send index.html for any non-API route
    app.get("*", (_req, res) => {
      res.sendFile(path.join(publicDir, "index.html"));
    });
  }

  // 7. Listen on PORT env, then fallback — 5000 in dev, 8080 in prod
  const port = process.env.PORT
    ? Number(process.env.PORT)
    : isDev
    ? 5000
    : 8080;

  server.listen({ port, host: "0.0.0.0", reusePort: true }, () => {
    log(`🚀 listening on port ${port}`);
    cronScheduler.start();
    reminderScheduler.start();
  });
})();
