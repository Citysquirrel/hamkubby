interface TurnstileOptions {
	sitekey: string;
	action: "feedback";
	language: "ko";
	size: "flexible";
	callback: (token: string) => void;
	"error-callback": () => boolean;
	"expired-callback": () => void;
	"timeout-callback": () => void;
}

export interface Turnstile {
	render: (container: HTMLElement, options: TurnstileOptions) => string | undefined;
	remove: (id: string) => void;
}

declare global {
	interface Window {
		turnstile?: Turnstile;
	}
}

let loading: Promise<Turnstile> | undefined;

export function loadTurnstile(): Promise<Turnstile> {
	if (window.turnstile) return Promise.resolve(window.turnstile);
	if (loading) return loading;
	loading = new Promise<Turnstile>((resolve, reject) => {
		const script = document.createElement("script");
		const fail = () => {
			clearTimeout(timer);
			script.onload = null;
			script.onerror = null;
			script.remove();
			reject(new Error("Turnstile could not be loaded"));
		};
		const timer = setTimeout(fail, 15000);
		script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
		script.async = true;
		script.onload = () => {
			if (!window.turnstile) { fail(); return; }
			clearTimeout(timer);
			resolve(window.turnstile);
		};
		script.onerror = fail;
		document.head.append(script);
	}).catch((error: unknown) => {
		loading = undefined;
		throw error;
	});
	return loading;
}
