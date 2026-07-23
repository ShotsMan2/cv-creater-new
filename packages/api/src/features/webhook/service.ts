import { createHash, randomBytes } from "node:crypto";
import { and, count, desc, eq } from "drizzle-orm";
import { db } from "@reactive-resume/db/client";
import { webhook, webhookDelivery } from "@reactive-resume/db/schema";
import { generateId } from "@reactive-resume/utils/string";
import { ORPCError } from "@orpc/server";

export class WebhookService {
  async list(params: { userId: string; page?: number; limit?: number }) {
    const { userId, page = 1, limit = 10 } = params;
    const offset = (page - 1) * limit;

    const [data, totalResult] = await Promise.all([
      db
        .select()
        .from(webhook)
        .where(eq(webhook.userId, userId))
        .orderBy(desc(webhook.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: count() })
        .from(webhook)
        .where(eq(webhook.userId, userId)),
    ]);

    return { data, total: totalResult[0]?.count ?? 0, page, limit };
  }

  async getById(id: string, userId: string) {
    const [hook] = await db
      .select()
      .from(webhook)
      .where(and(eq(webhook.id, id), eq(webhook.userId, userId)))
      .limit(1);
    if (!hook) throw new ORPCError("NOT_FOUND");
    return hook;
  }

  async create(data: { name: string; url: string; events: string[]; retryCount?: number; timeoutMs?: number }, userId: string) {
    const secret = randomBytes(32).toString("hex");
    const [created] = await db
      .insert(webhook)
      .values({
        id: generateId(),
        name: data.name,
        url: data.url,
        secret,
        events: data.events,
        retryCount: data.retryCount ?? 3,
        timeoutMs: data.timeoutMs ?? 5000,
        userId,
      })
      .returning();
    return created;
  }

  async update(
    id: string,
    userId: string,
    data: {
      name?: string | undefined;
      url?: string | undefined;
      events?: string[] | undefined;
      isActive?: boolean | undefined;
      retryCount?: number | undefined;
      timeoutMs?: number | undefined;
    },
  ) {
    const [existing] = await db
      .select()
      .from(webhook)
      .where(and(eq(webhook.id, id), eq(webhook.userId, userId)))
      .limit(1);
    if (!existing) throw new ORPCError("NOT_FOUND");

    const [updated] = await db
      .update(webhook)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(webhook.id, id))
      .returning();
    return updated;
  }

  async delete(id: string, userId: string) {
    const [existing] = await db
      .select()
      .from(webhook)
      .where(and(eq(webhook.id, id), eq(webhook.userId, userId)))
      .limit(1);
    if (!existing) throw new ORPCError("NOT_FOUND");

    await db.delete(webhookDelivery).where(eq(webhookDelivery.webhookId, id));
    await db.delete(webhook).where(eq(webhook.id, id));
    return { success: true };
  }

  async trigger(event: string, payload: unknown) {
    const hooks = await db.select().from(webhook).where(eq(webhook.isActive, true));

    const matching = hooks.filter((h) => h.events.includes(event));

    for (const hook of matching) {
      const deliveryId = generateId();
      const startTime = Date.now();

      try {
        const signature = createHash("sha256")
          .update(JSON.stringify(payload) + hook.secret)
          .digest("hex");

        const response = await fetch(hook.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Webhook-Signature": signature,
            "X-Webhook-Event": event,
            "X-Webhook-Delivery": deliveryId,
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(hook.timeoutMs),
        });

        const duration = Date.now() - startTime;

        await db.insert(webhookDelivery).values({
          id: deliveryId,
          webhookId: hook.id,
          event,
          payload,
          status: response.ok ? "success" : "failed",
          statusCode: response.status,
          duration,
        });

        await db
          .update(webhook)
          .set({
            lastTriggeredAt: new Date(),
            lastSuccessAt: response.ok ? new Date() : undefined,
            lastFailureAt: response.ok ? undefined : new Date(),
            lastFailureReason: response.ok ? undefined : `HTTP ${response.status}`,
          })
          .where(eq(webhook.id, hook.id));
      } catch (error) {
        const duration = Date.now() - startTime;

        await db.insert(webhookDelivery).values({
          id: deliveryId,
          webhookId: hook.id,
          event,
          payload,
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown error",
          duration,
        });

        await db
          .update(webhook)
          .set({
            lastTriggeredAt: new Date(),
            lastFailureAt: new Date(),
            lastFailureReason: error instanceof Error ? error.message : "Unknown error",
          })
          .where(eq(webhook.id, hook.id));
      }
    }
  }

  async getDeliveries(webhookId: string, userId: string, page: number, limit: number) {
    const offset = (page - 1) * limit;

    const [hook] = await db
      .select()
      .from(webhook)
      .where(and(eq(webhook.id, webhookId), eq(webhook.userId, userId)))
      .limit(1);
    if (!hook) throw new ORPCError("NOT_FOUND");

    const [data, totalResult] = await Promise.all([
      db
        .select()
        .from(webhookDelivery)
        .where(eq(webhookDelivery.webhookId, webhookId))
        .orderBy(desc(webhookDelivery.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: count() })
        .from(webhookDelivery)
        .where(eq(webhookDelivery.webhookId, webhookId)),
    ]);

    return { data, total: totalResult[0]?.count ?? 0, page, limit };
  }
}

export const webhookService = new WebhookService();
