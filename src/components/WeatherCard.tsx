import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WeatherData } from '@/types';
import { colors, typography, spacing, radius } from '@/constants/theme';

interface WeatherCardProps {
  weather: WeatherData;
}

// 날씨 아이콘 코드 → 이모지 변환
function getWeatherEmoji(iconCode: string): string {
  const code = iconCode.replace('n', 'd'); // 야간 → 주간으로 통일
  const map: Record<string, string> = {
    '01d': '☀️', '02d': '⛅', '03d': '🌥️', '04d': '☁️',
    '09d': '🌧️', '10d': '🌦️', '11d': '⛈️', '13d': '❄️', '50d': '🌫️',
  };
  return map[code] || '🌤️';
}

export function WeatherCard({ weather }: WeatherCardProps) {
  const emoji = getWeatherEmoji(weather.icon);

  return (
    <View style={styles.card}>
      <View style={styles.mainRow}>
        <Text style={styles.emoji}>{emoji}</Text>
        <View style={styles.tempContainer}>
          <Text style={styles.temperature}>{weather.temperature}°</Text>
          <Text style={styles.city}>{weather.city}</Text>
        </View>
        <View style={styles.detailsRight}>
          <Text style={styles.condition}>{weather.condition}</Text>
          <Text style={styles.feelsLike}>체감 {weather.feels_like}°</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statEmoji}>💧</Text>
          <Text style={styles.statValue}>{weather.humidity}%</Text>
          <Text style={styles.statLabel}>습도</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statEmoji}>☔</Text>
          <Text style={styles.statValue}>{weather.precipitation_prob}%</Text>
          <Text style={styles.statLabel}>강수확률</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statEmoji}>💨</Text>
          <Text style={styles.statValue}>{weather.wind_speed}m/s</Text>
          <Text style={styles.statLabel}>풍속</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  emoji: {
    fontSize: 48,
    marginRight: spacing.md,
  },
  tempContainer: {
    flex: 1,
  },
  temperature: {
    fontSize: 42,
    fontWeight: '700',
    color: colors.text.primary,
    lineHeight: 48,
  },
  city: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  detailsRight: {
    alignItems: 'flex-end',
  },
  condition: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text.primary,
  },
  feelsLike: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  stat: {
    alignItems: 'center',
    flex: 1,
  },
  statEmoji: {
    fontSize: 16,
    marginBottom: spacing.xs,
  },
  statValue: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.text.primary,
  },
  statLabel: {
    fontSize: 11,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
});
