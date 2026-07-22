import * as pg from "drizzle-orm/pg-core";
import { generateId } from "@reactive-resume/utils/string";
import { user } from "./auth";

export const workspaceRole = pg.pgEnum("workspace_role", ["owner", "admin", "member", "recruiter", "auditor"]);

export const workspace = pg.pgTable(
	"workspace",
	{
		id: pg
			.text("id")
			.notNull()
			.primaryKey()
			.$defaultFn(() => generateId()),
		name: pg.text("name").notNull(),
		slug: pg.text("slug").notNull().unique(),
		logoUrl: pg.text("logo_url"),
		customDomain: pg.text("custom_domain").unique(),
		customDomainVerified: pg.boolean("custom_domain_verified").notNull().default(false),
		primaryColor: pg.text("primary_color"),
		ownerId: pg
			.text("owner_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		billingEmail: pg.text("billing_email"),
		maxMembers: pg.integer("max_members").notNull().default(10),
		maxResumes: pg.integer("max_resumes").notNull().default(100),
		isActive: pg.boolean("is_active").notNull().default(true),
		createdAt: pg.timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
		updatedAt: pg
			.timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(t) => [pg.index().on(t.ownerId), pg.index().on(t.slug), pg.index().on(t.customDomain), pg.index().on(t.isActive)],
);

export const workspaceMember = pg.pgTable(
	"workspace_member",
	{
		id: pg
			.text("id")
			.notNull()
			.primaryKey()
			.$defaultFn(() => generateId()),
		workspaceId: pg
			.text("workspace_id")
			.notNull()
			.references(() => workspace.id, { onDelete: "cascade" }),
		userId: pg
			.text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		role: pg.text("role").notNull().default("member"),
		invitedBy: pg.text("invited_by").references(() => user.id, { onDelete: "set null" }),
		joinedAt: pg.timestamp("joined_at", { withTimezone: true }).defaultNow(),
		createdAt: pg.timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
		updatedAt: pg
			.timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(t) => [
		pg.unique().on(t.workspaceId, t.userId),
		pg.index().on(t.workspaceId),
		pg.index().on(t.userId),
		pg.index().on(t.role),
	],
);

export const workspaceInvite = pg.pgTable(
	"workspace_invite",
	{
		id: pg
			.text("id")
			.notNull()
			.primaryKey()
			.$defaultFn(() => generateId()),
		workspaceId: pg
			.text("workspace_id")
			.notNull()
			.references(() => workspace.id, { onDelete: "cascade" }),
		email: pg.text("email").notNull(),
		role: pg.text("role").notNull().default("member"),
		token: pg.text("token").notNull().unique(),
		invitedBy: pg
			.text("invited_by")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		expiresAt: pg.timestamp("expires_at", { withTimezone: true }).notNull(),
		acceptedAt: pg.timestamp("accepted_at", { withTimezone: true }),
		createdAt: pg.timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	},
	(t) => [pg.index().on(t.workspaceId), pg.index().on(t.email), pg.index().on(t.token)],
);

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

export const telemetryMetric = pg.pgTable(
	"telemetry_metric",
	{
		id: pg
			.text("id")
			.notNull()
			.primaryKey()
			.$defaultFn(() => generateId()),
		metricName: pg.text("metric_name").notNull(),
		metricValue: pg.doublePrecision("metric_value").notNull(),
		labels: pg.jsonb("labels"),
		timestamp: pg.timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
		createdAt: pg.timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	},
	(t) => [pg.index().on(t.metricName, t.timestamp.desc()), pg.index().on(t.timestamp.desc())],
);

export const aiTokenQuota = pg.pgTable(
	"ai_token_quota",
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
		provider: pg.text("provider").notNull().default("openai"),
		model: pg.text("model").notNull().default("gpt-4"),
		tokensUsed: pg.integer("tokens_used").notNull().default(0),
		tokenLimit: pg.integer("token_limit").notNull().default(1000000),
		costInMillicents: pg.integer("cost_in_millicents").notNull().default(0),
		billingPeriodStart: pg.timestamp("billing_period_start", { withTimezone: true }).notNull().defaultNow(),
		billingPeriodEnd: pg.timestamp("billing_period_end", { withTimezone: true }).notNull(),
		createdAt: pg.timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
		updatedAt: pg
			.timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(t) => [pg.index().on(t.userId, t.provider), pg.index().on(t.workspaceId, t.billingPeriodStart, t.billingPeriodEnd)],
);
