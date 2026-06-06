import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image,
  TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/stores/authStore';
import { useWeatherStore } from '@/stores/weatherStore';
import { useWardrobeStore } from '@/stores/wardrobeStore';
import { api } from '@/services/api';
import { Button } from '@/components/Button';
import { OutfitFeedback } from '@/types';
import { colors, typography, spacing, radius, shadow } from '@/constants/theme';

// ── 점수 바 ───────────────────────────────────────────
function ScoreBar({ label, score }: { label: string; score: number }) {
  const barColor = score >= 80 ? colors.success : score >= 60 ? colors.warning : colors.error;
  return (
    <View style={score_s.wrap}>
      <View style={score_s.row}>
        <Text style={score_s.label}>{label}</Text>
        <Text style={[score_s.val, { color: barColor }]}>{score}</Text>
      </View>
      <View style={score_s.bg}>
        <View style={[score_s.fill, { width: `${score}%`, backgroundColor: barColor }]} />
      </View>
    </View>
  );
}
const score_s = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  label: { ...typography.bodySmall, fontWeight: '600', color: colors.text.primary },
  val: { ...typography.bodySmall, fontWeight: '700' },
  bg: { height: 8, backgroundColor: colors.border, borderRadius: radius.full },
  fill: { height: 8, borderRadius: radius.full },
});

// ── AI 이미지 (로딩 스피너 / 실패 상태 포함) ────────────
function DalleImage({ uri, failed }: { uri?: string; failed?: boolean }) {
  const [loading, setLoading] = useState(true);

  if (failed || !uri) {
    return (
      <View style={di.placeholder}>
        <Text style={di.placeholderEmoji}>🖼️</Text>
        <Text style={di.placeholderText}>{failed ? '생성 실패' : '생성 중…'}</Text>
      </View>
    );
  }
  return (
    <View style={di.wrap}>
      {loading && (
        <View style={di.spinner}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={di.spinnerText}>불러오는 중</Text>
        </View>
      )}
      <Image
        source={{ uri }}
        style={di.img}
        resizeMode="cover"
        onLoad={() => setLoading(false)}
        onError={() => setLoading(false)}
      />
    </View>
  );
}
const di = StyleSheet.create({
  wrap: { position: 'relative' },
  img: { width: '100%', aspectRatio: 1, borderRadius: radius.lg },
  spinner: {
    position: 'absolute', inset: 0, zIndex: 1,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.surface, borderRadius: radius.lg, gap: 4,
  },
  spinnerText: { ...typography.caption, color: colors.text.tertiary },
  placeholder: {
    width: '100%', aspectRatio: 1, borderRadius: radius.lg,
    backgroundColor: colors.surface, alignItems: 'center',
    justifyContent: 'center', gap: spacing.xs,
    borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed',
  },
  placeholderEmoji: { fontSize: 28 },
  placeholderText: { ...typography.caption, color: colors.text.tertiary },
});

// ── 단계 타입 ─────────────────────────────────────────
type Phase = 'pick' | 'preview' | 'analyzing' | 'result';

export default function FeedbackScreen() {
  const { user } = useAuthStore();
  const { weather } = useWeatherStore();
  const { items } = useWardrobeStore();

  const [phase, setPhase] = useState<Phase>('pick');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<OutfitFeedback | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  // ── 사진 선택 (자르기 없이) ──────────────────────────
  const pickPhoto = async (fromCamera: boolean) => {
    if (fromCamera) {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) { Alert.alert('권한 필요', '카메라 접근 권한이 필요합니다.'); return; }
      const res = await ImagePicker.launchCameraAsync({
        allowsEditing: false,   // 네이티브 "자르기" UI 제거
        quality: 0.85,
      });
      if (!res.canceled) { setPhotoUri(res.assets[0].uri); setPhase('preview'); }
    } else {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) { Alert.alert('권한 필요', '갤러리 접근 권한이 필요합니다.'); return; }
      const res = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: false,   // 네이티브 "자르기" UI 제거
        quality: 0.85,
      });
      if (!res.canceled) { setPhotoUri(res.assets[0].uri); setPhase('preview'); }
    }
  };

  const showPickerAlert = () => {
    Alert.alert('사진 선택', '착장 사진을 어떻게 가져올까요?', [
      { text: '📷 카메라 촬영', onPress: () => pickPhoto(true) },
      { text: '🖼️ 갤러리에서 선택', onPress: () => pickPhoto(false) },
      { text: '취소', style: 'cancel' },
    ]);
  };

  // ── AI 분석 시작 ──────────────────────────────────
  const analyze = async () => {
    if (!photoUri || !user) return;
    setPhase('analyzing');
    setApiError(null);
    try {
      // 로컬 file:// URI → base64 변환
      const base64 = await FileSystem.readAsStringAsync(photoUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const result: OutfitFeedback = await api.post('/api/v1/feedback/analyze', {
        photo_url: photoUri,
        photo_base64: base64,
        photo_mime_type: 'image/jpeg',
        user_id: user.id,
        weather_context: weather,
        user_context: {
          age_group: user.age_group,
          job: user.job,
          today_activity: user.today_activity,
          additional_request: user.additional_request,
        },
        wardrobe_items: items.slice(0, 10),
      });
      setFeedback(result);
      setPhase('result');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '알 수 없는 오류';
      setApiError(message);
      setPhase('preview');   // 미리보기로 돌아가 오류 표시
    }
  };

  const reset = () => { setPhotoUri(null); setFeedback(null); setPhase('pick'); setApiError(null); };

  // ── 렌더 ─────────────────────────────────────────
  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* PHASE: pick */}
        {phase === 'pick' && (
          <>
            <Text style={s.title}>📸 오늘 옷 평가받기</Text>
            <TouchableOpacity style={[s.photoArea, shadow.sm]} onPress={showPickerAlert}>
              <Text style={s.cameraEmoji}>📷</Text>
              <Text style={s.cameraLabel}>탭하여 착장 사진 추가</Text>
              <Text style={s.cameraSub}>카메라 촬영 또는 갤러리 업로드</Text>
            </TouchableOpacity>
            {(weather || user?.today_activity) && (
              <View style={s.contextBox}>
                <Text style={s.contextTitle}>분석에 반영될 정보</Text>
                {weather && (
                  <Text style={s.contextItem}>🌤 {weather.temperature}° {weather.condition} · 강수 {weather.precipitation_prob}%</Text>
                )}
                {user?.today_activity && (
                  <Text style={s.contextItem}>📍 오늘 활동: {user.today_activity}</Text>
                )}
                {user?.additional_request && (
                  <Text style={s.contextItem}>💬 요청: {user.additional_request}</Text>
                )}
              </View>
            )}
          </>
        )}

        {/* PHASE: preview — 사진 확인 화면 ("확인" 버튼 포함) */}
        {phase === 'preview' && photoUri && (
          <>
            {/* 상단 헤더: 다시 선택 ← | → 확인 */}
            <View style={s.previewHeader}>
              <TouchableOpacity onPress={showPickerAlert} style={s.previewHeaderBtn}>
                <Text style={s.previewHeaderBack}>← 다시 선택</Text>
              </TouchableOpacity>
              <Text style={s.previewTitle}>사진 확인</Text>
              <TouchableOpacity onPress={analyze} style={s.previewHeaderBtn}>
                <Text style={s.previewConfirm}>확인</Text>
              </TouchableOpacity>
            </View>

            <Image source={{ uri: photoUri }} style={[s.photo, shadow.md]} resizeMode="cover" />

            {/* 오류 메시지 */}
            {apiError && (
              <View style={s.errorBox}>
                <Text style={s.errorText}>⚠️ {apiError}</Text>
              </View>
            )}

            {/* 하단 버튼 */}
            <View style={s.readyBtns}>
              <Button title="다시 선택" onPress={showPickerAlert} variant="secondary" style={s.btnHalf} />
              <Button title="AI 분석 시작 ✨" onPress={analyze} style={s.btnHalf} />
            </View>
          </>
        )}

        {/* PHASE: analyzing */}
        {phase === 'analyzing' && (
          <View style={s.analyzing}>
            {photoUri && <Image source={{ uri: photoUri }} style={[s.photo, s.photoFade]} resizeMode="cover" />}
            <View style={s.analyzingOverlay}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={s.analyzingTitle}>AI가 분석 중이에요…</Text>
              <Text style={s.analyzingDesc}>날씨·활동·요청사항을 종합하고 있어요</Text>
            </View>
          </View>
        )}

        {/* PHASE: result */}
        {phase === 'result' && feedback && (
          <ResultView feedback={feedback} photoUri={photoUri} onRetry={reset} />
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

// ── 결과 화면 ─────────────────────────────────────────
function ResultView({
  feedback, photoUri, onRetry,
}: { feedback: OutfitFeedback; photoUri: string | null; onRetry: () => void }) {
  const isOk = feedback.overall === 'ok';
  const badgeColor = isOk ? colors.success : colors.warning;
  const avgScore = Math.round(
    (feedback.scores.color_harmony + feedback.scores.season_fit + feedback.scores.tpo_fit) / 3
  );
  const hasImages = !!(feedback.current_image_url || feedback.suggestion_image_url);

  return (
    <View style={r.wrap}>
      {/* ① 착장 사진 + 종합 뱃지 */}
      {photoUri && (
        <View style={r.photoWrap}>
          <Image source={{ uri: photoUri }} style={r.photo} resizeMode="cover" />
          <View style={[r.badge, { backgroundColor: badgeColor }]}>
            <Text style={r.badgeText}>{isOk ? '✅ 오늘 코디 완벽!' : '⚠️ 수정 제안 있어요'}</Text>
          </View>
        </View>
      )}

      {/* ② 종합 평가 */}
      {!!feedback.overall_comment && (
        <View style={[r.card, shadow.sm]}>
          <Text style={r.cardTitle}>🧑‍💼 AI 종합 평가</Text>
          <Text style={r.overallComment}>{feedback.overall_comment}</Text>
        </View>
      )}

      {/* ③ 항목별 점수 + 코멘트 */}
      <View style={[r.card, shadow.sm]}>
        <View style={r.scoreHeader}>
          <Text style={r.cardTitle}>📊 항목별 점수</Text>
          <Text style={[r.avgScore, { color: badgeColor }]}>평균 {avgScore}점</Text>
        </View>
        <ScoreBar label="색상 조화" score={feedback.scores.color_harmony} />
        {!!feedback.item_comments?.color_harmony && (
          <Text style={r.itemComment}>{feedback.item_comments.color_harmony}</Text>
        )}
        <ScoreBar label="계절감" score={feedback.scores.season_fit} />
        {!!feedback.item_comments?.season_fit && (
          <Text style={r.itemComment}>{feedback.item_comments.season_fit}</Text>
        )}
        <ScoreBar label="TPO 적합성" score={feedback.scores.tpo_fit} />
        {!!feedback.item_comments?.tpo_fit && (
          <Text style={r.itemComment}>{feedback.item_comments.tpo_fit}</Text>
        )}
      </View>

      {/* ④ 잘된 점 */}
      {(feedback.good_points?.length ?? 0) > 0 && (
        <View style={[r.card, shadow.sm]}>
          <Text style={r.cardTitle}>✅ 잘된 점</Text>
          {feedback.good_points!.map((pt, i) => (
            <View key={i} style={r.listRow}>
              <Text style={[r.bullet, { color: colors.success }]}>✓</Text>
              <Text style={r.listText}>{pt}</Text>
            </View>
          ))}
        </View>
      )}

      {/* ⑤ 개선 제안 */}
      {feedback.suggestions.length > 0 && (
        <View style={[r.card, shadow.sm]}>
          <Text style={r.cardTitle}>💡 개선 포인트</Text>
          {feedback.suggestions.map((sg, i) => (
            <View key={i} style={r.listRow}>
              <Text style={[r.bullet, { color: colors.accent }]}>•</Text>
              <Text style={r.listText}>{sg}</Text>
            </View>
          ))}
        </View>
      )}

      {/* ⑥ 스타일링 팁 */}
      {(feedback.styling_tips?.length ?? 0) > 0 && (
        <View style={[r.card, { ...shadow.sm, backgroundColor: colors.accentLight }]}>
          <Text style={[r.cardTitle, { color: colors.accent }]}>✨ 스타일링 팁</Text>
          {feedback.styling_tips!.map((tip, i) => (
            <View key={i} style={r.listRow}>
              <Text style={[r.bullet, { color: colors.accent }]}>{i + 1}.</Text>
              <Text style={[r.listText, { color: colors.text.secondary }]}>{tip}</Text>
            </View>
          ))}
        </View>
      )}

      {/* ⑦ AI 생성 이미지 2장 */}
      <View style={[r.card, shadow.sm]}>
        <Text style={r.cardTitle}>🎨 AI 생성 이미지</Text>
        {feedback.image_error && !hasImages ? (
          <View style={r.imageError}>
            <Text style={r.imageErrorEmoji}>🖼️</Text>
            <Text style={r.imageErrorText}>{feedback.image_error}</Text>
          </View>
        ) : (
          <>
            <Text style={r.dalleSubtitle}>현재 착장과 AI 수정 제안을 시각화했어요</Text>
            <View style={r.dalleRow}>
              <View style={r.dalleCol}>
                <Text style={r.dalleLabel}>현재 착장</Text>
                <DalleImage uri={feedback.current_image_url} failed={!feedback.current_image_url} />
              </View>
              <View style={r.dalleCol}>
                <Text style={r.dalleLabel}>수정 제안</Text>
                <DalleImage uri={feedback.suggestion_image_url} failed={!feedback.suggestion_image_url} />
              </View>
            </View>
            <Text style={r.dalleCaption}>Gemini로 생성된 참고 이미지입니다</Text>
          </>
        )}
      </View>

      <Button title="다시 평가받기" onPress={onRetry} variant="secondary" />
    </View>
  );
}

// ── 스타일 ────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  title: { ...typography.h2, marginBottom: spacing.xl },
  photoArea: {
    width: '100%', aspectRatio: 3 / 4, borderRadius: radius.xl,
    backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.border, borderStyle: 'dashed',
    gap: spacing.sm, marginBottom: spacing.lg,
  },
  cameraEmoji: { fontSize: 52 },
  cameraLabel: { ...typography.body, fontWeight: '600', color: colors.text.primary },
  cameraSub: { ...typography.bodySmall, color: colors.text.tertiary },
  contextBox: {
    backgroundColor: colors.accentLight, borderRadius: radius.xl,
    padding: spacing.md, gap: spacing.xs,
  },
  contextTitle: { ...typography.bodySmall, fontWeight: '700', color: colors.accent, marginBottom: spacing.xs },
  contextItem: { ...typography.bodySmall, color: colors.text.secondary },

  // 사진 확인(preview) 헤더
  previewHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  previewHeaderBtn: { minWidth: 80 },
  previewHeaderBack: { ...typography.body, color: colors.text.secondary },
  previewTitle: { ...typography.h3 },
  previewConfirm: {
    ...typography.body, fontWeight: '700', color: colors.primary, textAlign: 'right',
  },

  photo: { width: '100%', aspectRatio: 3 / 4, borderRadius: radius.xl, marginBottom: spacing.lg },
  photoFade: { opacity: 0.4 },
  readyBtns: { flexDirection: 'row', gap: spacing.md },
  btnHalf: { flex: 1 },
  errorBox: {
    backgroundColor: '#FFF3CD', borderRadius: radius.lg, padding: spacing.md,
    marginBottom: spacing.md, borderWidth: 1, borderColor: '#FFC107',
  },
  errorText: { ...typography.bodySmall, color: '#856404' },
  analyzing: { alignItems: 'center', position: 'relative', marginBottom: spacing.lg },
  analyzingOverlay: {
    position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
  },
  analyzingTitle: { ...typography.h3, color: colors.primary },
  analyzingDesc: { ...typography.bodySmall, color: colors.text.secondary },
});

const r = StyleSheet.create({
  wrap: { gap: spacing.md },
  photoWrap: { position: 'relative', borderRadius: radius.xl, overflow: 'hidden', marginBottom: spacing.sm },
  photo: { width: '100%', aspectRatio: 3 / 4 },
  badge: {
    position: 'absolute', bottom: spacing.md, left: spacing.md, right: spacing.md,
    borderRadius: radius.full, paddingVertical: spacing.sm, alignItems: 'center',
  },
  badgeText: { ...typography.body, fontWeight: '700', color: '#fff' },
  card: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg },
  scoreHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  cardTitle: { ...typography.h3 },
  avgScore: { ...typography.h3, fontWeight: '700' },
  overallComment: { ...typography.body, color: colors.text.secondary, lineHeight: 24, marginTop: spacing.sm },
  itemComment: {
    ...typography.bodySmall, color: colors.text.tertiary,
    marginBottom: spacing.md, marginLeft: spacing.sm, fontStyle: 'italic',
  },
  listRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  bullet: { ...typography.body, fontWeight: '700', marginTop: 1 },
  listText: { ...typography.body, color: colors.text.secondary, flex: 1, lineHeight: 22 },
  imageError: { alignItems: 'center', paddingVertical: spacing.lg, gap: spacing.sm },
  imageErrorEmoji: { fontSize: 36 },
  imageErrorText: { ...typography.bodySmall, color: colors.text.tertiary, textAlign: 'center' },
  dalleSubtitle: { ...typography.bodySmall, color: colors.text.secondary, marginBottom: spacing.md },
  dalleRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  dalleCol: { flex: 1, gap: spacing.xs },
  dalleLabel: {
    ...typography.caption, fontWeight: '700', color: colors.text.secondary,
    textAlign: 'center', marginBottom: spacing.xs,
  },
  dalleCaption: { ...typography.caption, color: colors.text.tertiary, textAlign: 'center', marginTop: spacing.xs },
});
