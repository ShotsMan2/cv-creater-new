import type { UIMessage } from "ai";
import { ORPCError } from "@orpc/client";

export function isAgentEnvironmentUnavailable(error: unknown) {
	if (error instanceof Error) {
		if (error.message === "AGENT_ENVIRONMENT_UNAVAILABLE") return true;
		if (error.message.includes("Reached the max retries per request limit")) return true;
	}
	return false;
}

export function throwUnavailable(): never {
	throw new ORPCError("PRECONDITION_FAILED", {
		message: "AI agent workspace is unavailable because REDIS_URL/ENCRYPTION_SECRET is missing or Redis is unreachable.",
	});
}

export function isUiMessage(value: unknown): value is UIMessage {
	if (!value || typeof value !== "object") return false;

	const message = value as Partial<UIMessage>;
	return (
		typeof message.id === "string" &&
		(message.role === "system" || message.role === "user" || message.role === "assistant") &&
		Array.isArray(message.parts)
	);
}
