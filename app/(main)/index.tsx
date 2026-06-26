import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, RefreshControl, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/authStore';
import { useWeatherStore } from '@/stores/weatherStore';
import { WeatherCard } from '@/components/WeatherCard';
import { colors, typography, spacing, radius, shadow } from '@/constants/theme';

export default function HomeScreen() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { weather, isLoading: weatherLoading, fetchWeatherByLocation } = useWeatherStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchWeatherByLocation(); }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchWeatherByLocation();
    setRefreshing(false);
  };

  const activityText = user?.today_activity
    ? t('home.todayActivity', { activity: t(`activities.${user.today_activity}` as any) })
    : null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* 헤더 */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{t('home.greeting')}</Text>
            <Text style={styles.subGreeting}>
              {activityText ?? t('home.defaultActivity')}
            </Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(main)/settings')} style={styles.settingsBtn}>
            <Text style={{ fontSize: 22 }}>⚙️</Text>
          </TouchableOpacity>
        </View>

        {/* 날씨 카드 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('home.weatherTitle')}</Text>
          {weatherLoading ? (
            <View style={styles.weatherSkeleton}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.skeletonText}>{t('home.weatherLoading')}</Text>
            </View>
          ) : weather ? (
            <WeatherCard weather={weather} />
          ) : (
            <TouchableOpacity style={styles.weatherError} onPress={fetchWeatherByLocation}>
              <Text style={styles.weatherErrorText}>{t('home.weatherError')}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 메인 CTA */}
        <View style={styles.ctaSection}>
          <TouchableOpacity
            style={[styles.mainCta, shadow.lg]}
            onPress={() => router.push('/(main)/feedback')}
            activeOpacity={0.85}
          >
            <Text style={styles.mainCtaEmoji}>📸</Text>
            <View style={styles.mainCtaText}>
              <Text style={styles.mainCtaTitle}>{t('home.mainCtaTitle')}</Text>
              <Text style={styles.mainCtaSub}>{t('home.mainCtaSub')}</Text>
            </View>
            <Text style={styles.mainCtaArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.subCta, shadow.sm]}
            onPress={() => router.push('/(main)/wardrobe')}
            activeOpacity={0.85}
          >
            <Text style={styles.subCtaEmoji}>👔</Text>
            <View style={styles.subCtaText}>
              <Text style={styles.subCtaTitle}>{t('home.wardrobeCtaTitle')}</Text>
              <Text style={styles.subCtaSub}>{t('home.wardrobeCtaSub')}</Text>
            </View>
            <Text style={styles.subCtaArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* 사용 팁 */}
        <View style={styles.tipBox}>
          <Text style={styles.tipTitle}>{t('home.tipTitle')}</Text>
          <Text style={styles.tipText}>{t('home.tipText')}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: spacing.xl,
  },
  greeting: { ...typography.h2, marginBottom: spacing.xs },
  subGreeting: { ...typography.body, color: colors.text.secondary },
  settingsBtn: {
    width: 44, height: 44, borderRadius: radius.full,
    backgroundColor: colors.surface, alignItems: 'center',
    justifyContent: 'center', ...shadow.sm,
  },
  section: { marginBottom: spacing.xl },
  sectionTitle: { ...typography.h3, marginBottom: spacing.md },
  weatherSkeleton: {
    height: 120, backgroundColor: colors.surface, borderRadius: radius.xl,
    alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
  },
  skeletonText: { ...typography.body, color: colors.text.tertiary },
  weatherError: {
    height: 80, backgroundColor: colors.surface, borderRadius: radius.xl,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed',
  },
  weatherErrorText: { ...typography.bodySmall, color: colors.text.tertiary },
  ctaSection: { gap: spacing.md, marginBottom: spacing.xl },
  // 메인 CTA — 큰 카드
  mainCta: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.primary, borderRadius: radius.xl,
    padding: spacing.lg, gap: spacing.md,
  },
  mainCtaEmoji: { fontSize: 36 },
  mainCtaText: { flex: 1 },
  mainCtaTitle: { ...typography.h3, color: colors.text.inverse, marginBottom: 2 },
  mainCtaSub: { ...typography.bodySmall, color: 'rgba(255,255,255,0.7)' },
  mainCtaArrow: { fontSize: 28, color: 'rgba(255,255,255,0.6)' },
  // 보조 CTA — 작은 카드
  subCta: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: radius.xl,
    padding: spacing.lg, gap: spacing.md,
    borderWidth: 1.5, borderColor: colors.border,
  },
  subCtaEmoji: { fontSize: 28 },
  subCtaText: { flex: 1 },
  subCtaTitle: { ...typography.body, fontWeight: '700', color: colors.text.primary, marginBottom: 2 },
  subCtaSub: { ...typography.bodySmall, color: colors.text.secondary },
  subCtaArrow: { fontSize: 24, color: colors.text.tertiary },
  tipBox: {
    backgroundColor: colors.accentLight,
    borderRadius: radius.xl, padding: spacing.lg,
  },
  tipTitle: { ...typography.bodySmall, fontWeight: '700', color: colors.accent, marginBottom: spacing.sm },
  tipText: { ...typography.bodySmall, color: colors.text.secondary, lineHeight: 22 },
});
