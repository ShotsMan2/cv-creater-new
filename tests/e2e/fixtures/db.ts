import type { E2EAccount } from "./data";
import { Pool } from "pg";

function getDatabaseUrl() {
	const databaseUrl = process.env.DATABASE_URL;
	if (!databaseUrl) throw new Error("DATABASE_URL is required for E2E cleanup.");

	return databaseUrl;
}

export async function deleteE2EUser(account: E2EAccount) {
	const pool = new Pool({ connectionString: getDatabaseUrl() });

	try {
		await pool.query('delete from "user" where email = $1 or username = $2', [account.email, account.username]);
	} finally {
		await pool.end();
	}
}

export async function setE2EUserRole(account: E2EAccount, role: "user" | "admin") {
	const pool = new Pool({ connectionString: getDatabaseUrl() });

	try {
		await pool.query('update "user" set role = $1 where email = $2', [role, account.email]);
	} finally {
		await pool.end();
	}
}
