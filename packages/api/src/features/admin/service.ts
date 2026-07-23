import { and, asc, count, desc, eq, gte, ilike, lte, or, sql } from "drizzle-orm";
import { db } from "@reactive-resume/db/client";
import { user, resume, workspace, workspaceMember, session, auditLog } from "@reactive-resume/db/schema";
import { ORPCError } from "@orpc/server";

export class AdminService {
  async listUsers(params: {
    page: number;
    limit: number;
    search?: string | undefined;
    role?: string | undefined;
    sortBy?: string | undefined;
    sortOrder?: "asc" | "desc" | undefined;
    banned?: boolean | undefined;
  }) {
    const { page, limit, search, role, sortBy = "createdAt", sortOrder = "desc", banned } = params;
    const offset = (page - 1) * limit;

    const conditions = [];
    if (search) {
      conditions.push(
        or(
          ilike(user.name, `%${search}%`),
          ilike(user.email, `%${search}%`),
          ilike(user.username, `%${search}%`),
        ),
      );
    }
    if (role) {
      conditions.push(eq(user.role, role as "admin" | "user"));
    }
    if (banned !== undefined) {
      conditions.push(eq(user.banned, banned));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const sortColumn = sortBy === "email" ? user.email
      : sortBy === "name" ? user.name
      : sortBy === "role" ? user.role
      : user.createdAt;

    const [usersData, totalResult] = await Promise.all([
      db.select().from(user)
        .where(where)
        .orderBy(sortOrder === "desc" ? desc(sortColumn) : asc(sortColumn))
        .limit(limit)
        .offset(offset),
      db.select({ count: count() }).from(user).where(where),
    ]);

    const total = totalResult[0]?.count ?? 0;

    return {
      data: usersData,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getUserById(id: string) {
    const [userResult] = await db.select().from(user).where(eq(user.id, id)).limit(1);
    if (!userResult) throw new ORPCError("NOT_FOUND", { message: "User not found" });

    const [resumeCount, workspaceCount, sessionCount] = await Promise.all([
      db.select({ count: count() }).from(resume).where(eq(resume.userId, id)),
      db.select({ count: count() }).from(workspaceMember).where(eq(workspaceMember.userId, id)),
      db.select({ count: count() }).from(session).where(eq(session.userId, id)),
    ]);

    return {
      ...userResult,
      stats: {
        resumeCount: resumeCount[0]?.count ?? 0,
        workspaceCount: workspaceCount[0]?.count ?? 0,
        sessionCount: sessionCount[0]?.count ?? 0,
      },
    };
  }

  async updateUser(id: string, data: { name?: string | undefined; email?: string | undefined; role?: "admin" | "user" | undefined }) {
    const [existing] = await db.select().from(user).where(eq(user.id, id)).limit(1);
    if (!existing) throw new ORPCError("NOT_FOUND", { message: "User not found" });

    const [updated] = await db
      .update(user)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(user.id, id))
      .returning();

    return updated;
  }

  async deleteUser(id: string) {
    const [existing] = await db.select().from(user).where(eq(user.id, id)).limit(1);
    if (!existing) throw new ORPCError("NOT_FOUND", { message: "User not found" });

    await db.delete(session).where(eq(session.userId, id));
    await db.delete(resume).where(eq(resume.userId, id));
    await db.delete(workspaceMember).where(eq(workspaceMember.userId, id));
    await db.delete(user).where(eq(user.id, id));

    return { success: true };
  }

  async banUser(id: string, banned: boolean, reason?: string, banExpires?: Date) {
    const [existing] = await db.select().from(user).where(eq(user.id, id)).limit(1);
    if (!existing) throw new ORPCError("NOT_FOUND", { message: "User not found" });

    const [updated] = await db
      .update(user)
      .set({
        banned,
        banReason: banned ? (reason ?? null) : null,
        banExpires: banned ? (banExpires ?? null) : null,
        updatedAt: new Date(),
      })
      .where(eq(user.id, id))
      .returning();

    return updated;
  }

  async getSystemStats() {
    const [totalUsers, totalResumes, totalWorkspaces, activeUsersToday] = await Promise.all([
      db.select({ count: count() }).from(user),
      db.select({ count: count() }).from(resume),
      db.select({ count: count() }).from(workspace),
      db.select({ count: count() }).from(user)
        .where(gte(user.lastActiveAt, new Date(Date.now() - 24 * 60 * 60 * 1000))),
    ]);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [signupsToday] = await db.select({ count: count() }).from(user)
      .where(gte(user.createdAt, todayStart));

    return {
      totalUsers: totalUsers[0]?.count ?? 0,
      totalResumes: totalResumes[0]?.count ?? 0,
      totalWorkspaces: totalWorkspaces[0]?.count ?? 0,
      activeUsersToday: activeUsersToday[0]?.count ?? 0,
      signupsToday: signupsToday?.count ?? 0,
    };
  }

  async getUserGrowth(days: number) {
    const results = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const [dayCount] = await db.select({ count: count() }).from(user)
        .where(and(gte(user.createdAt, date), lte(user.createdAt, nextDate)));

      results.push({
        date: date.toISOString().split("T")[0],
        count: dayCount?.count ?? 0,
      });
    }
    return results;
  }

  async getUserResumes(userId: string, page: number, limit: number) {
    const offset = (page - 1) * limit;
    const [resumes, totalResult] = await Promise.all([
      db.select().from(resume)
        .where(eq(resume.userId, userId))
        .orderBy(desc(resume.updatedAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: count() }).from(resume).where(eq(resume.userId, userId)),
    ]);

    return {
      data: resumes,
      total: totalResult[0]?.count ?? 0,
      page,
      limit,
    };
  }

  async getAuditLogs(params: {
    page: number;
    limit: number;
    action?: string | undefined;
    entityType?: string | undefined;
    userId?: string | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
  }) {
    const { page, limit, action, entityType: entityTypeFilter, userId, startDate, endDate } = params;
    const offset = (page - 1) * limit;

    const conditions = [];
    if (action) conditions.push(eq(auditLog.action, action));
    if (entityTypeFilter) conditions.push(eq(auditLog.entityType, entityTypeFilter));
    if (userId) conditions.push(eq(auditLog.userId, userId));
    if (startDate) conditions.push(gte(auditLog.createdAt, new Date(startDate)));
    if (endDate) conditions.push(lte(auditLog.createdAt, new Date(endDate)));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [logs, totalResult] = await Promise.all([
      db.select().from(auditLog)
        .where(where)
        .orderBy(desc(auditLog.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: count() }).from(auditLog).where(where),
    ]);

    // Enrich logs with user info
    const userIds = [...new Set(logs.map((l) => l.userId).filter(Boolean))];
    const users = userIds.length > 0
      ? await db.select({ id: user.id, name: user.name, email: user.email }).from(user)
        .where(sql`${user.id} = ANY(${userIds})`)
      : [];

    const userMap = new Map(users.map((u) => [u.id, u]));

    return {
      data: logs.map((log) => ({
        ...log,
        user: log.userId ? userMap.get(log.userId) ?? null : null,
      })),
      total: totalResult[0]?.count ?? 0,
      page,
      limit,
    };
  }
}

export const adminService = new AdminService();
