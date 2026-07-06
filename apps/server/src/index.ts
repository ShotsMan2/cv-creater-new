import { pathToFileURL, fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { serve } from "@hono/node-server";
import { env } from "@reactive-resume/env/server";
import { createApp } from "./http/app";
import { runStartupChecks } from "./startup/checks";

console.info("Server index.ts is starting...", { argv: process.argv, url: import.meta.url });


export { createApp } from "./http/app";

async function main() {
	await runStartupChecks();

	const port =
		process.env.NODE_ENV === "production" ? Number.parseInt(process.env.PORT ?? "3000", 10) : env.SERVER_PORT;

	const app = createApp();

	serve(
		{
			fetch: app.fetch,
			port,
		},
		(info) => {
			console.info(`🚀 Up and running on http://localhost:${info.port}`);
		},
	);
}

const isMain =
	process.argv[1] &&
	(import.meta.url === pathToFileURL(process.argv[1]).href ||
		fileURLToPath(import.meta.url).toLowerCase() === resolve(process.argv[1]).toLowerCase());

if (isMain) {
	main().catch((error) => {
		console.error(error);
		process.exit(1);
	});
}
