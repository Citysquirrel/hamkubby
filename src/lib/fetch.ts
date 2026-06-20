export interface FetchOptions extends RequestInit {
	method?: "GET" | "POST" | "DELETE" | "PATCH" | "PUT" | (string & {});
	timeout?: number;
}

interface FetchResponse<T = any> {
	data?: T;
	headers?: Headers;
	status: number;
	statusText: string;
}

// #regions UI Dock 소통
export type NetworkLog = {
	id: string;
	url: string;
	method: string;
	status: "pending" | "success" | "error";
	statusCode?: number;
	reqBody?: any;
	resBody?: any;
	time: string;
	duration?: number;
};

const dispatchNetworkLog = (log: NetworkLog) => {
	if (typeof window !== "undefined") {
		window.dispatchEvent(new CustomEvent("network-log", { detail: log }));
	}
};
// #endregions

export async function fetch_<T = any>(input: RequestInfo | URL, options?: FetchOptions): Promise<FetchResponse> {
	// 로깅을 위한 고유 ID 및 시간 측정, URL 파싱
	const logId = Math.random().toString(36).substring(7);
	const startTime = performance.now();
	const urlStr = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
	const method = options?.method || "GET";

	// 로그 통신 시작 알림
	dispatchNetworkLog({
		id: logId,
		url: urlStr,
		method,
		status: "pending",
		reqBody: options?.body,
		time: new Date().toLocaleTimeString(),
	});

	const timeout = options?.timeout ?? 20000;
	const controller = new AbortController();
	const id = timeout > 0 ? setTimeout(() => controller.abort(), timeout) : undefined;
	try {
		const res = await fetch(input, {
			...options,
			signal: controller.signal,
		});

		const response: FetchResponse<T> = {
			data: await res.json().catch(() => undefined),
			headers: res.headers,
			status: res.status,
			statusText: res.statusText,
		};

		// 성공(또는 HTTP 에러 응답) 알림
		dispatchNetworkLog({
			id: logId,
			url: urlStr,
			method,
			status: res.ok ? "success" : "error", // 4xx, 5xx 에러 보기 쉽게 분리
			statusCode: res.status,
			resBody: response.data,
			time: new Date().toLocaleTimeString(),
			duration: Math.round(performance.now() - startTime),
		});

		return response;
	} catch (err: any) {
		// 에러 관련
		const errorMessage = err instanceof Error ? err.message : String(err);

		// 네트워크 단절 및 타임아웃 캐치 알림
		dispatchNetworkLog({
			id: logId,
			url: urlStr,
			method,
			status: "error",
			statusCode: err.name === "AbortError" ? 408 : 500,
			resBody: errorMessage,
			time: new Date().toLocaleTimeString(),
			duration: Math.round(performance.now() - startTime),
		});

		return {
			data: undefined,
			status: err.name === "AbortError" ? 408 : 500, // 타임아웃 시 408 Request Timeout 센스
			statusText: errorMessage,
			headers: undefined,
		};
	} finally {
		if (id) clearTimeout(id);
	}
}
