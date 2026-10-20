export const API_BASE_URL = import.meta.env.DEV
	? "https://localhost:3467"
	: import.meta.env.VITE_API_URL || "https://api.stelcount.fans";

export const HAMKUBBY_API_BASE_URL = import.meta.env.DEV
	? ""
	: (import.meta.env.VITE_HAMKUBBY_API_URL || "https://hamkubby.stelcount.fans").replace(/\/+$/, "");
