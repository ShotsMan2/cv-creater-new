import { t } from "@lingui/core/macro";
import { ChartBar } from "@phosphor-icons/react";
import { createFileRoute } from "@tanstack/react-router";
import { Separator } from "@reactive-resume/ui/components/separator";
import { TelemetryCharts } from "@/features/admin/components/telemetry-charts";
import { DashboardHeader } from "../dashboard/-components/header";

export const Route = createFileRoute("/admin/analytics")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div className="space-y-4">
			<DashboardHeader icon={ChartBar} title={t`Analytics`} />
			<Separator />
			<TelemetryCharts />
		</div>
	);
}
