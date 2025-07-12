import 'dotenv/config'; // will load .env, or .env.${NODE_ENV} if you install dotenv-flow or dotenv-cli
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { cronScheduler } from "./cron-scheduler";
import { reminderScheduler } from "./reminder-scheduler";
import { setupDomainConfiguration } from "./setup/domainSetup";
import path from "path";

const app = express();
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false, limit: "10mb" }));

// simple request logger for /api routes
app.use((req, res, next) => {
  const start = Date.now();
  const reqPath = req.path;
  let capturedJson: Record<string, any> | undefined;

  const originalJson = res.json.bind(res);
  res.json = (body, ...args) => {
    capturedJson = body;
    return originalJson(body, ...args);
  };

  res.on("finish", () => {
    if (!reqPath.startsWith("/api")) return;
    const duration = Date.now() - start;
    let line = `${req.method} ${reqPath} ${res.statusCode} in ${duration}ms`;
    if (capturedJson) line += ` :: ${JSON.stringify(capturedJson)}`;
    if (line.length > 80) line = line.slice(0, 79) + "…";
    log(line);
  });

  next();
});

(async () => {
  // 1) Domain setup
  await setupDomainConfiguration();

  // 2) Register API & other routes
  const server = await registerRoutes(app);

  // 3) Serve service worker before Vite/static
  app.get("/sw.js", (_req: Request, res: Response) => {
    res.type("application/javascript").sendFile(path.resolve("./public/sw.js"));
  });

  // 4) 404 for missing API endpoints
  app.use("/api/*", (_req, res) => {
    res.status(404).json({ message: "API route not found" });
  });

  // 5) Error handler
  app.use(
    (err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      res.status(status).json({ message: err.message || "Internal Server Error" });
      throw err;
    }
  );

  // 6) Frontend/middleware setup
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // 7) Dynamic port binding: use $PORT (e.g. Cloud Run), otherwise 5000
  const port = parseInt(process.env.PORT ?? "5000", 10);
  server.listen(
    { port, host: "0.0.0.0", reusePort: true },
    () => {
      log(`🚀 Server listening on port ${port}`);

      // start background jobs after server is up
      cronScheduler.start();
      reminderScheduler.start();
    }
  );
})();
