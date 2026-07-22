import { adminProcedure } from "../../context";
import { db } from "@reactive-resume/db/client";
import { user, auditLog } from "@reactive-resume/db/schema";
import { desc } from "drizzle-orm";
import { z } from "zod";

export const adminRouter = {
	getUsers: adminProcedure
		.route({
			method: "GET",
			path: "/admin/users",
			tags: ["Admin"],
			operationId: "adminGetUsers",
			summary: "Get all users (Admin)",
			description: "Returns a list of all users in the system. Requires admin access.",
			successDescription: "A list of users.",
		})
		.input(
			z.object({
				limit: z.number().min(1).max(100).default(50),
				offset: z.number().min(0).default(0),
			}).optional().default({ limit: 50, offset: 0 })
		)
		.handler(async ({ input }) => {
			const users = await db
				.select()
				.from(user)
				.limit(input.limit)
				.offset(input.offset)
				.orderBy(desc(user.createdAt));
			return users;
		}),

	getAuditLogs: adminProcedure
		.route({
			method: "GET",
			path: "/admin/audit-logs",
			tags: ["Admin"],
			operationId: "adminGetAuditLogs",
			summary: "Get all audit logs (Admin)",
			description: "Returns a list of all system audit logs. Requires admin access.",
			successDescription: "A list of audit logs.",
		})
		.input(
			z.object({
				limit: z.number().min(1).max(100).default(50),
				offset: z.number().min(0).default(0),
			}).optional().default({ limit: 50, offset: 0 })
		)
		.handler(async ({ input }) => {
			const logs = await db
				.select()
				.from(auditLog)
				.limit(input.limit)
				.offset(input.offset)
				.orderBy(desc(auditLog.createdAt));
			return logs;
		}),
};
