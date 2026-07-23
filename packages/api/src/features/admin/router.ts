import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@reactive-resume/db/client";
import { systemConfig } from "@reactive-resume/db/schema";
import { generateId } from "@reactive-resume/utils/string";
import { adminProcedure } from "../../context";
import { adminService } from "./service";

export const adminRouter = {
  // User Management
  getUsers: adminProcedure
    .route({ method: "GET", path: "/admin/users", tags: ["Admin"], operationId: "adminGetUsers", summary: "Get all users" })
    .input(z.object({
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(10),
      search: z.string().optional(),
      role: z.string().optional(),
      sortBy: z.enum(["createdAt", "name", "email", "role"]).default("createdAt"),
      sortOrder: z.enum(["asc", "desc"]).default("desc"),
      banned: z.boolean().optional(),
    }))
    .handler(async ({ input }) => adminService.listUsers(input)),

  getUserById: adminProcedure
    .route({ method: "GET", path: "/admin/users/:id", tags: ["Admin"], operationId: "adminGetUserById", summary: "Get user by ID" })
    .input(z.object({ id: z.string() }))
    .handler(async ({ input }) => adminService.getUserById(input.id)),

  updateUser: adminProcedure
    .route({ method: "PUT", path: "/admin/users/:id", tags: ["Admin"], operationId: "adminUpdateUser", summary: "Update user" })
    .input(z.object({
      id: z.string(),
      name: z.string().min(1).optional(),
      email: z.string().email().optional(),
      role: z.enum(["user", "admin"]).optional(),
    }))
    .handler(async ({ input }) => adminService.updateUser(input.id, { name: input.name, email: input.email, role: input.role })),

  deleteUser: adminProcedure
    .route({ method: "DELETE", path: "/admin/users/:id", tags: ["Admin"], operationId: "adminDeleteUser", summary: "Delete user" })
    .input(z.object({ id: z.string() }))
    .handler(async ({ input }) => adminService.deleteUser(input.id)),

  banUser: adminProcedure
    .route({ method: "POST", path: "/admin/users/:id/ban", tags: ["Admin"], operationId: "adminBanUser", summary: "Ban/unban user" })
    .input(z.object({
      id: z.string(),
      banned: z.boolean(),
      reason: z.string().optional(),
      banExpires: z.string().datetime().optional(),
    }))
    .handler(async ({ input }) => adminService.banUser(input.id, input.banned, input.reason, input.banExpires ? new Date(input.banExpires) : undefined)),

  getUserResumes: adminProcedure
    .route({ method: "GET", path: "/admin/users/:id/resumes", tags: ["Admin"], operationId: "adminGetUserResumes", summary: "Get user resumes" })
    .input(z.object({
      id: z.string(),
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(10),
    }))
    .handler(async ({ input }) => adminService.getUserResumes(input.id, input.page, input.limit)),

  // System
  getSystemStats: adminProcedure
    .route({ method: "GET", path: "/admin/system/stats", tags: ["Admin"], operationId: "adminGetSystemStats", summary: "Get system stats" })
    .handler(async () => adminService.getSystemStats()),

  getUserGrowth: adminProcedure
    .route({ method: "GET", path: "/admin/analytics/user-growth", tags: ["Admin"], operationId: "adminGetUserGrowth", summary: "Get user growth data" })
    .input(z.object({ days: z.number().min(1).max(365).default(30) }))
    .handler(async ({ input }) => adminService.getUserGrowth(input.days)),

  // Audit Logs
  getAuditLogs: adminProcedure
    .route({ method: "GET", path: "/admin/audit-logs", tags: ["Admin"], operationId: "adminGetAuditLogs", summary: "Get audit logs" })
    .input(z.object({
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(50),
      action: z.string().optional(),
      entityType: z.string().optional(),
      userId: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .handler(async ({ input }) => adminService.getAuditLogs(input)),

  // System Config
  getSystemConfig: adminProcedure
    .route({ method: "GET", path: "/admin/system/config", tags: ["Admin"], operationId: "adminGetSystemConfig", summary: "Get system config" })
    .handler(async () => {
      const configs = await db.select().from(systemConfig);
      return configs.reduce((acc, c) => ({ ...acc, [c.key]: c.value }), {} as Record<string, unknown>);
    }),

  updateSystemConfig: adminProcedure
    .route({ method: "PUT", path: "/admin/system/config", tags: ["Admin"], operationId: "adminUpdateSystemConfig", summary: "Update system config" })
    .input(z.object({
      key: z.string(),
      value: z.any(),
      description: z.string().optional(),
    }))
    .handler(async ({ input, context }) => {
      const [existing] = await db.select().from(systemConfig).where(eq(systemConfig.key, input.key)).limit(1);
      if (existing) {
        const [updated] = await db.update(systemConfig).set({
          value: input.value,
          description: input.description,
          updatedAt: new Date(),
          updatedById: context.user?.id,
        }).where(eq(systemConfig.key, input.key)).returning();
        return updated;
      }
      const [created] = await db.insert(systemConfig).values({
        id: generateId(),
        key: input.key,
        value: input.value,
        description: input.description,
        updatedById: context.user?.id,
      }).returning();
      return created;
    }),
};
