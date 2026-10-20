import { HAMKUBBY_API_BASE_URL } from "../config/base-url";
import { formatPlaybackTime } from "./player";

export interface YoutubeVideo {
	id: string;
	channel: "main" | "replay";
	title: string;
	thumbnailUrl: string;
	publishedAt: string;
	duration: string;
	categories: string[];
	viewCount?: string | null;
}

export interface YoutubeFilters {
	q: string;
	channel: "" | "main" | "replay";
	category: string;
	from: string;
	to: string;
}

export interface YoutubeVideoPage {
	items: YoutubeVideo[];
	total: number;
	page: number;
	pageSize: number;
	totalPages: number;
}

export interface YoutubeCategory {
	name: string;
	count: number;
}

export type YoutubeSort = "newest" | "oldest" | "popular";
export const youtubeSorts: { value: YoutubeSort; label: string }[] = [
	{ value: "newest", label: "최신순" },
	{ value: "popular", label: "인기순" },
	{ value: "oldest", label: "오래된순" },
];

async function requestYoutube(path: string, signal: AbortSignal): Promise<unknown> {
	const controller = new AbortController();
	const cancel = () => controller.abort();
	signal.addEventListener("abort", cancel, { once: true });
	if (signal.aborted) cancel();
	const timeout = setTimeout(cancel, 20000);
	try {
		const response = await fetch(`${HAMKUBBY_API_BASE_URL}/api/v1/youtube/${path}`, { signal: controller.signal });
		if (response.status === 400 && new URLSearchParams(path.split("?")[1]).has("sort")) {
			throw new Error("현재 이 정렬을 사용할 수 없어요. 최신순으로 다시 확인해 주세요.");
		}
		if (!response.ok) throw new Error("영상을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.");
		return await response.json();
	} finally {
		clearTimeout(timeout);
		signal.removeEventListener("abort", cancel);
	}
}

export async function getYoutubeVideos(
	filters: YoutubeFilters, page: number, signal: AbortSignal,
	{ pageSize = 20, sort = "newest" }: { pageSize?: number; sort?: YoutubeSort } = {},
): Promise<YoutubeVideoPage> {
	const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
	if (sort !== "newest") params.set("sort", sort);
	Object.entries(filters).forEach(([key, value]) => { if (value) params.set(key, value); });
	const result = await requestYoutube(`videos?${params}`, signal) as YoutubeVideoPage | null;
	if (!result || !Array.isArray(result.items) || !Number.isInteger(result.total) || result.total < 0 ||
		result.page !== page || result.pageSize !== pageSize || result.totalPages !== Math.ceil(result.total / pageSize) ||
		!result.items.every((video) => video && /^[\w-]{11}$/.test(video.id) &&
			["main", "replay"].includes(video.channel) && typeof video.title === "string" &&
			typeof video.thumbnailUrl === "string" && typeof video.duration === "string" &&
			typeof video.publishedAt === "string" && Number.isFinite(Date.parse(video.publishedAt)) &&
			Array.isArray(video.categories) && video.categories.every((category) => typeof category === "string") &&
			(video.viewCount == null || (typeof video.viewCount === "string" && /^\d{1,20}$/.test(video.viewCount))))) {
		throw new Error("영상 목록을 확인하지 못했어요. 다시 시도해 주세요.");
	}
	return result;
}

export function youtubeDateRange(days: number, now = Date.now()): Pick<YoutubeFilters, "from" | "to"> {
	const koreanDate = (time: number) => new Date(time + 9 * 3600000).toISOString().slice(0, 10);
	return { from: koreanDate(now - (days - 1) * 86400000), to: koreanDate(now) };
}

export function isRecentYoutubeVideo(video: YoutubeVideo, now = Date.now()): boolean {
	const published = Date.parse(video.publishedAt);
	return video.channel === "main" && published <= now && published >= now - 7 * 86400000;
}

export async function getYoutubeCategories(signal: AbortSignal): Promise<YoutubeCategory[]> {
	const result = await requestYoutube("categories", signal) as { categories: YoutubeCategory[] } | null;
	if (!result || !Array.isArray(result.categories) || !result.categories.every((category) =>
		category && typeof category.name === "string" && Number.isInteger(category.count) && category.count >= 0)) {
		throw new Error("카테고리를 불러오지 못했어요.");
	}
	return result.categories;
}

export function formatYoutubeDuration(duration: string): string {
	const match = /^P(?:(\d+)D)?T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?$/.exec(duration);
	if (!match) return "";
	return formatPlaybackTime(Number(match[1] || 0) * 86400 + Number(match[2] || 0) * 3600 +
		Number(match[3] || 0) * 60 + Number(match[4] || 0));
}

