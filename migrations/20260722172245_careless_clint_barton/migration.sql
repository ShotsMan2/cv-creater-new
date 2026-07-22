CREATE TYPE "workspace_role" AS ENUM('owner', 'admin', 'member', 'recruiter', 'auditor');--> statement-breakpoint
CREATE TABLE "ai_token_quota" (
	"id" text PRIMARY KEY,
	"workspace_id" text,
	"user_id" text NOT NULL,
	"provider" text DEFAULT 'openai' NOT NULL,
	"model" text DEFAULT 'gpt-4' NOT NULL,
	"tokens_used" integer DEFAULT 0 NOT NULL,
	"token_limit" integer DEFAULT 1000000 NOT NULL,
	"cost_in_millicents" integer DEFAULT 0 NOT NULL,
	"billing_period_start" timestamp with time zone DEFAULT now() NOT NULL,
	"billing_period_end" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" text PRIMARY KEY,
	"workspace_id" text,
	"user_id" text NOT NULL,
	"action" text NOT NULL,
	"entity_type" text,
	"entity_id" text,
	"details" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "telemetry_metric" (
	"id" text PRIMARY KEY,
	"metric_name" text NOT NULL,
	"metric_value" double precision NOT NULL,
	"labels" jsonb,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspace" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"slug" text NOT NULL UNIQUE,
	"logo_url" text,
	"custom_domain" text UNIQUE,
	"custom_domain_verified" boolean DEFAULT false NOT NULL,
	"primary_color" text,
	"owner_id" text NOT NULL,
	"billing_email" text,
	"max_members" integer DEFAULT 10 NOT NULL,
	"max_resumes" integer DEFAULT 100 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspace_invite" (
	"id" text PRIMARY KEY,
	"workspace_id" text NOT NULL,
	"email" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"token" text NOT NULL UNIQUE,
	"invited_by" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"accepted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspace_member" (
	"id" text PRIMARY KEY,
	"workspace_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"invited_by" text,
	"joined_at" timestamp with time zone DEFAULT now(),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "workspace_member_workspace_id_user_id_unique" UNIQUE("workspace_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "resume" ADD COLUMN "workspace_id" text;--> statement-breakpoint
CREATE INDEX "ai_token_quota_user_id_provider_index" ON "ai_token_quota" ("user_id","provider");--> statement-breakpoint
CREATE INDEX "ai_token_quota_workspace_id_billing_period_start_billing_period_end_index" ON "ai_token_quota" ("workspace_id","billing_period_start","billing_period_end");--> statement-breakpoint
CREATE INDEX "audit_log_workspace_id_created_at_index" ON "audit_log" ("workspace_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "audit_log_user_id_created_at_index" ON "audit_log" ("user_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "audit_log_action_index" ON "audit_log" ("action");--> statement-breakpoint
CREATE INDEX "audit_log_created_at_index" ON "audit_log" ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "telemetry_metric_metric_name_timestamp_index" ON "telemetry_metric" ("metric_name","timestamp" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "telemetry_metric_timestamp_index" ON "telemetry_metric" ("timestamp" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "workspace_owner_id_index" ON "workspace" ("owner_id");--> statement-breakpoint
CREATE INDEX "workspace_slug_index" ON "workspace" ("slug");--> statement-breakpoint
CREATE INDEX "workspace_custom_domain_index" ON "workspace" ("custom_domain");--> statement-breakpoint
CREATE INDEX "workspace_is_active_index" ON "workspace" ("is_active");--> statement-breakpoint
CREATE INDEX "workspace_invite_workspace_id_index" ON "workspace_invite" ("workspace_id");--> statement-breakpoint
CREATE INDEX "workspace_invite_email_index" ON "workspace_invite" ("email");--> statement-breakpoint
CREATE INDEX "workspace_invite_token_index" ON "workspace_invite" ("token");--> statement-breakpoint
CREATE INDEX "workspace_member_workspace_id_index" ON "workspace_member" ("workspace_id");--> statement-breakpoint
CREATE INDEX "workspace_member_user_id_index" ON "workspace_member" ("user_id");--> statement-breakpoint
CREATE INDEX "workspace_member_role_index" ON "workspace_member" ("role");--> statement-breakpoint
ALTER TABLE "resume" ADD CONSTRAINT "resume_workspace_id_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspace"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "ai_token_quota" ADD CONSTRAINT "ai_token_quota_workspace_id_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspace"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "ai_token_quota" ADD CONSTRAINT "ai_token_quota_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_workspace_id_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspace"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "workspace" ADD CONSTRAINT "workspace_owner_id_user_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "workspace_invite" ADD CONSTRAINT "workspace_invite_workspace_id_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspace"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "workspace_invite" ADD CONSTRAINT "workspace_invite_invited_by_user_id_fkey" FOREIGN KEY ("invited_by") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "workspace_member" ADD CONSTRAINT "workspace_member_workspace_id_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspace"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "workspace_member" ADD CONSTRAINT "workspace_member_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "workspace_member" ADD CONSTRAINT "workspace_member_invited_by_user_id_fkey" FOREIGN KEY ("invited_by") REFERENCES "user"("id") ON DELETE SET NULL;