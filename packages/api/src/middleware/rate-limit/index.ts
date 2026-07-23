import { createRatelimitMiddleware } from "@orpc/experimental-ratelimit";
import { rateLimitConfig, TRUSTED_IP_HEADERS } from "@reactive-resume/utils/rate-limit";
import { rateLimiter } from "@reactive-resume/utils/redis-rate-limit";

const isRateLimitEnabled = process.env.NODE_ENV === "production";

type ContextWithHeaders = {
	reqHeaders?: Headers;
	user?: { id: string } | null;
};

function createLimiter(config: { maxRequests: number; window: number }, prefix: string) {
	return {
		limit: async (key: string) => {
			const result = await rateLimiter.check(`${prefix}:${key}`, {
				windowMs: config.window,
				max: config.maxRequests,
			});
			return {
				success: result.success,
				remaining: result.remaining,
				reset: result.resetAt.getTime(),
			};
		},
	};
}

function getTrustedIp(headers?: Headers): string | null {
	if (!headers) return null;

	for (const headerName of TRUSTED_IP_HEADERS) {
		const raw = headers.get(headerName)?.trim();
		if (!raw) continue;

		const ip = raw.split(",")[0]?.trim();
		if (!ip) continue;

		return ip;
	}

	return null;
}

function getClientKey(headers?: Headers): string {
	const trustedIp = getTrustedIp(headers);
	if (trustedIp) return `ip:${trustedIp}`;

	const userAgent = headers?.get("user-agent")?.trim() ?? "unknown";
	const language = headers?.get("accept-language")?.split(",")[0]?.trim() ?? "none";

	return `fp:${userAgent.slice(0, 64)}:${language.slice(0, 16)}`;
}

function getUserKey(context: ContextWithHeaders): string {
	return context.user?.id ?? "anon";
}

function getInputKeyPart(input: unknown): string {
	if (!input || typeof input !== "object") return "no-input";

	const inputRecord = input as Record<string, unknown>;

	const fields = ["resumeId", "threadId", "conversationId", "messageId", "fileId", "id"] as const;
	for (const field of fields) {
		const value = inputRecord[field];
		if (typeof value !== "string") continue;

		const trimmedValue = value.trim();
		if (trimmedValue) return `${field}:${trimmedValue}`;
	}

	const username = inputRecord.username;
	const slug = inputRecord.slug;

	if (typeof username === "string" && typeof slug === "string") return `${username}:${slug}`;

	return "no-id";
}

const resumePasswordLimiter = createLimiter(rateLimitConfig.orpc.resumePassword, "resume-password");
const pdfLimiter = createLimiter(rateLimitConfig.orpc.pdfExport, "pdf");
const aiLimiter = createLimiter(rateLimitConfig.orpc.aiRequest, "ai");
const storageUploadLimiter = createLimiter(rateLimitConfig.orpc.storageUpload, "storage-upload");
const storageDeleteLimiter = createLimiter(rateLimitConfig.orpc.storageDelete, "storage-delete");
const resumeMutationLimiter = createLimiter(rateLimitConfig.orpc.resumeMutations, "resume-mutations");
const disabledLimiter = {
	limit: async () => ({
		success: true,
		remaining: Number.POSITIVE_INFINITY,
		reset: Date.now(),
	}),
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const productionLimiter = (limiter: any) => (isRateLimitEnabled ? limiter : disabledLimiter);

export const resumePasswordRateLimit = createRatelimitMiddleware<
	ContextWithHeaders,
	{ username: string; slug: string }
>({
	limiter: productionLimiter(resumePasswordLimiter),
	key: ({ context }, input) => `resume-password:${input.username}:${input.slug}:${getClientKey(context.reqHeaders)}`,
});

export const pdfExportRateLimit = createRatelimitMiddleware<ContextWithHeaders, { id: string }>({
	limiter: productionLimiter(pdfLimiter),
	key: ({ context }, input) => `pdf-export:${getUserKey(context)}:${input.id}`,
});

export const aiRequestRateLimit = createRatelimitMiddleware<ContextWithHeaders, unknown>({
	limiter: productionLimiter(aiLimiter),
	key: ({ context }, input) => `ai-request:${getUserKey(context)}:${getInputKeyPart(input)}`,
});

export const storageUploadRateLimit = createRatelimitMiddleware<ContextWithHeaders, unknown>({
	limiter: productionLimiter(storageUploadLimiter),
	key: ({ context }) => `storage-upload:${getUserKey(context)}`,
});

export const storageDeleteRateLimit = createRatelimitMiddleware<ContextWithHeaders, { filename: string }>({
	limiter: productionLimiter(storageDeleteLimiter),
	key: ({ context }, input) => `storage-delete:${getUserKey(context)}:${input.filename}`,
});

export const resumeMutationRateLimit = createRatelimitMiddleware<ContextWithHeaders, unknown>({
	limiter: productionLimiter(resumeMutationLimiter),
	key: ({ context }, input) => `resume-mutation:${getUserKey(context)}:${getInputKeyPart(input)}`,
});
