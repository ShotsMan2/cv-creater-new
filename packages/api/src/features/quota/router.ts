import z from "zod";
import { protectedProcedure } from "../../context";
import { quotaService } from "./service";

export const quotaRouter = {
	getUserQuota: protectedProcedure
		.route({
			method: "GET",
			path: "/quotas/user",
			tags: ["Quotas"],
			operationId: "getUserQuota",
			summary: "Get AI token quota for current user",
		})
		.input(z.object({ provider: z.string().optional() }))
		.output(z.any())
		.handler(async ({ input, context }) => {
			return quotaService.getUserQuota({
				userId: context.user.id,
				provider: (input as { provider?: string }).provider,
			});
		}),

	getWorkspaceQuota: protectedProcedure
		.route({
			method: "GET",
			path: "/quotas/workspace/{workspaceId}",
			tags: ["Quotas"],
			operationId: "getWorkspaceQuota",
			summary: "Get AI token quota for a workspace",
		})
		.input(z.object({ workspaceId: z.string(), provider: z.string().optional() }))
		.output(z.any())
		.handler(async ({ input }) => {
			return quotaService.getWorkspaceQuota({
				workspaceId: input.workspaceId,
				provider: (input as { provider?: string }).provider,
			});
		}),

	getUsageSummary: protectedProcedure
		.route({
			method: "GET",
			path: "/quotas/summary",
			tags: ["Quotas"],
			operationId: "getQuotaUsageSummary",
			summary: "Get AI token usage summary",
		})
		.output(z.object({ totalTokensUsed: z.number(), totalCost: z.number(), totalLimit: z.number() }))
		.handler(async ({ context }) => {
			return quotaService.getUsageSummary({ userId: context.user.id });
		}),
};
