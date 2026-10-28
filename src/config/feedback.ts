export const FEEDBACK_API_URL = import.meta.env.DEV ? "/api/feedback" : "https://api.stelcount.fans/api/feedback";

// Cloudflare Turnstile의 공개 Site key만 입력한다. Secret key는 서버에서 관리한다.
export const FEEDBACK_SITE_KEY: string = import.meta.env.DEV
	? "1x00000000000000000000AA"
	: "0x4AAAAAAFoUNwzwadqrYY5S";

