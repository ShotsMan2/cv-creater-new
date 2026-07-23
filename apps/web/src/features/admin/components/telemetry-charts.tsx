import { t } from "@lingui/core/macro";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@reactive-resume/ui/components/card";

const mockLineData = Array.from({ length: 30 }).map((_, i) => ({
	date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString(undefined, {
		month: "short",
		day: "numeric",
	}),
	activeUsers: Math.floor(Math.random() * 500) + 1000,
	newSignups: Math.floor(Math.random() * 50) + 10,
}));

const mockBarData = [
	{ name: "Frontend", errors: 12 },
	{ name: "API", errors: 34 },
	{ name: "Database", errors: 5 },
	{ name: "Redis", errors: 2 },
	{ name: "Worker", errors: 18 },
];

export function TelemetryCharts() {
	return (
		<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
			<Card className="lg:col-span-4">
				<CardHeader>
					<CardTitle>{t`User Growth Overview`}</CardTitle>
					<CardDescription>{t`Active users and signups over the last 30 days`}</CardDescription>
				</CardHeader>
				<CardContent className="h-[300px]">
					<ResponsiveContainer width="100%" height="100%">
						<AreaChart data={mockLineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
							<defs>
								<linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
									<stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
									<stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
								</linearGradient>
								<linearGradient id="colorSignups" x1="0" y1="0" x2="0" y2="1">
									<stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
									<stop offset="95%" stopColor="#10b981" stopOpacity={0} />
								</linearGradient>
							</defs>
							<CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
							<XAxis
								dataKey="date"
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
								tickFormatter={(v) => `${v}`}
							/>
							<Tooltip
								contentStyle={{
									backgroundColor: "hsl(var(--background))",
									borderColor: "hsl(var(--border))",
									borderRadius: "8px",
								}}
								itemStyle={{ color: "hsl(var(--foreground))" }}
							/>
							<Area
								type="monotone"
								dataKey="activeUsers"
								name={t`Active Users`}
								stroke="#3b82f6"
								fillOpacity={1}
								fill="url(#colorUsers)"
							/>
							<Area
								type="monotone"
								dataKey="newSignups"
								name={t`New Signups`}
								stroke="#10b981"
								fillOpacity={1}
								fill="url(#colorSignups)"
							/>
						</AreaChart>
					</ResponsiveContainer>
				</CardContent>
			</Card>

			<Card className="lg:col-span-3">
				<CardHeader>
					<CardTitle>{t`System Errors by Service`}</CardTitle>
					<CardDescription>{t`Error distribution in the last 24 hours`}</CardDescription>
				</CardHeader>
				<CardContent className="h-[300px]">
					<ResponsiveContainer width="100%" height="100%">
						<BarChart data={mockBarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
							<CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
							<XAxis
								dataKey="name"
								stroke="hsl(var(--muted-foreground))"
								fontSize={12}
								tickLine={false}
								axisLine={false}
							/>
							<YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
							<Tooltip
								contentStyle={{
									backgroundColor: "hsl(var(--background))",
									borderColor: "hsl(var(--border))",
									borderRadius: "8px",
								}}
								itemStyle={{ color: "hsl(var(--foreground))" }}
								cursor={{ fill: "hsl(var(--muted))" }}
							/>
							<Bar dataKey="errors" name={t`Errors`} fill="#ef4444" radius={[4, 4, 0, 0]} />
						</BarChart>
					</ResponsiveContainer>
				</CardContent>
			</Card>
		</div>
	);
}
