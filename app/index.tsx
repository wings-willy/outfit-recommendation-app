import { Redirect } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { View, ActivityIndicator } from 'react-native';
import { colors } from '@/constants/theme';

// 루트 진입점 — 프로필 로드 후 온보딩 완료 여부로만 분기
export default function Index() {
  const { user, isLoading, isInitialized } = useAuthStore();

  if (!isInitialized || isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // 최초 실행(온보딩 미완료) → 온보딩으로
  if (!user?.onboarding_completed) {
    return <Redirect href="/onboarding" />;
  }

  // 이후 모든 실행 → 바로 홈으로
  return <Redirect href="/(main)" />;
}
