import type { Song } from "@/config/types";
import { create } from "zustand";

interface SongDataState {
	data: Song[];
	setData: (newData: Song[]) => void;
	hasLoaded: boolean;
	error: string | null;
	setError: (error: string) => void;

	isSongDataLoading: boolean;
	startSongDataLoading: () => void;
	stopSongDataLoading: () => void;
}

const useSongDataStore = create<SongDataState>((set) => ({
	data: [],
	setData: (data: Song[]) => set({ data, hasLoaded: true, error: null }),
	hasLoaded: false,
	error: null,
	setError: (error) => set({ error }),

	isSongDataLoading: true,
	startSongDataLoading: () => set({ isSongDataLoading: true }),
	stopSongDataLoading: () => set({ isSongDataLoading: false }),
}));

export default useSongDataStore;
