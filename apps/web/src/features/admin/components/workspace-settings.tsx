import type { MessageDescriptor } from "@lingui/core";
import { msg } from "@lingui/core/macro";
import { t } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { Trans } from "@lingui/react/macro";
import { Plus, Shield, UserMinus } from "@phosphor-icons/react";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@reactive-resume/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@reactive-resume/ui/components/card";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@reactive-resume/ui/components/dialog";
import { FormControl, FormItem, FormLabel, FormMessage } from "@reactive-resume/ui/components/form";
import { Input } from "@reactive-resume/ui/components/input";
import { useConfirm } from "@reactive-resume/ui/hooks/use-confirm";
import { orpc } from "@/libs/orpc/client";

const ROLE_OPTIONS = [
	{ value: "owner", label: msg`Owner` },
	{ value: "admin", label: msg`Admin` },
	{ value: "member", label: msg`Member` },
	{ value: "recruiter", label: msg`Recruiter` },
	{ value: "auditor", label: msg`Auditor` },
] as const satisfies { value: string; label: MessageDescriptor }[];

function InviteMemberDialog({ workspaceId }: { workspaceId: string }) {
	const { i18n } = useLingui();
	const queryClient = useQueryClient();
	const [open, setOpen] = useState(false);

	const inviteMutation = useMutation({
		mutationFn: (data: { email: string; role: string }) =>
			orpc.workspace.members.invite.mutationOptions().mutationFn({
				workspaceId,
				email: data.email,
				role: data.role as "admin" | "member" | "recruiter" | "auditor",
			}),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: orpc.workspace.members.list.queryKey() });
			setOpen(false);
		},
	});

	const form = useForm({
		defaultValues: { email: "", role: "member" },
		onSubmit: ({ value }) => inviteMutation.mutate(value),
	});

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger
				render={
					<Button size="sm">
						<Plus className="mr-2 size-4" />
						<Trans>Invite Member</Trans>
					</Button>
				}
			/>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						<Trans>Invite Team Member</Trans>
					</DialogTitle>
					<DialogDescription>
						<Trans>Send an invitation to join this workspace.</Trans>
					</DialogDescription>
				</DialogHeader>
				<form
					onSubmit={(e) => {
						e.preventDefault();
						void form.handleSubmit();
					}}
					className="space-y-4"
				>
					<form.Field name="email">
						{(field) => (
							<FormItem>
								<FormLabel>
									<Trans>Email</Trans>
								</FormLabel>
								<FormControl
									render={
										<Input
											value={field.state.value}
											onChange={(e) => field.handleChange(e.target.value)}
											placeholder="colleague@company.com"
										/>
									}
								/>
								<FormMessage errors={field.state.meta.errors} />
							</FormItem>
						)}
					</form.Field>
					<form.Field name="role">
						{(field) => (
							<FormItem>
								<FormLabel>
									<Trans>Role</Trans>
								</FormLabel>
								<select
									className="w-full rounded-md border bg-background px-3 py-2 text-sm"
									value={field.state.value}
									onChange={(e) => field.handleChange(e.target.value)}
								>
								{ROLE_OPTIONS.map((r) => (
									<option key={r.value} value={r.value}>
										{i18n.t(r.label)}
									</option>
								))}
							</select>
						</FormItem>
					)}
				</form.Field>
				<div className="flex justify-end gap-x-3">
						<DialogClose
							render={
								<Button variant="outline">
									<Trans>Cancel</Trans>
								</Button>
							}
						/>
						<Button type="submit" disabled={inviteMutation.isPending}>
							{inviteMutation.isPending ? <Trans>Sending...</Trans> : <Trans>Send Invite</Trans>}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}

function MemberList({ workspaceId }: { workspaceId: string }) {
	const { i18n } = useLingui();
	const queryClient = useQueryClient();
	const confirm = useConfirm();

	const { data: members } = useQuery(orpc.workspace.members.list.queryOptions({ input: { workspaceId } }));

	const updateRoleMutation = useMutation({
		mutationFn: (data: { memberId: string; role: string }) =>
			orpc.workspace.members.updateRole.mutationOptions().mutationFn({
				workspaceId,
				memberId: data.memberId,
				role: data.role as "owner" | "admin" | "member" | "recruiter" | "auditor",
			}),
		onSuccess: () => void queryClient.invalidateQueries({ queryKey: orpc.workspace.members.list.queryKey() }),
	});

	const removeMutation = useMutation({
		mutationFn: (memberId: string) =>
			orpc.workspace.members.remove.mutationOptions().mutationFn({ workspaceId, memberId }),
		onSuccess: () => void queryClient.invalidateQueries({ queryKey: orpc.workspace.members.list.queryKey() }),
	});

	const handleRemove = async (memberId: string, name: string) => {
		const confirmed = await confirm(t`Remove ${name}?`, {
			description: t`This will remove them from the workspace.`,
			confirmText: t`Remove`,
		});
		if (confirmed) removeMutation.mutate(memberId);
	};

	return (
		<div className="space-y-2">
			{(members ?? []).map(
				(member: { id: string; name: string | null; email: string; role: string; userId: string }) => (
					<div key={member.id} className="flex items-center justify-between rounded-lg border px-4 py-3">
						<div className="flex items-center gap-x-3">
							<div className="flex size-9 items-center justify-center rounded-full bg-muted">
								<Shield className="size-4 text-muted-foreground" />
							</div>
							<div>
								<p className="font-medium text-sm">{member.name ?? member.email}</p>
								<p className="text-muted-foreground text-xs">{member.email}</p>
							</div>
						</div>
						<div className="flex items-center gap-x-2">
							<select
								className="rounded-md border bg-background px-2 py-1 text-xs"
								value={member.role}
								onChange={(e) => updateRoleMutation.mutate({ memberId: member.id, role: e.target.value })}
							>
							{ROLE_OPTIONS.map((r) => (
								<option key={r.value} value={r.value}>
									{i18n.t(r.label)}
								</option>
							))}
						</select>
							<Button
								variant="ghost"
								size="xs"
								onClick={() => void handleRemove(member.id, member.name ?? member.email)}
							>
								<UserMinus className="size-4" />
							</Button>
						</div>
					</div>
				),
			)}
			{(members ?? []).length === 0 && (
				<p className="py-4 text-center text-muted-foreground text-sm">{t`No members yet.`}</p>
			)}
		</div>
	);
}

export function WorkspaceSettings({ workspaceId }: { workspaceId: string }) {
	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>{t`Team Members`}</CardTitle>
					<CardDescription>{t`Manage workspace members and their roles`}</CardDescription>
				</CardHeader>
				<CardContent>
					<MemberList workspaceId={workspaceId} />
				</CardContent>
				<CardFooter>
					<InviteMemberDialog workspaceId={workspaceId} />
				</CardFooter>
			</Card>
		</div>
	);
}
