import { t } from "@lingui/core/macro";
import { UsersIcon } from "@phosphor-icons/react";
import { createFileRoute } from "@tanstack/react-router";
import { Separator } from "@reactive-resume/ui/components/separator";
import { UsersTable } from "@/features/admin/components/users-table";
import { DashboardHeader } from "../dashboard/-components/header";

export const Route = createFileRoute("/admin/users")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div className="space-y-4">
			<DashboardHeader icon={UsersIcon} title={t`Users`} />
			<Separator />
			<UsersTable />
		</div>
	);
}
