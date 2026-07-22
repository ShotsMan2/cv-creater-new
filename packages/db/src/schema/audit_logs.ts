import * as pg from "drizzle-orm/pg-core";
import { generateId } from "@reactive-resume/utils/string";
import { user } from "./auth";
import { workspace } from "./workspace";

export const auditLog = pg.pgTable(
	"audit_log",
	{
		id: pg
			.text("id")
			.notNull()
			.primaryKey()
			.$defaultFn(() => generateId()),
		workspaceId: pg.text("workspace_id").references(() => workspace.id, { onDelete: "cascade" }),
		userId: pg
			.text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		action: pg.text("action").notNull(),
		entityType: pg.text("entity_type"),
		entityId: pg.text("entity_id"),
		details: pg.jsonb("details"),
		ipAddress: pg.text("ip_address"),
		userAgent: pg.text("user_agent"),
		createdAt: pg.timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	},
	(t) => [
		pg.index().on(t.workspaceId, t.createdAt.desc()),
		pg.index().on(t.userId, t.createdAt.desc()),
		pg.index().on(t.action),
		pg.index().on(t.createdAt.desc()),
	],
);
