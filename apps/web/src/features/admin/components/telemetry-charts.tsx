import { UserGrowthChart } from "./user-growth-chart";
import { SystemErrorsChart } from "./system-errors-chart";

export function TelemetryCharts() {

	return (
		<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
			<UserGrowthChart />
			<SystemErrorsChart />
		</div>
	);
}
