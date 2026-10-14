export const isBoolean = (value: unknown): value is boolean => typeof value === "boolean";

export const isPosition = (value: unknown): value is { x: number; y: number } =>
	typeof value === "object" &&
	value !== null &&
	"x" in value &&
	"y" in value &&
	typeof value.x === "number" &&
	typeof value.y === "number" &&
	Number.isFinite(value.x) &&
	Number.isFinite(value.y);

export const isPlayerVolume = (value: unknown): value is number[] =>
	Array.isArray(value) &&
	value.length === 1 &&
	typeof value[0] === "number" &&
	Number.isFinite(value[0]) &&
	value[0] >= 0 &&
	value[0] <= 100;

export function readStoredValue<T>(key: string, fallback: T, validate: (value: unknown) => value is T): T {
	try {
		const raw = localStorage.getItem(key);
		if (raw === null) return fallback;
		const value: unknown = JSON.parse(raw);
		return validate(value) ? value : fallback;
	} catch {
		return fallback;
	}
}

export function writeStoredValue(key: string, value: unknown): void {
	try {
		localStorage.setItem(key, JSON.stringify(value));
	} catch {
		// 저장소 접근이 차단되어도 현재 화면의 설정 변경은 유지한다.
	}
}
