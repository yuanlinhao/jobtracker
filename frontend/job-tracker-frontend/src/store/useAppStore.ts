import { create } from "zustand";
import { Application } from "../types";

type AppStore = {
  apps: Application[];
  setApps: (apps: Application[]) => void;
  updateApp: (updated: Application) => void;
  addApp: (app: Application) => void;
};

export const useAppStore = create<AppStore>((set) => ({
  apps: [],
  setApps: (apps) => set({ apps }),
  updateApp: (updated) =>
    set((state) => ({
      apps: state.apps.map((app) =>
        app.id === updated.id ? { ...app, ...updated } : app
      ),
    })),
  addApp: (app) =>
    set((state) => ({
      apps: [app, ...state.apps],
    })),
}));
