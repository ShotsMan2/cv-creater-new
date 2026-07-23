import { createHash, randomBytes } from "node:crypto";
import type { Context, Next } from "hono";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function hmacSign(value: string, secret: string): string {
	return createHash("sha256").update(`${value}:${secret}`).digest("hex");
}

function generateToken(secret: string): { token: string; cookie: string } {
	const random = randomBytes(32).toString("hex");
	const signature = hmacSign(random, secret);
	const token = `${random}.${signature}`;
	const cookie = token;
	return { token, cookie };
}

function validateToken(token: string, secret: string): boolean {
	const parts = token.split(".");
	if (parts.length !== 2) return false;
	const random = parts[0];
	const signature = parts[1];
	if (!random || !signature) return false;
	const expected = hmacSign(random, secret);
	if (signature !== expected) return false;
	return true;
}

export function csrfMiddleware(csrfSecret: string) {
	return async function csrfProtect(c: Context, next: Next) {
		const method = c.req.method;

		// Skip safe methods
		if (SAFE_METHODS.has(method)) {
			// Ensure a CSRF token cookie is set for GET requests
			if (method === "GET") {
				const existing = c.req.raw.headers.get("cookie") ?? "";
				if (!existing.includes("csrf-token=")) {
					const { cookie } = generateToken(csrfSecret);
					const isSecure = c.req.url.startsWith("https://");
					c.header(
						"Set-Cookie",
						`csrf-token=${cookie}; Path=/; SameSite=Lax${isSecure ? "; Secure" : ""}`,
					);
				}
			}
			await next();
			return;
		}

		// Skip CSRF for auth endpoints (Better Auth handles its own CSRF)
		const url = c.req.raw.url;
		const path = url ? new URL(url).pathname : "";
		if (path.startsWith("/api/auth/") || path.startsWith("/.well-known/")) {
			await next();
			return;
		}

		// Double-submit cookie pattern
		const cookieHeader = c.req.raw.headers.get("cookie") ?? "";
		const csrfCookie = parseCookie(cookieHeader, "csrf-token");
		const csrfHeader = c.req.raw.headers.get("x-csrf-token") ?? c.req.raw.headers.get("x-xsrf-token") ?? "";

		if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
			c.status(403);
			return c.json({ error: "CSRF validation failed" });
		}

		if (!validateToken(csrfCookie, csrfSecret)) {
			c.status(403);
			return c.json({ error: "CSRF token invalid" });
		}

		// Rotate token after successful validation
		const { cookie: newCookie } = generateToken(csrfSecret);
		const isSecure = c.req.url.startsWith("https://");
		c.header(
			"Set-Cookie",
			`csrf-token=${newCookie}; Path=/; SameSite=Lax${isSecure ? "; Secure" : ""}`,
		);

		await next();
	};
}

function parseCookie(cookieHeader: string, name: string): string | null {
	for (const part of cookieHeader.split(";")) {
		const trimmed = part.trim();
		const eqIdx = trimmed.indexOf("=");
		if (eqIdx === -1) continue;
		const key = trimmed.slice(0, eqIdx).trim();
		const value = trimmed.slice(eqIdx + 1).trim();
		if (key === name) return value;
	}
	return null;
}
