import { defineRelations } from "drizzle-orm";
import * as schema from "./schema";

export const relations = defineRelations(schema, (r) => ({
	user: {
		sessions: r.many.session(),
		accounts: r.many.account(),
		twoFactors: r.many.twoFactor(),
		passkeys: r.many.passkey(),
		resumes: r.many.resume(),
		aiProviders: r.many.aiProvider(),
		agentThreads: r.many.agentThread(),
		agentMessages: r.many.agentMessage(),
		agentAttachments: r.many.agentAttachment(),
		agentActions: r.many.agentAction(),
		apiKeys: r.many.apikey(),
		oauthClients: r.many.oauthClient(),
		oauthRefreshTokens: r.many.oauthRefreshToken(),
		oauthAccessTokens: r.many.oauthAccessToken(),
		oauthConsents: r.many.oauthConsent(),
		ownedWorkspaces: r.many.workspace(),
		workspaceMemberships: r.many.workspaceMember({
			alias: "workspaceMember_user",
		}),
		workspaceInvitesSent: r.many.workspaceInvite({
			alias: "workspaceInvite_inviter",
		}),
		auditLogs: r.many.auditLog(),
		aiTokenQuotas: r.many.aiTokenQuota(),
	},
	session: {
		user: r.one.user({
			from: r.session.userId,
			to: r.user.id,
		}),
		oauthRefreshTokens: r.many.oauthRefreshToken({
			from: r.session.id,
			to: r.oauthRefreshToken.sessionId,
		}),
		oauthAccessTokens: r.many.oauthAccessToken({
			from: r.session.id,
			to: r.oauthAccessToken.sessionId,
		}),
	},
	account: {
		user: r.one.user({
			from: r.account.userId,
			to: r.user.id,
		}),
	},
	twoFactor: {
		user: r.one.user({
			from: r.twoFactor.userId,
			to: r.user.id,
		}),
	},
	passkey: {
		user: r.one.user({
			from: r.passkey.userId,
			to: r.user.id,
		}),
	},
	resume: {
		user: r.one.user({
			from: r.resume.userId,
			to: r.user.id,
		}),
		workspace: r.one.workspace({
			from: r.resume.workspaceId,
			to: r.workspace.id,
		}),
		statistics: r.one.resumeStatistics({
			from: r.resume.id,
			to: r.resumeStatistics.resumeId,
		}),
		analysis: r.one.resumeAnalysis({
			from: r.resume.id,
			to: r.resumeAnalysis.resumeId,
		}),
		sourceAgentThreads: r.many.agentThread({
			alias: "sourceAgentThread_resume",
		}),
		workingAgentThreads: r.many.agentThread({
			alias: "workingAgentThread_resume",
		}),
		agentActions: r.many.agentAction({
			from: r.resume.id,
			to: r.agentAction.resumeId,
		}),
	},
	resumeStatistics: {
		resume: r.one.resume({
			from: r.resumeStatistics.resumeId,
			to: r.resume.id,
		}),
	},
	resumeAnalysis: {
		resume: r.one.resume({
			from: r.resumeAnalysis.resumeId,
			to: r.resume.id,
		}),
	},
	aiProvider: {
		user: r.one.user({
			from: r.aiProvider.userId,
			to: r.user.id,
		}),
		threads: r.many.agentThread({
			from: r.aiProvider.id,
			to: r.agentThread.aiProviderId,
		}),
	},
	agentThread: {
		user: r.one.user({
			from: r.agentThread.userId,
			to: r.user.id,
		}),
		aiProvider: r.one.aiProvider({
			from: r.agentThread.aiProviderId,
			to: r.aiProvider.id,
		}),
		sourceResume: r.one.resume({
			from: r.agentThread.sourceResumeId,
			to: r.resume.id,
			alias: "sourceAgentThread_resume",
		}),
		workingResume: r.one.resume({
			from: r.agentThread.workingResumeId,
			to: r.resume.id,
			alias: "workingAgentThread_resume",
		}),
		messages: r.many.agentMessage(),
		attachments: r.many.agentAttachment(),
		actions: r.many.agentAction(),
	},
	agentMessage: {
		user: r.one.user({
			from: r.agentMessage.userId,
			to: r.user.id,
		}),
		thread: r.one.agentThread({
			from: r.agentMessage.threadId,
			to: r.agentThread.id,
		}),
		attachments: r.many.agentAttachment(),
		actions: r.many.agentAction(),
	},
	agentAttachment: {
		user: r.one.user({
			from: r.agentAttachment.userId,
			to: r.user.id,
		}),
		thread: r.one.agentThread({
			from: r.agentAttachment.threadId,
			to: r.agentThread.id,
		}),
		message: r.one.agentMessage({
			from: r.agentAttachment.messageId,
			to: r.agentMessage.id,
		}),
	},
	agentAction: {
		user: r.one.user({
			from: r.agentAction.userId,
			to: r.user.id,
		}),
		thread: r.one.agentThread({
			from: r.agentAction.threadId,
			to: r.agentThread.id,
		}),
		message: r.one.agentMessage({
			from: r.agentAction.messageId,
			to: r.agentMessage.id,
		}),
		resume: r.one.resume({
			from: r.agentAction.resumeId,
			to: r.resume.id,
		}),
	},
	apikey: {
		user: r.one.user({
			from: r.apikey.referenceId,
			to: r.user.id,
		}),
	},
	oauthClient: {
		user: r.one.user({
			from: r.oauthClient.userId,
			to: r.user.id,
		}),
		oauthRefreshTokens: r.many.oauthRefreshToken({
			from: r.oauthClient.clientId,
			to: r.oauthRefreshToken.clientId,
		}),
		oauthAccessTokens: r.many.oauthAccessToken({
			from: r.oauthClient.clientId,
			to: r.oauthAccessToken.clientId,
		}),
		oauthConsents: r.many.oauthConsent({
			from: r.oauthClient.clientId,
			to: r.oauthConsent.clientId,
		}),
	},
	oauthRefreshToken: {
		user: r.one.user({
			from: r.oauthRefreshToken.userId,
			to: r.user.id,
		}),
		session: r.one.session({
			from: r.oauthRefreshToken.sessionId,
			to: r.session.id,
		}),
	},
	oauthAccessToken: {
		user: r.one.user({
			from: r.oauthAccessToken.userId,
			to: r.user.id,
		}),
		session: r.one.session({
			from: r.oauthAccessToken.sessionId,
			to: r.session.id,
		}),
		refreshToken: r.one.oauthRefreshToken({
			from: r.oauthAccessToken.refreshId,
			to: r.oauthRefreshToken.id,
		}),
	},
	oauthConsent: {
		user: r.one.user({
			from: r.oauthConsent.userId,
			to: r.user.id,
		}),
	},
	workspace: {
		owner: r.one.user({
			from: r.workspace.ownerId,
			to: r.user.id,
		}),
		members: r.many.workspaceMember(),
		invites: r.many.workspaceInvite(),
		auditLogs: r.many.auditLog(),
		aiTokenQuotas: r.many.aiTokenQuota(),
		resumes: r.many.resume(),
	},
	workspaceMember: {
		workspace: r.one.workspace({
			from: r.workspaceMember.workspaceId,
			to: r.workspace.id,
		}),
		user: r.one.user({
			from: r.workspaceMember.userId,
			to: r.user.id,
			alias: "workspaceMember_user",
		}),
		inviter: r.one.user({
			from: r.workspaceMember.invitedBy,
			to: r.user.id,
			alias: "workspaceMember_inviter",
		}),
	},
	workspaceInvite: {
		workspace: r.one.workspace({
			from: r.workspaceInvite.workspaceId,
			to: r.workspace.id,
		}),
		inviter: r.one.user({
			from: r.workspaceInvite.invitedBy,
			to: r.user.id,
			alias: "workspaceInvite_inviter",
		}),
	},
	auditLog: {
		workspace: r.one.workspace({
			from: r.auditLog.workspaceId,
			to: r.workspace.id,
		}),
		user: r.one.user({
			from: r.auditLog.userId,
			to: r.user.id,
		}),
	},
	telemetryMetric: {},
	aiTokenQuota: {
		workspace: r.one.workspace({
			from: r.aiTokenQuota.workspaceId,
			to: r.workspace.id,
		}),
		user: r.one.user({
			from: r.aiTokenQuota.userId,
			to: r.user.id,
		}),
	},
}));
