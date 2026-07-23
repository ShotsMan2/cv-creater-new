import type { Context, Next } from "hono";
import { generateId } from "@reactive-resume/utils/string";

export async function requestId(c: Context, next: Next) {
  const id = c.req.header("x-request-id") || generateId();
  c.set("requestId", id);
  c.header("x-request-id", id);
  await next();
}
