import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';

test('shared pool uses URL config; connection check is read-only and sanitizes driver errors', () => {
  // The driver is stubbed before any query. No database or network is used.
  const result = spawnSync(process.execPath, ['--import', 'tsx', '--input-type=module', '-e', `
    import assert from 'node:assert/strict';
    import { pool, testConnection, fetchProjects } from './src/lib/database.ts';
    assert.ok(pool);
    assert.equal(pool.options.host, 'db.example.invalid');
    assert.equal(pool.options.ssl.rejectUnauthorized, true);
    assert.equal(pool.options.connectionString, undefined);
    assert.equal(pool.totalCount, 0);
    let calls = 0;
    pool.query = async (sql) => {
      assert.equal(sql, 'SELECT 1');
      calls++;
      return { rows: [{ '?column?': 1 }] };
    };
    assert.equal(await testConnection(), true);
    assert.equal(calls, 1);
    pool.query = async () => { throw new Error('private-driver-error'); };
    assert.equal(await testConnection(), false);
    pool.connect = async () => { throw new Error('private-driver-error'); };
    await assert.rejects(fetchProjects(), { message: 'Database query failed while fetching projects.' });
    assert.equal(pool.totalCount, 0);
    await pool.end();
  `], {
    cwd: new URL('..', import.meta.url),
    env: { PATH: process.env.PATH, DATABASE_URL: 'postgres://demo:dummy-password@db.example.invalid/portfolio' },
    encoding: 'utf8', timeout: 10000,
  });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Database connected successfully/);
  assert.match(result.stderr, /Database connection failed/);
  assert.ok(!(result.stdout + result.stderr).includes('private-driver-error'));
  assert.ok(!(result.stdout + result.stderr).includes('dummy-password'));
  assert.ok(!(result.stdout + result.stderr).includes('db.example.invalid'));
});
