import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "@reactive-resume/db/client";
import * as schema from "@reactive-resume/db/schema";

export const quotaService = {
	getUserQuota: async ({ userId, provider }: { userId: string; provider?: string | undefined }) => {
		const conditions = [eq(schema.aiTokenQuota.userId, userId)];
		if (provider) conditions.push(eq(schema.aiTokenQuota.provider, provider));

		return db
			.select()
			.from(schema.aiTokenQuota)
			.where(and(...conditions))
			.orderBy(desc(schema.aiTokenQuota.billingPeriodEnd))
			.limit(10);
	},

	getWorkspaceQuota: async ({ workspaceId, provider }: { workspaceId: string; provider?: string | undefined }) => {
		const conditions = [eq(schema.aiTokenQuota.workspaceId, workspaceId)];
		if (provider) conditions.push(eq(schema.aiTokenQuota.provider, provider));

		return db
			.select()
			.from(schema.aiTokenQuota)
			.where(and(...conditions))
			.orderBy(desc(schema.aiTokenQuota.billingPeriodEnd))
			.limit(10);
	},

	getUsageSummary: async ({ userId }: { userId: string }) => {
		const [result] = await db
			.select({
				totalTokensUsed: sql<number>`coalesce(sum(${schema.aiTokenQuota.tokensUsed}), 0)`,
				totalCost: sql<number>`coalesce(sum(${schema.aiTokenQuota.costInMillicents}), 0)`,
				totalLimit: sql<number>`coalesce(sum(${schema.aiTokenQuota.tokenLimit}), 0)`,
			})
			.from(schema.aiTokenQuota)
			.where(eq(schema.aiTokenQuota.userId, userId));

		return result ?? { totalTokensUsed: 0, totalCost: 0, totalLimit: 0 };
	},

	trackUsage: async ({
		userId,
		workspaceId,
		provider,
		model,
		tokensUsed,
		costInMillicents,
	}: {
		userId: string;
		workspaceId?: string;
		provider: string;
		model: string;
		tokensUsed: number;
		costInMillicents: number;
	}) => {
		const { generateId } = await import("@reactive-resume/utils/string");

		const now = new Date();
		const billingPeriodStart = new Date(now.getFullYear(), now.getMonth(), 1);
		const billingPeriodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

		const [existing] = await db
			.select()
			.from(schema.aiTokenQuota)
			.where(
				and(
					eq(schema.aiTokenQuota.userId, userId),
					eq(schema.aiTokenQuota.provider, provider),
					eq(schema.aiTokenQuota.model, model),
					gte(schema.aiTokenQuota.billingPeriodStart, billingPeriodStart),
					lte(schema.aiTokenQuota.billingPeriodEnd, billingPeriodEnd),
				),
			)
			.limit(1);

		if (existing) {
			await db
				.update(schema.aiTokenQuota)
				.set({
					tokensUsed: sql`${schema.aiTokenQuota.tokensUsed} + ${tokensUsed}`,
					costInMillicents: sql`${schema.aiTokenQuota.costInMillicents} + ${costInMillicents}`,
				})
				.where(eq(schema.aiTokenQuota.id, existing.id));
			return existing.id;
		}

		await db.insert(schema.aiTokenQuota).values({
			id: generateId(),
			userId,
			workspaceId,
			provider,
			model,
			tokensUsed,
			costInMillicents,
			billingPeriodStart,
			billingPeriodEnd,
		});
	},
};
