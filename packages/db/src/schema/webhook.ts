import { pgTable, text, timestamp, jsonb, boolean, integer } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const webhook = pgTable("webhook", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  secret: text("secret").notNull(),
  events: jsonb("events").$type<string[]>().notNull().default([]),
  isActive: boolean("is_active").notNull().default(true),
  retryCount: integer("retry_count").notNull().default(3),
  timeoutMs: integer("timeout_ms").notNull().default(5000),
  lastTriggeredAt: timestamp("last_triggered_at", { withTimezone: true }),
  lastSuccessAt: timestamp("last_success_at", { withTimezone: true }),
  lastFailureAt: timestamp("last_failure_at", { withTimezone: true }),
  lastFailureReason: text("last_failure_reason"),
  userId: text("user_id").notNull().references(() => user.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const webhookDelivery = pgTable("webhook_delivery", {
  id: text("id").primaryKey(),
  webhookId: text("webhook_id").notNull().references(() => webhook.id),
  event: text("event").notNull(),
  payload: jsonb("payload"),
  status: text("status").notNull().$type<"success" | "failed" | "pending">(),
  statusCode: integer("status_code"),
  duration: integer("duration"),
  error: text("error"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
