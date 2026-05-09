import { defineConfig } from 'drizzle-kit';
import 'dotenv/config';

const url = process.env.DATABASE_URL ||
  `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME}`;

export default defineConfig({
  schema: './src/db/schema.js',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: { url },
});
