import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image,
  TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
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
type Phase = 'pick' | 'ready' | 'analyzing' | 'result';

export default function FeedbackScreen() {
  const { user } = useAuthStore();
  const { weather } = useWeatherStore();
  const { items } = useWardrobeStore();

  const [phase, setPhase] = useState<Phase>('pick');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<OutfitFeedback | null>(null);

  // ── 사진 선택 ─────────────────────────────────────
  const pickPhoto = async (fromCamera: boolean) => {
    if (fromCamera) {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) { Alert.alert('권한 필요', '카메라 접근 권한이 필요합니다.'); return; }
      const res = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [3, 4], quality: 0.85 });
      if (!res.canceled) { setPhotoUri(res.assets[0].uri); setPhase('ready'); }
    } else {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) { Alert.alert('권한 필요', '갤러리 접근 권한이 필요합니다.'); return; }
      const res = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [3, 4], quality: 0.85 });
      if (!res.canceled) { setPhotoUri(res.assets[0].uri); setPhase('ready'); }
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
    try {
      const result: OutfitFeedback = await api.post('/api/v1/feedback/analyze', {
        photo_url: photoUri,
        user_id: user.id,
        weather_context: weather,
        user_context: {
          age_group: user.age_group,
          job: user.job,
          today_activity: user.today_activity,
          additional_request: user.additional_request,
        },
        wardrobe_items: items.slice(0, 10),   // 옷장 상위 10개 참고
      });
      setFeedback(result);
      setPhase('result');
    } catch (err) {
      console.warn('API 오류, Mock 사용:', err);
      setFeedback(getMockFeedback(user.id));
      setPhase('result');
    }
  };

  const reset = () => { setPhotoUri(null); setFeedback(null); setPhase('pick'); };

  // ── 렌더 ─────────────────────────────────────────
  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.title}>📸 오늘 옷 평가받기</Text>

        {/* PHASE: pick */}
        {phase === 'pick' && (
          <>
            <TouchableOpacity style={[s.photoArea, shadow.sm]} onPress={showPickerAlert}>
              <Text style={s.cameraEmoji}>📷</Text>
              <Text style={s.cameraLabel}>탭하여 착장 사진 추가</Text>
              <Text style={s.cameraSub}>카메라 촬영 또는 갤러리 업로드</Text>
            </TouchableOpacity>
            {/* 컨텍스트 요약 */}
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

        {/* PHASE: ready (사진 선택 후, 분석 전) */}
        {phase === 'ready' && photoUri && (
          <>
            <Image source={{ uri: photoUri }} style={[s.photo, shadow.md]} resizeMode="cover" />
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
          /* 이미지 생성 실패 */
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

// ── Mock 데이터 ───────────────────────────────────────
function getMockFeedback(userId: string): OutfitFeedback {
  return {
    id: 'mock-' + Date.now(),
    user_id: userId,
    photo_url: '',
    overall: 'needs_improvement',
    overall_comment: '전체적으로 무난한 코디예요! 색상 조합에서 약간 아쉬운 부분이 있지만 기본기는 탄탄해요. 몇 가지 포인트만 수정하면 훨씬 세련된 스타일이 완성될 것 같아요 😊',
    scores: { color_harmony: 72, season_fit: 85, tpo_fit: 68 },
    item_comments: {
      color_harmony: '상의와 하의 색상 대비가 조금 강해요. 톤온톤 배색이나 뉴트럴 컬러를 활용하면 더 조화로워질 거예요.',
      season_fit: '현재 날씨와 계절에 소재는 잘 맞아요! 레이어링을 추가하면 온도 변화에도 대응할 수 있어요.',
      tpo_fit: '일상 활동에는 무난하지만, 상황에 특화된 스타일링을 더하면 자신감이 올라갈 거예요.',
    },
    good_points: [
      '실루엣 자체는 깔끔하고 정돈된 느낌이에요 👍',
      '신발 선택이 전체 코디와 잘 어우러져요.',
    ],
    suggestions: [
      '상의 색이 다소 강해요. 베이지나 화이트 계열로 바꾸면 더 조화로울 것 같아요.',
      '오늘 강수 확률이 있으니 방수 소재 아우터를 챙겨보세요.',
    ],
    styling_tips: [
      '심플한 실버 목걸이 하나만 추가해도 완성도가 확 올라가요!',
      '가방을 토트백으로 바꾸면 더 세련된 느낌을 줄 수 있어요.',
      '깔끔한 로퍼로 마무리하면 완벽한 데일리 룩이 됩니다.',
    ],
    image_error: '이미지 생성 중 오류가 발생했습니다. 텍스트 분석 결과를 확인해주세요.',
    created_at: new Date().toISOString(),
  };
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
  photo: { width: '100%', aspectRatio: 3 / 4, borderRadius: radius.xl, marginBottom: spacing.lg },
  photoFade: { opacity: 0.4 },
  readyBtns: { flexDirection: 'row', gap: spacing.md },
  btnHalf: { flex: 1 },
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
