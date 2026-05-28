// ── 온보딩 ─────────────────────────────────────────
export type AgeGroup = '10대' | '20대' | '30대' | '40대' | '50대 이상';

export type TodayActivity = '등교' | '출근' | '운동' | '데이트' | '기타';

export const TODAY_ACTIVITY_LABELS: Record<TodayActivity, { emoji: string }> = {
  '등교': { emoji: '🎓' },
  '출근': { emoji: '🏢' },
  '운동': { emoji: '🏃' },
  '데이트': { emoji: '💑' },
  '기타': { emoji: '✨' },
};

export interface OnboardingData {
  ageGroup: AgeGroup | null;
  job: string;
  todayActivity: TodayActivity | null;
  customActivity: string;   // '기타' 선택 시 직접 입력
  additionalRequest: string;
}

// ── 사용자 프로필 ───────────────────────────────────
export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  age_group?: string;
  job?: string;
  today_activity?: string;
  additional_request?: string;
  onboarding_completed: boolean;
  subscription_plan: 'free' | 'premium';
  created_at: string;
}

// ── 날씨 ────────────────────────────────────────────
export interface WeatherData {
  city: string;
  temperature: number;
  feels_like: number;
  condition: string;
  condition_code: string;
  humidity: number;
  precipitation_prob: number;
  uv_index?: number;
  wind_speed: number;
  icon: string;
  updated_at: string;
}

// ── 의상(옷장 DB) ────────────────────────────────────
export type ClothingCategory = 'top' | 'bottom' | 'outer' | 'shoes' | 'accessory';

export interface ClothingItem {
  id: string;
  user_id: string;
  image_url: string;
  category: ClothingCategory;
  tags: {
    colors: string[];
    styles: string[];
    materials: string[];
    seasons: string[];
    formality: number;
  };
  wear_count: number;
  last_worn_at?: string;
  created_at: string;
}

export const CATEGORY_LABELS: Record<ClothingCategory, string> = {
  top: '상의', bottom: '하의', outer: '아우터', shoes: '신발', accessory: '악세사리',
};

// ── AI 피드백 결과 ────────────────────────────────────
export interface FeedbackScores {
  color_harmony: number;   // 0~100
  season_fit: number;
  tpo_fit: number;
}

export interface FeedbackItemComments {
  color_harmony: string;
  season_fit: string;
  tpo_fit: string;
}

export interface OutfitFeedback {
  id: string;
  user_id: string;
  photo_url: string;
  overall: 'ok' | 'needs_improvement';
  overall_comment?: string;           // 종합 평가
  scores: FeedbackScores;
  item_comments?: FeedbackItemComments; // 항목별 코멘트
  good_points?: string[];             // 잘된 점
  suggestions: string[];              // 개선 제안
  styling_tips?: string[];            // 스타일링 팁
  outfit_description?: string;
  current_image_url?: string;
  suggestion_image_url?: string;
  image_error?: string;               // 이미지 생성 실패 메시지
  created_at: string;
}

// ── 코디 추천 (recommendation 화면) ──────────────────
export interface SituationInput {
  time_of_day: 'morning' | 'afternoon' | 'evening' | 'all_day';
  situations: string[];
  custom_situation?: string;
}

export interface OutfitRecommendation {
  id: string;
  user_id: string;
  date: string;
  weather_snapshot: WeatherData;
  situation: SituationInput | null;
  recommended_items: Array<{ id: string; image_url: string; category: string; tags: Record<string, unknown> }>;
  reason_text: string;
  styling_tips: string[];
  created_at: string;
}

// ── API 공통 ─────────────────────────────────────────
export interface ApiResponse<T> {
  data?: T;
  error?: string;
}
