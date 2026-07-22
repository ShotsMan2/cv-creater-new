import { createFileRoute, Outlet, redirect, useRouter } from "@tanstack/react-router";
import { AnimatePresence, m } from "motion/react";
import { SidebarProvider } from "@reactive-resume/ui/components/sidebar";
import { createNoindexFollowMeta } from "@/libs/seo";
import { getDashboardSidebarState, setDashboardSidebarState } from "./-components/functions";
import { DashboardSidebar } from "./-components/sidebar";

export const Route = createFileRoute("/dashboard")({
	component: RouteComponent,
	beforeLoad: async ({ context }) => {
		if (!context.session) throw redirect({ to: "/auth/login", replace: true });
		return { session: context.session };
	},
	loader: async () => {
		const sidebarState = getDashboardSidebarState();
		return { sidebarState };
	},
	head: () => ({
		meta: [createNoindexFollowMeta()],
	}),
});

function RouteComponent() {
	const router = useRouter();
	const { sidebarState } = Route.useLoaderData();

	const handleSidebarOpenChange = (open: boolean) => {
		setDashboardSidebarState(open);
		void router.invalidate();
	};

	return (
		<SidebarProvider open={sidebarState} onOpenChange={handleSidebarOpenChange}>
			<DashboardSidebar />

			<main className="@container flex-1 p-4 md:p-6 md:ps-2">
				<AnimatePresence mode="wait">
					<m.div
						key={router.state.location.pathname}
						initial={{ opacity: 0, y: 15 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -15 }}
						transition={{ duration: 0.3, ease: "easeOut" }}
						className="h-full flex flex-col"
					>
						<Outlet />
					</m.div>
				</AnimatePresence>
			</main>
		</SidebarProvider>
	);
}
