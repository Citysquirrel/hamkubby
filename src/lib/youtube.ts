import { queryOptions } from "@tanstack/react-query";
import { HAMKUBBY_API_BASE_URL } from "../config/base-url";
import { formatPlaybackTime } from "./player";
import { createYoutubeSearch, normalizeKeyword } from "./search";

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
	// category: string; // 카테고리 제공 시 복원
	broadcastFrom: string;
	broadcastTo: string;
}

interface YoutubeVideoList {
	items: YoutubeVideo[];
	total: number;
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
		if (!response.ok) throw new Error("영상을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.");
		return await response.json();
	} finally {
		clearTimeout(timeout);
		signal.removeEventListener("abort", cancel);
	}
}

export async function getAllYoutubeVideos(signal: AbortSignal): Promise<YoutubeVideo[]> {
	const result = await requestYoutube("videos", signal) as YoutubeVideoList | null;
	if (!result || !Array.isArray(result.items) || !Number.isInteger(result.total) || result.total < 0 ||
		result.items.length !== result.total ||
		!result.items.every((video) => video && /^[\w-]{11}$/.test(video.id) &&
			["main", "replay"].includes(video.channel) && typeof video.title === "string" &&
			typeof video.thumbnailUrl === "string" && typeof video.duration === "string" &&
			typeof video.publishedAt === "string" && Number.isFinite(Date.parse(video.publishedAt)) &&
			Array.isArray(video.categories) && video.categories.every((category) => typeof category === "string") &&
			(video.viewCount == null || (typeof video.viewCount === "string" && /^\d{1,20}$/.test(video.viewCount))))) {
		throw new Error("전체 영상 목록을 확인하지 못했어요. 잠시 후 다시 시도해 주세요.");
	}
	if (new Set(result.items.map((video) => video.id)).size !== result.total) {
		throw new Error("영상 목록이 갱신됐어요. 다시 불러와 주세요.");
	}
	return result.items.sort((a, b) => compareYoutubeVideos(a, b, "newest"));
}

export const youtubeVideosQueryOptions = queryOptions({
	queryKey: ["youtube-videos", "all"],
	queryFn: ({ signal }) => getAllYoutubeVideos(signal),
	staleTime: 60000,
	retry: 1,
});

export function youtubeBroadcastDate(title: string): string | null {
	const match = /^\[(\d{2})\.(\d{2})\.(\d{2})\]/.exec(title.trimStart());
	if (!match) return null;
	const year = 2000 + Number(match[1]);
	const month = Number(match[2]);
	const day = Number(match[3]);
	const date = new Date(Date.UTC(year, month - 1, day));
	if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
	return `${year}-${match[2]}-${match[3]}`;
}

function koreanDate(time: number): string {
	return new Date(time + 9 * 3600000).toISOString().slice(0, 10);
}

export function youtubeVideoDate(video: YoutubeVideo): string {
	return youtubeBroadcastDate(video.title) ?? koreanDate(Date.parse(video.publishedAt));
}

function compareYoutubeVideos(a: YoutubeVideo, b: YoutubeVideo, sort: YoutubeSort): number {
	if (sort === "popular") {
		if (a.viewCount == null && b.viewCount != null) return 1;
		if (a.viewCount != null && b.viewCount == null) return -1;
		if (a.viewCount != null && b.viewCount != null) {
			const left = BigInt(a.viewCount);
			const right = BigInt(b.viewCount);
			if (left !== right) return left > right ? -1 : 1;
		}
	}
	const dateOrder = Date.parse(a.publishedAt) - Date.parse(b.publishedAt);
	return (sort === "oldest" ? dateOrder : -dateOrder) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
}

export function filterAndSortYoutubeVideos(
	videos: YoutubeVideo[],
	filters: YoutubeFilters,
	sort: YoutubeSort,
	search?: ReturnType<typeof createYoutubeSearch>,
): YoutubeVideo[] {
	const keyword = normalizeKeyword(filters.q);
	const candidates = keyword
		? (search ?? createYoutubeSearch(videos)).search(keyword).map(({ item }) => item.video)
		: filters.q.trim() ? [] : videos;
	return candidates.filter((video) => {
		if (filters.channel && video.channel !== filters.channel) return false;
		// if (filters.category && !video.categories.includes(filters.category)) return false;
		if (filters.broadcastFrom || filters.broadcastTo) {
			const broadcast = youtubeVideoDate(video);
			if (filters.broadcastFrom && broadcast < filters.broadcastFrom ||
				filters.broadcastTo && broadcast > filters.broadcastTo) return false;
		}
		return true;
	}).sort((a, b) => compareYoutubeVideos(a, b, sort));
}

export function youtubeDateRange(days: number, now = Date.now()): { from: string; to: string } {
	return { from: koreanDate(now - (days - 1) * 86400000), to: koreanDate(now) };
}

export function isRecentYoutubeVideo(video: YoutubeVideo, now = Date.now()): boolean {
	const published = Date.parse(video.publishedAt);
	return video.channel === "main" && published <= now && published >= now - 7 * 86400000;
}

export function getRecentYoutubeUploadLabel(video: YoutubeVideo, now = Date.now()): string | null {
	if (!isRecentYoutubeVideo(video, now)) return null;
	const days = Math.round((Date.parse(koreanDate(now)) - Date.parse(koreanDate(Date.parse(video.publishedAt)))) / 86400000);
	return days === 0 ? "오늘" : `${days}일 전`;
}

export function getYoutubeHypeReset(now: number) {
	const koreaOffset = 9 * 3600000;
	const current = new Date(now + koreaOffset);
	const resetDate = new Date(current);
	// 한국의 주간 초기화 시각(월요일 00:00 KST)을 기기 시간대와 무관하게 계산한다.
	resetDate.setUTCDate(current.getUTCDate() + ((8 - current.getUTCDay()) % 7 || 7));
	resetDate.setUTCHours(0, 0, 0, 0);
	const resetAt = new Date(resetDate.getTime() - koreaOffset);
	const remainingMs = resetAt.getTime() - now;
	const showSeconds = remainingMs <= 5 * 60000;
	const seconds = showSeconds ? Math.ceil(remainingMs / 1000) : Math.ceil(remainingMs / 60000) * 60;
	const days = Math.floor(seconds / 86400);
	const hours = Math.floor((seconds % 86400) / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	const remaining = [
		days && `${days}일`,
		(days || hours) && `${hours}시간`,
		`${minutes}분`,
		showSeconds && `${seconds % 60}초`,
	].filter(Boolean).join(" ");
	const message = remainingMs <= 3600000
		? "곧 초기화돼요. 남은 하이프를 확인해 보세요."
		: remainingMs <= 86400000
			? "남은 하이프가 있다면, 초기화 전에 응원해 주세요."
			: current.getUTCDay() === 1
				? "새로운 한 주, 하이프 횟수가 초기화됐어요."
				: "하이프 버튼이 보이면 쿠비에게 응원을 보내주세요.";
	return { resetAt, remaining, message, soon: remainingMs <= 86400000 };
}

export function formatYoutubeDuration(duration: string): string {
	const match = /^P(?:(\d+)D)?T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?$/.exec(duration);
	if (!match) return "";
	return formatPlaybackTime(Number(match[1] || 0) * 86400 + Number(match[2] || 0) * 3600 +
		Number(match[3] || 0) * 60 + Number(match[4] || 0));
}

