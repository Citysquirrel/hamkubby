// src/store/useBroadcastStore.ts
import { create } from "zustand";

interface BroadcastState {
	roomId: string | null;
	songList: Broadcast.Song[];
	settings: Broadcast.Settings;

	pastSettings: Broadcast.Settings[];
	futureSettings: Broadcast.Settings[];

	undo: () => void;
	redo: () => void;

	setRoomId: (id: string) => void;
	setSongList: (list: Broadcast.Song[]) => void;
	updateSettings: (newSettings: Partial<Broadcast.Settings>) => void;
	syncFromServer: (data: Broadcast.DataPayload) => void;
}

const chzzkShadow: Broadcast.ShadowSettings = {
	enabled: true,
	x: 0,
	y: 0,
	blur: 15,
	spread: 0,
	color: "rgba(0, 255, 163, 0.4)",
};
const noShadow: Broadcast.ShadowSettings = {
	enabled: false,
	x: 0,
	y: 0,
	blur: 0,
	spread: 0,
	color: "rgba(0, 0, 0, 0)",
};

const defaultSettings: Broadcast.Settings = {
	global: {
		font: "Pretendard",
		width: 400,
		height: 0,
		paddingX: 16,
		paddingY: 16,
		bgColor: "rgba(10, 11, 14, 0.4)", // 반투명 다크 틴트
		borderWidth: 1,
		borderColor: "rgba(0, 255, 163, 0.15)",
		borderRadius: 16,
		boxShadow: noShadow,
	},
	header: { text: "", align: "center", marginB: 16, typo: { font: "inherit", size: 16, color: "#ffffff" } },
	footer: { text: "", align: "center", marginT: 16, typo: { font: "inherit", size: 14, color: "#ffffff" } },
	nowPlaying: {
		layout: "singleLine",
		showNumber: true,
		bgColor: "rgba(24, 25, 28, 0.9)",
		highlightColor: "#00ffa3",
		paddingX: 16,
		paddingY: 16,
		marginB: 16,
		borderRadius: 12,
		boxShadow: chzzkShadow,
		numTypo: { font: "inherit", size: 16, color: "#00ffa3" },
		titleTypo: { font: "inherit", size: 22, color: "#ffffff" },
		singerTypo: { font: "inherit", size: 15, color: "#aaaaaa" },
		playingText: { text: "ON AIR", typo: { font: "inherit", size: 12, color: "#00ffa3" } },
	},
	waitingList: {
		layout: "singleLine",
		showNumber: true,
		bgColor: "rgba(24, 25, 28, 0.6)",
		paddingX: 12,
		paddingY: 12,
		gap: 8,
		borderRadius: 8,
		numTypo: { font: "inherit", size: 14, color: "#888888" },
		titleTypo: { font: "inherit", size: 18, color: "#dddddd" },
		singerTypo: { font: "inherit", size: 14, color: "#888888" },
	},
	listWrapper: {
		borderWidth: 0,
		borderColor: "transparent",
		borderRadius: 0,
		maskFadeTop: 10,
		maskFadeBottom: 10,
		scrollSpeed: 5,
		marqueeSpeed: 10,
	},
};

export const useBroadcastStore = create<BroadcastState>((set) => ({
	roomId: null,
	songList: [],
	settings: defaultSettings,

	pastSettings: [],
	futureSettings: [],

	undo: () =>
		set((state) => {
			if (state.pastSettings.length === 0) return state;
			const previous = state.pastSettings[state.pastSettings.length - 1];
			const newPast = state.pastSettings.slice(0, -1);
			return { settings: previous, pastSettings: newPast, futureSettings: [state.settings, ...state.futureSettings] };
		}),

	redo: () =>
		set((state) => {
			if (state.futureSettings.length === 0) return state;
			const next = state.futureSettings[0];
			const newFuture = state.futureSettings.slice(1);
			return { settings: next, pastSettings: [...state.pastSettings, state.settings], futureSettings: newFuture };
		}),

	setRoomId: (id) => set({ roomId: id }),
	setSongList: (list) => set({ songList: list }),
	updateSettings: (newSettings) =>
		set((state) => {
			const newPast = [...state.pastSettings, state.settings].slice(-100);
			return { settings: newSettings, pastSettings: newPast, futureSettings: [] } as Partial<BroadcastState>;
		}),
	syncFromServer: (data) => {
		const mergedSettings: Broadcast.Settings = {
			global: { ...defaultSettings.global, ...(data.settings?.global || {}) },
			header: { ...defaultSettings.header, ...(data.settings?.header || {}) },
			footer: { ...defaultSettings.footer, ...(data.settings?.footer || {}) },
			nowPlaying: { ...defaultSettings.nowPlaying, ...(data.settings?.nowPlaying || {}) },
			waitingList: { ...defaultSettings.waitingList, ...(data.settings?.waitingList || {}) },
			listWrapper: { ...defaultSettings.listWrapper, ...(data.settings?.listWrapper || {}) },
		};
		set({ songList: data.songList, settings: mergedSettings });
	},
}));
