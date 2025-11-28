import { create } from "zustand";
import type { StrategyLeg } from "@trader/types";

export type StrategyBuilderState = {
  name: string;
  description: string;
  legs: StrategyLeg[];
};

const defaultLeg: StrategyLeg = {
  type: "option",
  action: "buy",
  symbol: "NIFTY",
  strike: 19500,
  quantity: 1,
  orderType: "market",
};

const initialState: StrategyBuilderState = {
  name: "New Strategy",
  description: "",
  legs: [defaultLeg],
};

export const useStrategyBuilder = create<
  StrategyBuilderState & {
    setName: (name: string) => void;
    setDescription: (description: string) => void;
    addLeg: () => void;
    updateLeg: (index: number, leg: Partial<StrategyLeg>) => void;
    removeLeg: (index: number) => void;
    reset: () => void;
  }
>((set) => ({
  ...initialState,
  setName: (name) => set({ name }),
  setDescription: (description) => set({ description }),
  addLeg: () => set((state) => ({ legs: [...state.legs, defaultLeg] })),
  updateLeg: (index, leg) =>
    set((state) => ({
      legs: state.legs.map((existingLeg, idx) =>
        idx === index ? { ...existingLeg, ...leg } : existingLeg
      ),
    })),
  removeLeg: (index) =>
    set((state) => ({ legs: state.legs.filter((_, idx) => idx !== index) })),
  reset: () => set(initialState),
}));
