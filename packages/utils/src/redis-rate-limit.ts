// Redis-based distributed rate limiter
// Falls back to in-memory rate limiter when Redis is unavailable

import { Redis } from "ioredis";

interface RateLimitConfig {
  windowMs: number;
  max: number;
}

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: Date;
}

class RedisRateLimiter {
  private client: Redis | null = null;
  private memoryStore = new Map<string, { count: number; resetAt: number }>();
  private useRedis = false;

  constructor() {
    this.initRedis();
  }

  private initRedis() {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) return;

    try {
      this.client = new Redis(redisUrl, {
        maxRetriesPerRequest: 1,
        retryStrategy: (times: number) => (times > 3 ? null : Math.min(times * 100, 3000)),
        lazyConnect: true,
      });

      this.client.on("error", () => {
        this.useRedis = false;
      });

      this.client.connect().then(() => {
        this.useRedis = true;
      }).catch(() => {
        this.useRedis = false;
      });
    } catch {
      this.useRedis = false;
    }
  }

  async check(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
    if (this.useRedis && this.client) {
      return this.checkRedis(key, config);
    }
    return this.checkMemory(key, config);
  }

  private async checkRedis(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
    try {
      const now = Date.now();
      const windowKey = Math.floor(now / config.windowMs);
      const redisKey = `ratelimit:${key}:${windowKey}`;

      const result = await this.client!.incr(redisKey);
      if (result === 1) {
        await this.client!.pexpire(redisKey, config.windowMs);
      }

      const ttl = await this.client!.pttl(redisKey);
      const resetAt = new Date(now + (ttl > 0 ? ttl : config.windowMs));

      return {
        success: result <= config.max,
        limit: config.max,
        remaining: Math.max(0, config.max - result),
        resetAt,
      };
    } catch {
      return this.checkMemory(key, config);
    }
  }

  private checkMemory(key: string, config: RateLimitConfig): RateLimitResult {
    const now = Date.now();
    const record = this.memoryStore.get(key);

    if (!record || now > record.resetAt) {
      this.memoryStore.set(key, { count: 1, resetAt: now + config.windowMs });
      return { success: true, limit: config.max, remaining: config.max - 1, resetAt: new Date(now + config.windowMs) };
    }

    record.count++;
    return {
      success: record.count <= config.max,
      limit: config.max,
      remaining: Math.max(0, config.max - record.count),
      resetAt: new Date(record.resetAt),
    };
  }

  // Cleanup expired entries from memory store periodically
  startCleanup(intervalMs = 60000) {
    setInterval(() => {
      const now = Date.now();
      for (const [key, record] of this.memoryStore.entries()) {
        if (now > record.resetAt) {
          this.memoryStore.delete(key);
        }
      }
    }, intervalMs).unref();
  }
}

export const rateLimiter = new RedisRateLimiter();
export type { RateLimitConfig, RateLimitResult };
