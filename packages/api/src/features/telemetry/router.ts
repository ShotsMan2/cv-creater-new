import z from "zod";
import { protectedProcedure } from "../../context";
import { telemetryService } from "./service";

const telemetryEntrySchema = z.object({
	id: z.string(),
	metricName: z.string(),
	metricValue: z.number(),
	labels: z.any().nullable(),
	timestamp: z.date(),
	createdAt: z.date(),
});

export const telemetryRouter = {
	getLatest: protectedProcedure
		.route({
			method: "GET",
			path: "/telemetry/{metricName}",
			tags: ["Telemetry"],
			operationId: "getTelemetryLatest",
			summary: "Get latest telemetry values for a metric",
		})
		.input(z.object({ metricName: z.string(), limit: z.number().int().min(1).max(200).default(60) }))
		.output(z.array(telemetryEntrySchema))
		.handler(async ({ input }) => {
			return telemetryService.getLatestByMetricName({ metricName: input.metricName, limit: input.limit });
		}),

	getSummary: protectedProcedure
		.route({
			method: "GET",
			path: "/telemetry/summary",
			tags: ["Telemetry"],
			operationId: "getTelemetrySummary",
			summary: "Get summary of all telemetry metrics",
			description: "Returns the latest values for DB pool, Redis, S3, API latency, and total counts.",
		})
		.output(
			z.object({
				dbConnectionPool: telemetryEntrySchema.pick({ metricValue: true, timestamp: true }).nullable(),
				redisConnectedClients: telemetryEntrySchema.pick({ metricValue: true, timestamp: true }).nullable(),
				s3StorageUsed: telemetryEntrySchema.pick({ metricValue: true, timestamp: true }).nullable(),
				apiLatencyP95: telemetryEntrySchema.pick({ metricValue: true, timestamp: true }).nullable(),
				totalUsers: z.number(),
				totalResumes: z.number(),
				totalWorkspaces: z.number(),
			}),
		)
		.handler(async () => {
			return telemetryService.getSummary();
		}),
};
