import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@reactive-resume/db/client";
import { user, resume, session, account, workspace, workspaceMember } from "@reactive-resume/db/schema";
import { protectedProcedure } from "../../context";

export const gdprRouter = {
  exportMyData: protectedProcedure
    .route({ method: "GET", path: "/gdpr/export", tags: ["GDPR"], operationId: "gdprExportMyData", summary: "Export my personal data" })
    .handler(async ({ context }) => {
      const userId = context.user!.id;

      const [myUser, myResumes, mySessions, myAccounts, myWorkspaces] = await Promise.all([
        db.select().from(user).where(eq(user.id, userId)).limit(1),
        db.select().from(resume).where(eq(resume.userId, userId)),
        db.select({ id: session.id, createdAt: session.createdAt, ipAddress: session.ipAddress, userAgent: session.userAgent })
          .from(session).where(eq(session.userId, userId)),
        db.select().from(account).where(eq(account.userId, userId)),
        db.select({
          workspaceId: workspaceMember.workspaceId,
          role: workspaceMember.role,
          workspaceName: workspace.name,
        }).from(workspaceMember)
          .leftJoin(workspace, eq(workspaceMember.workspaceId, workspace.id))
          .where(eq(workspaceMember.userId, userId)),
      ]);

      return {
        exportedAt: new Date().toISOString(),
        user: myUser[0],
        resumes: myResumes,
        sessions: mySessions,
        accounts: myAccounts.map((a) => ({ providerId: a.providerId, accountId: a.accountId })),
        workspaces: myWorkspaces,
      };
    }),

  deleteMyAccount: protectedProcedure
    .route({ method: "DELETE", path: "/gdpr/account", tags: ["GDPR"], operationId: "gdprDeleteAccount", summary: "Delete my account and all data" })
    .input(z.object({ confirmation: z.literal("DELETE MY ACCOUNT") }))
    .handler(async ({ context }) => {
      const userId = context.user!.id;

      await db.delete(session).where(eq(session.userId, userId));
      await db.delete(account).where(eq(account.userId, userId));
      await db.delete(resume).where(eq(resume.userId, userId));
      await db.delete(workspaceMember).where(eq(workspaceMember.userId, userId));
      await db.delete(user).where(eq(user.id, userId));

      return { success: true, message: "Account deleted successfully" };
    }),
};
