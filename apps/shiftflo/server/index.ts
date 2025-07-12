import "dotenv/config";                          // ← load your .env first
import express, { Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { cronScheduler } from "./cron-scheduler";
import { reminderScheduler } from "./reminder-scheduler";
import { setupDomainConfiguration } from "./setup/domainSetup";
import path from "path";

const app = express();
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false, limit: "10mb" }));

// request logger for /api
app.use((req, res, next) => {
  const start = Date.now();
  const originalJson = res.json.bind(res);
  let payload;
  res.json = (body, ...args) => { payload = body; return originalJson(body, ...args); };
  res.on("finish", () => {
    if (req.path.startsWith("/api")) {
      let line = `${req.method} ${req.path} ${res.statusCode} in ${Date.now() - start}ms`;
      if (payload) line += ` :: ${JSON.stringify(payload)}`;
      log(line);
    }
  });
  next();
});

(async () => {
  await setupDomainConfiguration();
  const server = await registerRoutes(app);

  // serve SW before vite
  app.get("/sw.js", (_req, res) =>
    res.type("application/javascript").sendFile(path.resolve("./public/sw.js"))
  );

  app.use("/api/*", (_req, res) => res.status(404).json({ message: "API route not found" }));

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    res.status(status).json({ message: err.message || "Internal Server Error" });
    throw err;
  });

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = parseInt(process.env.PORT ?? "5000", 10);
  server.listen({ port, host: "0.0.0.0", reusePort: true }, () => {
    log(`🚀 Server listening on port ${port}`);
    cronScheduler.start();
    reminderScheduler.start();
  });
})();
