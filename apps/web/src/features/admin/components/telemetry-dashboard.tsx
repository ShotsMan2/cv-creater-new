import type { RouterOutput } from "@/libs/orpc/client";
import { t } from "@lingui/core/macro";
import { Buildings, Coin, Database, FileText, Gauge, HardDrive, Users } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@reactive-resume/ui/components/card";
import { Skeleton } from "@reactive-resume/ui/components/skeleton";
import { orpc } from "@/libs/orpc/client";

type TelemetrySummary = RouterOutput["telemetry"]["getSummary"];

function MetricCard({
	icon: Icon,
	title,
	value,
	unit,
	timestamp,
	loading,
}: {
	icon: React.ComponentType<{ weight?: string; className?: string }>;
	title: string;
	value: string | number | undefined;
	unit?: string;
	timestamp?: string | null;
	loading?: boolean;
}) {
	return (
		<Card size="sm">
			<CardHeader className="flex-row items-center gap-x-3 space-y-0">
				<Icon weight="light" className="size-5 text-muted-foreground" />
				<CardTitle className="font-medium text-sm">{title}</CardTitle>
			</CardHeader>
			<CardContent>
				{loading ? (
					<Skeleton className="h-8 w-24" />
				) : (
					<>
						<p className="font-medium text-2xl tracking-tight">
							{value ?? "—"}
							{unit && <span className="ms-1 text-muted-foreground text-sm">{unit}</span>}
						</p>
						{timestamp && (
							<CardDescription className="mt-1 text-xs">
								{t`Last updated`}: {new Date(timestamp).toLocaleString()}
							</CardDescription>
						)}
					</>
				)}
			</CardContent>
		</Card>
	);
}

export function TelemetryDashboard() {
	const { data: summary, isLoading } = useQuery(orpc.telemetry.getSummary.queryOptions({}));

	const metrics = summary as TelemetrySummary | undefined;

	return (
		<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
			<MetricCard
				icon={Database}
				title={t`DB Connection Pool`}
				value={metrics?.dbConnectionPool?.metricValue}
				timestamp={metrics?.dbConnectionPool?.timestamp?.toISOString()}
				loading={isLoading}
			/>
			<MetricCard
				icon={Gauge}
				title={t`Redis Clients`}
				value={metrics?.redisConnectedClients?.metricValue}
				timestamp={metrics?.redisConnectedClients?.timestamp?.toISOString()}
				loading={isLoading}
			/>
			<MetricCard
				icon={HardDrive}
				title={t`S3 Storage Used`}
				value={metrics?.s3StorageUsed?.metricValue}
				unit="MB"
				timestamp={metrics?.s3StorageUsed?.timestamp?.toISOString()}
				loading={isLoading}
			/>
			<MetricCard
				icon={Coin}
				title={t`API Latency (p95)`}
				value={metrics?.apiLatencyP95?.metricValue}
				unit="ms"
				timestamp={metrics?.apiLatencyP95?.timestamp?.toISOString()}
				loading={isLoading}
			/>
			<MetricCard icon={Users} title={t`Total Users`} value={metrics?.totalUsers} loading={isLoading} />
			<MetricCard icon={FileText} title={t`Total Resumes`} value={metrics?.totalResumes} loading={isLoading} />
			<MetricCard icon={Buildings} title={t`Total Workspaces`} value={metrics?.totalWorkspaces} loading={isLoading} />
		</div>
	);
}
