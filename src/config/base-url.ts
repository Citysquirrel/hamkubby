export const API_BASE_URL = import.meta.env.DEV
	? "https://localhost:3467"
	: import.meta.env.VITE_API_URL || "https://api.stelcount.fans";

export const SONGBOOK_API_URL = import.meta.env.DEV
	? "/api/v2/songbook"
	: `${API_BASE_URL}/api/v2/songbook`;

export const HAMKUBBY_API_BASE_URL = import.meta.env.DEV
	? ""
	: (import.meta.env.VITE_HAMKUBBY_API_URL || "https://hamkubby.stelcount.fans").replace(/\/+$/, "");
