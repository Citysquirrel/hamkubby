import Papa from "papaparse";
import { RequestContext } from "../../src/config/types";

const CSV_URL = (sheetID: string, gid: string) =>
	`https://docs.google.com/spreadsheets/d/${sheetID}/export?format=csv&gid=${gid}`;

export async function onRequest({ request, env }: RequestContext) {
	if (request.method !== "GET") {
		return new Response("Method Not Allowed", {
			status: 405,
		});
	}

	const raw_gids = env.GOOGLE_SHEET_GIDS;

	if (!raw_gids) {
		return new Response("Missing SHEET_GIDS", { status: 500 });
	}

	const gids = raw_gids.split(",");

	if (gids.length !== 4) {
		return new Response(`Invalid SHEET_GIDS format. Expected 4 values but got ${gids.length}`, { status: 500 });
	}

	// =========================================================
	// KV 캐시키 & 리턴
	// =============================================== ==========
	const kv = env.GOOGLE_SHEET_KV;
	const cacheKey = "songbook_all";

	if (kv) {
		const cached = await kv.get(cacheKey);

		// KV HIT → Sheets 호출 없이 바로 반환
		if (cached) {
			return new Response(cached, {
				headers: {
					"Content-Type": "application/json",
					"X-Cache": "HIT", // 디버깅용
				},
			});
		}
	}

	try {
		// =========================================================
		// csv 변환 로직
		// =========================================================
		const csvTexts = await Promise.all(
			gids.map(async (gid) => {
				const res = await fetch(CSV_URL(env.GOOGLE_SHEET_ID, gid));

				if (!res.ok) {
					throw new Error(`Failed to fetch gid: ${gid}`);
				}

				return res.text();
			}),
		);

		const parsed = csvTexts.map(
			(csv) =>
				Papa.parse(csv, {
					header: true,
					skipEmptyLines: true,
					dynamicTyping: true,
				}).data,
		);

		const [jpop, kpop, pop, mission] = parsed;

		const result = {
			jpop,
			kpop,
			pop,
			mission,
			hiddenRows: env.GOOGLE_SHEET_HIDDEN_ROWS,
		};

		const json = JSON.stringify(result);

		// =========================================================
		// KV 저장 (MISS일 때)
		// =========================================================
		if (kv) {
			await kv.put(cacheKey, json, {
				expirationTtl: Number(env.GOOGLE_SHEET_CACHE_TIME || 600),
			});
		}

		return new Response(json, {
			headers: {
				"Content-Type": "application/json",
				"Cache-Control": `public, max-age=${env.GOOGLE_SHEET_CACHE_TIME || 600}`,
				"X-Cache": "MISS",
			},
		});

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
	} catch (err: any) {
		return new Response(err.message || "Internal Error", {
			status: 500,
		});
	}
}
