import type { InferRouterInputs, InferRouterOutputs, RouterClient } from "@orpc/server";
import type router from "@reactive-resume/api/routers";
import { createORPCClient, onError } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { BatchLinkPlugin } from "@orpc/client/plugins";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";

const getRpcUrl = () => {
	if (typeof window === "undefined") {
		const appUrl = (typeof process !== "undefined" && process.env && process.env.APP_URL) || "http://localhost:3003";
		return `${appUrl}/api/rpc`;
	}
	return `${window.location.origin}/api/rpc`;
};

function getCsrfToken(): string | null {
	if (typeof document === "undefined") return null;
	const match = document.cookie.match(/(?:^|;\s*)csrf-token=([^;]*)/);
	return match ? decodeURIComponent(match[1]) : null;
}

const createRpcClient = (): RouterClient<typeof router> => {
	const link = new RPCLink({
		url: getRpcUrl(),
		fetch: (request, init) => {
			const csrfToken = getCsrfToken();
			if (csrfToken) {
				request.headers.set("x-csrf-token", csrfToken);
			}
			return fetch(request, { ...init, credentials: "include" });
		},
		plugins: [
			new BatchLinkPlugin({
				mode: "streaming",
				groups: [{ condition: () => true, context: {} }],
			}),
		],
		interceptors: [
			onError((error) => {
				if (error instanceof DOMException && error.name === "AbortError") return;
				console.warn("[oRPC client]", error);
			}),
		],
	});

	return createORPCClient(link);
};

export const client = createRpcClient();

const createStreamClient = (): RouterClient<typeof router> => {
	const link = new RPCLink({
		url: getRpcUrl(),
		fetch: (request, init) => {
			const csrfToken = getCsrfToken();
			if (csrfToken) {
				request.headers.set("x-csrf-token", csrfToken);
			}
			return fetch(request, { ...init, credentials: "include" });
		},
		interceptors: [
			onError((error) => {
				if (error instanceof DOMException && error.name === "AbortError") return;
				console.warn("[oRPC stream client]", error);
			}),
		],
	});

	return createORPCClient(link);
};

export const streamClient = createStreamClient();

export const orpc = createTanstackQueryUtils(client);

export type RouterInput = InferRouterInputs<typeof router>;

export type RouterOutput = InferRouterOutputs<typeof router>;
