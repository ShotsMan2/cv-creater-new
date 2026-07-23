import { t } from "@lingui/core/macro";
import { useState } from "react";
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
import { useBanUser } from "../hooks/use-admin";

type UserBanDialogProps = {
	user: { id: string; name: string; banned: boolean | null } | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

export function UserBanDialog({ user, open, onOpenChange }: UserBanDialogProps) {
	const [reason, setReason] = useState("");
	const banUser = useBanUser();

	if (!user) return null;

	const handleAction = async () => {
		await banUser.mutateAsync({
			id: user.id,
			banned: !user.banned,
			reason: !user.banned ? (reason || undefined) : undefined,
		});
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{user.banned ? t`Unban User` : t`Ban User`}</DialogTitle>
					<DialogDescription>
						{user.banned
							? t`This will lift the ban on ${user.name}.`
							: t`This will prevent ${user.name} from accessing the platform.`}
					</DialogDescription>
				</DialogHeader>
				{!user.banned && (
					<div className="space-y-2">
						<Label>{t`Reason (optional)`}</Label>
						<Input
							value={reason}
							onChange={(e) => setReason(e.target.value)}
							placeholder={t`Enter ban reason...`}
						/>
					</div>
				)}
				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						{t`Cancel`}
					</Button>
					<Button
						variant={user.banned ? "default" : "destructive"}
						onClick={handleAction}
						disabled={banUser.isPending}
					>
						{user.banned ? t`Unban` : t`Ban User`}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
