import { RequestContext } from "../../src/config/types";

export async function onRequest({ request, env }: RequestContext) {
	try {
		if (request.method !== "GET") {
			return new Response("Method Not Allowed", {
				status: 405,
			});
		}

		return new Response(JSON.stringify(env.GOOGLE_SHEET_HIDDEN_ROWS), {
			headers: {
				"Content-Type": "application/json",
				"Cache-Control": `public, max-age=${env.GOOGLE_SHEET_CACHE_TIME || 600}`,
				"X-Cache": "MISS",
			},
		});
	} catch (err: any) {
		return new Response(err.message || "Internal Error", {
			status: 500,
		});
	}
}
