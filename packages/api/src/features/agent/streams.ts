import type { UIMessageChunk } from "ai";
import type { ResumableStreamContext } from "resumable-stream/ioredis";
import { JsonToSseTransformStream } from "ai";
import Redis from "ioredis";
import { createResumableStreamContext } from "resumable-stream/ioredis";
import { env } from "@reactive-resume/env/server";

type AgentStreamContext = Pick<ResumableStreamContext, "createNewResumableStream" | "resumeExistingStream">;

type AgentStreamLifecycleOptions = {
	getContext: () => AgentStreamContext;
};

let streamContext: AgentStreamContext | null = null;

export function emptyAgentStream() {
	return new ReadableStream<string>({
		start(controller) {
			controller.close();
		},
	});
}

function getAgentStreamContext() {
	if (!streamContext) {
		const redisUrl = env.REDIS_URL;
		if (!redisUrl) throw new Error("AGENT_ENVIRONMENT_UNAVAILABLE");

		const publisher = new Redis(redisUrl, { maxRetriesPerRequest: 1 });
		const subscriber = new Redis(redisUrl, { maxRetriesPerRequest: 1 });

		publisher.on("error", () => {}); // Prevent unhandled error crashes
		subscriber.on("error", () => {});

		streamContext = createResumableStreamContext({
			keyPrefix: "reactive-resume:agent-stream",
			waitUntil: null,
			publisher,
			subscriber,
		});
	}

	return streamContext;
}

export function createAgentStreamLifecycle(options: AgentStreamLifecycleOptions) {
	return {
		async create(streamId: string, makeStream: () => ReadableStream<UIMessageChunk>) {
			try {
				const stream = await options
					.getContext()
					.createNewResumableStream(streamId, () => makeStream().pipeThrough(new JsonToSseTransformStream()));

				return stream ?? emptyAgentStream();
			} catch (error) {
				if (error instanceof Error && error.message.includes("Reached the max retries per request limit")) {
					console.warn("[agent] Redis unreachable. Falling back to non-resumable stream.");
					return makeStream().pipeThrough(new JsonToSseTransformStream());
				}
				throw error;
			}
		},

		async resume(streamId: string | null | undefined) {
			if (!streamId) return emptyAgentStream();

			try {
				const stream = await options.getContext().resumeExistingStream(streamId);
				return stream ?? emptyAgentStream();
			} catch (error) {
				if (error instanceof Error && error.message.includes("Reached the max retries per request limit")) {
					console.warn("[agent] Redis unreachable. Cannot resume stream.");
					return emptyAgentStream();
				}
				throw error;
			}
		},
	};
}

export const agentStreamLifecycle = createAgentStreamLifecycle({ getContext: getAgentStreamContext });
