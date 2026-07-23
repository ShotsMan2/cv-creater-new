import { t } from "@lingui/core/macro";
import { DownloadSimple } from "@phosphor-icons/react";
import { useState } from "react";
import {
	Area,
	AreaChart,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { Button } from "@reactive-resume/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@reactive-resume/ui/components/card";
import { Spinner } from "@reactive-resume/ui/components/spinner";
import { useUserGrowth } from "../hooks/use-admin";

const PERIOD_MAP = { daily: 7, weekly: 30, monthly: 90 } as const;
type Period = keyof typeof PERIOD_MAP;

export function UserGrowthChart() {
	const [period, setPeriod] = useState<Period>("weekly");
	const { data: userGrowth, isLoading } = useUserGrowth(PERIOD_MAP[period]);

	const chartData = (userGrowth ?? []).map((d: { date: string; count: number }) => ({
		date: d.date,
		count: d.count,
	}));

	const handleExportCSV = () => {
		const headers = ["Date", "Signups"];
		const rows = chartData.map((d: { date: string; count: number }) => `${d.date},${d.count}`);
		const csv = [headers.join(","), ...rows].join("\n");
		const blob = new Blob([csv], { type: "text/csv" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `user-growth-${period}-${new Date().toISOString().split("T")[0]}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	};

	return (
		<Card className="lg:col-span-4">
			<CardHeader className="flex-row items-center justify-between">
				<div>
					<CardTitle>{t`User Growth`}</CardTitle>
					<CardDescription>{t`New user signups over time`}</CardDescription>
				</div>
				<div className="flex items-center gap-x-2">
					<div className="flex rounded-lg border p-0.5">
						{(["daily", "weekly", "monthly"] as Period[]).map((p) => (
							<button
								key={p}
								type="button"
								className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
									period === p ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
								}`}
								onClick={() => setPeriod(p)}
							>
								{p === "daily" ? t`Daily` : p === "weekly" ? t`Weekly` : t`Monthly`}
							</button>
						))}
					</div>
					<Button variant="outline" size="icon-sm" onClick={handleExportCSV} title={t`Export to CSV`}>
						<DownloadSimple className="size-4" />
					</Button>
				</div>
			</CardHeader>
			<CardContent className="h-[300px]">
				{isLoading ? (
					<div className="flex h-full items-center justify-center">
						<Spinner className="size-6" />
					</div>
				) : (
					<ResponsiveContainer width="100%" height="100%">
						<AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
							<defs>
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
								allowDecimals={false}
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
								dataKey="count"
								name={t`Signups`}
								stroke="#10b981"
								fillOpacity={1}
								fill="url(#colorSignups)"
							/>
						</AreaChart>
					</ResponsiveContainer>
				)}
			</CardContent>
		</Card>
	);
}
