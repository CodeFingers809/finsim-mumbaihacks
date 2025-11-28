import { create } from "zustand";
import type { Watchlist } from "@trader/types";

type State = {
  activeWatchlistId?: string;
  watchlists: Watchlist[];
};

const initialState: State = {
  activeWatchlistId: undefined,
  watchlists: [],
};

type Actions = {
  setWatchlists: (lists: Watchlist[]) => void;
  setActiveWatchlist: (id: string) => void;
  updateWatchlist: (updated: Watchlist) => void;
};

export const useWatchlistStore = create<State & Actions>((set) => ({
  ...initialState,
  setWatchlists: (lists) =>
    set((state) => ({
      watchlists: lists,
      activeWatchlistId: state.activeWatchlistId ?? lists[0]?._id,
    })),
  setActiveWatchlist: (id) => set({ activeWatchlistId: id }),
  updateWatchlist: (updated) =>
    set((state) => ({
      watchlists: state.watchlists.some((watchlist) => watchlist._id === updated._id)
        ? state.watchlists.map((watchlist) =>
            watchlist._id === updated._id ? updated : watchlist
          )
        : [updated, ...state.watchlists],
    })),
}));
