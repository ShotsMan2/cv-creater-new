import type { Context, Next } from "hono";
import { logger } from "@reactive-resume/utils/logger";

export async function errorTracking(c: Context, next: Next) {
  try {
    await next();
  } catch (error) {
    logger.error({
      message: "Unhandled error",
      method: c.req.method,
      url: c.req.url,
      statusCode: c.res?.status,
      err: error,
    });
    throw error;
  }
}
