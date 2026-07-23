import { t } from "@lingui/core/macro";
import {
	Bar,
	BarChart,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@reactive-resume/ui/components/card";
import { Skeleton } from "@reactive-resume/ui/components/skeleton";
import { useSystemStats } from "../hooks/use-admin";

export function SystemErrorsChart() {
	const { data: stats, isLoading } = useSystemStats();

	const chartData = stats
		? [
				{ name: t`Users`, value: stats.totalUsers, fill: "#3b82f6" },
				{ name: t`Resumes`, value: stats.totalResumes, fill: "#10b981" },
				{ name: t`Workspaces`, value: stats.totalWorkspaces, fill: "#f59e0b" },
				{ name: t`Active Today`, value: stats.activeUsersToday, fill: "#22c55e" },
				{ name: t`Signups Today`, value: stats.signupsToday, fill: "#8b5cf6" },
			]
		: [];

	return (
		<Card className="lg:col-span-3">
			<CardHeader>
				<CardTitle>{t`System Diagnostics`}</CardTitle>
				<CardDescription>{t`System resource distribution overview`}</CardDescription>
			</CardHeader>
			<CardContent className="h-[300px]">
				{isLoading ? (
					<Skeleton className="h-full w-full" />
				) : (
					<ResponsiveContainer width="100%" height="100%">
						<BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
							<CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
							<XAxis
								dataKey="name"
								stroke="hsl(var(--muted-foreground))"
								fontSize={12}
								tickLine={false}
								axisLine={false}
							/>
							<YAxis
								stroke="hsl(var(--muted-foreground))"
								fontSize={12}
								tickLine={false}
								axisLine={false}
								allowDecimals={false}
							/>
							<Tooltip
								contentStyle={{
									backgroundColor: "hsl(var(--background))",
									borderColor: "hsl(var(--border))",
									borderRadius: "8px",
								}}
								itemStyle={{ color: "hsl(var(--foreground))" }}
								cursor={{ fill: "hsl(var(--muted))" }}
							/>
							<Bar dataKey="value" name={t`Count`} radius={[4, 4, 0, 0]} />
						</BarChart>
					</ResponsiveContainer>
				)}
			</CardContent>
		</Card>
	);
}
