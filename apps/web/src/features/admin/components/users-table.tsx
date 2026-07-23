import { t } from "@lingui/core/macro";
import {
	CaretLeft,
	CaretRight,
	Eye,
	MagnifyingGlass,
	PencilSimple,
	ProhibitInset,
	TrashSimple,
	ArrowClockwise,
} from "@phosphor-icons/react";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@reactive-resume/ui/components/avatar";
import { Badge } from "@reactive-resume/ui/components/badge";
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
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@reactive-resume/ui/components/dialog";
import { Input } from "@reactive-resume/ui/components/input";
import { useUsers, useDeleteUser } from "../hooks/use-admin";
import { UserDetailDialog } from "./user-detail-dialog";
import { UserEditDialog } from "./user-edit-dialog";
import { UserBanDialog } from "./user-ban-dialog";

export function UsersTable() {
	const [search, setSearch] = useState("");
	const [roleFilter, setRoleFilter] = useState<string | undefined>();
	const [page, setPage] = useState(1);
	const limit = 10;

	const [selectedUser, setSelectedUser] = useState<any>(null);
	const [detailOpen, setDetailOpen] = useState(false);
	const [editOpen, setEditOpen] = useState(false);
	const [banOpen, setBanOpen] = useState(false);
	const [deleteOpen, setDeleteOpen] = useState(false);

	const deleteUser = useDeleteUser();

	const { data: result, isLoading, isFetching } = useUsers({
		limit,
		page,
		search: search || undefined,
		role: roleFilter || undefined,
	});

	const users = result?.data ?? [];
	const totalItems = result?.total ?? 0;
	const totalPages = result?.totalPages ?? Math.ceil(totalItems / limit);

	const handleDelete = async () => {
		if (!selectedUser) return;
		await deleteUser.mutateAsync(selectedUser.id);
		setDeleteOpen(false);
		setSelectedUser(null);
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center gap-x-3">
				<div className="relative max-w-sm flex-1">
					<MagnifyingGlass className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						placeholder={t`Search users...`}
						value={search}
						onChange={(e) => {
							setSearch(e.target.value);
							setPage(1);
						}}
						className="ps-9"
					/>
				</div>
				<select
					className="rounded-md border bg-background px-3 py-2 text-sm"
					value={roleFilter ?? ""}
					onChange={(e) => {
						setRoleFilter(e.target.value || undefined);
						setPage(1);
					}}
				>
					<option value="">{t`All roles`}</option>
					<option value="admin">{t`Admin`}</option>
					<option value="user">{t`User`}</option>
				</select>
				<Button
					variant="outline"
					size="icon"
					onClick={() => setPage(1)}
					disabled={isFetching}
					title={t`Refresh`}
				>
					<ArrowClockwise className={`size-4 ${isFetching ? "animate-spin" : ""}`} />
				</Button>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>{t`Users`}</CardTitle>
					<CardDescription>{t`Manage system users, their roles, and status`}</CardDescription>
				</CardHeader>
				<CardContent className="p-0">
					<div className="overflow-x-auto">
						<table className="w-full text-left text-sm">
							<thead className="bg-muted/50 text-muted-foreground text-xs uppercase">
								<tr>
									<th className="px-6 py-3 font-medium">{t`User`}</th>
									<th className="px-6 py-3 font-medium">{t`Role`}</th>
									<th className="px-6 py-3 font-medium">{t`Status`}</th>
									<th className="px-6 py-3 font-medium">{t`Joined`}</th>
									<th className="px-6 py-3 text-right font-medium">{t`Actions`}</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-border">
								{isLoading ? (
									<tr>
										<td colSpan={5} className="py-8 text-center text-muted-foreground">
											{t`Loading users...`}
										</td>
									</tr>
								) : users.length === 0 ? (
									<tr>
										<td colSpan={5} className="py-8 text-center text-muted-foreground">
											{t`No users found.`}
										</td>
									</tr>
								) : (
									users.map((user: any) => (
										<tr key={user.id} className="transition-colors hover:bg-muted/50">
											<td className="flex items-center gap-x-3 px-6 py-4">
												<Avatar className="size-8">
													<AvatarImage src={user.image ?? undefined} />
													<AvatarFallback>{user.name?.charAt(0) ?? "U"}</AvatarFallback>
												</Avatar>
												<div>
													<p className="font-medium text-foreground">{user.name}</p>
													<p className="text-muted-foreground text-xs">{user.email}</p>
												</div>
											</td>
											<td className="px-6 py-4">
												<Badge variant={user.role === "admin" ? "default" : "secondary"}>
													{user.role ?? "user"}
												</Badge>
											</td>
											<td className="px-6 py-4">
												<Badge variant={user.banned ? "destructive" : "outline"}>
													{user.banned ? t`Banned` : t`Active`}
												</Badge>
											</td>
											<td className="whitespace-nowrap px-6 py-4 text-muted-foreground text-xs">
												{new Date(user.createdAt).toLocaleDateString()}
											</td>
											<td className="px-6 py-4 text-right">
												<div className="flex items-center justify-end gap-x-1">
													<Button
														variant="ghost"
														size="icon"
														title={t`View Details`}
														onClick={() => {
															setSelectedUser(user);
															setDetailOpen(true);
														}}
													>
														<Eye className="size-4" />
													</Button>
													<Button
														variant="ghost"
														size="icon"
														title={t`Edit User`}
														onClick={() => {
															setSelectedUser(user);
															setEditOpen(true);
														}}
													>
														<PencilSimple className="size-4" />
													</Button>
													<Button
														variant="ghost"
														size="icon"
														title={user.banned ? t`Unban User` : t`Ban User`}
														onClick={() => {
															setSelectedUser(user);
															setBanOpen(true);
														}}
													>
														<ProhibitInset className="size-4" />
													</Button>
													<Button
														variant="ghost"
														size="icon"
														title={t`Delete User`}
														onClick={() => {
															setSelectedUser(user);
															setDeleteOpen(true);
														}}
													>
														<TrashSimple className="size-4" />
													</Button>
												</div>
											</td>
										</tr>
									))
								)}
							</tbody>
						</table>
					</div>
				</CardContent>
				{totalPages > 1 && (
					<CardFooter className="flex items-center justify-between border-t p-4">
						<p className="text-muted-foreground text-xs">
							{t`Showing`} {(page - 1) * limit + 1} {t`to`} {Math.min(page * limit, totalItems)} {t`of`} {totalItems}{" "}
							{t`entries`}
						</p>
						<div className="flex items-center gap-x-1">
							<Button
								variant="outline"
								size="icon"
								disabled={page === 1}
								onClick={() => setPage((p) => p - 1)}
							>
								<CaretLeft className="size-4" />
							</Button>
							{Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
								const start = Math.max(1, Math.min(page - 2, totalPages - 4));
								const p = start + i;
								if (p > totalPages) return null;
								return (
									<Button
										key={p}
										variant={p === page ? "default" : "outline"}
										size="icon-sm"
										onClick={() => setPage(p)}
										className="size-8 text-xs"
									>
										{p}
									</Button>
								);
							})}
							<Button
								variant="outline"
								size="icon"
								disabled={page === totalPages}
								onClick={() => setPage((p) => p + 1)}
							>
								<CaretRight className="size-4" />
							</Button>
						</div>
					</CardFooter>
				)}
			</Card>

			<UserDetailDialog user={selectedUser} open={detailOpen} onOpenChange={setDetailOpen} />
			<UserEditDialog user={selectedUser} open={editOpen} onOpenChange={setEditOpen} />
			<UserBanDialog user={selectedUser} open={banOpen} onOpenChange={setBanOpen} />

			<Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{t`Delete User`}</DialogTitle>
						<DialogDescription>
							{t`Are you sure you want to permanently delete ${selectedUser?.name ?? "this user"}? This action cannot be undone.`}
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => setDeleteOpen(false)}>
							{t`Cancel`}
						</Button>
						<Button variant="destructive" onClick={handleDelete} disabled={deleteUser.isPending}>
							{t`Delete`}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
