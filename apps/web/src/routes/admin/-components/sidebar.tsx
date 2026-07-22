import type { MessageDescriptor } from "@lingui/core";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { Trans } from "@lingui/react/macro";
import { Buildings as BuildingsIcon, Gauge as GaugeIcon, Scroll as ScrollIcon, Users } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
import { Avatar, AvatarFallback, AvatarImage } from "@reactive-resume/ui/components/avatar";
import { BrandIcon } from "@reactive-resume/ui/components/brand-icon";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarRail,
	SidebarSeparator,
} from "@reactive-resume/ui/components/sidebar";
import { getInitials } from "@reactive-resume/utils/string";
import { UserDropdownMenu } from "@/features/user/dropdown-menu";

type SidebarItem = {
	icon: React.ReactNode;
	label: MessageDescriptor;
	href: React.ComponentProps<typeof Link>["to"];
};

const adminSidebarItems = [
	{
		icon: <GaugeIcon />,
		label: msg`Dashboard`,
		href: "/admin",
	},
	{
		icon: <Users />,
		label: msg`Users`,
		href: "/admin/users",
	},
	{
		icon: <ScrollIcon />,
		label: msg`Audit Logs`,
		href: "/admin/audit-logs",
	},
	{
		icon: <GaugeIcon />,
		label: msg`Telemetry`,
		href: "/admin/telemetry",
	},
	{
		icon: <BuildingsIcon />,
		label: msg`Workspaces`,
		href: "/admin/workspaces",
	},
] as const satisfies SidebarItem[];

type SidebarItemListProps = {
	items: readonly SidebarItem[];
};

function SidebarItemList({ items }: SidebarItemListProps) {
	const { i18n } = useLingui();

	return (
		<SidebarMenu>
			{items.map((item) => (
				<SidebarMenuItem key={item.href}>
					<SidebarMenuButton
						title={i18n.t(item.label)}
						render={
							<Link to={item.href} activeProps={{ className: "bg-sidebar-accent" }}>
								{item.icon}
								<span className="shrink-0 transition-[margin,opacity] duration-200 ease-in-out group-data-[collapsible=icon]:-ms-8 group-data-[collapsible=icon]:opacity-0">
									{i18n.t(item.label)}
								</span>
							</Link>
						}
					/>
				</SidebarMenuItem>
			))}
		</SidebarMenu>
	);
}

export function AdminSidebar() {
	return (
		<Sidebar variant="floating" collapsible="icon">
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton
							className="h-auto justify-center"
							render={
								<Link to="/">
									<BrandIcon variant="icon" className="size-6" />
									<h1 className="sr-only">Reactive Resume</h1>
								</Link>
							}
						/>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>

			<SidebarSeparator />

			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>
						<Trans>Admin</Trans>
					</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarItemList items={adminSidebarItems} />
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>

			<SidebarSeparator />

			<SidebarFooter className="gap-y-0">
				<SidebarMenu>
					<SidebarMenuItem>
						<UserDropdownMenu>
							{({ session }) => (
								<SidebarMenuButton className="h-auto gap-x-3 group-data-[collapsible=icon]:p-1!">
									<Avatar className="size-8 shrink-0 transition-all group-data-[collapsible=icon]:size-6">
										<AvatarImage src={session.user.image ?? undefined} />
										<AvatarFallback className="group-data-[collapsible=icon]:text-[0.5rem]">
											{getInitials(session.user.name)}
										</AvatarFallback>
									</Avatar>

									<div className="transition-[margin,opacity] duration-200 ease-in-out group-data-[collapsible=icon]:-ms-8 group-data-[collapsible=icon]:opacity-0">
										<p className="font-medium">{session.user.name}</p>
										<p className="text-muted-foreground text-xs">{session.user.email}</p>
									</div>
								</SidebarMenuButton>
							)}
						</UserDropdownMenu>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarFooter>

			<SidebarRail />
		</Sidebar>
	);
}
