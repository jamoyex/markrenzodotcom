import { pool, testConnection } from '../src/lib/database.ts';

try {
  // This command is read-only and exits unsuccessfully on invalid config or connection failure.
  process.exitCode = await testConnection() ? 0 : 1;
} finally {
  await pool?.end();
}
