export interface FetchOptions extends RequestInit {
	method?: "POST" | "DELETE" | "PATCH" | (string & {});
	timeout?: number;
}
interface FetchResponse {
	data?: any;
	headers?: Headers;
	status: number;
	statusText: string;
}

export async function fetch_(input: RequestInfo | URL, options?: FetchOptions): Promise<FetchResponse> {
	try {
		const controller = new AbortController();
		const id = setTimeout(() => controller.abort(), options?.timeout || 20000);
		const res = await fetch(input, {
			...options,
			signal: controller.signal,
		});
		clearTimeout(id);
		const { headers, status, statusText } = res;

		const response = {
			data: await res.json().catch(() => {
				return;
			}),
			headers,
			status,
			statusText,
		};

		return response;
	} catch (err: any) {
		// 에러 관련
		return { data: undefined, status: 500, statusText: err.stack.split("\n")[0], headers: undefined };
	}
}
