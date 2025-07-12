// apps/shiftflo/server/db.ts

import * as dotenv from 'dotenv';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '@shared/schema';

// Dynamically load .env based on NODE_ENV
const nodeEnv = process.env.NODE_ENV || 'development';
dotenv.config({ path: `.env.${nodeEnv}` });

let pool: Pool;

if (process.env.DATABASE_URL) {
  console.log(`🌐 Using DATABASE_URL for DB connection (${nodeEnv})`);
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: nodeEnv === 'production' ? { rejectUnauthorized: false } : false,
  });
} else {
  const { DB_USER, DB_PASS, DB_NAME, INSTANCE_CONNECTION_NAME } = process.env;

  if (!DB_USER || !DB_PASS || !DB_NAME || !INSTANCE_CONNECTION_NAME) {
    throw new Error(
      '❌ Missing DB_USER, DB_PASS, DB_NAME or INSTANCE_CONNECTION_NAME'
    );
  }

  console.log(`🔐 Connecting via Cloud SQL Socket for ${nodeEnv}`);

  pool = new Pool({
    user: DB_USER,
    password: DB_PASS,
    database: DB_NAME,
    host: `/cloudsql/${INSTANCE_CONNECTION_NAME}`,
    port: 5432,
    ssl: false,
  });
}

const db = drizzle(pool, { schema });

export { db, pool };
