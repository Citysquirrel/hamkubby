import type { EventContext, KVNamespace } from "@cloudflare/workers-types";
type Cheese = "잘몰라" | "일반곡" | "피토곡" | "우엑곡" | "숙제곡" | (string & {});
export type SortType = "default" | "title-asc" | "title-desc" | "artist-asc" | "artist-desc";

export type Genre = "K-POP" | "J-POP" | "POP" | (string & {});
type ActionStatus = "ACTIVE" | "DELETED" | "DISABLED";

export interface HamkubbySongHistoryModel {
	id: number;
	historyId: string;
	sungAt: string;
	youtubeVideoId: string;
	start: number | null;
	end: number | null;
	memo?: string | null;
	priority: number;
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
	song_histories?: HamkubbySongHistoryModel[]; // Join된 히스토리 데이터
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

export type SetStateAction<T> = T | ((prevState: T) => T);

declare global {
	namespace Broadcast {
		interface Song {
			id: string;
			title: string;
			singer: string;
			status: "waiting" | "playing" | "done";
		}

		interface Decoration {
			id: string;
			imageUrl: string;
			position: "absolute" | "relative";
			top?: string;
			bottom?: string;
			left?: string;
			right?: string;
			width?: string;
			zIndex?: number;
		}

		type FontChoice = "inherit" | "Pretendard" | "Gmarket Sans" | "Noto Sans KR" | "Arial" | "Verdana" | (string & {});
		interface Typo {
			font: FontChoice;
			size: number;
			color: string;
		}

		interface ShadowSettings {
			enabled: boolean;
			x: number;
			y: number;
			blur: number;
			spread: number;
			color: string;
		}

		interface Settings {
			global: {
				font: FontChoice;
				width: number;
				height: number;
				padding?: number;
				paddingX: number;
				paddingY: number;
				bgColor: string;
				borderWidth: number;
				borderColor: string;
				borderRadius: number;
				boxShadow: ShadowSettings;
			};
			header: { text: string; align: "left" | "center" | "right"; marginB: number; typo: Typo };
			footer: { text: string; align: "left" | "center" | "right"; marginT: number; typo: Typo };
			nowPlaying: {
				layout: "singleLine" | "doubleLine";
				showNumber: boolean;
				bgColor: string;
				highlightColor: string;
				padding?: number;
				paddingX: number;
				paddingY: number;
				marginB: number;
				borderRadius: number;
				boxShadow: ShadowSettings;
				numTypo: Typo;
				titleTypo: Typo;
				singerTypo: Typo;
				playingText: { text: string; typo: Typo };
			};
			waitingList: {
				layout: "singleLine" | "doubleLine";
				showNumber: boolean;
				bgColor: string;
				padding?: number;
				paddingX: number;
				paddingY: number;
				gap: number;
				borderRadius: number;
				numTypo: Typo;
				titleTypo: Typo;
				singerTypo: Typo;
			};
			listWrapper: {
				borderWidth: number;
				borderColor: string;
				borderRadius: number;
				maskFadeTop: number;
				maskFadeBottom: number;
				scrollSpeed: number;
				marqueeSpeed: number;
			};
		}

		interface DataPayload {
			roomId?: string;
			pin: string;
			songList: Song[];
			settings: Settings;
		}
	}
}
