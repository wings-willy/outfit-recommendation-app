import { supabase } from './supabase';
import { api } from './api';
import { ClothingItem, ClothingCategory } from '@/types';

// 의상 목록 조회
export async function getClothingItems(userId: string): Promise<ClothingItem[]> {
  const { data, error } = await supabase
    .from('clothing_items')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

// 카테고리별 의상 조회
export async function getClothingByCategory(
  userId: string,
  category: ClothingCategory
): Promise<ClothingItem[]> {
  const { data, error } = await supabase
    .from('clothing_items')
    .select('*')
    .eq('user_id', userId)
    .eq('category', category)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

// 이미지를 Supabase Storage에 업로드
export async function uploadClothingImage(
  userId: string,
  imageUri: string,
  fileName: string
): Promise<string> {
  const response = await fetch(imageUri);
  const blob = await response.blob();

  const filePath = `${userId}/${fileName}`;

  const { error } = await supabase.storage
    .from('clothing-images')
    .upload(filePath, blob, {
      contentType: 'image/jpeg',
      upsert: false,
    });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from('clothing-images').getPublicUrl(filePath);
  return data.publicUrl;
}

// AI 태깅 요청 후 의상 저장
export async function addClothingItem(
  userId: string,
  imageUri: string
): Promise<ClothingItem> {
  const fileName = `clothing_${Date.now()}.jpg`;

  // 이미지 업로드
  const imageUrl = await uploadClothingImage(userId, imageUri, fileName);

  // 백엔드 API로 AI 태깅 요청
  const taggingResult = await api.post('/api/v1/clothing/analyze', {
    image_url: imageUrl,
    user_id: userId,
  });

  // Supabase에 의상 저장
  const { data, error } = await supabase
    .from('clothing_items')
    .insert({
      user_id: userId,
      image_url: imageUrl,
      category: taggingResult.category,
      tags: {
        colors: taggingResult.colors,
        styles: taggingResult.style,
        materials: [taggingResult.material_guess],
        seasons: taggingResult.season,
        formality: taggingResult.formality,
      },
      ai_tags: taggingResult,
      wear_count: 0,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// 의상 삭제
export async function deleteClothingItem(itemId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('clothing_items')
    .delete()
    .eq('id', itemId)
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
}

// 착용 횟수 증가
export async function incrementWearCount(itemId: string): Promise<void> {
  const { error } = await supabase.rpc('increment_wear_count', { item_id: itemId });
  if (error) throw new Error(error.message);
}

// Mock 의상 데이터 (테스트용)
export function getMockClothingItems(userId: string): ClothingItem[] {
  return [
    {
      id: 'mock-1',
      user_id: userId,
      image_url: 'https://via.placeholder.com/200x250?text=흰색+티셔츠',
      category: 'top',
      tags: { colors: ['white'], styles: ['casual', 'basic'], materials: ['cotton'], seasons: ['spring', 'summer', 'fall'], formality: 2 },
      wear_count: 5,
      created_at: new Date().toISOString(),
    },
    {
      id: 'mock-2',
      user_id: userId,
      image_url: 'https://via.placeholder.com/200x250?text=청바지',
      category: 'bottom',
      tags: { colors: ['blue'], styles: ['casual'], materials: ['denim'], seasons: ['spring', 'fall'], formality: 2 },
      wear_count: 8,
      created_at: new Date().toISOString(),
    },
    {
      id: 'mock-3',
      user_id: userId,
      image_url: 'https://via.placeholder.com/200x250?text=네이비+재킷',
      category: 'outer',
      tags: { colors: ['navy'], styles: ['office', 'classic'], materials: ['polyester'], seasons: ['spring', 'fall'], formality: 4 },
      wear_count: 3,
      created_at: new Date().toISOString(),
    },
  ];
}
