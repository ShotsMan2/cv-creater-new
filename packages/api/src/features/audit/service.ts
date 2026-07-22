import { and, desc, eq, gte, lte } from "drizzle-orm";
import { db } from "@reactive-resume/db/client";
import * as schema from "@reactive-resume/db/schema";

export const auditService = {
	list: async ({
		workspaceId,
		limit = 50,
		offset = 0,
		action,
		fromDate,
		toDate,
	}: {
		workspaceId?: string | undefined;
		limit?: number | undefined;
		offset?: number | undefined;
		action?: string | undefined;
		fromDate?: Date | undefined;
		toDate?: Date | undefined;
	}) => {
		const whereClauses = [];

		if (workspaceId) {
			whereClauses.push(eq(schema.auditLog.workspaceId, workspaceId));
		}
		if (action) {
			whereClauses.push(eq(schema.auditLog.action, action));
		}
		if (fromDate) {
			whereClauses.push(gte(schema.auditLog.createdAt, fromDate));
		}
		if (toDate) {
			whereClauses.push(lte(schema.auditLog.createdAt, toDate));
		}

		const condition = whereClauses.length > 0 ? and(...whereClauses) : undefined;

		return db
			.select({
				id: schema.auditLog.id,
				workspaceId: schema.auditLog.workspaceId,
				userId: schema.auditLog.userId,
				action: schema.auditLog.action,
				entityType: schema.auditLog.entityType,
				entityId: schema.auditLog.entityId,
				details: schema.auditLog.details,
				ipAddress: schema.auditLog.ipAddress,
				userAgent: schema.auditLog.userAgent,
				createdAt: schema.auditLog.createdAt,
				userName: schema.user.name,
				userEmail: schema.user.email,
			})
			.from(schema.auditLog)
			.leftJoin(schema.user, eq(schema.auditLog.userId, schema.user.id))
			.where(condition)
			.orderBy(desc(schema.auditLog.createdAt))
			.limit(limit)
			.offset(offset);
	},

	create: async ({
		workspaceId,
		userId,
		action,
		entityType,
		entityId,
		details,
		ipAddress,
		userAgent,
	}: {
		workspaceId?: string | undefined;
		userId: string;
		action: string;
		entityType?: string | undefined;
		entityId?: string | undefined;
		details?: Record<string, unknown> | undefined;
		ipAddress?: string | undefined;
		userAgent?: string | undefined;
	}) => {
		const { generateId } = await import("@reactive-resume/utils/string");
		await db.insert(schema.auditLog).values({
			id: generateId(),
			workspaceId,
			userId,
			action,
			entityType,
			entityId,
			details: details as Record<string, unknown> | null | undefined,
			ipAddress,
			userAgent,
		});
	},
};
