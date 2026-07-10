import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_home/")({
	beforeLoad: () => {
		throw redirect({ to: "/dashboard", replace: true });
	},
});
