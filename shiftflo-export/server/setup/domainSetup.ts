import { db } from "../db";
import { domainConfig } from "../../shared/schema";
import { eq } from "drizzle-orm";

export async function setupDomainConfiguration() {
  try {
    const siteDomain = process.env.SITE_DOMAIN;
    
    if (!siteDomain) {
      console.log('🌐 DOMAIN_SETUP_SKIPPED', { 
        reason: 'SITE_DOMAIN environment variable not set',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Clean domain format (remove protocol and trailing slash)
    const cleanDomain = siteDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');

    console.log('🌐 DOMAIN_SETUP_START', { 
      rawDomain: siteDomain,
      cleanDomain: cleanDomain,
      timestamp: new Date().toISOString()
    });

    // Check if domain configuration already exists
    const existingConfig = await db
      .select()
      .from(domainConfig)
      .where(eq(domainConfig.name, 'production'))
      .limit(1);

    if (existingConfig.length > 0) {
      // Update existing domain configuration
      await db
        .update(domainConfig)
        .set({
          baseUrl: `https://${cleanDomain}`,
          isActive: true
        })
        .where(eq(domainConfig.name, 'production'));

      console.log('✅ DOMAIN_UPDATED', { 
        oldDomain: existingConfig[0].baseUrl,
        newDomain: `https://${cleanDomain}`,
        timestamp: new Date().toISOString()
      });
    } else {
      // Create new domain configuration
      await db
        .insert(domainConfig)
        .values({
          name: 'production',
          baseUrl: `https://${cleanDomain}`,
          isActive: true
        });

      console.log('✅ DOMAIN_CREATED', { 
        domain: `https://${cleanDomain}`,
        timestamp: new Date().toISOString()
      });
    }

    // Also ensure development domain exists for local testing
    const devConfig = await db
      .select()
      .from(domainConfig)
      .where(eq(domainConfig.name, 'development'))
      .limit(1);

    if (devConfig.length === 0) {
      await db
        .insert(domainConfig)
        .values({
          name: 'development',
          baseUrl: 'http://localhost:5000',
          isActive: true
        });

      console.log('✅ DEV_DOMAIN_CREATED', { 
        domain: 'http://localhost:5000',
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('❌ DOMAIN_SETUP_ERROR', { 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

export function getDomainForEnvironment(): string {
  // In production, use SITE_DOMAIN if available (format: site.com)
  if (process.env.NODE_ENV === 'production' && process.env.SITE_DOMAIN) {
    return process.env.SITE_DOMAIN.replace(/^https?:\/\//, '').replace(/\/$/, '');
  }
  
  // Fallback to localhost for development
  return 'localhost:5000';
}

export async function getDomainFromDatabase(): Promise<string> {
  try {
    const environment = process.env.NODE_ENV === 'production' ? 'production' : 'development';
    
    const config = await db
      .select()
      .from(domainConfig)
      .where(eq(domainConfig.name, environment))
      .limit(1);

    if (config.length > 0) {
      // Remove protocol from baseUrl for consistency
      return config[0].baseUrl.replace(/^https?:\/\//, '');
    }

    // Fallback to environment-based domain
    return getDomainForEnvironment();
  } catch (error) {
    console.error('❌ DOMAIN_FETCH_ERROR', { error: error.message });
    return getDomainForEnvironment();
  }
}