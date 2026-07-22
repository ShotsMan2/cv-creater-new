import { t } from "@lingui/core/macro";
import { MagnifyingGlassIcon, DotsThreeIcon, CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { Badge } from "@reactive-resume/ui/components/badge";
import { Button } from "@reactive-resume/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@reactive-resume/ui/components/card";
import { Input } from "@reactive-resume/ui/components/input";
import { Avatar, AvatarFallback } from "@reactive-resume/ui/components/avatar";

import { orpc } from "@/libs/orpc/client";
import { useQuery } from "@tanstack/react-query";

export function UsersTable() {
	const [search, setSearch] = useState("");
	const [roleFilter, setRoleFilter] = useState<string | undefined>();
	const [page, setPage] = useState(1);
	const limit = 10;

	const { data: result, isLoading } = useQuery(
		orpc.admin.getUsers.queryOptions({
			input: {
				page,
				limit,
				search: search || undefined,
				role: roleFilter || undefined,
			},
		}),
	);

	const paginated = result ?? [];
	const totalItems = result?.length ?? 0;
	const totalPages = Math.ceil(totalItems / limit);

	return (
		<div className="space-y-4">
			<div className="flex items-center gap-x-3">
				<div className="relative flex-1 max-w-sm">
					<MagnifyingGlassIcon className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						placeholder={t`Search users...`}
						value={search}
						onChange={(e) => { setSearch(e.target.value); setPage(1); }}
						className="ps-9"
					/>
				</div>
				<select
					className="rounded-md border bg-background px-3 py-2 text-sm"
					value={roleFilter ?? ""}
					onChange={(e) => { setRoleFilter(e.target.value || undefined); setPage(1); }}
				>
					<option value="">{t`All roles`}</option>
					<option value="admin">{t`Admin`}</option>
					<option value="user">{t`User`}</option>
				</select>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>{t`Users`}</CardTitle>
					<CardDescription>{t`Manage system users, their roles, and status`}</CardDescription>
				</CardHeader>
				<CardContent className="p-0">
					<div className="overflow-x-auto">
						<table className="w-full text-sm text-left">
							<thead className="bg-muted/50 text-muted-foreground uppercase text-xs">
								<tr>
									<th className="px-6 py-3 font-medium">{t`User`}</th>
									<th className="px-6 py-3 font-medium">{t`Role`}</th>
									<th className="px-6 py-3 font-medium">{t`Joined`}</th>
									<th className="px-6 py-3 font-medium text-right">{t`Actions`}</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-border">
								{isLoading ? (
									<tr>
										<td colSpan={4} className="py-8 text-center text-muted-foreground">
											{t`Loading users...`}
										</td>
									</tr>
								) : paginated.length === 0 ? (
									<tr>
										<td colSpan={4} className="py-8 text-center text-muted-foreground">
											{t`No users found.`}
										</td>
									</tr>
								) : (
									paginated.map((user: any) => (
										<tr key={user.id} className="hover:bg-muted/50 transition-colors">
											<td className="px-6 py-4 flex items-center gap-x-3">
												<Avatar className="size-8">
													<AvatarFallback>{user.name?.charAt(0) ?? "U"}</AvatarFallback>
												</Avatar>
												<div>
													<p className="font-medium text-foreground">{user.name}</p>
													<p className="text-muted-foreground text-xs">{user.email}</p>
												</div>
											</td>
											<td className="px-6 py-4">
												<Badge variant={user.role === "admin" ? "default" : "secondary"}>
													{user.role || "user"}
												</Badge>
											</td>
											<td className="px-6 py-4 text-muted-foreground text-xs whitespace-nowrap">
												{new Date(user.createdAt).toLocaleDateString()}
											</td>
											<td className="px-6 py-4 text-right">
												<Button variant="ghost" size="icon">
													<DotsThreeIcon className="size-4" />
												</Button>
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
						<p className="text-xs text-muted-foreground">
							{t`Showing`} {(page - 1) * limit + 1} {t`to`} {Math.min(page * limit, totalItems)} {t`of`} {totalItems} {t`entries`}
						</p>
						<div className="flex items-center gap-x-2">
							<Button variant="outline" size="icon" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
								<CaretLeftIcon className="size-4" />
							</Button>
							<Button variant="outline" size="icon" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
								<CaretRightIcon className="size-4" />
							</Button>
						</div>
					</CardFooter>
				)}
			</Card>
		</div>
	);
}
