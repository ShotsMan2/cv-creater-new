import { afterEach, describe, expect, it, vi } from "vitest";

// Mock the DB
const dbResult = vi.hoisted(() => [{ id: "1", name: "Test User" }]);
const dbMock = vi.hoisted(() => {
	const orderBy = vi.fn().mockResolvedValue(dbResult);
	const offset = vi.fn().mockReturnValue({ orderBy });
	const limit = vi.fn().mockReturnValue({ offset });
	const from = vi.fn().mockReturnValue({ limit });
	const select = vi.fn().mockReturnValue({ from });
	return { select };
});

vi.mock("@reactive-resume/db/client", () => ({ db: dbMock }));
vi.mock("@reactive-resume/db/schema", () => ({ 
	user: { __table: "user", createdAt: "created_at" },
	auditLog: { __table: "auditLog", createdAt: "created_at" }
}));
vi.mock("drizzle-orm", () => ({ desc: vi.fn() }));

// After mocks, import the router
import { adminRouter } from "./router";
import { ORPCError } from "@orpc/server";

describe("adminRouter", () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	describe("getUsers", () => {
		it("allows admin users to get users", async () => {
			const context = {
				user: { id: "admin-1", role: "admin", email: "admin@example.com" },
				reqHeaders: new Headers(),
				locale: "en-US",
			} as any;

			const result = await adminRouter.getUsers({ limit: 10, offset: 0 }, { context });
			
			expect(result).toEqual(dbResult);
			expect(dbMock.select).toHaveBeenCalled();
		});

		it("rejects non-admin users with FORBIDDEN", async () => {
			const context = {
				user: { id: "user-1", role: "user", email: "user@example.com" },
				reqHeaders: new Headers(),
				locale: "en-US",
			} as any;

			await expect(adminRouter.getUsers({ limit: 10, offset: 0 }, { context }))
				.rejects.toThrowError(new ORPCError("FORBIDDEN", { message: "Admin access required" }));
		});

		it("rejects unauthenticated users with UNAUTHORIZED", async () => {
			const context = {
				user: null,
				reqHeaders: new Headers(),
				locale: "en-US",
			} as any;

			await expect(adminRouter.getUsers({ limit: 10, offset: 0 }, { context }))
				.rejects.toThrowError(new ORPCError("UNAUTHORIZED"));
		});
	});

	describe("getAuditLogs", () => {
		it("allows admin users to get audit logs", async () => {
			const context = {
				user: { id: "admin-1", role: "admin", email: "admin@example.com" },
				reqHeaders: new Headers(),
				locale: "en-US",
			} as any;

			const result = await adminRouter.getAuditLogs({ limit: 10, offset: 0 }, { context });
			
			expect(result).toEqual(dbResult);
			expect(dbMock.select).toHaveBeenCalled();
		});

		it("rejects non-admin users with FORBIDDEN", async () => {
			const context = {
				user: { id: "user-1", role: "user", email: "user@example.com" },
				reqHeaders: new Headers(),
				locale: "en-US",
			} as any;

			await expect(adminRouter.getAuditLogs({ limit: 10, offset: 0 }, { context }))
				.rejects.toThrowError(new ORPCError("FORBIDDEN", { message: "Admin access required" }));
		});
	});
});
