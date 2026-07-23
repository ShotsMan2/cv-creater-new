import { t } from "@lingui/core/macro";
import { useState, useEffect } from "react";
import { Button } from "@reactive-resume/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@reactive-resume/ui/components/dialog";
import { Input } from "@reactive-resume/ui/components/input";
import { Label } from "@reactive-resume/ui/components/label";
import { useUpdateUser } from "../hooks/use-admin";

type UserEditDialogProps = {
	user: { id: string; name: string; email: string; role: string | null } | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

export function UserEditDialog({ user, open, onOpenChange }: UserEditDialogProps) {
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [role, setRole] = useState<"admin" | "user">("user");
	const updateUser = useUpdateUser();

	useEffect(() => {
		if (user) {
			setName(user.name);
			setEmail(user.email);
			setRole((user.role ?? "user") as "admin" | "user");
		}
	}, [user]);

	if (!user) return null;

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		await updateUser.mutateAsync({ id: user.id, name, email, role: role as "admin" | "user" });
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{t`Edit User`}</DialogTitle>
					<DialogDescription>{t`Update user details and permissions`}</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<Label>{t`Name`}</Label>
						<Input value={name} onChange={(e) => setName(e.target.value)} />
					</div>
					<div className="space-y-2">
						<Label>{t`Email`}</Label>
						<Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
					</div>
					<div className="space-y-2">
						<Label>{t`Role`}</Label>
						<select
							className="w-full rounded-md border bg-background px-3 py-2 text-sm"
							value={role}
							onChange={(e) => setRole(e.target.value as "admin" | "user")}
						>
							<option value="user">{t`User`}</option>
							<option value="admin">{t`Admin`}</option>
						</select>
					</div>
					<DialogFooter>
						<Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
							{t`Cancel`}
						</Button>
						<Button type="submit" disabled={updateUser.isPending}>
							{t`Save Changes`}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
