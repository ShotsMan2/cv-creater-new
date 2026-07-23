import { describe, expect, it } from "vitest";
import { adminRouter } from "./router";

describe("adminRouter", () => {
	it("exports all expected user management procedures", () => {
		expect(adminRouter).toHaveProperty("getUsers");
		expect(adminRouter).toHaveProperty("getUserById");
		expect(adminRouter).toHaveProperty("updateUser");
		expect(adminRouter).toHaveProperty("deleteUser");
		expect(adminRouter).toHaveProperty("banUser");
		expect(adminRouter).toHaveProperty("getUserResumes");
		expect(adminRouter).toHaveProperty("getUserSessions");
		expect(adminRouter).toHaveProperty("revokeUserSession");
	});

	it("exports all expected system management procedures", () => {
		expect(adminRouter).toHaveProperty("getSystemStats");
		expect(adminRouter).toHaveProperty("getSystemLogs");
		expect(adminRouter).toHaveProperty("getSystemConfig");
		expect(adminRouter).toHaveProperty("updateSystemConfig");
	});

	it("exports all expected template management procedures", () => {
		expect(adminRouter).toHaveProperty("getTemplates");
		expect(adminRouter).toHaveProperty("getTemplateById");
		expect(adminRouter).toHaveProperty("updateTemplateMetadata");
	});

	it("exports all expected analytics procedures", () => {
		expect(adminRouter).toHaveProperty("getUserGrowth");
		expect(adminRouter).toHaveProperty("getResumeStats");
		expect(adminRouter).toHaveProperty("getExportStats");
		expect(adminRouter).toHaveProperty("getActiveUsers");
	});

	it("has exactly 18 procedures", () => {
		expect(Object.keys(adminRouter)).toHaveLength(18);
	});
});
