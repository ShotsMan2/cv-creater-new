import { z } from "zod";
import { protectedProcedure } from "../../context";
import { webhookService } from "./service";

export const webhookRouter = {
  listWebhooks: protectedProcedure
    .route({ method: "GET", path: "/webhooks", tags: ["Webhooks"], operationId: "webhookList" })
    .input(z.object({ page: z.number().min(1).default(1), limit: z.number().min(1).max(100).default(10) }))
    .handler(async ({ input, context }) => webhookService.list({ userId: context.user!.id, ...input })),

  getWebhook: protectedProcedure
    .route({ method: "GET", path: "/webhooks/:id", tags: ["Webhooks"], operationId: "webhookGet" })
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => webhookService.getById(input.id, context.user!.id)),

  createWebhook: protectedProcedure
    .route({ method: "POST", path: "/webhooks", tags: ["Webhooks"], operationId: "webhookCreate" })
    .input(
      z.object({
        name: z.string().min(1).max(100),
        url: z.string().url(),
        events: z.array(z.string()).min(1),
        retryCount: z.number().min(0).max(10).default(3),
        timeoutMs: z.number().min(1000).max(30000).default(5000),
      }),
    )
    .handler(async ({ input, context }) => webhookService.create(input, context.user!.id)),

  updateWebhook: protectedProcedure
    .route({ method: "PUT", path: "/webhooks/:id", tags: ["Webhooks"], operationId: "webhookUpdate" })
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(100).optional(),
        url: z.string().url().optional(),
        events: z.array(z.string()).min(1).optional(),
        isActive: z.boolean().optional(),
        retryCount: z.number().min(0).max(10).optional(),
        timeoutMs: z.number().min(1000).max(30000).optional(),
      }),
    )
    .handler(async ({ input, context }) => webhookService.update(input.id, context.user!.id, input)),

  deleteWebhook: protectedProcedure
    .route({ method: "DELETE", path: "/webhooks/:id", tags: ["Webhooks"], operationId: "webhookDelete" })
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => webhookService.delete(input.id, context.user!.id)),

  getWebhookDeliveries: protectedProcedure
    .route({ method: "GET", path: "/webhooks/:id/deliveries", tags: ["Webhooks"], operationId: "webhookDeliveries" })
    .input(
      z.object({
        id: z.string(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(10),
      }),
    )
    .handler(async ({ input, context }) =>
      webhookService.getDeliveries(input.id, context.user!.id, input.page, input.limit),
    ),
};
