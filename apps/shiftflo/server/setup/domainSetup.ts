import { db } from "../db";
import { domainConfig } from "../../shared/schema";
import { eq, and } from "drizzle-orm";

const DEPLOYMENT_NAME =
  process.env.DEPLOYMENT_NAME ??
  (process.env.NODE_ENV === "production" ? "production" : "development");

/**
 * Reads REPLIT_DOMAINS or falls back to localhost for development
 * or SITE_DOMAIN for production.
 */
export function getDomainForEnvironment(): string {
  if (process.env.NODE_ENV === "production" && process.env.SITE_DOMAIN) {
    return process.env.SITE_DOMAIN.replace(/^https?:\/\//, "").replace(/\/$/, "");
  }

  if (process.env.REPLIT_DOMAINS) {
    const domains = process.env.REPLIT_DOMAINS.split(",").map(d => d.trim());
    if (domains.length > 0) return domains[0];
  }

  return "localhost:5000";
}

/**
 * Ensures that exactly one active record exists for each of:
 *  - the current deployment (production or staging, etc)
 *  - development (always points at local or Replit)
 */
export async function setupDomainConfiguration() {
  try {
    // 1) PRODUCTION / DEPLOYMENT ROW
    if (process.env.SITE_DOMAIN) {
      const cleanProd = process.env.SITE_DOMAIN.replace(/^https?:\/\//, "").replace(/\/$/, "");
      const prodUrl   = `https://${cleanProd}`;

      console.log("🌐 DOMAIN_SETUP_START", {
        deployment: DEPLOYMENT_NAME,
        raw:        process.env.SITE_DOMAIN,
        normalized: prodUrl,
        timestamp:  new Date().toISOString(),
      });

      // deactivate any old rows for this deployment
      await db
        .update(domainConfig)
        .set({ isActive: false })
        .where(eq(domainConfig.name, DEPLOYMENT_NAME));

      // upsert the row
      const existing = await db
        .select()
        .from(domainConfig)
        .where(eq(domainConfig.name, DEPLOYMENT_NAME))
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(domainConfig)
          .set({ baseUrl: prodUrl, isActive: true })
          .where(eq(domainConfig.name, DEPLOYMENT_NAME));

        console.log("✅ DOMAIN_UPDATED", {
          deployment: DEPLOYMENT_NAME,
          newDomain:  prodUrl,
          timestamp:  new Date().toISOString(),
        });
      } else {
        await db
          .insert(domainConfig)
          .values({ name: DEPLOYMENT_NAME, baseUrl: prodUrl, isActive: true });

        console.log("✅ DOMAIN_CREATED", {
          deployment: DEPLOYMENT_NAME,
          domain:     prodUrl,
          timestamp:  new Date().toISOString(),
        });
      }
    } else {
      console.log("🌐 DOMAIN_SETUP_SKIPPED", {
        deployment: DEPLOYMENT_NAME,
        reason:     "SITE_DOMAIN not set",
        timestamp:  new Date().toISOString(),
      });
    }

    // 2) DEVELOPMENT ROW (always present)
    const devHost = getDomainForEnvironment();
    const devUrl  = devHost.includes("localhost") ? `http://${devHost}` : `https://${devHost}`;

    console.log("🌐 DEV_DOMAIN_SETUP_START", {
      host:      devHost,
      normalized: devUrl,
      timestamp: new Date().toISOString(),
    });

    await db
      .update(domainConfig)
      .set({ isActive: false })
      .where(eq(domainConfig.name, "development"));

    const existingDev = await db
      .select()
      .from(domainConfig)
      .where(eq(domainConfig.name, "development"))
      .limit(1);

    if (existingDev.length > 0) {
      await db
        .update(domainConfig)
        .set({ baseUrl: devUrl, isActive: true })
        .where(eq(domainConfig.name, "development"));

      console.log("✅ DEV_DOMAIN_UPDATED", {
        old:       existingDev[0].baseUrl,
        new:       devUrl,
        timestamp: new Date().toISOString(),
      });
    } else {
      await db
        .insert(domainConfig)
        .values({ name: "development", baseUrl: devUrl, isActive: true });

      console.log("✅ DEV_DOMAIN_CREATED", {
        domain:    devUrl,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (err: any) {
    console.error("❌ DOMAIN_SETUP_ERROR", {
      error:     err.message,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Fetches the active baseUrl from the database for the current deployment.
 * Falls back to getDomainForEnvironment() if no active row is found.
 */
export async function getDomainFromDatabase(): Promise<string> {
  try {
    const [cfg] = await db
      .select({ baseUrl: domainConfig.baseUrl })
      .from(domainConfig)
      .where(
        and(
          eq(domainConfig.name, DEPLOYMENT_NAME),
          eq(domainConfig.isActive, true),
        )
      )
      .limit(1);

    if (cfg) {
      // return without protocol
      return cfg.baseUrl.replace(/^https?:\/\//, "");
    }
  } catch (err: any) {
    console.error("❌ DOMAIN_FETCH_ERROR", {
      error:     err.message,
      deployment: DEPLOYMENT_NAME,
      timestamp: new Date().toISOString(),
    });
  }

  // fallback to environment-based domain
  return getDomainForEnvironment();
}
