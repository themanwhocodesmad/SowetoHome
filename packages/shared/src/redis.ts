export interface RedisConnectionOptions {
  host: string;
  port: number;
  password?: string;
  db?: number;
}

// Returns a plain options object rather than an ioredis `Redis` instance on purpose: bullmq
// bundles its own copy of ioredis, and passing an instance created from a *different*
// top-level ioredis install trips a TypeScript structural mismatch between the two copies'
// classes. A plain object has no such cross-package identity to conflict with.
export function parseRedisUrl(redisUrl: string): RedisConnectionOptions {
  const url = new URL(redisUrl);
  const db = url.pathname && url.pathname !== '/' ? Number(url.pathname.slice(1)) : undefined;
  return {
    host: url.hostname,
    port: url.port ? Number(url.port) : 6379,
    password: url.password || undefined,
    db,
  };
}
