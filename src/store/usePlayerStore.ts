import { create } from "zustand";
import { appendTracks, isQueueTrack, moveTrack, type QueueTrack, type SavedPlaylist } from "../lib/player";
import { readStoredValue, writeStoredValue } from "../lib/storage";

type Repeat = "off" | "one" | "all";
interface PersistedPlayer {
	queue: QueueTrack[];
	lists: SavedPlaylist[];
	currentId: string | null;
	position: number;
	volume: number;
	muted: boolean;
	shuffle: boolean;
	repeat: Repeat;
}
interface PlayerState extends PersistedPlayer {
	open: boolean;
	playing: boolean;
	wantPlay: boolean;
	revision: number;
	visited: string[];
	back: string[];
	notice: string;
	undoList: SavedPlaylist | null;
	add: (track: QueueTrack, play?: boolean) => void;
	select: (id: string) => void;
	next: (automatic?: boolean) => void;
	previous: () => void;
	remove: (id: string) => void;
	move: (id: string, offset: number) => void;
	show: () => void;
	close: () => void;
	saveList: (name: string, id?: string) => string | null;
	renameList: (id: string, name: string) => void;
	deleteList: (id: string) => void;
	restoreList: () => void;
	editList: (id: string, trackId: string, offset?: number) => void;
	useList: (id: string, play: boolean) => void;
}
const key = "songbook-player-v1";
const defaults: PersistedPlayer = { queue: [], lists: [], currentId: null, position: 0, volume: 40, muted: false, shuffle: false, repeat: "off" };
function isPersisted(value: unknown): value is PersistedPlayer {
	if (!value || typeof value !== "object") return false;
	const state = value as PersistedPlayer;
	return Array.isArray(state.queue) && state.queue.every(isQueueTrack) &&
		Array.isArray(state.lists) && state.lists.every((list) => list && typeof list.id === "string" && typeof list.name === "string" && Array.isArray(list.tracks) && list.tracks.every(isQueueTrack)) &&
		(state.currentId === null || typeof state.currentId === "string") &&
		Number.isFinite(state.position) && state.position >= 0 &&
		Number.isFinite(state.volume) && state.volume >= 0 && state.volume <= 100 &&
		typeof state.muted === "boolean" && typeof state.shuffle === "boolean" && ["off", "one", "all"].includes(state.repeat);
}
const restored = readStoredValue(key, defaults, isPersisted);
restored.queue = appendTracks([], restored.queue);
if (!restored.queue.some((track) => track.id === restored.currentId)) {
	restored.currentId = restored.queue[0]?.id ?? null;
	restored.position = restored.queue[0]?.start ?? 0;
}
const current = restored.queue.find((track) => track.id === restored.currentId);
if (current) restored.position = Math.max(current.start, Math.min(restored.position, current.end ?? Infinity));

export const usePlayerStore = create<PlayerState>((set, get) => ({
	...restored,
	open: restored.queue.length > 0,
	playing: false,
	wantPlay: false,
	revision: 0,
	visited: restored.currentId ? [restored.currentId] : [],
	back: [],
	notice: "",
	undoList: null,
	add: (track, play = false) => {
		if (!isQueueTrack(track)) return;
		set((state) => {
			const exists = state.queue.some((item) => item.id === track.id);
			const queue = [...state.queue];
			if (!exists) {
				const index = state.queue.findIndex((item) => item.id === state.currentId);
				queue.splice(play && index >= 0 ? index + 1 : queue.length, 0, track);
			}
			const choose = play || !state.currentId;
			return { queue, open: true, notice: exists ? "대기열에 이미 담긴 영상이에요." : "대기열에 담았어요.",
				...(choose ? { currentId: track.id, position: track.start, wantPlay: play, playing: false,
					revision: state.revision + 1, visited: [...new Set([...state.visited, track.id])],
					back: state.currentId && state.currentId !== track.id ? [...state.back, state.currentId] : state.back } : {}) };
		});
	},
	select: (id) => {
		const state = get();
		const track = state.queue.find((item) => item.id === id);
		if (!track) return;
		set({ currentId: id, position: track.start, wantPlay: true, playing: false, open: true, revision: state.revision + 1,
			visited: [...new Set([...state.visited, id])], back: state.currentId && state.currentId !== id ? [...state.back, state.currentId] : state.back });
	},
	next: (automatic = false) => {
		const state = get();
		if (!state.queue.length) return;
		if (automatic && state.repeat === "one" && state.currentId) { state.select(state.currentId); return; }
		let next: QueueTrack | undefined;
		if (state.shuffle) {
			let candidates = state.queue.filter((track) => !state.visited.includes(track.id));
			if (!candidates.length && state.repeat === "all") {
				candidates = state.queue.filter((track) => track.id !== state.currentId);
				if (!candidates.length) candidates = state.queue;
				set({ visited: [] });
			}
			next = candidates[Math.floor(Math.random() * candidates.length)];
		} else {
			const index = state.queue.findIndex((track) => track.id === state.currentId);
			next = state.queue[index + 1] ?? (state.repeat === "all" ? state.queue[0] : undefined);
		}
		if (next) get().select(next.id);
		else set({ playing: false, wantPlay: false, notice: "대기열 재생이 끝났어요." });
	},
	previous: () => {
		const state = get();
		const id = state.shuffle ? [...state.back].reverse().find((item) => state.queue.some((track) => track.id === item))
			: state.queue[state.queue.findIndex((track) => track.id === state.currentId) - 1]?.id;
		if (id) {
			state.select(id);
			set({ back: state.back.slice(0, state.back.lastIndexOf(id)), visited: state.visited.filter((item) => item !== state.currentId) });
		} else if (state.currentId) state.select(state.currentId);
	},
	remove: (id) => set((state) => {
		const index = state.queue.findIndex((track) => track.id === id);
		const queue = state.queue.filter((track) => track.id !== id);
		const replacement = queue[Math.min(index, queue.length - 1)];
		return { queue, visited: state.visited.filter((item) => item !== id), back: state.back.filter((item) => item !== id),
			...(state.currentId === id ? { currentId: replacement?.id ?? null, position: replacement?.start ?? 0, wantPlay: false, playing: false, revision: state.revision + 1 } : {}) };
	}),
	move: (id, offset) => set((state) => ({ queue: moveTrack(state.queue, id, offset) })),
	show: () => set({ open: true }),
	close: () => set({ open: false, playing: false, wantPlay: false }),
	saveList: (name, id) => {
		const clean = name.trim().slice(0, 80);
		if (!clean) return null;
		const state = get();
		const list = { id: id ?? crypto.randomUUID(), name: clean, tracks: [...state.queue] };
		set({ lists: id ? state.lists.map((item) => item.id === id ? list : item) : [...state.lists, list], notice: "목록을 저장했어요." });
		return list.id;
	},
	renameList: (id, name) => {
		const clean = name.trim().slice(0, 80);
		if (clean) set((state) => ({ lists: state.lists.map((list) => list.id === id ? { ...list, name: clean } : list) }));
	},
	deleteList: (id) => set((state) => ({ undoList: state.lists.find((list) => list.id === id) ?? null, lists: state.lists.filter((list) => list.id !== id), notice: "저장 목록을 삭제했어요." })),
	restoreList: () => set((state) => ({ lists: state.undoList ? [...state.lists, state.undoList] : state.lists, undoList: null, notice: "목록을 복원했어요." })),
	editList: (id, trackId, offset) => set((state) => ({ lists: state.lists.map((list) => list.id === id ? { ...list,
		tracks: offset === undefined ? list.tracks.filter((track) => track.id !== trackId) : moveTrack(list.tracks, trackId, offset) } : list) })),
	useList: (id, play) => {
		const state = get();
		const list = state.lists.find((item) => item.id === id);
		if (!list?.tracks.length) return;
		if (play) set({ queue: [...list.tracks], currentId: list.tracks[0].id, position: list.tracks[0].start,
			wantPlay: true, playing: false, open: true, revision: state.revision + 1, visited: [list.tracks[0].id], back: [] });
		else {
			const queue = appendTracks(state.queue, list.tracks);
			set({ queue, open: true, notice: "목록을 대기열에 추가했어요.",
				...(!state.currentId ? { currentId: queue[0].id, position: queue[0].start, revision: state.revision + 1 } : {}) });
		}
	},
}));

let lastPositionSave = 0;
export function persistPlayerState() {
	const { queue, lists, currentId, position, volume, muted, shuffle, repeat } = usePlayerStore.getState();
	writeStoredValue(key, { queue, lists, currentId, position, volume, muted, shuffle, repeat });
}
usePlayerStore.subscribe((state, previous) => {
	const structural = state.queue !== previous.queue || state.lists !== previous.lists || state.currentId !== previous.currentId ||
		state.volume !== previous.volume || state.muted !== previous.muted || state.shuffle !== previous.shuffle || state.repeat !== previous.repeat || state.open !== previous.open || state.playing !== previous.playing || state.wantPlay !== previous.wantPlay;
	if (!structural && (state.position === previous.position || Date.now() - lastPositionSave < 2000)) return;
	lastPositionSave = Date.now();
	persistPlayerState();
});
