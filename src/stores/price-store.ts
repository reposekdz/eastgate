// Price Management Store - Allows branch managers to adjust prices
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type PriceCategory = "room" | "menu" | "spa" | "event";

export interface PriceOverride {
  id: string;
  category: PriceCategory;
  itemId: string;
  itemName: string;
  originalPrice: number;
  newPrice: number;
  branchId: string;
  updatedBy: string;
  updatedAt: string;
  reason?: string;
  active: boolean;
}

export interface PriceHistory {
  id: string;
  overrideId: string;
  oldPrice: number;
  newPrice: number;
  changedBy: string;
  changedAt: string;
}

interface PriceStore {
  overrides: PriceOverride[];
  history: PriceHistory[];
  setPrice: (override: Omit<PriceOverride, "id" | "updatedAt">) => string;
  updatePrice: (overrideId: string, newPrice: number, changedBy: string) => void;
  removeOverride: (overrideId: string) => void;
  toggleOverride: (overrideId: string) => void;
  getOverridesByBranch: (branchId: string) => PriceOverride[];
  getOverridesByCategory: (branchId: string, category: PriceCategory) => PriceOverride[];
  getEffectivePrice: (itemId: string, branchId: string, originalPrice: number) => number;
  getHistory: (overrideId: string) => PriceHistory[];
}

export const usePriceStore = create<PriceStore>()(
  persist(
    (set, get) => ({
      overrides: [],
      history: [],

      setPrice: (overrideData) => {
        const id = `po-${Date.now().toString(36)}`;
        const now = new Date().toISOString();

        // Remove existing override for same item + branch
        const existing = get().overrides.find(
          (o) => o.itemId === overrideData.itemId && o.branchId === overrideData.branchId
        );

        const newOverride: PriceOverride = { ...overrideData, id, updatedAt: now };

        set((state) => ({
          overrides: existing
            ? state.overrides.map((o) =>
                o.id === existing.id ? newOverride : o
              )
            : [...state.overrides, newOverride],
          history: [
            ...state.history,
            {
              id: `ph-${Date.now().toString(36)}`,
              overrideId: id,
              oldPrice: existing?.newPrice || overrideData.originalPrice,
              newPrice: overrideData.newPrice,
              changedBy: overrideData.updatedBy,
              changedAt: now,
            },
          ],
        }));

        return id;
      },

      updatePrice: (overrideId, newPrice, changedBy) => {
        const existing = get().overrides.find((o) => o.id === overrideId);
        if (!existing) return;

        const now = new Date().toISOString();
        set((state) => ({
          overrides: state.overrides.map((o) =>
            o.id === overrideId
              ? { ...o, newPrice, updatedAt: now, updatedBy: changedBy }
              : o
          ),
          history: [
            ...state.history,
            {
              id: `ph-${Date.now().toString(36)}`,
              overrideId,
              oldPrice: existing.newPrice,
              newPrice,
              changedBy,
              changedAt: now,
            },
          ],
        }));
      },

      removeOverride: (overrideId) => {
        set((state) => ({
          overrides: state.overrides.filter((o) => o.id !== overrideId),
        }));
      },

      toggleOverride: (overrideId) => {
        set((state) => ({
          overrides: state.overrides.map((o) =>
            o.id === overrideId ? { ...o, active: !o.active } : o
          ),
        }));
      },

      getOverridesByBranch: (branchId) => {
        return get().overrides.filter((o) => o.branchId === branchId);
      },

      getOverridesByCategory: (branchId, category) => {
        return get().overrides.filter(
          (o) => o.branchId === branchId && o.category === category
        );
      },

      getEffectivePrice: (itemId, branchId, originalPrice) => {
        const override = get().overrides.find(
          (o) => o.itemId === itemId && o.branchId === branchId && o.active
        );
        return override ? override.newPrice : originalPrice;
      },

      getHistory: (overrideId) => {
        return get().history.filter((h) => h.overrideId === overrideId);
      },
    }),
    { name: "eastgate-price-store" }
  )
);
