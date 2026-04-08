import { create } from "zustand";
import type { UserRole, Resource } from "@/services/api";

interface AppState {
  role: UserRole;
  setRole: (role: UserRole) => void;
  selectedResource: Resource | null;
  setSelectedResource: (r: Resource | null) => void;
  showReportModal: boolean;
  setShowReportModal: (v: boolean) => void;
  showAddModal: boolean;
  setShowAddModal: (v: boolean) => void;
  isDark: boolean;
  toggleTheme: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  role: "Student",
  setRole: (role) => set({ role }),
  selectedResource: null,
  setSelectedResource: (r) => set({ selectedResource: r }),
  showReportModal: false,
  setShowReportModal: (v) => set({ showReportModal: v }),
  showAddModal: false,
  setShowAddModal: (v) => set({ showAddModal: v }),
  isDark: true,
  toggleTheme: () =>
    set((s) => {
      const next = !s.isDark;
      document.documentElement.classList.toggle("dark", next);
      return { isDark: next };
    }),
}));
