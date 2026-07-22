import { t } from "@lingui/core/macro";
import { Buildings } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@reactive-resume/ui/components/card";
import { Separator } from "@reactive-resume/ui/components/separator";
import { WorkspaceSettings } from "@/features/admin/components/workspace-settings";
import { orpc } from "@/libs/orpc/client";
import { DashboardHeader } from "../dashboard/-components/header";

export const Route = createFileRoute("/admin/workspaces")({
	component: RouteComponent,
});

function RouteComponent() {
	const { data: workspaces } = useQuery(orpc.workspace.list.queryOptions({}));

	return (
		<div className="space-y-4">
			<DashboardHeader icon={Buildings} title={t`Workspaces`} />
			<Separator />

			{(workspaces ?? []).length === 0 ? (
				<Card>
					<CardContent className="py-8 text-center text-muted-foreground text-sm">
						{t`You don't have any workspaces yet.`}
					</CardContent>
				</Card>
			) : (
				<div className="space-y-6">
					{(workspaces ?? []).map((ws: { id: string; name: string; slug: string; role: string }) => (
						<Card key={ws.id}>
							<CardHeader>
								<div className="flex items-center justify-between">
									<div>
										<CardTitle>{ws.name}</CardTitle>
										<p className="text-muted-foreground text-sm">/{ws.slug}</p>
									</div>
									<span className="rounded-full bg-muted px-3 py-1 text-xs">{ws.role}</span>
								</div>
							</CardHeader>
							<CardContent>
								<WorkspaceSettings workspaceId={ws.id} />
							</CardContent>
						</Card>
					))}
				</div>
			)}
		</div>
	);
}
