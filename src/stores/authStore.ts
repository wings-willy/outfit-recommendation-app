/**
 * authStore — 로컬 전용 사용자 프로필 스토어
 * Supabase Auth 없이 AsyncStorage에 프로필을 저장합니다.
 */
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile } from '@/types';

const PROFILE_KEY = '@todaywear/user_profile';

/** 로컬 UUID 생성 (crypto 없이) */
function generateLocalId(): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 11);
  return `local_${ts}_${rand}`;
}

/** 초기 기본 프로필 */
function makeDefaultProfile(): UserProfile {
  return {
    id: generateLocalId(),
    email: '',
    onboarding_completed: false,
    subscription_plan: 'free',
    created_at: new Date().toISOString(),
  };
}

interface AuthState {
  user: UserProfile | null;
  isLoading: boolean;
  isInitialized: boolean;

  initialize: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  resetProfile: () => Promise<void>;   // 설정에서 "초기화" 시 사용
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isInitialized: false,

  /** 앱 시작 시 AsyncStorage에서 프로필 로드 (없으면 신규 생성) */
  initialize: async () => {
    try {
      const raw = await AsyncStorage.getItem(PROFILE_KEY);
      if (raw) {
        const saved: UserProfile = JSON.parse(raw);
        set({ user: saved, isLoading: false, isInitialized: true });
      } else {
        // 최초 실행 — 기본 프로필 생성 후 저장
        const profile = makeDefaultProfile();
        await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
        set({ user: profile, isLoading: false, isInitialized: true });
      }
    } catch (err) {
      console.warn('[AuthStore] initialize 오류:', err);
      // 오류 시에도 기본 프로필로 앱 계속 진행
      const profile = makeDefaultProfile();
      set({ user: profile, isLoading: false, isInitialized: true });
    }
  },

  /** 프로필 일부 업데이트 후 AsyncStorage에 저장 */
  updateProfile: async (updates) => {
    const { user } = get();
    if (!user) return;
    const updated: UserProfile = { ...user, ...updates };
    try {
      await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.warn('[AuthStore] updateProfile 저장 오류:', err);
    }
    set({ user: updated });
  },

  /** 프로필 초기화 (설정 화면 "앱 데이터 초기화") */
  resetProfile: async () => {
    try {
      await AsyncStorage.removeItem(PROFILE_KEY);
    } catch { /* ignore */ }
    const profile = makeDefaultProfile();
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    set({ user: profile });
  },
}));
