import type { RawSongData, Song, SortType } from "../config/types";
import { normalizeKeyword } from "./search";

function parseSynonyms(raw: string): string[] {
	try {
		const value: unknown = JSON.parse(raw);
		return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
	} catch {
		return [];
	}
}

export function parseSongbookData(rawData: RawSongData[]): Song[] {
	return rawData.filter((song) => song.isActive).map(({ synonyms, isActive: _isActive, ...song }) => ({
		...song,
		synonyms: parseSynonyms(synonyms),
		actionStatus: "ACTIVE",
		searchTitle: normalizeKeyword(song.title),
		searchArtist: normalizeKeyword(song.artist),
	}));
}

export function findSelectedSong(data: Song[], selection: Song | null): Song | null {
	if (!selection) return null;
	return (
		data.find((song) => {
			if (selection.syncId) return song.syncId === selection.syncId;
			if (selection.id != null) return song.id === selection.id;
			return song.title === selection.title && song.artist === selection.artist && song.genre === selection.genre;
		}) ?? null
	);
}

export interface SongFilters {
	genre?: string[];
	official?: string[];
	cheese?: string[];
	history?: string[];
}

export function filterAndSortSongs(data: Song[], filters: SongFilters, sort: SortType, isSearching = false): Song[] {
	const filtered = data.filter((song) => {
		const matches = (values: string[] | undefined, value: string) => !values?.length || values.includes(value);
		return matches(filters.genre, song.genre)
			&& matches(filters.official, String(song.isOfficial))
			&& (!song.isOfficial || matches(filters.cheese, song.cheese))
			&& matches(filters.history, song.song_histories?.length ? "yes" : "no");
	});
	if (isSearching || sort === "default") return filtered;
	const field = sort.startsWith("artist") ? "artist" : "title";
	const direction = sort.endsWith("desc") ? -1 : 1;
	return filtered.sort((a, b) => a[field].localeCompare(b[field], "ko") * direction);
}
