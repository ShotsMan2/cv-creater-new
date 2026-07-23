import { adminRouter } from "../features/admin/router";
import { agentRouter } from "../features/agent/router";
import { aiRouter } from "../features/ai/router";
import { aiProvidersRouter } from "../features/ai-providers/router";
import { auditRouter } from "../features/audit/router";
import { authRouter } from "../features/auth/router";
import { flagsRouter } from "../features/flags/router";
import { quotaRouter } from "../features/quota/router";
import { resumeRouter } from "../features/resume/router";
import { statisticsRouter } from "../features/statistics/router";
import { storageRouter } from "../features/storage/router";
import { telemetryRouter } from "../features/telemetry/router";
import { workspaceRouter } from "../features/workspace/router";

export default {
	ai: aiRouter,
	aiProviders: aiProvidersRouter,
	agent: agentRouter,
	admin: adminRouter,
	audit: auditRouter,
	auth: authRouter,
	flags: flagsRouter,
	resume: resumeRouter,
	quota: quotaRouter,
	statistics: statisticsRouter,
	storage: storageRouter,
	telemetry: telemetryRouter,
	workspace: workspaceRouter,
};
