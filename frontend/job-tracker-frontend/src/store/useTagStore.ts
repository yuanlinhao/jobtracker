import { create } from "zustand";
import { api } from "../api/client";

export type Tag = {
  id: string;
  name: string;
};

type TagState = {
  tags: Tag[];
  tagMap: Record<string, string>;
  loading: boolean;
  error: string | null;
  fetchTags: () => Promise<void>;
};

export const useTagStore = create<TagState>((set) => ({
  tags: [],
  tagMap: {},
  loading: false,
  error: null,

  fetchTags: async () => {
    set({ loading: true });
    try {
      const res = await api.get("/tags/");
      const tags = res.data ?? [];
      const tagMap = Object.fromEntries(tags.map((t: Tag) => [t.id, t.name]));
      set({ tags, tagMap, error: null });
    } catch (err: any) {
      set({ error: err.message || "Failed to fetch tags" });
    } finally {
      set({ loading: false });
    }
  },
}));
