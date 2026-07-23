import { setE2EUserRole } from "../fixtures/db";
import { expect, test } from "../fixtures/test";

test.describe("Admin Role", () => {
	test("admin can navigate to /admin/users and see DataTable", async ({ authPage, account }) => {
		await setE2EUserRole(account, "admin");

		// Navigate to the dashboard to refresh user state if needed, then to admin users
		await authPage.goto("/dashboard");
		await expect(authPage.getByRole("heading", { name: "Resumes" })).toBeVisible();

		// Go to admin users page
		await authPage.goto("/admin/users");
		await expect(authPage.getByRole("heading", { name: "Users" })).toBeVisible();

		// The DataTable should be present (e.g., look for the table role or search input)
		await expect(authPage.getByPlaceholder("Search...")).toBeVisible();
		// The current user should be in the table
		await expect(authPage.getByRole("cell", { name: account.email })).toBeVisible();
	});

	test("admin can navigate to /admin/audit-logs and see DataTable", async ({ authPage, account }) => {
		await setE2EUserRole(account, "admin");

		await authPage.goto("/dashboard");
		await expect(authPage.getByRole("heading", { name: "Resumes" })).toBeVisible();

		await authPage.goto("/admin/audit-logs");
		await expect(authPage.getByRole("heading", { name: "Audit Logs" })).toBeVisible();

		await expect(authPage.getByPlaceholder("Search...")).toBeVisible();
	});
});
