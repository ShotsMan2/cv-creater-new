import { t } from "@lingui/core/macro";
import { ShieldCheckIcon } from "@phosphor-icons/react";
import { createFileRoute } from "@tanstack/react-router";
import { Separator } from "@reactive-resume/ui/components/separator";
import { DataExportCard } from "@/features/gdpr/components/data-export";
import { AccountDeletionCard } from "@/features/gdpr/components/account-deletion";
import { DashboardHeader } from "../-components/header";

export const Route = createFileRoute("/dashboard/settings/privacy")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div className="space-y-4">
			<DashboardHeader icon={ShieldCheckIcon} title={t`Privacy & GDPR`} />
			<Separator />
			<DataExportCard />
			<AccountDeletionCard />
		</div>
	);
}
