import { t } from "@lingui/core/macro";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@reactive-resume/ui/components/dialog";
import { Badge } from "@reactive-resume/ui/components/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@reactive-resume/ui/components/avatar";

type UserDetailDialogProps = {
	user: {
		id: string;
		name: string;
		email: string;
		role: string | null;
		username: string;
		image: string | null;
		banned: boolean | null;
		banReason: string | null;
		createdAt: Date;
		lastActiveAt: Date | null;
	} | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

export function UserDetailDialog({ user, open, onOpenChange }: UserDetailDialogProps) {
	if (!user) return null;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle className="flex items-center gap-3">
						<Avatar className="size-10">
							<AvatarImage src={user.image ?? undefined} />
							<AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
						</Avatar>
						<div>
							<p>{user.name}</p>
							<p className="text-sm font-normal text-muted-foreground">{user.email}</p>
						</div>
					</DialogTitle>
					<DialogDescription>{t`User details and management`}</DialogDescription>
				</DialogHeader>
				<div className="space-y-4">
					<div className="grid grid-cols-2 gap-4">
						<div>
							<p className="text-sm font-medium text-muted-foreground">{t`Username`}</p>
							<p>{user.username}</p>
						</div>
						<div>
							<p className="text-sm font-medium text-muted-foreground">{t`Role`}</p>
							<Badge variant={user.role === "admin" ? "default" : "secondary"}>
								{user.role ?? "user"}
							</Badge>
						</div>
						<div>
							<p className="text-sm font-medium text-muted-foreground">{t`Status`}</p>
							<Badge variant={user.banned ? "destructive" : "outline"}>
								{user.banned ? t`Banned` : t`Active`}
							</Badge>
						</div>
						<div>
							<p className="text-sm font-medium text-muted-foreground">{t`Joined`}</p>
							<p>{new Date(user.createdAt).toLocaleDateString()}</p>
						</div>
						<div>
							<p className="text-sm font-medium text-muted-foreground">{t`Last Active`}</p>
							<p>{user.lastActiveAt ? new Date(user.lastActiveAt).toLocaleDateString() : "—"}</p>
						</div>
					</div>
					{user.banReason && (
						<div>
							<p className="text-sm font-medium text-muted-foreground">{t`Ban Reason`}</p>
							<p className="text-sm text-destructive">{user.banReason}</p>
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
