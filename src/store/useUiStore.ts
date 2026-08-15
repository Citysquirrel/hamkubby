import type { SetStateAction } from "@/config/types";
import type { PreviewVideo } from "@/pages/SongBook";
import { create } from "zustand";

interface UiState {
	isProfileOpen: boolean;
	setIsProfileOpen: (action: SetStateAction<boolean>) => void;
	toggleProfile: () => void;
	openProfile: () => void;
	closeProfile: () => void;

	showPreview: boolean;
	togglePreview: () => void;
	openPreview: () => void;
	closePreview: () => void;

	previewVideo: PreviewVideo;
	setPreviewVideo: (action: SetStateAction<PreviewVideo>) => void;
}

const useUiStore = create<UiState>((set) => ({
	isProfileOpen: false,
	setIsProfileOpen: (action) =>
		set((state) => {
			const next = typeof action === "function" ? action(state.isProfileOpen) : action;

			return { isProfileOpen: next };
		}),
	toggleProfile: () => set((state) => ({ isProfileOpen: !state.isProfileOpen })),
	openProfile: () => set({ isProfileOpen: true }),
	closeProfile: () => set({ isProfileOpen: false }),

	showPreview: false,
	togglePreview: () => set((state) => ({ showPreview: !state.showPreview })),
	openPreview: () => set({ showPreview: true }),
	closePreview: () => set({ showPreview: false }),

	previewVideo: ["", undefined, undefined],
	setPreviewVideo: (action) =>
		set((state) => {
			const next = typeof action === "function" ? action(state.previewVideo) : action;

			return { previewVideo: next };
		}),
}));

export default useUiStore;
