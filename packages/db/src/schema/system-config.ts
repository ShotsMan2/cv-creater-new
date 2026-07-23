import { pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core";

export const systemConfig = pgTable("system_config", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: jsonb("value").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  updatedById: text("updated_by_id"),
});
