import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n, { LANGUAGE_KEY, type Language } from '@/i18n';

interface LanguageState {
  language: Language;
  isLoaded: boolean;
  setLanguage: (lang: Language) => Promise<void>;
  loadLanguage: () => Promise<void>;
}

export const useLanguageStore = create<LanguageState>((set) => ({
  language: 'ko',
  isLoaded: false,

  loadLanguage: async () => {
    try {
      const saved = await AsyncStorage.getItem(LANGUAGE_KEY);
      const lang: Language = (saved === 'en' ? 'en' : 'ko');
      await i18n.changeLanguage(lang);
      set({ language: lang, isLoaded: true });
    } catch {
      set({ isLoaded: true });
    }
  },

  setLanguage: async (lang: Language) => {
    await AsyncStorage.setItem(LANGUAGE_KEY, lang);
    await i18n.changeLanguage(lang);
    set({ language: lang });
  },
}));
