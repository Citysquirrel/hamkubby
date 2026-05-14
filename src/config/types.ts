import type { KVNamespace, EventContext } from "@cloudflare/workers-types";
type Cheese = "잘몰라" | "일반곡" | "피토곡" | "우엑곡" | "숙제곡" | (string & {});
export type SortType = "title-asc" | "title-desc" | "artist-asc" | "artist-desc";

export type Genre = "all" | "kpop" | "jpop" | "pop" | (string & {});

export interface Song {
	id?: string;
	title: string;
	artist: string;
	searchTitle?: string;
	searchArtist?: string;
	genre: Genre;
	synonyms?: string[];
	hasLyrics?: boolean;
	notes?: string;
	cheese: Cheese;
	isOfficial?: boolean;
}

interface Env {
	GOOGLE_SHEET_ID: string;
	GOOGLE_SHEET_GIDS: string;
	GOOGLE_SHEET_CACHE_TIME?: string;
	GOOGLE_SHEET_KV?: KVNamespace;
	GOOGLE_SHEET_HIDDEN_ROWS?: string; // 1,4,17;E;3,4;8,23,77;
}

export type RequestContext = EventContext<Env, string, Record<string, string>>;
