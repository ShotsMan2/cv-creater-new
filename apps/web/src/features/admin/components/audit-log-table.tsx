import { t } from "@lingui/core/macro";
import { FunnelIcon, MagnifyingGlassIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { Badge } from "@reactive-resume/ui/components/badge";
import { Button } from "@reactive-resume/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@reactive-resume/ui/components/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@reactive-resume/ui/components/dialog";
import { Input } from "@reactive-resume/ui/components/input";
import { Separator } from "@reactive-resume/ui/components/separator";
import { Skeleton } from "@reactive-resume/ui/components/skeleton";

type AuditEntry = {
	id: string;
	workspaceId: string | null;
	userId: string;
	action: string;
	entityType: string | null;
	entityId: string | null;
	details: unknown;
	ipAddress: string | null;
	userAgent: string | null;
	createdAt: Date;
};

function AuditRow({ entry }: { entry: AuditEntry }) {
	const actionColor =
		entry.action.includes("delete") || entry.action.includes("ban")
			? "destructive"
			: entry.action.includes("create")
				? "default"
				: "secondary";

	return (
		<div className="flex items-center justify-between rounded-lg border px-4 py-3 transition-colors hover:bg-muted/50">
			<div className="flex min-w-0 flex-1 items-center gap-x-3">
				<Badge variant={actionColor} className="shrink-0 text-xs">
					{entry.action}
				</Badge>
				<div className="min-w-0">
					<p className="truncate font-medium text-sm">{entry.userId ? `User: ${entry.userId}` : t`Unknown`}</p>
					{entry.entityType && (
						<p className="truncate text-muted-foreground text-xs">
							{entry.entityType}: {entry.entityId}
						</p>
					)}
				</div>
			</div>
			<div className="flex shrink-0 items-center gap-x-3">
				{!!entry.details && (
					<Dialog>
						<DialogTrigger
							render={
								<Button variant="ghost" size="xs">
									<FunnelIcon className="size-3.5" />
								</Button>
							}
						/>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>{t`Audit Details`}</DialogTitle>
								<DialogDescription>
									{t`Action`}: {entry.action}
								</DialogDescription>
							</DialogHeader>
							<Separator />
							<pre className="max-h-96 overflow-auto rounded bg-muted p-4 text-xs">
								{JSON.stringify(entry.details, null, 2)}
							</pre>
						</DialogContent>
					</Dialog>
				)}
				<span className="whitespace-nowrap text-muted-foreground text-xs">
					{new Date(entry.createdAt).toLocaleString()}
				</span>
			</div>
		</div>
	);
}

import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/libs/orpc/client";

export function AuditLogTable({ workspaceId: _workspaceId }: { workspaceId?: string }) {
	const [search, setSearch] = useState("");
	const [actionFilter, setActionFilter] = useState<string | undefined>();
	const [page, setPage] = useState(1);
	const limit = 10;

	const { data: result, isLoading } = useQuery(
		orpc.admin.getAuditLogs.queryOptions({
			input: {
				page,
				limit,
				search: search || undefined,
				action: actionFilter || undefined,
			},
		}),
	);

	const paginated = result ?? [];
	const totalItems = result?.length ?? 0;
	const totalPages = Math.ceil(totalItems / limit);
	
	// Actions are normally dynamic, but without a specific endpoint for them we can just list standard ones or leave it empty,
	// or we can just fetch some predefined ones. For now, let's just keep the filter input without all options or use a predefined list.
	const uniqueActions = ["user.login", "user.register", "resume.create", "resume.update", "resume.delete", "workspace.create", "workspace.update", "workspace.delete"];

	return (
		<div className="space-y-4">
			<div className="flex items-center gap-x-3">
				<div className="relative flex-1 max-w-sm">
					<MagnifyingGlassIcon className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						placeholder={t`Search audit log...`}
						value={search}
						onChange={(e) => { setSearch(e.target.value); setPage(1); }}
						className="ps-9"
					/>
				</div>
				<select
					className="rounded-md border bg-background px-3 py-2 text-sm"
					value={actionFilter ?? ""}
					onChange={(e) => { setActionFilter(e.target.value || undefined); setPage(1); }}
				>
					<option value="">{t`All actions`}</option>
					{uniqueActions.map((action: string) => (
						<option key={action} value={action}>
							{action}
						</option>
					))}
				</select>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>{t`Audit Log`}</CardTitle>
					<CardDescription>{t`Track all system activities and changes`}</CardDescription>
				</CardHeader>
				<CardContent className="space-y-2">
					{isLoading ? (
						<div className="space-y-3">
							{[...Array(5)].map((_, i) => (
								<Skeleton key={i} className="h-14 w-full" />
							))}
						</div>
					) : paginated?.length === 0 ? (
						<p className="py-8 text-center text-muted-foreground text-sm">{t`No audit entries found.`}</p>
					) : (
						paginated?.map((entry: AuditEntry) => <AuditRow key={entry.id} entry={entry} />)
					)}
				</CardContent>
				{totalPages > 1 && (
					<div className="flex items-center justify-between border-t p-4">
						<p className="text-xs text-muted-foreground">
							{t`Showing`} {(page - 1) * limit + 1} {t`to`} {Math.min(page * limit, totalItems)} {t`of`} {totalItems} {t`entries`}
						</p>
						<div className="flex items-center gap-x-2">
							<Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
								{t`Previous`}
							</Button>
							<Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
								{t`Next`}
							</Button>
						</div>
					</div>
				)}
			</Card>
		</div>
	);
}
