import { and, asc, desc, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "@reactive-resume/db/client";
import * as schema from "@reactive-resume/db/schema";

export const telemetryService = {
	getLatestByMetricName: async ({ metricName, limit = 60 }: { metricName: string; limit?: number }) => {
		return db
			.select()
			.from(schema.telemetryMetric)
			.where(eq(schema.telemetryMetric.metricName, metricName))
			.orderBy(desc(schema.telemetryMetric.timestamp))
			.limit(limit);
	},

	getRange: async ({ metricName, fromDate, toDate }: { metricName: string; fromDate: Date; toDate: Date }) => {
		return db
			.select()
			.from(schema.telemetryMetric)
			.where(
				and(
					eq(schema.telemetryMetric.metricName, metricName),
					gte(schema.telemetryMetric.timestamp, fromDate),
					lte(schema.telemetryMetric.timestamp, toDate),
				),
			)
			.orderBy(asc(schema.telemetryMetric.timestamp));
	},

	getSummary: async () => {
		const dbPoolQuery = db
			.select({
				metricValue: schema.telemetryMetric.metricValue,
				timestamp: schema.telemetryMetric.timestamp,
			})
			.from(schema.telemetryMetric)
			.where(eq(schema.telemetryMetric.metricName, "db_connection_pool"))
			.orderBy(desc(schema.telemetryMetric.timestamp))
			.limit(1);

		const redisQuery = db
			.select({
				metricValue: schema.telemetryMetric.metricValue,
				timestamp: schema.telemetryMetric.timestamp,
			})
			.from(schema.telemetryMetric)
			.where(eq(schema.telemetryMetric.metricName, "redis_connected_clients"))
			.orderBy(desc(schema.telemetryMetric.timestamp))
			.limit(1);

		const s3Query = db
			.select({
				metricValue: schema.telemetryMetric.metricValue,
				timestamp: schema.telemetryMetric.timestamp,
			})
			.from(schema.telemetryMetric)
			.where(eq(schema.telemetryMetric.metricName, "s3_storage_used"))
			.orderBy(desc(schema.telemetryMetric.timestamp))
			.limit(1);

		const apiLatencyQuery = db
			.select({
				metricValue: schema.telemetryMetric.metricValue,
				timestamp: schema.telemetryMetric.timestamp,
			})
			.from(schema.telemetryMetric)
			.where(eq(schema.telemetryMetric.metricName, "api_latency_p95"))
			.orderBy(desc(schema.telemetryMetric.timestamp))
			.limit(1);

		const userCountQuery = db.select({ count: sql<number>`count(*)::int` }).from(schema.user);

		const resumeCountQuery = db.select({ count: sql<number>`count(*)::int` }).from(schema.resume);

		const workspaceCountQuery = db.select({ count: sql<number>`count(*)::int` }).from(schema.workspace);

		const [[dbPool], [redis], [s3], [apiLatency], [userCount], [resumeCount], [workspaceCount]] = await Promise.all([
			dbPoolQuery,
			redisQuery,
			s3Query,
			apiLatencyQuery,
			userCountQuery,
			resumeCountQuery,
			workspaceCountQuery,
		]);

		return {
			dbConnectionPool: dbPool ?? null,
			redisConnectedClients: redis ?? null,
			s3StorageUsed: s3 ?? null,
			apiLatencyP95: apiLatency ?? null,
			totalUsers: userCount?.count ?? 0,
			totalResumes: resumeCount?.count ?? 0,
			totalWorkspaces: workspaceCount?.count ?? 0,
		};
	},
};
