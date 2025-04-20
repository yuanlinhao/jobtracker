import { create } from "zustand";

type SelectionStore = {
  selectedIds: string[];
  toggleSelection: (id: string, multi: boolean) => void;
  clearSelection: () => void;
};

export const useSelectionStore = create<SelectionStore>((set) => ({
  selectedIds: [],
  toggleSelection: (id, multi) =>
    set((state) => {
      const already = state.selectedIds.includes(id);
      if (!multi) return { selectedIds: [id] };
      return {
        selectedIds: already
          ? state.selectedIds.filter((i) => i !== id)
          : [...state.selectedIds, id],
      };
    }),
  clearSelection: () => set({ selectedIds: [] }),
}));
