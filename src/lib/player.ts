import type { HamkubbySongHistoryModel, Song } from "../config/types";

export interface QueueTrack {
	id: string;
	videoId: string;
	title: string;
	artist: string;
	sungAt: string;
	start: number;
	end: number | null;
}

export interface SavedPlaylist {
	id: string;
	name: string;
	tracks: QueueTrack[];
}

export function isQueueTrack(value: unknown): value is QueueTrack {
	if (!value || typeof value !== "object") return false;
	const track = value as QueueTrack;
	return [track.id, track.title, track.artist, track.sungAt].every((item) => typeof item === "string") &&
		typeof track.videoId === "string" && /^[\w-]{11}$/.test(track.videoId) &&
		Number.isFinite(track.start) && track.start >= 0 &&
		(track.end === null || (Number.isFinite(track.end) && track.end > track.start));
}

export function toQueueTrack(song: Song, history: HamkubbySongHistoryModel): QueueTrack | null {
	const track: QueueTrack = {
		id: JSON.stringify([song.syncId ?? song.id ?? [song.title, song.artist], history.historyId || history.id,
			history.youtubeVideoId, history.start ?? 0, history.end, history.sungAt]),
		videoId: history.youtubeVideoId,
		title: song.title,
		artist: song.artist,
		sungAt: history.sungAt,
		start: history.start ?? 0,
		end: history.end ?? null,
	};
	return isQueueTrack(track) ? track : null;
}

export function appendTracks(queue: QueueTrack[], tracks: QueueTrack[]): QueueTrack[] {
	const seen = new Set(queue.map((track) => track.id));
	return [...queue, ...tracks.filter((track) => {
		if (!isQueueTrack(track) || seen.has(track.id)) return false;
		seen.add(track.id);
		return true;
	})];
}

export function moveTrack(tracks: QueueTrack[], id: string, offset: number): QueueTrack[] {
	const index = tracks.findIndex((track) => track.id === id);
	const target = index + offset;
	if (index < 0 || target < 0 || target >= tracks.length) return tracks;
	const next = [...tracks];
	[next[index], next[target]] = [next[target], next[index]];
	return next;
}

export function formatPlaybackTime(seconds: number): string {
	const value = Math.max(0, Math.floor(seconds || 0));
	return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, "0")}`;
}
