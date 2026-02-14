// Cart Store - Global State Management with Zustand
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useEffect, useState } from 'react';

export interface MenuItem {
  id: string;
  name: string;
  nameEn: string;
  nameFr?: string;
  price: number;
  image: string;
  category: string;
  description?: string;
  descriptionEn?: string;
  popular?: boolean;
  vegetarian?: boolean;
  spicy?: boolean;
  halal?: boolean;
}

export interface CartItem {
  item: MenuItem;
  quantity: number;
  specialInstructions?: string;
}

interface CartStore {
  items: CartItem[];
  favorites: string[]; // item IDs
  
  // Cart Actions
  addItem: (item: MenuItem, quantity?: number) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  updateInstructions: (itemId: string, instructions: string) => void;
  clearCart: () => void;
  
  // Favorites Actions
  toggleFavorite: (itemId: string) => void;
  isFavorite: (itemId: string) => boolean;
  
  // Computed Values
  totalItems: () => number;
  totalAmount: () => number;
  getItemQuantity: (itemId: string) => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      favorites: [],

      addItem: (item, quantity = 1) => {
        set((state) => {
          const existingIndex = state.items.findIndex((i) => i.item.id === item.id);
          
          if (existingIndex >= 0) {
            const newItems = [...state.items];
            newItems[existingIndex].quantity += quantity;
            return { items: newItems };
          }
          
          return { items: [...state.items, { item, quantity }] };
        });
      },

      removeItem: (itemId) => {
        set((state) => ({
          items: state.items.filter((i) => i.item.id !== itemId),
        }));
      },

      updateQuantity: (itemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(itemId);
          return;
        }
        
        set((state) => ({
          items: state.items.map((i) =>
            i.item.id === itemId ? { ...i, quantity } : i
          ),
        }));
      },

      updateInstructions: (itemId, instructions) => {
        set((state) => ({
          items: state.items.map((i) =>
            i.item.id === itemId ? { ...i, specialInstructions: instructions } : i
          ),
        }));
      },

      clearCart: () => {
        set({ items: [] });
      },

      toggleFavorite: (itemId) => {
        set((state) => {
          const isFav = state.favorites.includes(itemId);
          return {
            favorites: isFav
              ? state.favorites.filter((id) => id !== itemId)
              : [...state.favorites, itemId],
          };
        });
      },

      isFavorite: (itemId) => {
        return get().favorites.includes(itemId);
      },

      totalItems: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },

      totalAmount: () => {
        return get().items.reduce(
          (sum, item) => sum + item.item.price * item.quantity,
          0
        );
      },

      getItemQuantity: (itemId) => {
        const item = get().items.find((i) => i.item.id === itemId);
        return item?.quantity || 0;
      },
    }),
    {
      name: 'eastgate-cart-storage',
      skipHydration: true,
    }
  )
);

// Hook to safely hydrate the cart store on the client
export function useCartHydration() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    useCartStore.persist.rehydrate();
    setHydrated(true);
  }, []);
  return hydrated;
}
