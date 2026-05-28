import { create } from 'zustand';
import { AgeGroup, TodayActivity } from '@/types';
import { useAuthStore } from '@/stores/authStore';

interface OnboardingState {
  ageGroup: AgeGroup | null;
  job: string;
  todayActivity: TodayActivity | null;
  customActivity: string;
  additionalRequest: string;
  currentStep: number;   // 1~3

  setAgeGroup: (v: AgeGroup | null) => void;
  setJob: (v: string) => void;
  setTodayActivity: (v: TodayActivity | null) => void;
  setCustomActivity: (v: string) => void;
  setAdditionalRequest: (v: string) => void;
  nextStep: () => void;
  prevStep: () => void;
  /** onboarding 완료 — authStore.updateProfile 로 AsyncStorage 저장 */
  saveOnboarding: () => Promise<void>;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  ageGroup: null,
  job: '',
  todayActivity: null,
  customActivity: '',
  additionalRequest: '',
  currentStep: 1,

  setAgeGroup: (ageGroup) => set({ ageGroup }),
  setJob: (job) => set({ job }),
  setTodayActivity: (todayActivity) => set({ todayActivity }),
  setCustomActivity: (customActivity) => set({ customActivity }),
  setAdditionalRequest: (additionalRequest) => set({ additionalRequest }),
  nextStep: () => set((s) => ({ currentStep: Math.min(s.currentStep + 1, 3) })),
  prevStep: () => set((s) => ({ currentStep: Math.max(s.currentStep - 1, 1) })),

  saveOnboarding: async () => {
    const { ageGroup, job, todayActivity, customActivity, additionalRequest } = get();
    const activityText = todayActivity === '기타' ? customActivity : (todayActivity ?? '');

    await useAuthStore.getState().updateProfile({
      age_group: ageGroup ?? undefined,
      job,
      today_activity: activityText || undefined,
      additional_request: additionalRequest || undefined,
      onboarding_completed: true,
    });
  },

  reset: () => set({
    ageGroup: null, job: '', todayActivity: null,
    customActivity: '', additionalRequest: '', currentStep: 1,
  }),
}));
