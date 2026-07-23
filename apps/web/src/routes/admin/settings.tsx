import { t } from "@lingui/core/macro";
import { Gear } from "@phosphor-icons/react";
import { createFileRoute } from "@tanstack/react-router";
import { Separator } from "@reactive-resume/ui/components/separator";
import { SystemSettingsForm } from "@/features/admin/components/system-settings-form";
import { DashboardHeader } from "../dashboard/-components/header";

export const Route = createFileRoute("/admin/settings")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div className="space-y-4">
			<DashboardHeader icon={Gear} title={t`System Settings`} />
			<Separator />
			<SystemSettingsForm />
		</div>
	);
}
