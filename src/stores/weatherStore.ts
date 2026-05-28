import { create } from 'zustand';
import { WeatherData } from '@/types';
import { getCurrentLocation, getWeatherByCoords, getWeatherByCity } from '@/services/weatherService';

interface WeatherState {
  weather: WeatherData | null;
  isLoading: boolean;
  error: string | null;

  fetchWeatherByLocation: () => Promise<void>;
  fetchWeatherByCity: (city: string) => Promise<void>;
}

export const useWeatherStore = create<WeatherState>((set) => ({
  weather: null,
  isLoading: false,
  error: null,

  fetchWeatherByLocation: async () => {
    set({ isLoading: true, error: null });
    try {
      const location = await getCurrentLocation();
      const weather = await getWeatherByCoords(location.lat, location.lng);
      set({ weather: { ...weather, city: location.city || weather.city }, isLoading: false });
    } catch (err) {
      const msg = err instanceof Error ? err.message : '날씨를 불러오지 못했습니다.';
      set({ error: msg, isLoading: false });
    }
  },

  fetchWeatherByCity: async (city) => {
    set({ isLoading: true, error: null });
    try {
      const weather = await getWeatherByCity(city);
      set({ weather, isLoading: false });
    } catch (err) {
      const msg = err instanceof Error ? err.message : '날씨를 불러오지 못했습니다.';
      set({ error: msg, isLoading: false });
    }
  },
}));
