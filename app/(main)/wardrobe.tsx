import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/stores/authStore';
import { useWardrobeStore } from '@/stores/wardrobeStore';
import { ClothingCard } from '@/components/ClothingCard';
import { ClothingCategory, CATEGORY_LABELS } from '@/types';
import { colors, typography, spacing, radius, shadow } from '@/constants/theme';

const CATEGORIES: { value: ClothingCategory | 'all'; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'top', label: '상의' },
  { value: 'bottom', label: '하의' },
  { value: 'outer', label: '아우터' },
  { value: 'shoes', label: '신발' },
  { value: 'accessory', label: '악세사리' },
];

export default function WardrobeScreen() {
  const { user } = useAuthStore();
  const { loadItems, addItem, removeItem, setCategory, selectedCategory, getFilteredItems, isLoading } =
    useWardrobeStore();
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadItems(user.id);
    }
  }, [user?.id]);

  const handleAddClothing = async () => {
    Alert.alert('의상 추가', '어떻게 추가할까요?', [
      {
        text: '카메라 촬영',
        onPress: async () => {
          const permission = await ImagePicker.requestCameraPermissionsAsync();
          if (!permission.granted) {
            Alert.alert('권한 필요', '카메라 접근 권한이 필요합니다.');
            return;
          }
          const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [3, 4],
            quality: 0.8,
          });
          if (!result.canceled && user?.id) {
            await handleUpload(result.assets[0].uri);
          }
        },
      },
      {
        text: '갤러리에서 선택',
        onPress: async () => {
          const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (!permission.granted) {
            Alert.alert('권한 필요', '갤러리 접근 권한이 필요합니다.');
            return;
          }
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [3, 4],
            quality: 0.8,
          });
          if (!result.canceled && user?.id) {
            await handleUpload(result.assets[0].uri);
          }
        },
      },
      { text: '취소', style: 'cancel' },
    ]);
  };

  const handleUpload = async (imageUri: string) => {
    if (!user?.id) return;
    setIsAdding(true);
    try {
      await addItem(user.id, imageUri);
      Alert.alert('완료', 'AI가 의상을 분석하여 옷장에 추가했어요! 🎉');
    } catch {
      Alert.alert('오류', '의상 추가에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleLongPress = (itemId: string) => {
    Alert.alert('의상 삭제', '이 의상을 삭제할까요?', [
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => user?.id && removeItem(itemId, user.id),
      },
      { text: '취소', style: 'cancel' },
    ]);
  };

  const filteredItems = getFilteredItems();

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.title}>내 옷장</Text>
        <Text style={styles.itemCount}>{filteredItems.length}벌</Text>
      </View>

      {/* 카테고리 탭 */}
      <FlatList
        horizontal
        data={CATEGORIES}
        keyExtractor={(item) => item.value}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.categoryChip, selectedCategory === item.value && styles.categoryChipSelected]}
            onPress={() => setCategory(item.value)}
          >
            <Text style={[styles.categoryChipText, selectedCategory === item.value && styles.categoryChipTextSelected]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* 의상 그리드 */}
      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>옷장을 불러오는 중...</Text>
        </View>
      ) : filteredItems.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>👕</Text>
          <Text style={styles.emptyTitle}>옷장이 비어있어요</Text>
          <Text style={styles.emptySubtitle}>+ 버튼으로 의상을 추가해보세요</Text>
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <ClothingCard
              item={item}
              onLongPress={() => handleLongPress(item.id)}
            />
          )}
        />
      )}

      {/* 추가 버튼 */}
      <TouchableOpacity
        style={[styles.fab, shadow.lg]}
        onPress={handleAddClothing}
        disabled={isAdding}
      >
        {isAdding ? (
          <ActivityIndicator color={colors.text.inverse} size="small" />
        ) : (
          <Text style={styles.fabText}>+</Text>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  title: {
    ...typography.h2,
  },
  itemCount: {
    ...typography.body,
    color: colors.text.secondary,
  },
  categoryList: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  categoryChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  categoryChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryChipText: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  categoryChipTextSelected: {
    color: colors.text.inverse,
  },
  gridRow: {
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  grid: {
    paddingBottom: 100,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  loadingText: {
    ...typography.body,
    color: colors.text.secondary,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  emptyEmoji: {
    fontSize: 56,
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.text.primary,
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.text.secondary,
  },
  fab: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.xl,
    width: 60,
    height: 60,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabText: {
    fontSize: 32,
    color: colors.text.inverse,
    lineHeight: 36,
  },
});
