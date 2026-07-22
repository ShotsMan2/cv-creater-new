import { t } from "@lingui/core/macro";
import { ScrollIcon } from "@phosphor-icons/react";
import { createFileRoute } from "@tanstack/react-router";
import { Separator } from "@reactive-resume/ui/components/separator";
import { AuditLogTable } from "@/features/admin/components/audit-log-table";
import { DashboardHeader } from "../dashboard/-components/header";

export const Route = createFileRoute("/admin/audit")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div className="space-y-4">
			<DashboardHeader icon={ScrollIcon} title={t`Audit Log`} />
			<Separator />
			<AuditLogTable />
		</div>
	);
}
