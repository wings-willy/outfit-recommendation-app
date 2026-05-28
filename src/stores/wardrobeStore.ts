import { create } from 'zustand';
import { ClothingItem, ClothingCategory } from '@/types';
import { getClothingItems, addClothingItem, deleteClothingItem, getMockClothingItems } from '@/services/clothingService';

const USE_MOCK = !process.env.EXPO_PUBLIC_SUPABASE_URL;

interface WardrobeState {
  items: ClothingItem[];
  isLoading: boolean;
  selectedCategory: ClothingCategory | 'all';

  loadItems: (userId: string) => Promise<void>;
  addItem: (userId: string, imageUri: string) => Promise<void>;
  removeItem: (itemId: string, userId: string) => Promise<void>;
  setCategory: (category: ClothingCategory | 'all') => void;
  getFilteredItems: () => ClothingItem[];
}

export const useWardrobeStore = create<WardrobeState>((set, get) => ({
  items: [],
  isLoading: false,
  selectedCategory: 'all',

  loadItems: async (userId) => {
    set({ isLoading: true });
    try {
      const items = USE_MOCK
        ? getMockClothingItems(userId)
        : await getClothingItems(userId);
      set({ items, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  addItem: async (userId, imageUri) => {
    set({ isLoading: true });
    try {
      const newItem = await addClothingItem(userId, imageUri);
      set((state) => ({ items: [newItem, ...state.items], isLoading: false }));
    } catch {
      set({ isLoading: false });
      throw new Error('의상 추가에 실패했습니다.');
    }
  },

  removeItem: async (itemId, userId) => {
    await deleteClothingItem(itemId, userId);
    set((state) => ({ items: state.items.filter((i) => i.id !== itemId) }));
  },

  setCategory: (category) => set({ selectedCategory: category }),

  getFilteredItems: () => {
    const { items, selectedCategory } = get();
    if (selectedCategory === 'all') return items;
    return items.filter((item) => item.category === selectedCategory);
  },
}));
