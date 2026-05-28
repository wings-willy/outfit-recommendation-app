import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/stores/authStore';
import { useWardrobeStore } from '@/stores/wardrobeStore';
import { useWeatherStore } from '@/stores/weatherStore';
import { api } from '@/services/api';
import { Button } from '@/components/Button';
import { ClothingCard } from '@/components/ClothingCard';
import { OutfitRecommendation, SituationInput } from '@/types';
import { colors, typography, spacing, radius, shadow } from '@/constants/theme';

export default function RecommendationScreen() {
  const { situation: situationParam } = useLocalSearchParams<{ situation?: string }>();
  const { user } = useAuthStore();
  const { items, loadItems } = useWardrobeStore();
  const { weather } = useWeatherStore();

  const [recommendations, setRecommendations] = useState<OutfitRecommendation[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const situation: SituationInput | null = situationParam
    ? JSON.parse(situationParam)
    : null;

  useEffect(() => {
    if (user?.id && items.length === 0) {
      loadItems(user.id);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user && weather) {
      fetchRecommendations();
    }
  }, [user, weather]);

  const fetchRecommendations = async () => {
    if (!user || !weather) return;
    setIsLoading(true);
    try {
      const result = await api.post('/api/v1/recommendation/generate', {
        user_id: user.id,
        weather,
        situation,
        clothing_items: items,
        user_profile: {
          age_group: user.age_group,
        },
      });
      setRecommendations(result.recommendations || []);
    } catch {
      // Mock 추천으로 폴백
      setRecommendations(getMockRecommendations());
    } finally {
      setIsLoading(false);
    }
  };

  const activeRec = recommendations[activeIndex];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>✨ 오늘의 코디 추천</Text>

        {weather && (
          <View style={styles.contextBadge}>
            <Text style={styles.contextText}>
              {weather.temperature}° · {weather.condition}
              {situation?.situations.length ? ` · ${situation.situations.slice(0, 2).join(', ')}` : ''}
            </Text>
          </View>
        )}

        {isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingTitle}>AI가 코디를 분석 중이에요...</Text>
            <Text style={styles.loadingSubtitle}>날씨와 일정을 고려한 최적 조합을 찾고 있어요</Text>
          </View>
        ) : recommendations.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🤔</Text>
            <Text style={styles.emptyTitle}>추천할 의상이 없어요</Text>
            <Text style={styles.emptySubtitle}>옷장에 의상을 먼저 등록해주세요</Text>
            <Button title="옷장으로 가기" onPress={() => {}} variant="secondary" style={styles.emptyButton} />
          </View>
        ) : (
          <>
            {/* 메인 추천 카드 */}
            {activeRec && (
              <View style={[styles.recCard, shadow.md]}>
                <View style={styles.recHeader}>
                  <Text style={styles.recBadge}>
                    {activeIndex === 0 ? '⭐ 메인 추천' : `대안 ${activeIndex}`}
                  </Text>
                </View>

                {/* 의상 아이템 조합 */}
                <View style={styles.itemsRow}>
                  {(activeRec.recommended_items || []).slice(0, 4).map((item: { id: string; image_url: string }) => (
                    <Image
                      key={item.id}
                      source={{ uri: item.image_url }}
                      style={styles.itemImage}
                    />
                  ))}
                </View>

                {/* 추천 이유 */}
                <View style={styles.reasonBox}>
                  <Text style={styles.reasonTitle}>추천 이유</Text>
                  <Text style={styles.reasonText}>{activeRec.reason_text}</Text>
                </View>

                {/* 스타일링 팁 */}
                {activeRec.styling_tips?.length > 0 && (
                  <View style={styles.tipsBox}>
                    <Text style={styles.tipsTitle}>💡 스타일링 팁</Text>
                    {activeRec.styling_tips.map((tip: string, i: number) => (
                      <Text key={i} style={styles.tipItem}>• {tip}</Text>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* 대안 추천 탭 */}
            {recommendations.length > 1 && (
              <View style={styles.altRow}>
                {recommendations.map((_, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[styles.altDot, i === activeIndex && styles.altDotActive]}
                    onPress={() => setActiveIndex(i)}
                  >
                    <Text style={[styles.altDotText, i === activeIndex && styles.altDotTextActive]}>
                      {i === 0 ? '메인' : `대안 ${i}`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* 액션 버튼 */}
            <View style={styles.actions}>
              <Button title="📸 내가 고른 옷 평가받기" onPress={() => {}} variant="secondary" />
              <Button title="🔄 다시 추천받기" onPress={fetchRecommendations} variant="ghost" />
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// Mock 추천 데이터
function getMockRecommendations(): OutfitRecommendation[] {
  return [
    {
      id: 'mock-rec-1',
      user_id: 'mock',
      date: new Date().toISOString(),
      weather_snapshot: {
        city: '서울',
        temperature: 18,
        feels_like: 16,
        condition: '구름 조금',
        condition_code: '801',
        humidity: 60,
        precipitation_prob: 20,
        wind_speed: 2.5,
        icon: '02d',
        updated_at: new Date().toISOString(),
      },
      situation: { time_of_day: 'all_day', situations: ['work'] },
      recommended_items: [],
      reason_text: '오늘 기온 18도에 오후 미팅이 있으니 네이비 재킷에 흰 티셔츠 코디가 깔끔하고 적합해요. 약한 강수 가능성이 있으니 가벼운 아우터를 준비하세요.',
      styling_tips: [
        '재킷 소매를 살짝 걷으면 더 캐주얼한 느낌이 나요',
        '흰 운동화로 가볍게 마무리해보세요',
      ],
      created_at: new Date().toISOString(),
    },
  ];
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  title: {
    ...typography.h2,
    marginBottom: spacing.md,
  },
  contextBadge: {
    backgroundColor: colors.accentLight,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    alignSelf: 'flex-start',
    marginBottom: spacing.lg,
  },
  contextText: {
    ...typography.bodySmall,
    color: colors.accent,
    fontWeight: '600',
  },
  loading: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  loadingTitle: {
    ...typography.h3,
    marginTop: spacing.md,
  },
  loadingSubtitle: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  empty: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyEmoji: { fontSize: 56 },
  emptyTitle: { ...typography.h3 },
  emptySubtitle: { ...typography.body, color: colors.text.secondary },
  emptyButton: { marginTop: spacing.md, width: '60%' },
  recCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  recHeader: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  recBadge: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.accent,
  },
  itemsRow: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.sm,
    minHeight: 140,
    backgroundColor: colors.background,
  },
  itemImage: {
    flex: 1,
    height: 140,
    borderRadius: radius.md,
    backgroundColor: colors.border,
  },
  reasonBox: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  reasonTitle: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  reasonText: {
    ...typography.body,
    color: colors.text.secondary,
    lineHeight: 22,
  },
  tipsBox: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  tipsTitle: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  tipItem: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  altRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  altDot: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  altDotActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  altDotText: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  altDotTextActive: {
    color: colors.text.inverse,
  },
  actions: {
    gap: spacing.sm,
  },
});
