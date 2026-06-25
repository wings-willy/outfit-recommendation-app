import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image,
  TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/authStore';
import { useWeatherStore } from '@/stores/weatherStore';
import { useWardrobeStore } from '@/stores/wardrobeStore';
import { useLanguageStore } from '@/stores/languageStore';
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
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);

  if (failed || !uri) {
    return (
      <View style={di.placeholder}>
        <Text style={di.placeholderEmoji}>🖼️</Text>
        <Text style={di.placeholderText}>{failed ? t('feedback.aiImageFail') : t('common.loading')}</Text>
      </View>
    );
  }
  return (
    <View style={di.wrap}>
      {loading && (
        <View style={di.spinner}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={di.spinnerText}>{t('feedback.aiImageLoading')}</Text>
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
  img: { width: '100%', aspectRatio: 3 / 4, borderRadius: radius.lg },
  spinner: {
    position: 'absolute', inset: 0, zIndex: 1,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.surface, borderRadius: radius.lg, gap: 4,
  },
  spinnerText: { ...typography.caption, color: colors.text.tertiary },
  placeholder: {
    width: '100%', aspectRatio: 3 / 4, borderRadius: radius.lg,
    backgroundColor: colors.surface, alignItems: 'center',
    justifyContent: 'center', gap: spacing.xs,
    borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed',
  },
  placeholderEmoji: { fontSize: 36 },
  placeholderText: { ...typography.caption, color: colors.text.tertiary },
});

// ── 단계 타입 ─────────────────────────────────────────
type Phase = 'pick' | 'preview' | 'analyzing' | 'result';

export default function FeedbackScreen() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { weather } = useWeatherStore();
  const { items } = useWardrobeStore();
  const { language } = useLanguageStore();

  const [phase, setPhase] = useState<Phase>('pick');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [photoMime, setPhotoMime] = useState<string>('image/jpeg');
  const [feedback, setFeedback] = useState<OutfitFeedback | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  // ── 사진 선택 (자르기 없이, base64 포함) ──────────────
  const pickPhoto = async (fromCamera: boolean) => {
    const opts: ImagePicker.ImagePickerOptions = {
      allowsEditing: false,   // 네이티브 "자르기" UI 완전 제거
      quality: 0.85,
      base64: true,           // base64 데이터를 직접 받음 (expo-file-system 불필요)
    };

    if (fromCamera) {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) { Alert.alert(t('feedback.cameraPermission'), t('feedback.cameraPermissionMsg')); return; }
      const res = await ImagePicker.launchCameraAsync(opts);
      if (!res.canceled && res.assets[0]) {
        const asset = res.assets[0];
        setPhotoUri(asset.uri);
        setPhotoBase64(asset.base64 ?? null);
        setPhotoMime(asset.mimeType ?? 'image/jpeg');
        setPhase('preview');
      }
    } else {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) { Alert.alert(t('feedback.galleryPermission'), t('feedback.galleryPermissionMsg')); return; }
      const res = await ImagePicker.launchImageLibraryAsync(opts);
      if (!res.canceled && res.assets[0]) {
        const asset = res.assets[0];
        setPhotoUri(asset.uri);
        setPhotoBase64(asset.base64 ?? null);
        setPhotoMime(asset.mimeType ?? 'image/jpeg');
        setPhase('preview');
      }
    }
  };

  const showPickerAlert = () => {
    Alert.alert(t('feedback.photoAlert'), '', [
      { text: t('feedback.cameraOption'), onPress: () => pickPhoto(true) },
      { text: t('feedback.galleryOption'), onPress: () => pickPhoto(false) },
      { text: t('feedback.cancelOption'), style: 'cancel' },
    ]);
  };

  // ── AI 분석 시작 ──────────────────────────────────
  const analyze = async () => {
    if (!photoUri || !user) return;
    setPhase('analyzing');
    setApiError(null);
    try {
      const result: OutfitFeedback = await api.post('/api/v1/feedback/analyze', {
        photo_url: photoUri,
        photo_base64: photoBase64,
        photo_mime_type: photoMime,
        user_id: user.id,
        language,                    // AI 응답 언어 전달
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

  const reset = () => {
    setPhotoUri(null); setPhotoBase64(null); setPhotoMime('image/jpeg');
    setFeedback(null); setPhase('pick'); setApiError(null);
  };

  // ── 렌더 ─────────────────────────────────────────
  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* PHASE: pick */}
        {phase === 'pick' && (
          <>
            <Text style={s.title}>{t('feedback.title')}</Text>
            <TouchableOpacity style={[s.photoArea, shadow.sm]} onPress={showPickerAlert}>
              <Text style={s.cameraEmoji}>📷</Text>
              <Text style={s.cameraLabel}>{t('feedback.photoAreaLabel')}</Text>
              <Text style={s.cameraSub}>{t('feedback.photoAreaSub')}</Text>
            </TouchableOpacity>
            {(weather || user?.today_activity) && (
              <View style={s.contextBox}>
                <Text style={s.contextTitle}>{t('feedback.contextTitle')}</Text>
                {weather && (
                  <Text style={s.contextItem}>{t('feedback.weatherInfo', {
                    temp: weather.temperature,
                    condition: weather.condition,
                    rain: weather.precipitation_prob,
                  })}</Text>
                )}
                {user?.today_activity && (
                  <Text style={s.contextItem}>{t('feedback.activityInfo', {
                    activity: t(`activities.${user.today_activity}` as any),
                  })}</Text>
                )}
                {user?.additional_request && (
                  <Text style={s.contextItem}>{t('feedback.requestInfo', { request: user.additional_request })}</Text>
                )}
              </View>
            )}
          </>
        )}

        {/* PHASE: preview — 사진 확인 화면 ("확인" 버튼 포함) */}
        {phase === 'preview' && photoUri && (
          <>
            <View style={s.previewHeader}>
              <TouchableOpacity onPress={showPickerAlert} style={s.previewHeaderBtn}>
                <Text style={s.previewHeaderBack}>{t('feedback.previewBack')}</Text>
              </TouchableOpacity>
              <Text style={s.previewTitle}>{t('feedback.previewTitle')}</Text>
              <TouchableOpacity onPress={analyze} style={s.previewHeaderBtn}>
                <Text style={s.previewConfirm}>{t('feedback.previewConfirm')}</Text>
              </TouchableOpacity>
            </View>

            <Image source={{ uri: photoUri }} style={[s.photo, shadow.md]} resizeMode="cover" />

            {apiError && (
              <View style={s.errorBox}>
                <Text style={s.errorText}>⚠️ {apiError}</Text>
              </View>
            )}

            <View style={s.readyBtns}>
              <Button title={t('feedback.reselect')} onPress={showPickerAlert} variant="secondary" style={s.btnHalf} />
              <Button title={t('feedback.analyzeBtn')} onPress={analyze} style={s.btnHalf} />
            </View>
          </>
        )}

        {/* PHASE: analyzing */}
        {phase === 'analyzing' && (
          <View style={s.analyzing}>
            {photoUri && <Image source={{ uri: photoUri }} style={[s.photo, s.photoFade]} resizeMode="cover" />}
            <View style={s.analyzingOverlay}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={s.analyzingTitle}>{t('feedback.analyzingTitle')}</Text>
              <Text style={s.analyzingDesc}>{t('feedback.analyzingDesc')}</Text>
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
  const { t } = useTranslation();
  const isOk = feedback.overall === 'ok';
  const badgeColor = isOk ? colors.success : colors.warning;
  const avgScore = Math.round(
    (feedback.scores.color_harmony + feedback.scores.season_fit + feedback.scores.tpo_fit) / 3
  );

  return (
    <View style={r.wrap}>
      {/* ① 착장 사진 + 종합 뱃지 */}
      {photoUri && (
        <View style={r.photoWrap}>
          <Image source={{ uri: photoUri }} style={r.photo} resizeMode="cover" />
          <View style={[r.badge, { backgroundColor: badgeColor }]}>
            <Text style={r.badgeText}>
              {isOk ? t('feedback.badgeOk') : t('feedback.badgeNeedsImprovement')}
            </Text>
          </View>
        </View>
      )}

      {/* ② 종합 평가 */}
      {!!feedback.overall_comment && (
        <View style={[r.card, shadow.sm]}>
          <Text style={r.cardTitle}>{t('feedback.overallTitle')}</Text>
          <Text style={r.overallComment}>{feedback.overall_comment}</Text>
        </View>
      )}

      {/* ③ 항목별 점수 + 코멘트 */}
      <View style={[r.card, shadow.sm]}>
        <View style={r.scoreHeader}>
          <Text style={r.cardTitle}>{t('feedback.scoreTitle')}</Text>
          <Text style={[r.avgScore, { color: badgeColor }]}>{t('feedback.avgScore', { score: avgScore })}</Text>
        </View>
        <ScoreBar label={t('feedback.colorHarmony')} score={feedback.scores.color_harmony} />
        {!!feedback.item_comments?.color_harmony && (
          <Text style={r.itemComment}>{feedback.item_comments.color_harmony}</Text>
        )}
        <ScoreBar label={t('feedback.seasonFit')} score={feedback.scores.season_fit} />
        {!!feedback.item_comments?.season_fit && (
          <Text style={r.itemComment}>{feedback.item_comments.season_fit}</Text>
        )}
        <ScoreBar label={t('feedback.tpoFit')} score={feedback.scores.tpo_fit} />
        {!!feedback.item_comments?.tpo_fit && (
          <Text style={r.itemComment}>{feedback.item_comments.tpo_fit}</Text>
        )}
      </View>

      {/* ④ 잘된 점 */}
      {(feedback.good_points?.length ?? 0) > 0 && (
        <View style={[r.card, shadow.sm]}>
          <Text style={r.cardTitle}>{t('feedback.goodPointsTitle')}</Text>
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
          <Text style={r.cardTitle}>{t('feedback.suggestionsTitle')}</Text>
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
          <Text style={[r.cardTitle, { color: colors.accent }]}>{t('feedback.tipsTitle')}</Text>
          {feedback.styling_tips!.map((tip, i) => (
            <View key={i} style={r.listRow}>
              <Text style={[r.bullet, { color: colors.accent }]}>{i + 1}.</Text>
              <Text style={[r.listText, { color: colors.text.secondary }]}>{tip}</Text>
            </View>
          ))}
        </View>
      )}

      {/* ⑦ AI 추천 스타일 이미지 */}
      <View style={[r.card, shadow.sm]}>
        <Text style={r.cardTitle}>{t('feedback.aiImageTitle')}</Text>
        {feedback.image_error && !feedback.suggestion_image_url ? (
          <View style={r.imageError}>
            <Text style={r.imageErrorEmoji}>🖼️</Text>
            <Text style={r.imageErrorText}>{t('feedback.imageErrorText')}</Text>
          </View>
        ) : (
          <>
            <Text style={r.dalleSubtitle}>{t('feedback.aiImageSub')}</Text>
            <DalleImage uri={feedback.suggestion_image_url} failed={!feedback.suggestion_image_url} />
            <Text style={r.dalleCaption}>{t('feedback.aiImageCaption')}</Text>
          </>
        )}
      </View>

      <Button title={t('feedback.retryBtn')} onPress={onRetry} variant="secondary" />
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
  dalleCaption: { ...typography.caption, color: colors.text.tertiary, textAlign: 'center', marginTop: spacing.sm },
});
