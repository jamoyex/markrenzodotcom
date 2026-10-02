import { X509Certificate } from 'node:crypto';
import { checkServerIdentity } from 'node:tls';
import type { PoolConfig } from 'pg';

// Server-only configuration. Never pass these values to Vite or log them.
export class DatabaseConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DatabaseConfigError';
  }
}

function parsePort(value: string): number {
  if (!/^\d+$/.test(value) || Number(value) < 1 || Number(value) > 65535) {
    throw new DatabaseConfigError('Database port must be an integer between 1 and 65535.');
  }
  return Number(value);
}

function parseDatabaseUrl(value: string) {
  try {
    // URL() otherwise silently strips some whitespace/control characters.
    if (/[\s\u0000-\u001f\u007f]/.test(value)) throw new Error();
    const url = new URL(value);
    if (!['postgres:', 'postgresql:'].includes(url.protocol) || url.hash) throw new Error();
    const host = url.hostname.replace(/^\[|\]$/g, '');
    const user = decodeURIComponent(url.username);
    const password = decodeURIComponent(url.password);
    const database = decodeURIComponent(url.pathname.slice(1));
    if (!host || !user || !password || !database || url.pathname.slice(1).includes('/')) throw new Error();
    if (/[\s%/\\]/.test(host) || [user, password, database].some(v => v.includes('\0'))) throw new Error();
    // Do not forward a connectionString to pg: its parser can override TLS options.
    // In particular, ssl, sslrootcert and uselibpqcompat must not bypass verification.
    if ([...url.searchParams.keys()].some(key => key !== 'sslmode') || url.searchParams.getAll('sslmode').length > 1) {
      throw new DatabaseConfigError('DATABASE_URL supports only one optional sslmode query parameter.');
    }
    return { host, user, password, database, port: parsePort(url.port || '5432'), sslmode: url.searchParams.get('sslmode') };
  } catch (error) {
    if (error instanceof DatabaseConfigError) throw error;
    // URL and decoding errors can contain the original secret input.
    throw new DatabaseConfigError('DATABASE_URL must be a valid postgres:// or postgresql:// URL with host, user, password and database.');
  }
}

function readCertificate(value: string): string {
  const ca = value.replace(/\\n/g, '\n').trim();
  const certificates = ca.match(/-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g);
  try {
    if (!certificates?.length || ca.replace(/-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g, '').trim()) {
      throw new Error();
    }
    certificates.forEach(certificate => new X509Certificate(certificate));
    return ca;
  } catch {
    throw new DatabaseConfigError('DB_SSL_CA must contain valid PEM CA certificates.');
  }
}

export function getDatabaseConfig(env: NodeJS.ProcessEnv): PoolConfig {
  let connection: Pick<PoolConfig, 'host' | 'port' | 'database' | 'user' | 'password'>;
  let urlMode: string | null = null;
  const usesUrl = env.DATABASE_URL !== undefined;

  if (usesUrl) {
    const { sslmode, ...parsed } = parseDatabaseUrl(env.DATABASE_URL!);
    connection = parsed;
    urlMode = sslmode;
  } else {
    const required = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'] as const;
    if (required.some(key => !env[key]?.trim())) {
      throw new DatabaseConfigError('Set DATABASE_URL or all of DB_HOST, DB_PORT, DB_NAME, DB_USER and DB_PASSWORD.');
    }
    connection = {
      host: env.DB_HOST,
      port: parsePort(env.DB_PORT!),
      database: env.DB_NAME,
      user: env.DB_USER,
      password: env.DB_PASSWORD,
    };
  }

  // "require" is intentionally strengthened to certificate AND hostname verification.
  // We never offer a no-verify mode or allow URL parameters to downgrade TLS.
  for (const mode of [urlMode, env.DB_SSL_MODE]) {
    if (mode != null && mode !== 'verify-full' && mode !== 'require') {
      throw new DatabaseConfigError('Database SSL mode must be verify-full or require (both fully verify TLS).');
    }
  }
  const ca = env.DB_SSL_CA !== undefined ? readCertificate(env.DB_SSL_CA) : undefined;
  const useTls = usesUrl || urlMode !== null || env.DB_SSL_MODE !== undefined || ca !== undefined;
  if (useTls && connection.host!.startsWith('/')) {
    throw new DatabaseConfigError('Verified database TLS requires a TCP hostname, not a Unix socket.');
  }

  return {
    ...connection,
    // Keep the existing DB_* no-TLS default only for compatibility. DATABASE_URL always uses TLS.
    ssl: useTls ? {
      rejectUnauthorized: true,
      ...(ca === undefined ? {} : { ca }),
      // Explicitly bind verification to the configured host, including IP addresses.
      checkServerIdentity: (_hostname, certificate) => checkServerIdentity(connection.host!, certificate),
    } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  };
}
