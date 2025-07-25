import { Pool } from 'pg';

const pool = new Pool({
  user: process.env.POSTGRES_USER || 'user',
  host: 'localhost',
  database: process.env.POSTGRES_DB || 'barbar-book',
  password: process.env.POSTGRES_PASSWORD || 'password',
  port: 5432,
});

export default pool;
