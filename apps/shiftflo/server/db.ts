import 'dotenv/config';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '@shared/schema';

// Pull discrete DB connection settings from environment
const {
  DB_USER,
  DB_PASS,
  DB_NAME,
  INSTANCE_CONNECTION_NAME,
} = process.env;

// Validate required env vars
if (!DB_USER || !DB_PASS || !DB_NAME || !INSTANCE_CONNECTION_NAME) {
  throw new Error(
    'Missing one of DB_USER, DB_PASS, DB_NAME, INSTANCE_CONNECTION_NAME',
  );
}

// Create a connection pool using the UNIX socket provided by Cloud Run
const pool = new Pool({
  user:     DB_USER,
  password: DB_PASS,
  database: DB_NAME,
  host:     `/cloudsql/${INSTANCE_CONNECTION_NAME}`,
  port:     5432,
  ssl:      false,
});

// Initialize Drizzle ORM with the Postgres pool
export const db = drizzle(pool, { schema });
