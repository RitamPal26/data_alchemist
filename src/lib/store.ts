import { create } from 'zustand';
import type { CSVRow, Rule, WeightMap } from './types';

interface StoreState {
  rows: Record<string, CSVRow[]>;          // keyed by sheet name
  errors: Record<string, string[]>;        // keyed by sheet name
  rules: Rule[];
  weights: WeightMap;
  setRows: (sheet: string, data: CSVRow[]) => void;
  setErrors: (sheet: string, errs: string[]) => void;
  addRule: (r: Rule) => void;
  setWeights: (w: WeightMap) => void;
}

export const useStore = create<StoreState>((set) => ({
  rows: {},
  errors: {},
  rules: [],
  weights: {},
  setRows: (sheet, data) =>
    set((s) => ({ rows: { ...s.rows, [sheet]: data } })),
  setErrors: (sheet, errs) =>
    set((s) => ({ errors: { ...s.errors, [sheet]: errs } })),
  addRule: (r) => set((s) => ({ rules: [...s.rules, r] })),
  setWeights: (w) => set(() => ({ weights: w })),
}));
