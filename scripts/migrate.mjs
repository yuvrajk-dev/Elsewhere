import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import pg from 'pg';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: path.join(root, '.env.local') });
dotenv.config({ path: path.join(root, '.env'), override: false });

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is missing. Run `neon env pull` first.');
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL, max: 1 });
try {
  const sql = fs.readFileSync(path.join(root, 'api', 'schema.sql'), 'utf8');
  await pool.query(sql);
  console.log('Applied api/schema.sql');
} finally {
  await pool.end();
}
