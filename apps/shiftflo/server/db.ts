import 'dotenv/config';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import * as schema from '@shared/schema';

// Ensure the Neon websocket constructor is set
neonConfig.webSocketConstructor = ws;

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
export const pool = new Pool({
  user: DB_USER,
  password: DB_PASS,
  database: DB_NAME,
  host: `/cloudsql/${INSTANCE_CONNECTION_NAME}`,
  port: 5432,
  ssl: false,
});

// Wrap the pool with Drizzle ORM
export const db = drizzle({ client: pool, schema });
