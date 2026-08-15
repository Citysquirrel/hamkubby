import type { Song } from "@/config/types";
import { create } from "zustand";

interface SongDataState {
	data: Song[];
	setData: (newData: Song[]) => void;

	isSongDataLoading: boolean;
	startSongDataLoading: () => void;
	stopSongDataLoading: () => void;
}

const useSongDataStore = create<SongDataState>((set) => ({
	data: [],
	setData: (data: Song[]) => set(() => ({ data })),

	isSongDataLoading: false,
	startSongDataLoading: () => set({ isSongDataLoading: true }),
	stopSongDataLoading: () => set({ isSongDataLoading: false }),
}));

export default useSongDataStore;
