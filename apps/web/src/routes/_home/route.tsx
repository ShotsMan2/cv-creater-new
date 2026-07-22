import { Trans } from "@lingui/react/macro";
import { createFileRoute, Outlet, useRouter } from "@tanstack/react-router";
import { AnimatePresence, m } from "motion/react";
import { Header } from "./-sections/header";

export const Route = createFileRoute("/_home")({
	component: RouteComponent,
});

function RouteComponent() {
	const router = useRouter();
	return (
		<>
			<a
				href="#main-content"
				className="sr-only focus:not-sr-only focus:fixed focus:inset-s-4 focus:top-4 focus:z-100 focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-foreground focus:shadow-lg focus:ring-2 focus:ring-ring"
			>
				<Trans>Skip to main content</Trans>
			</a>

			<Header />

			<AnimatePresence mode="wait">
				<m.main
					key={router.state.location.pathname}
					initial={{ opacity: 0, filter: "blur(4px)" }}
					animate={{ opacity: 1, filter: "blur(0px)" }}
					exit={{ opacity: 0, filter: "blur(4px)" }}
					transition={{ duration: 0.4, ease: "easeOut" }}
				>
					<Outlet />
				</m.main>
			</AnimatePresence>
		</>
	);
}
