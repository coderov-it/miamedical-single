import { spawn } from 'node:child_process';
import { mkdir, rename, rm } from 'node:fs/promises';
import path from 'node:path';

/**
 * `pg_dump` in custom format, zstd level 19, written to `<target>.partial` and
 * renamed once it exits 0 — so a file at `target` is always whole. The password
 * travels in PGPASSWORD, never in the argument list `ps` shows.
 */
export async function runPgDump(databaseUrl: string, target: string): Promise<void> {
  await mkdir(path.dirname(target), { recursive: true });

  const url = new URL(databaseUrl);
  const password = decodeURIComponent(url.password);
  url.password = '';
  const childEnv = password ? { ...process.env, PGPASSWORD: password } : process.env;
  const partial = `${target}.partial`;

  await new Promise<void>((resolve, reject) => {
    const child = spawn(
      'pg_dump',
      ['--format=custom', '--compress=zstd:19', `--file=${partial}`, `--dbname=${url.toString()}`],
      { env: childEnv, stdio: ['ignore', 'ignore', 'pipe'] },
    );
    let stderr = '';
    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    child.on('error', (error) => {
      reject(new Error(`pg_dump not found on PATH or failed to start: ${error.message}`));
    });
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      void rm(partial, { force: true })
        .catch(() => undefined)
        .then(() => reject(new Error(`pg_dump exited ${code}: ${stderr.trim()}`)));
    });
  });

  await rename(partial, target);
}
