import z from "zod";
import { protectedProcedure } from "../../context";
import { workspaceService } from "./service";

const workspaceRoleSchema = z.enum(["owner", "admin", "member", "recruiter", "auditor"]);

const membersRouter = {
	list: protectedProcedure
		.route({
			method: "GET",
			path: "/workspaces/{workspaceId}/members",
			tags: ["Workspaces"],
			operationId: "listWorkspaceMembers",
			summary: "List workspace members",
		})
		.input(z.object({ workspaceId: z.string() }))
		.output(
			z.array(
				z.object({
					id: z.string(),
					userId: z.string(),
					role: z.string(),
					joinedAt: z.date().nullable(),
					name: z.string().nullable(),
					email: z.string(),
					image: z.string().nullable(),
				}),
			),
		)
		.handler(async ({ input, context }) => {
			return workspaceService.listMembers({ workspaceId: input.workspaceId, userId: context.user.id });
		}),

	invite: protectedProcedure
		.route({
			method: "POST",
			path: "/workspaces/{workspaceId}/invites",
			tags: ["Workspaces"],
			operationId: "inviteWorkspaceMember",
			summary: "Invite a member to workspace",
		})
		.input(
			z.object({
				workspaceId: z.string(),
				email: z.string().email(),
				role: workspaceRoleSchema.default("member"),
			}),
		)
		.output(z.object({ token: z.string() }))
		.handler(async ({ input, context }) => {
			const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
			const token = await workspaceService.inviteMember({
				workspaceId: input.workspaceId,
				email: input.email,
				role: input.role,
				invitedBy: context.user.id,
				expiresAt,
			});
			return { token };
		}),

	updateRole: protectedProcedure
		.route({
			method: "PATCH",
			path: "/workspaces/{workspaceId}/members/{memberId}",
			tags: ["Workspaces"],
			operationId: "updateWorkspaceMemberRole",
			summary: "Update workspace member role",
		})
		.input(z.object({ workspaceId: z.string(), memberId: z.string(), role: workspaceRoleSchema }))
		.output(z.void())
		.handler(async ({ input, context }) => {
			await workspaceService.updateMemberRole({
				workspaceId: input.workspaceId,
				memberId: input.memberId,
				role: input.role,
				userId: context.user.id,
			});
		}),

	remove: protectedProcedure
		.route({
			method: "DELETE",
			path: "/workspaces/{workspaceId}/members/{memberId}",
			tags: ["Workspaces"],
			operationId: "removeWorkspaceMember",
			summary: "Remove a member from workspace",
		})
		.input(z.object({ workspaceId: z.string(), memberId: z.string() }))
		.output(z.void())
		.handler(async ({ input, context }) => {
			await workspaceService.removeMember({
				workspaceId: input.workspaceId,
				memberId: input.memberId,
				userId: context.user.id,
			});
		}),
};

export const workspaceRouter = {
	list: protectedProcedure
		.route({
			method: "GET",
			path: "/workspaces",
			tags: ["Workspaces"],
			operationId: "listWorkspaces",
			summary: "List user workspaces",
			description: "Returns all workspaces the authenticated user belongs to.",
		})
		.output(
			z.array(
				z.object({
					id: z.string(),
					name: z.string(),
					slug: z.string(),
					logoUrl: z.string().nullable(),
					customDomain: z.string().nullable(),
					role: z.string(),
					memberCount: z.number(),
				}),
			),
		)
		.handler(async ({ context }) => {
			return workspaceService.listByUser({ userId: context.user.id });
		}),

	getById: protectedProcedure
		.route({
			method: "GET",
			path: "/workspaces/{id}",
			tags: ["Workspaces"],
			operationId: "getWorkspace",
			summary: "Get workspace by ID",
		})
		.input(z.object({ id: z.string() }))
		.output(
			z.object({
				id: z.string(),
				name: z.string(),
				slug: z.string(),
				logoUrl: z.string().nullable(),
				customDomain: z.string().nullable(),
				customDomainVerified: z.boolean(),
				primaryColor: z.string().nullable(),
				ownerId: z.string(),
				billingEmail: z.string().nullable(),
				maxMembers: z.number(),
				maxResumes: z.number(),
				isActive: z.boolean(),
				role: z.string(),
				createdAt: z.date(),
				updatedAt: z.date(),
			}),
		)
		.handler(async ({ input, context }) => {
			return workspaceService.getById({ id: input.id, userId: context.user.id });
		}),

	create: protectedProcedure
		.route({
			method: "POST",
			path: "/workspaces",
			tags: ["Workspaces"],
			operationId: "createWorkspace",
			summary: "Create a workspace",
		})
		.input(z.object({ name: z.string().min(1).max(64), slug: z.string().min(1).max(64) }))
		.output(z.string())
		.handler(async ({ input, context }) => {
			return workspaceService.create({ ...input, ownerId: context.user.id });
		}),

	update: protectedProcedure
		.route({
			method: "PATCH",
			path: "/workspaces/{id}",
			tags: ["Workspaces"],
			operationId: "updateWorkspace",
			summary: "Update workspace settings",
		})
		.input(
			z.object({
				id: z.string(),
				name: z.string().min(1).max(64).optional(),
				slug: z.string().min(1).max(64).optional(),
				logoUrl: z.string().optional(),
				customDomain: z.string().optional(),
				primaryColor: z.string().optional(),
				billingEmail: z.string().email().optional(),
			}),
		)
		.output(z.any())
		.handler(async ({ input, context }) => {
			return workspaceService.update({
				id: input.id,
				userId: context.user.id,
				...((input as { name?: string }).name !== undefined ? { name: (input as { name?: string }).name } : {}),
				...((input as { slug?: string }).slug !== undefined ? { slug: (input as { slug?: string }).slug } : {}),
				...((input as { logoUrl?: string }).logoUrl !== undefined
					? { logoUrl: (input as { logoUrl?: string }).logoUrl }
					: {}),
				...((input as { customDomain?: string }).customDomain !== undefined
					? { customDomain: (input as { customDomain?: string }).customDomain }
					: {}),
				...((input as { primaryColor?: string }).primaryColor !== undefined
					? { primaryColor: (input as { primaryColor?: string }).primaryColor }
					: {}),
				...((input as { billingEmail?: string }).billingEmail !== undefined
					? { billingEmail: (input as { billingEmail?: string }).billingEmail }
					: {}),
			});
		}),

	delete: protectedProcedure
		.route({
			method: "DELETE",
			path: "/workspaces/{id}",
			tags: ["Workspaces"],
			operationId: "deleteWorkspace",
			summary: "Delete a workspace",
		})
		.input(z.object({ id: z.string() }))
		.output(z.void())
		.handler(async ({ input, context }) => {
			await workspaceService.delete({ id: input.id, userId: context.user.id });
		}),

	members: membersRouter,
};
