import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { rootCertificates } from 'node:tls';
import type { ConnectionOptions, PeerCertificate } from 'node:tls';
import { test } from 'node:test';
import pg from 'pg';
import { DatabaseConfigError, getDatabaseConfig } from '../server/database-config.ts';

const url = 'postgresql://demo:dummy-password@db.example.invalid/portfolio';
const legacy = {
  DB_HOST: 'legacy.example.invalid', DB_PORT: '5433', DB_NAME: 'legacy',
  DB_USER: 'legacy-user', DB_PASSWORD: 'legacy-password',
};

function tlsOptions(env: NodeJS.ProcessEnv): ConnectionOptions {
  const ssl = getDatabaseConfig(env).ssl;
  assert.equal(typeof ssl, 'object');
  return ssl as ConnectionOptions;
}

test('DATABASE_URL takes precedence over complete or invalid legacy settings', () => {
  const config = getDatabaseConfig({ ...legacy, DB_PORT: 'invalid', DATABASE_URL: url });
  assert.equal(config.host, 'db.example.invalid');
  assert.equal(config.port, 5432);
  assert.equal(config.database, 'portfolio');
  assert.equal(config.user, 'demo');
  assert.equal(config.password, 'dummy-password');
  assert.equal(config.connectionString, undefined);
  assert.equal(config.max, 20);
  assert.equal(config.connectionTimeoutMillis, 2000);
});

test('supports both schemes, custom ports, IPv6 and percent-encoded credentials/database', () => {
  const config = getDatabaseConfig({ DATABASE_URL: 'postgres://demo%40user:p%3A%2F%23%40%25word@[::1]:5433/my%20db' });
  assert.equal(config.host, '::1');
  assert.equal(config.port, 5433);
  assert.equal(config.user, 'demo@user');
  assert.equal(config.password, 'p:/#@%word');
  assert.equal(config.database, 'my db');
});

test('falls back to all DB_* fields and preserves legacy no-TLS behavior', () => {
  const config = getDatabaseConfig(legacy);
  assert.equal(config.host, legacy.DB_HOST);
  assert.equal(config.port, 5433);
  assert.equal(config.database, legacy.DB_NAME);
  assert.equal(config.user, legacy.DB_USER);
  assert.equal(config.password, legacy.DB_PASSWORD);
  assert.equal(config.ssl, false);
});

test('requires complete legacy configuration, never implicit pg defaults', () => {
  assert.throws(() => getDatabaseConfig({}), DatabaseConfigError);
  for (const key of Object.keys(legacy)) {
    assert.throws(() => getDatabaseConfig({ ...legacy, [key]: undefined }), DatabaseConfigError);
    assert.throws(() => getDatabaseConfig({ ...legacy, [key]: '' }), DatabaseConfigError);
  }
  for (const port of ['0', '65536', '5432abc', '1.5', '-1', ' 5432']) {
    assert.throws(() => getDatabaseConfig({ ...legacy, DB_PORT: port }), DatabaseConfigError);
  }
});

test('invalid or empty DATABASE_URL fails closed instead of falling back', () => {
  const invalid = [
    '', ' ', 'secret-invalid-url', 'https://demo:password@db.example.invalid/db',
    'postgres://db.example.invalid/db', 'postgres://demo@db.example.invalid/db',
    'postgres://demo:password@db.example.invalid', `${url}#fragment`, `${url}\n`,
    'postgres://demo:%ZZ@db.example.invalid/db', 'postgres://demo:%00@db.example.invalid/db',
    'postgres://demo:password@db.example.invalid:65536/db',
    'postgres://demo:password@db.example.invalid:0/db', `${url}/another`,
  ];
  for (const value of invalid) {
    assert.throws(() => getDatabaseConfig({ ...legacy, DATABASE_URL: value }), error => {
      assert.ok(error instanceof DatabaseConfigError);
      assert.ok(!error.message.includes('secret-invalid-url'));
      assert.ok(!error.message.includes('password@'));
      assert.equal('cause' in error, false);
      return true;
    });
  }
});

test('URL defaults to verified TLS; require is also fully verified', () => {
  for (const suffix of ['', '?sslmode=verify-full', '?sslmode=require']) {
    const ssl = tlsOptions({ DATABASE_URL: url + suffix });
    assert.equal(ssl.rejectUnauthorized, true);
    assert.equal(ssl.ca, undefined);
    assert.equal(typeof ssl.checkServerIdentity, 'function');
    const client = new pg.Client(getDatabaseConfig({ DATABASE_URL: url + suffix }));
    assert.equal((client.ssl as unknown as ConnectionOptions).rejectUnauthorized, true);
  }
});

test('legacy deployments can opt into verified TLS', () => {
  for (const mode of ['verify-full', 'require']) {
    assert.equal(tlsOptions({ ...legacy, DB_SSL_MODE: mode }).rejectUnauthorized, true);
  }
});

test('rejects downgrade modes and URL query overrides, even with a secure env mode', () => {
  for (const mode of ['disable', 'no-verify', 'prefer', 'allow', 'verify-ca', 'false', '']) {
    assert.throws(() => getDatabaseConfig({ DATABASE_URL: `${url}?sslmode=${mode}`, DB_SSL_MODE: 'verify-full' }), DatabaseConfigError);
    assert.throws(() => getDatabaseConfig({ ...legacy, DB_SSL_MODE: mode }), DatabaseConfigError);
  }
  for (const query of ['ssl=false', 'ssl=no-verify', 'sslrootcert=/tmp/ca', 'uselibpqcompat=true', 'host=other', 'sslmode=require&sslmode=disable']) {
    assert.throws(() => getDatabaseConfig({ DATABASE_URL: `${url}?${query}` }), DatabaseConfigError);
  }
  assert.throws(() => getDatabaseConfig({ DATABASE_URL: url, DB_SSL_MODE: 'disable' }), DatabaseConfigError);
});

test('CA certificates enable verified TLS, accept escaped newlines and reject malformed input', () => {
  const ca = rootCertificates[0].trim();
  assert.equal(tlsOptions({ DATABASE_URL: url, DB_SSL_CA: ca }).ca, ca);
  const ssl = tlsOptions({ ...legacy, DB_SSL_CA: ca.replace(/\n/g, '\\n') });
  assert.equal(ssl.ca, ca);
  assert.equal(ssl.rejectUnauthorized, true);
  for (const invalid of ['', 'not-a-certificate', '-----BEGIN CERTIFICATE-----\ninvalid\n-----END CERTIFICATE-----']) {
    assert.throws(() => getDatabaseConfig({ DATABASE_URL: url, DB_SSL_CA: invalid }), DatabaseConfigError);
  }
  assert.throws(() => getDatabaseConfig({ ...legacy, DB_HOST: '/tmp/socket', DB_SSL_MODE: 'verify-full' }), DatabaseConfigError);
});

test('certificate identity is checked against the configured DNS host and IP', () => {
  const dns = tlsOptions({ DATABASE_URL: url });
  const certificate = { subjectaltname: 'DNS:db.example.invalid' } as PeerCertificate;
  assert.equal(dns.checkServerIdentity!('ignored.example.invalid', certificate), undefined);
  assert.ok(dns.checkServerIdentity!('db.example.invalid', { subjectaltname: 'DNS:wrong.example.invalid' } as PeerCertificate));
  const ip = tlsOptions({ DATABASE_URL: 'postgres://demo:dummy@127.0.0.1/portfolio' });
  assert.equal(ip.checkServerIdentity!('localhost', { subjectaltname: 'IP Address:127.0.0.1' } as PeerCertificate), undefined);
  assert.ok(ip.checkServerIdentity!('localhost', certificate));
});

test('db:test exits nonzero and hides invalid URL input without making a connection', () => {
  const result = spawnSync(process.execPath, ['--import', 'tsx', 'server/test-database.ts'], {
    cwd: new URL('..', import.meta.url),
    env: { PATH: process.env.PATH, DATABASE_URL: 'private-url-must-not-appear' },
    encoding: 'utf8', timeout: 10000,
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /DATABASE_URL must be a valid/);
  assert.ok(!(result.stdout + result.stderr).includes('private-url-must-not-appear'));
});
