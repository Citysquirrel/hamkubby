import { create } from "zustand";

interface UiState {
	isSidebarOpen: boolean;
	toggleSidebar: () => void;
	closeSidebar: () => void;
}

const useUiStore = create<UiState>((set) => ({
	isSidebarOpen: false,
	toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
	closeSidebar: () => set({ isSidebarOpen: false }),
}));

export default useUiStore;
