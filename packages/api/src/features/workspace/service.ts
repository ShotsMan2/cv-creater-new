import { ORPCError } from "@orpc/client";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@reactive-resume/db/client";
import * as schema from "@reactive-resume/db/schema";
import { generateId } from "@reactive-resume/utils/string";

export const workspaceService = {
	listByUser: async ({ userId }: { userId: string }) => {
		return db
			.select({
				id: schema.workspace.id,
				name: schema.workspace.name,
				slug: schema.workspace.slug,
				logoUrl: schema.workspace.logoUrl,
				customDomain: schema.workspace.customDomain,
				role: schema.workspaceMember.role,
				memberCount: sql<number>`(
					SELECT COUNT(*) FROM ${schema.workspaceMember}
					WHERE ${schema.workspaceMember.workspaceId} = ${schema.workspace.id}
				)`,
			})
			.from(schema.workspaceMember)
			.innerJoin(schema.workspace, eq(schema.workspaceMember.workspaceId, schema.workspace.id))
			.where(eq(schema.workspaceMember.userId, userId));
	},

	getById: async ({ id, userId }: { id: string; userId: string }) => {
		const [membership] = await db
			.select()
			.from(schema.workspaceMember)
			.where(and(eq(schema.workspaceMember.workspaceId, id), eq(schema.workspaceMember.userId, userId)));

		if (!membership) throw new ORPCError("NOT_FOUND");

		const [workspace] = await db.select().from(schema.workspace).where(eq(schema.workspace.id, id));

		if (!workspace) throw new ORPCError("NOT_FOUND");

		return { ...workspace, role: membership.role };
	},

	create: async ({ name, slug, ownerId }: { name: string; slug: string; ownerId: string }) => {
		const id = generateId();

		await db.transaction(async (tx) => {
			const [existingSlug] = await tx
				.select({ id: schema.workspace.id })
				.from(schema.workspace)
				.where(eq(schema.workspace.slug, slug));

			if (existingSlug) {
				throw new ORPCError("WORKSPACE_SLUG_ALREADY_EXISTS", {
					status: 400,
					message: "A workspace with this slug already exists.",
				});
			}

			await tx.insert(schema.workspace).values({ id, name, slug, ownerId });

			await tx.insert(schema.workspaceMember).values({
				id: generateId(),
				workspaceId: id,
				userId: ownerId,
				role: "owner",
			});
		});

		return id;
	},

	update: async ({
		id,
		userId,
		name,
		slug,
		logoUrl,
		customDomain,
		primaryColor,
		billingEmail,
	}: {
		id: string;
		userId: string;
		name?: string | undefined;
		slug?: string | undefined;
		logoUrl?: string | undefined;
		customDomain?: string | undefined;
		primaryColor?: string | undefined;
		billingEmail?: string | undefined;
	}) => {
		const [membership] = await db
			.select()
			.from(schema.workspaceMember)
			.where(and(eq(schema.workspaceMember.workspaceId, id), eq(schema.workspaceMember.userId, userId)));

		if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
			throw new ORPCError("FORBIDDEN");
		}

		await db
			.update(schema.workspace)
			.set({
				...(name !== undefined ? { name } : {}),
				...(slug !== undefined ? { slug } : {}),
				...(logoUrl !== undefined ? { logoUrl } : {}),
				...(customDomain !== undefined ? { customDomain } : {}),
				...(primaryColor !== undefined ? { primaryColor } : {}),
				...(billingEmail !== undefined ? { billingEmail } : {}),
			})
			.where(eq(schema.workspace.id, id));

		const [updated] = await db.select().from(schema.workspace).where(eq(schema.workspace.id, id));
		return updated;
	},

	delete: async ({ id, userId }: { id: string; userId: string }) => {
		const [membership] = await db
			.select()
			.from(schema.workspaceMember)
			.where(and(eq(schema.workspaceMember.workspaceId, id), eq(schema.workspaceMember.userId, userId)));

		if (membership?.role !== "owner") {
			throw new ORPCError("FORBIDDEN");
		}

		await db.delete(schema.workspace).where(eq(schema.workspace.id, id));
	},

	// ── Members ──

	listMembers: async ({ workspaceId, userId }: { workspaceId: string; userId: string }) => {
		const [membership] = await db
			.select()
			.from(schema.workspaceMember)
			.where(and(eq(schema.workspaceMember.workspaceId, workspaceId), eq(schema.workspaceMember.userId, userId)));

		if (!membership) throw new ORPCError("NOT_FOUND");

		return db
			.select({
				id: schema.workspaceMember.id,
				userId: schema.workspaceMember.userId,
				role: schema.workspaceMember.role,
				joinedAt: schema.workspaceMember.joinedAt,
				name: schema.user.name,
				email: schema.user.email,
				image: schema.user.image,
			})
			.from(schema.workspaceMember)
			.innerJoin(schema.user, eq(schema.workspaceMember.userId, schema.user.id))
			.where(eq(schema.workspaceMember.workspaceId, workspaceId));
	},

	inviteMember: async ({
		workspaceId,
		email,
		role,
		invitedBy,
		expiresAt,
	}: {
		workspaceId: string;
		email: string;
		role: string;
		invitedBy: string;
		expiresAt: Date;
	}) => {
		const token = generateId();

		await db.insert(schema.workspaceInvite).values({
			id: generateId(),
			workspaceId,
			email,
			role,
			token,
			invitedBy,
			expiresAt,
		});

		return token;
	},

	acceptInvite: async ({ token, userId }: { token: string; userId: string }) => {
		const [invite] = await db.select().from(schema.workspaceInvite).where(eq(schema.workspaceInvite.token, token));

		if (!invite) throw new ORPCError("NOT_FOUND");
		if (invite.acceptedAt) throw new ORPCError("INVITE_ALREADY_ACCEPTED", { status: 400 });
		if (invite.expiresAt < new Date()) throw new ORPCError("INVITE_EXPIRED", { status: 400 });

		await db.transaction(async (tx) => {
			await tx
				.update(schema.workspaceInvite)
				.set({ acceptedAt: new Date() })
				.where(eq(schema.workspaceInvite.id, invite.id));

			const [existing] = await tx
				.select()
				.from(schema.workspaceMember)
				.where(
					and(eq(schema.workspaceMember.workspaceId, invite.workspaceId), eq(schema.workspaceMember.userId, userId)),
				);

			if (!existing) {
				await tx.insert(schema.workspaceMember).values({
					id: generateId(),
					workspaceId: invite.workspaceId,
					userId,
					role: invite.role,
					invitedBy: invite.invitedBy,
				});
			}
		});

		return invite.workspaceId;
	},

	updateMemberRole: async ({
		workspaceId,
		memberId,
		role,
		userId,
	}: {
		workspaceId: string;
		memberId: string;
		role: string;
		userId: string;
	}) => {
		const [membership] = await db
			.select()
			.from(schema.workspaceMember)
			.where(and(eq(schema.workspaceMember.workspaceId, workspaceId), eq(schema.workspaceMember.userId, userId)));

		if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
			throw new ORPCError("FORBIDDEN");
		}

		await db
			.update(schema.workspaceMember)
			.set({ role })
			.where(and(eq(schema.workspaceMember.workspaceId, workspaceId), eq(schema.workspaceMember.id, memberId)));
	},

	removeMember: async ({
		workspaceId,
		memberId,
		userId,
	}: {
		workspaceId: string;
		memberId: string;
		userId: string;
	}) => {
		const [membership] = await db
			.select()
			.from(schema.workspaceMember)
			.where(and(eq(schema.workspaceMember.workspaceId, workspaceId), eq(schema.workspaceMember.userId, userId)));

		if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
			throw new ORPCError("FORBIDDEN");
		}

		await db
			.delete(schema.workspaceMember)
			.where(and(eq(schema.workspaceMember.workspaceId, workspaceId), eq(schema.workspaceMember.id, memberId)));
	},
};
