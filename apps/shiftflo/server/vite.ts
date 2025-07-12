import { createServer as createViteServer, createLogger } from "vite";
import { Express } from "express";
import fs from "fs";
import path from "path";
import { Server } from "http";
import { fileURLToPath } from "url";
import { nanoid } from "nanoid";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const viteLogger = createLogger();

export async function setupVite(app: Express, server: Server) {
  // now we import your config only at runtime
  const { default: viteConfig } = await import("../vite.config.js");
  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: { middlewareMode: true, hmr: { server }, allowedHosts: true },
    customLogger: {
      ...viteLogger,
      error: (m, o) => {
        viteLogger.error(m, o);
        process.exit(1);
      }
    },
    appType: "custom"
  });

  app.use(vite.middlewares);

  app.use("*", async (req, res, next) => {
    try {
      const tplPath = path.resolve(__dirname, "..", "client", "index.html");
      let tpl = await fs.promises.readFile(tplPath, "utf-8");
      tpl = tpl.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const html = await vite.transformIndexHtml(req.originalUrl, tpl);
      res.status(200).type("text/html").send(html);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const dist = path.resolve(__dirname, "..", "dist", "public");
  if (!fs.existsSync(dist)) {
    throw new Error(`Missing build dir: ${dist}`);
  }
  app.use(express.static(dist));
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(dist, "index.html"));
  });
}
