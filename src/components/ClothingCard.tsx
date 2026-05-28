import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { ClothingItem, CATEGORY_LABELS } from '@/types';
import { colors, typography, spacing, radius, shadow } from '@/constants/theme';

interface ClothingCardProps {
  item: ClothingItem;
  onPress?: () => void;
  onLongPress?: () => void;
  size?: 'sm' | 'md';
}

export function ClothingCard({ item, onPress, onLongPress, size = 'md' }: ClothingCardProps) {
  const isSmall = size === 'sm';

  return (
    <TouchableOpacity
      style={[styles.card, isSmall && styles.cardSmall, shadow.sm]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.85}
    >
      <Image
        source={{ uri: item.image_url }}
        style={[styles.image, isSmall && styles.imageSmall]}
        resizeMode="cover"
      />
      <View style={styles.info}>
        <Text style={styles.category}>{CATEGORY_LABELS[item.category]}</Text>
        {item.tags.colors.length > 0 && (
          <Text style={styles.tags} numberOfLines={1}>
            {item.tags.colors.join(' · ')}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    width: '47%',
    marginBottom: spacing.md,
  },
  cardSmall: {
    width: 100,
    marginBottom: 0,
  },
  image: {
    width: '100%',
    aspectRatio: 3 / 4,
    backgroundColor: colors.background,
  },
  imageSmall: {
    height: 120,
    aspectRatio: undefined,
  },
  info: {
    padding: spacing.sm,
  },
  category: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.text.primary,
  },
  tags: {
    fontSize: 11,
    color: colors.text.tertiary,
    marginTop: 2,
  },
});
