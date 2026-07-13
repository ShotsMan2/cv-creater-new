import z from "zod";
import { protectedProcedure } from "../../context";
import { isAgentEnvironmentUnavailable, throwUnavailable } from "./routing";
import { agentService } from "./service";

export const actionsRouter = {
	revert: protectedProcedure
		.route({
			method: "POST",
			path: "/agent/actions/{id}/revert",
			tags: ["Agent"],
			operationId: "revertAgentAction",
			summary: "Restore agent action snapshot",
		})
		.input(z.object({ id: z.string() }))
		.handler(async ({ context, input }) => {
			try {
				return await agentService.actions.revert({ id: input.id, userId: context.user.id });
			} catch (error) {
				if (isAgentEnvironmentUnavailable(error)) throwUnavailable();
				throw error;
			}
		}),

	branch: protectedProcedure
		.route({
			method: "POST",
			path: "/agent/actions/{id}/branch",
			tags: ["Agent"],
			operationId: "branchAgentAction",
			summary: "Create a new resume from agent action snapshot",
		})
		.input(z.object({ id: z.string(), name: z.string(), slug: z.string() }))
		.handler(async ({ context, input }) => {
			try {
				return await agentService.actions.branch({ id: input.id, userId: context.user.id, name: input.name, slug: input.slug });
			} catch (error) {
				if (isAgentEnvironmentUnavailable(error)) throwUnavailable();
				throw error;
			}
		}),

	listByResume: protectedProcedure
		.route({
			method: "GET",
			path: "/agent/actions/resume/{resumeId}",
			tags: ["Agent"],
			operationId: "listAgentActionsByResume",
			summary: "List agent actions for a resume",
		})
		.input(z.object({ resumeId: z.string() }))
		.handler(async ({ context, input }) => {
			try {
				return await agentService.actions.listByResume({ resumeId: input.resumeId, userId: context.user.id });
			} catch (error) {
				if (isAgentEnvironmentUnavailable(error)) throwUnavailable();
				throw error;
			}
		}),

	applyPatch: protectedProcedure
		.route({
			method: "POST",
			path: "/agent/actions/resume/{resumeId}/patch",
			tags: ["Agent"],
			operationId: "applyAgentResumePatch",
			summary: "Apply resume patch as agent action",
		})
		.input(z.object({
			resumeId: z.string(),
			threadId: z.string(),
			title: z.string(),
			summary: z.string().optional(),
			operations: z.array(z.any()),
		}))
		.handler(async ({ context, input }) => {
			try {
				return await agentService.actions.applyPatch({
					resumeId: input.resumeId,
					threadId: input.threadId,
					title: input.title,
					...(input.summary !== undefined ? { summary: input.summary } : {}),
					operations: input.operations,
					userId: context.user.id,
				});
			} catch (error) {
				if (isAgentEnvironmentUnavailable(error)) throwUnavailable();
				throw error;
			}
		}),
};
