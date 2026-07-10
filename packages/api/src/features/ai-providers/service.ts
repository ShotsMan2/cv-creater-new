import type { AIProvider } from "@reactive-resume/ai/types";
import { ORPCError } from "@orpc/client";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { aiProviderSchema } from "@reactive-resume/ai/types";
import { db } from "@reactive-resume/db/client";
import * as schema from "@reactive-resume/db/schema";
import {
	assertCredentialEncryptionConfigured,
	CredentialDecryptionError,
	decryptCredential,
	encryptCredential,
	redactEncryptedCredential,
} from "../ai/credentials";
import { testConnection } from "../ai/service";
import { resolveAiBaseUrl } from "../ai/url-policy";

type AiProviderRecord = typeof schema.aiProvider.$inferSelect;

export type AiProviderResponse = {
	id: string;
	label: string;
	provider: AIProvider;
	model: string;
	baseURL: string | null;
	enabled: boolean;
	testStatus: string;
	testError: string | null;
	apiKeyPreview: string;
	apiKeyFingerprint: string;
	lastTestedAt: Date | null;
	lastUsedAt: Date | null;
	createdAt: Date;
	updatedAt: Date;
};

type CreateAiProviderInput = {
	userId: string;
	label: string;
	provider: AIProvider;
	model: string;
	baseURL?: string | null;
	apiKey: string;
};

type UpdateAiProviderInput = {
	id: string;
	userId: string;
	label?: string;
	provider?: AIProvider;
	model?: string;
	baseURL?: string | null;
	apiKey?: string;
	enabled?: boolean;
};

function toResponse(row: AiProviderRecord): AiProviderResponse {
	const provider = aiProviderSchema.parse(row.provider);
	const { apiKeyFingerprint, apiKeyPreview } = redactEncryptedCredential({
		encryptedApiKey: row.encryptedApiKey,
		apiKeySalt: row.apiKeySalt,
		apiKeyHash: row.apiKeyHash,
		apiKeyPreview: row.apiKeyPreview,
	});

	return {
		id: row.id,
		label: row.label,
		provider,
		model: row.model,
		baseURL: row.baseUrl,
		enabled: row.enabled,
		testStatus: row.testStatus,
		testError: row.testError,
		apiKeyPreview,
		apiKeyFingerprint,
		lastTestedAt: row.lastTestedAt,
		lastUsedAt: row.lastUsedAt,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt,
	};
}

function normalizeBaseUrl(input: { provider: AIProvider; baseURL?: string | null }) {
	const trimmed = input.baseURL?.trim() ?? "";
	if (!trimmed) return null;

	return resolveAiBaseUrl({ provider: input.provider, baseURL: trimmed });
}

function orderByLastUsedAtDescNullsLast() {
	return desc(sql<Date>`coalesce(${schema.aiProvider.lastUsedAt}, '1970-01-01T00:00:00.000Z'::timestamptz)`);
}

async function getOwnedProvider(input: { id: string; userId: string }) {
	const [provider] = await db
		.select()
		.from(schema.aiProvider)
		.where(and(eq(schema.aiProvider.id, input.id), eq(schema.aiProvider.userId, input.userId)))
		.limit(1);

	if (!provider) throw new ORPCError("NOT_FOUND");

	return provider;
}

export const aiProvidersService = {
	list: async (input: { userId: string }) => {
		assertCredentialEncryptionConfigured();

		const providers = await db
			.select()
			.from(schema.aiProvider)
			.where(eq(schema.aiProvider.userId, input.userId))
			.orderBy(orderByLastUsedAtDescNullsLast(), asc(schema.aiProvider.createdAt));

		return providers.map(toResponse);
	},

	getRunnableById: async (input: { id: string; userId: string }) => {
		assertCredentialEncryptionConfigured();

		const provider = await getOwnedProvider(input);
		if (!provider.enabled || provider.testStatus !== "success") {
			throw new ORPCError("BAD_REQUEST", { message: "AI provider must be tested and enabled before use." });
		}

		try {
			return {
				...toResponse(provider),
				apiKey: decryptCredential(provider.encryptedApiKey),
				baseURL: provider.baseUrl ?? "",
			};
		} catch (error) {
			if (error instanceof CredentialDecryptionError) {
				throw new ORPCError("BAD_REQUEST", {
					message:
						"AI_PROVIDER_DECRYPTION_FAILED: Failed to decrypt the AI provider's API key. Please update the API key in the integration settings.",
				});
			}
			throw error;
		}
	},

	getDefaultRunnable: async (input: { userId: string }) => {
		assertCredentialEncryptionConfigured();

		const [provider] = await db
			.select()
			.from(schema.aiProvider)
			.where(
				and(
					eq(schema.aiProvider.userId, input.userId),
					eq(schema.aiProvider.enabled, true),
					eq(schema.aiProvider.testStatus, "success"),
				),
			)
			.orderBy(orderByLastUsedAtDescNullsLast(), asc(schema.aiProvider.createdAt))
			.limit(1);

		if (!provider) return null;

		try {
			return {
				...toResponse(provider),
				apiKey: decryptCredential(provider.encryptedApiKey),
				baseURL: provider.baseUrl ?? "",
			};
		} catch (error) {
			if (error instanceof CredentialDecryptionError) {
				throw new ORPCError("BAD_REQUEST", {
					message: "AI_PROVIDER_DECRYPTION_FAILED: Failed to decrypt the AI provider's API key. Please update the API key in settings.",
				});
			}
			throw error;
		}
	},

	create: async (input: CreateAiProviderInput) => {
		assertCredentialEncryptionConfigured();

		const encrypted = encryptCredential(input.apiKey.trim());
		const [provider] = await db
			.insert(schema.aiProvider)
			.values({
				userId: input.userId,
				label: input.label.trim(),
				provider: input.provider,
				model: input.model.trim(),
				baseUrl: normalizeBaseUrl(input),
				...encrypted,
			})
			.returning();

		if (!provider) throw new Error("AI_PROVIDER_CREATE_FAILED");

		return toResponse(provider);
	},

	update: async (input: UpdateAiProviderInput) => {
		assertCredentialEncryptionConfigured();

		const existing = await getOwnedProvider(input);
		const provider = input.provider ?? aiProviderSchema.parse(existing.provider);
		const nextApiKey = input.apiKey?.trim();
		const encrypted = nextApiKey ? encryptCredential(nextApiKey) : {};
		const credentialChanged = !!nextApiKey;
		const nextBaseUrl =
			input.baseURL !== undefined ? normalizeBaseUrl({ provider, baseURL: input.baseURL }) : existing.baseUrl;
		const providerChanged = input.provider !== undefined && input.provider !== existing.provider;
		const modelChanged = input.model !== undefined && input.model.trim() !== existing.model;
		const baseUrlChanged = input.baseURL !== undefined && nextBaseUrl !== existing.baseUrl;
		const runtimeChanged = credentialChanged || providerChanged || modelChanged || baseUrlChanged;

		if (input.enabled === true && existing.testStatus !== "success" && !runtimeChanged) {
			throw new ORPCError("BAD_REQUEST", { message: "AI provider must be tested successfully before enabling." });
		}

		const [updated] = await db
			.update(schema.aiProvider)
			.set({
				...(input.label !== undefined ? { label: input.label.trim() } : {}),
				...(input.provider !== undefined ? { provider: input.provider } : {}),
				...(input.model !== undefined ? { model: input.model.trim() } : {}),
				...(input.baseURL !== undefined ? { baseUrl: nextBaseUrl } : {}),
				...(input.enabled !== undefined && !runtimeChanged ? { enabled: input.enabled } : {}),
				...(runtimeChanged ? { enabled: false, testStatus: "untested", lastTestedAt: null, testError: null } : {}),
				...encrypted,
			})
			.where(and(eq(schema.aiProvider.id, input.id), eq(schema.aiProvider.userId, input.userId)))
			.returning();

		if (!updated) throw new ORPCError("NOT_FOUND");
		return toResponse(updated);
	},

	delete: async (input: { id: string; userId: string }) => {
		assertCredentialEncryptionConfigured();

		await db
			.delete(schema.aiProvider)
			.where(and(eq(schema.aiProvider.id, input.id), eq(schema.aiProvider.userId, input.userId)));
	},

	test: async (input: { id: string; userId: string }) => {
		assertCredentialEncryptionConfigured();

		const provider = await getOwnedProvider(input);
		const parsedProvider = aiProviderSchema.parse(provider.provider);

		try {
			const apiKey = decryptCredential(provider.encryptedApiKey);
			const ok = await testConnection({
				provider: parsedProvider,
				model: provider.model,
				apiKey,
				baseURL: provider.baseUrl ?? "",
			});

			const [updated] = await db
				.update(schema.aiProvider)
				.set({
					enabled: ok,
					testStatus: ok ? "success" : "failure",
					testError: ok ? null : "The provider test returned an unexpected response.",
					lastTestedAt: new Date(),
				})
				.where(and(eq(schema.aiProvider.id, input.id), eq(schema.aiProvider.userId, input.userId)))
				.returning();

			if (!updated) throw new ORPCError("NOT_FOUND");
			return toResponse(updated);
		} catch (error) {
			let message = "Failed to test provider.";
			if (error instanceof CredentialDecryptionError) {
				message = "Failed to decrypt the API key. Please update the API key in settings.";
			} else if (error instanceof Error) {
				message = error.message;
			}

			const [updated] = await db
				.update(schema.aiProvider)
				.set({
					enabled: false,
					testStatus: "failure",
					testError: message,
					lastTestedAt: new Date(),
				})
				.where(and(eq(schema.aiProvider.id, input.id), eq(schema.aiProvider.userId, input.userId)))
				.returning();

			if (error instanceof CredentialDecryptionError) {
				throw new ORPCError("BAD_REQUEST", {
					message: `AI_PROVIDER_DECRYPTION_FAILED: ${message}`,
				});
			}

			if (!updated) throw error;
			throw error;
		}
	},

	markUsed: async (input: { id: string; userId: string }) => {
		await db
			.update(schema.aiProvider)
			.set({ lastUsedAt: new Date() })
			.where(and(eq(schema.aiProvider.id, input.id), eq(schema.aiProvider.userId, input.userId)));
	},
};
