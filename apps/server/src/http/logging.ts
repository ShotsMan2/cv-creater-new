import type { Context, Next } from "hono";
import { createRequestLogger } from "@reactive-resume/utils/logger";

export async function requestLogging(c: Context, next: Next) {
  const startTime = Date.now();
  const log = createRequestLogger(c.req.raw, startTime);

  log.info("Request started");

  try {
    await next();
    log.info("Request completed", { statusCode: c.res.status });
  } catch (error) {
    log.error("Request failed", error);
    throw error;
  }
}
