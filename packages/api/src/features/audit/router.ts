import z from "zod";
import { protectedProcedure } from "../../context";
import { auditService } from "./service";

const auditLogEntrySchema = z.object({
	id: z.string(),
	workspaceId: z.string().nullable(),
	userId: z.string(),
	action: z.string(),
	entityType: z.string().nullable(),
	entityId: z.string().nullable(),
	details: z.any().nullable(),
	ipAddress: z.string().nullable(),
	userAgent: z.string().nullable(),
	createdAt: z.date(),
	userName: z.string().nullable(),
	userEmail: z.string().nullable(),
});

export const auditRouter = {
	list: protectedProcedure
		.route({
			method: "GET",
			path: "/audit-logs",
			tags: ["Audit"],
			operationId: "listAuditLogs",
			summary: "List audit log entries",
		})
		.input(
			z.object({
				workspaceId: z.string().optional(),
				limit: z.number().int().min(1).max(200).default(50),
				offset: z.number().int().min(0).default(0),
				action: z.string().optional(),
				fromDate: z.string().datetime().optional(),
				toDate: z.string().datetime().optional(),
			}),
		)
		.output(z.array(auditLogEntrySchema))
		.handler(async ({ input }) => {
			const inputObj = input as {
				workspaceId?: string;
				limit?: number;
				offset?: number;
				action?: string;
				fromDate?: string;
				toDate?: string;
			};
			return auditService.list({
				workspaceId: inputObj.workspaceId,
				limit: inputObj.limit,
				offset: inputObj.offset,
				action: inputObj.action,
				fromDate: inputObj.fromDate ? new Date(inputObj.fromDate) : undefined,
				toDate: inputObj.toDate ? new Date(inputObj.toDate) : undefined,
			});
		}),
};
