import { t } from "@lingui/core/macro";
import { GaugeIcon } from "@phosphor-icons/react";
import { createFileRoute } from "@tanstack/react-router";
import { Separator } from "@reactive-resume/ui/components/separator";
import { TelemetryDashboard } from "@/features/admin/components/telemetry-dashboard";
import { DashboardHeader } from "../dashboard/-components/header";

export const Route = createFileRoute("/admin/telemetry")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div className="space-y-4">
			<DashboardHeader icon={GaugeIcon} title={t`System Telemetry`} />
			<Separator />
			<TelemetryDashboard />
		</div>
	);
}
