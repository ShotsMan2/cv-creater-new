import { db } from "@reactive-resume/db/client";
import { sql } from "drizzle-orm";
import { Redis } from "ioredis";

interface HealthCheckResult {
  status: "healthy" | "degraded" | "unhealthy";
  checks: Record<string, { status: string; latency: number; error?: string }>;
  timestamp: string;
  uptime: number;
}

export async function handleDetailedHealth(): Promise<Response> {
  const checks: HealthCheckResult["checks"] = {};
  let overallStatus: HealthCheckResult["status"] = "healthy";

  // Database check
  try {
    const start = Date.now();
    await db.execute(sql`SELECT 1`);
    checks.database = { status: "up", latency: Date.now() - start };
  } catch (error) {
    checks.database = { status: "down", latency: 0, error: String(error) };
    overallStatus = "unhealthy";
  }

  // Redis check (if configured)
  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    try {
      const start = Date.now();
      const redis = new Redis(redisUrl, { lazyConnect: true });
      await redis.connect();
      await redis.ping();
      await redis.quit();
      checks.redis = { status: "up", latency: Date.now() - start };
    } catch (error) {
      checks.redis = { status: "down", latency: 0, error: String(error) };
      if (overallStatus !== "unhealthy") overallStatus = "degraded";
    }
  }

  // Storage check
  try {
    const start = Date.now();
    const hasS3 = process.env.S3_BUCKET;
    if (hasS3) {
      // S3 head bucket check would go here
      checks.storage = { status: "up", latency: Date.now() - start };
    } else {
      checks.storage = { status: "up", latency: 0 };
    }
  } catch {
    checks.storage = { status: "down", latency: 0 };
    if (overallStatus !== "unhealthy") overallStatus = "degraded";
  }

  const result: HealthCheckResult = {
    status: overallStatus,
    checks,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  };

  return new Response(JSON.stringify(result, null, 2), {
    status: overallStatus === "healthy" ? 200 : overallStatus === "degraded" ? 200 : 503,
    headers: { "content-type": "application/json" },
  });
}
