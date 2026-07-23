import { t } from "@lingui/core/macro";
import { LinkIcon } from "@phosphor-icons/react";
import { createFileRoute } from "@tanstack/react-router";
import { Separator } from "@reactive-resume/ui/components/separator";
import { WebhooksSettingsPage } from "@/features/settings/pages/webhooks";
import { DashboardHeader } from "../-components/header";

export const Route = createFileRoute("/dashboard/settings/webhooks")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div className="space-y-4">
			<DashboardHeader icon={LinkIcon} title={t`Webhooks`} />

			<Separator />

			<WebhooksSettingsPage />
		</div>
	);
}
