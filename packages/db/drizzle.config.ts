import { defineConfig } from 'drizzle-kit';
import { fileURLToPath } from 'node:url';

// drizzle-kit does not read .env itself. Load the repo-root file with Node's
// built-in loader (no dotenv dependency); real env vars still take precedence.
try {
  process.loadEnvFile(fileURLToPath(new URL('../../.env', import.meta.url)));
} catch {
  // No .env file — rely on whatever the shell/CI already exported.
}

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error('DATABASE_URL is not set. Copy .env.example to .env at the repo root.');
}

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/schema/index.ts',
  out: './drizzle',
  dbCredentials: { url },
  casing: 'snake_case',
  verbose: true,
  strict: true,
  // Managed Postgres (Xata, some others) preinstalls pg_stat_statements in
  // `public`; without this, `push` tries to drop the extension's views.
  tablesFilter: ['!pg_stat_statements', '!pg_stat_statements_info'],
});
