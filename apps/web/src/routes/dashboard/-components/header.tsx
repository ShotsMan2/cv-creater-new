import type { Icon as IconType } from "@phosphor-icons/react";
import { SidebarTrigger } from "@reactive-resume/ui/components/sidebar";
import { cn } from "@reactive-resume/utils/style";

type Props = {
	title: string;
	icon: IconType;
	className?: string;
};

export function DashboardHeader({ title, icon: IconComponent, className }: Props) {
	return (
		<header
			className={cn(
				"glass sticky top-0 z-10 mb-6 flex items-center gap-x-4 rounded-xl px-4 py-3 shadow-sm md:px-6 md:py-4",
				className,
			)}
		>
			<SidebarTrigger className="md:hidden" />
			<IconComponent weight="duotone" className="size-6 text-primary" />
			<h1 className="font-semibold text-2xl text-foreground tracking-tight">{title}</h1>
		</header>
	);
}
