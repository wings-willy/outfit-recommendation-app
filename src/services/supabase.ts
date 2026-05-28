import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

// 환경변수 누락 여부 확인 (개발 중 알림용)
export const isSupabaseConfigured =
  supabaseUrl.startsWith('https://') &&
  supabaseUrl.includes('.supabase.co') &&
  supabaseAnonKey.length > 20;

if (!isSupabaseConfigured && __DEV__) {
  console.warn(
    '[Supabase] ⚠️ 환경변수가 설정되지 않았습니다.\n' +
    'frontend/.env 파일에 EXPO_PUBLIC_SUPABASE_URL과 EXPO_PUBLIC_SUPABASE_ANON_KEY를 입력하세요.\n' +
    '현재는 Mock 모드로 동작합니다.'
  );
}

// Expo SecureStore를 Supabase 세션 저장소로 사용
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    if (Platform.OS === 'web') {
      try { return Promise.resolve(localStorage.getItem(key)); } catch { return Promise.resolve(null); }
    }
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string) => {
    if (Platform.OS === 'web') {
      try { localStorage.setItem(key, value); } catch {}
      return Promise.resolve();
    }
    return SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string) => {
    if (Platform.OS === 'web') {
      try { localStorage.removeItem(key); } catch {}
      return Promise.resolve();
    }
    return SecureStore.deleteItemAsync(key);
  },
};

// 환경변수가 없을 때 더미 URL로 클라이언트 생성 (크래시 방지)
const _url = isSupabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co';
const _key = isSupabaseConfigured ? supabaseAnonKey : 'placeholder-key';

export const supabase: SupabaseClient = createClient(_url, _key, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: isSupabaseConfigured,
    persistSession: isSupabaseConfigured,
    detectSessionInUrl: false,
  },
});
