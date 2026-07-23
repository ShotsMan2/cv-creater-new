import type { Context, Next } from "hono";

const CSP_DIRECTIVES: Record<string, string[]> = {
	"default-src": ["'self'"],
	"script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
	"style-src": ["'self'", "'unsafe-inline'"],
	"img-src": [
		"'self'",
		"data:",
		"blob:",
		"https://*.googleusercontent.com",
		"https://avatars.githubusercontent.com",
		"https://*.licdn.com",
	],
	"font-src": ["'self'", "data:", "https://fonts.gstatic.com", "https://fonts.googleapis.com"],
	"connect-src": ["'self'", "https://api.github.com"],
	"frame-src": ["'none'"],
	"object-src": ["'none'"],
	"base-uri": ["'self'"],
	"form-action": ["'self'"],
	"frame-ancestors": ["'none'"],
	"upgrade-insecure-requests": [],
};

function buildCsp(directives: Record<string, string[]>): string {
	return Object.entries(directives)
		.map(([key, values]) => {
			if (values.length === 0) return key;
			return `${key} ${values.join(" ")}`;
		})
		.join("; ");
}

export async function securityHeaders(c: Context, next: Next) {
	await next();

	c.header("X-Content-Type-Options", "nosniff");
	c.header("X-Frame-Options", "DENY");
	c.header("X-XSS-Protection", "0");
	c.header("Referrer-Policy", "strict-origin-when-cross-origin");
	c.header(
		"Permissions-Policy",
		"camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=()",
	);
	c.header("Cross-Origin-Resource-Policy", "same-origin");
	c.header("Cross-Origin-Opener-Policy", "same-origin");
	c.header("Cross-Origin-Embedder-Policy", "require-corp");

	if (process.env.NODE_ENV === "production") {
		c.header("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
	}

	c.header("Content-Security-Policy", buildCsp(CSP_DIRECTIVES));
}

export function handleSecurityTxt() {
	const contact = process.env.SECURITY_CONTACT ?? "https://github.com/AmruthPillai/Reactive-Resume/security";
	const expires = new Date(Date.UTC(2027, 0, 1)).toISOString().replace(/\.\d{3}Z$/, "Z");

	return new Response(
		[
			`Contact: ${contact}`,
			`Expires: ${expires}`,
			"Preferred-Languages: en",
			`Canonical: ${process.env.APP_URL ?? "http://localhost:3000"}/.well-known/security.txt`,
			"Policy: https://github.com/AmruthPillai/Reactive-Resume/security/policy",
		].join("\n"),
		{
			headers: {
				"Content-Type": "text/plain; charset=utf-8",
			},
		},
	);
}
