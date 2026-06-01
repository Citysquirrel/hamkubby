import type { KVNamespace, EventContext } from "@cloudflare/workers-types";
type Cheese = "잘몰라" | "일반곡" | "피토곡" | "우엑곡" | "숙제곡" | (string & {});
export type SortType = "title-asc" | "title-desc" | "artist-asc" | "artist-desc";

export type Genre = "all" | "kpop" | "jpop" | "pop" | (string & {});
type ActionStatus = "ACTIVE" | "DELETED" | "DISABLED";

interface HamkubbySongHistoryModel {
	id: number;
	sungAt: Date | null;
	youtubeVideoId: string;
	start: number;
	end: number;
	memo?: string | null;
	hamkubby_id: number;
}
export interface Song {
	id?: string;
	syncId?: string;
	title: string;
	artist: string;
	searchTitle?: string;
	searchArtist?: string;
	genre: Genre;
	synonyms?: string[];
	lyric?: string;
	notes?: string;
	cheese: Cheese;
	isOfficial?: boolean;
	actionStatus?: ActionStatus;
	history?: HamkubbySongHistoryModel[]; // Join된 히스토리 데이터
}

export type RawSongData = Omit<Song, "synonyms" | "actionStatus"> & {
	synonyms: string;
	isActive: boolean;
	searchBase: string;
	searchChosung: string;
	searchJamo: string;
	createdAt?: string | null;
	updatedAt?: string | null;
	deletedAt?: string | null;
};

interface Env {
	GOOGLE_SHEET_ID: string;
	GOOGLE_SHEET_GIDS: string;
	GOOGLE_SHEET_CACHE_TIME?: string;
	GOOGLE_SHEET_KV?: KVNamespace;
	GOOGLE_SHEET_HIDDEN_ROWS?: string; // 1,4,17;E;3,4;8,23,77;
	API_URL: string;
}

export type RequestContext = EventContext<Env, string, Record<string, string>>;
