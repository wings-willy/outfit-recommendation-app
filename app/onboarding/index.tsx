import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, TextInput, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { Button } from '@/components/Button';
import { AgeGroup, TodayActivity, TODAY_ACTIVITY_LABELS } from '@/types';
import { colors, typography, spacing, radius } from '@/constants/theme';

const AGE_OPTIONS: AgeGroup[] = ['10대', '20대', '30대', '40대', '50대 이상'];
const ACTIVITY_OPTIONS: TodayActivity[] = ['등교', '출근', '운동', '데이트', '기타'];

// ── 진행 바 ─────────────────────────────────────────
function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <View style={styles.progressRow}>
      {Array.from({ length: total }).map((_, i) => (
        <View key={i} style={[styles.progressSeg, i < current && styles.progressSegActive]} />
      ))}
    </View>
  );
}

// ── Step 1: 연령 + 직업 ──────────────────────────────
function Step1({ onNext }: { onNext: () => void }) {
  const { ageGroup, setAgeGroup, job, setJob } = useOnboardingStore();
  return (
    <View style={styles.step}>
      <Text style={styles.stepTitle}>기본 정보를 알려주세요</Text>
      <Text style={styles.stepSub}>더 정확한 코디 평가를 위해 사용됩니다</Text>

      <Text style={styles.label}>연령대</Text>
      <View style={styles.chipRow}>
        {AGE_OPTIONS.map((age) => (
          <TouchableOpacity
            key={age}
            style={[styles.chip, ageGroup === age && styles.chipActive]}
            onPress={() => setAgeGroup(age)}
          >
            <Text style={[styles.chipText, ageGroup === age && styles.chipTextActive]}>{age}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.label, { marginTop: spacing.lg }]}>직업 / 소속</Text>
      <TextInput
        style={styles.input}
        value={job}
        onChangeText={setJob}
        placeholder="예: 대학생, 직장인, 프리랜서…"
        placeholderTextColor={colors.text.tertiary}
      />

      <Button title="다음" onPress={onNext} style={styles.btn} />
    </View>
  );
}

// ── Step 2: 오늘 활동 ────────────────────────────────
function Step2({ onNext, onPrev }: { onNext: () => void; onPrev: () => void }) {
  const { todayActivity, setTodayActivity, customActivity, setCustomActivity } = useOnboardingStore();
  return (
    <View style={styles.step}>
      <Text style={styles.stepTitle}>오늘 주요 활동은?</Text>
      <Text style={styles.stepSub}>TPO에 맞는 피드백을 드릴게요</Text>

      <View style={styles.activityGrid}>
        {ACTIVITY_OPTIONS.map((act) => (
          <TouchableOpacity
            key={act}
            style={[styles.actCard, todayActivity === act && styles.actCardActive]}
            onPress={() => setTodayActivity(act)}
          >
            <Text style={styles.actEmoji}>{TODAY_ACTIVITY_LABELS[act].emoji}</Text>
            <Text style={[styles.actLabel, todayActivity === act && styles.actLabelActive]}>{act}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {todayActivity === '기타' && (
        <TextInput
          style={[styles.input, { marginTop: spacing.md }]}
          value={customActivity}
          onChangeText={setCustomActivity}
          placeholder="오늘 활동을 직접 입력해주세요"
          placeholderTextColor={colors.text.tertiary}
        />
      )}

      <View style={styles.btnRow}>
        <Button title="이전" onPress={onPrev} variant="secondary" style={styles.btnHalf} />
        <Button title="다음" onPress={onNext} style={styles.btnHalf} />
      </View>
    </View>
  );
}

// ── Step 3: 추가 요청사항 ─────────────────────────────
function Step3({ onComplete, isSaving, onPrev }: {
  onComplete: () => void; isSaving: boolean; onPrev: () => void;
}) {
  const { additionalRequest, setAdditionalRequest } = useOnboardingStore();
  return (
    <View style={styles.step}>
      <Text style={styles.stepTitle}>추가 요청사항</Text>
      <Text style={styles.stepSub}>AI가 평가 시 참고할 내용을 자유롭게 입력하세요</Text>

      <TextInput
        style={[styles.input, styles.textArea]}
        value={additionalRequest}
        onChangeText={setAdditionalRequest}
        placeholder={
          '예: 키가 작아서 세로로 길어 보이는 스타일을 선호해요.\n' +
          '예: 색깔 조합이 너무 튀지 않았으면 좋겠어요.\n' +
          '예: 오늘 비가 올 수도 있어요.'
        }
        placeholderTextColor={colors.text.tertiary}
        multiline
        numberOfLines={5}
        textAlignVertical="top"
      />

      <View style={styles.btnRow}>
        <Button title="이전" onPress={onPrev} variant="secondary" style={styles.btnHalf} />
        <Button title="완료!" onPress={onComplete} isLoading={isSaving} style={styles.btnHalf} />
      </View>
      <TouchableOpacity onPress={onComplete} style={styles.skipBtn}>
        <Text style={styles.skipText}>건너뛰기</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── 완료 화면 ─────────────────────────────────────────
function CompletionScreen({ onStart }: { onStart: () => void }) {
  return (
    <View style={styles.completion}>
      <Text style={styles.completionEmoji}>🎉</Text>
      <Text style={styles.completionTitle}>준비 완료!</Text>
      <Text style={styles.completionSub}>
        이제 오늘 착장 사진을 찍으면{'\n'}AI가 바로 피드백을 드려요
      </Text>
      <Button title="시작하기" onPress={onStart} style={{ width: '100%' }} />
    </View>
  );
}

// ── 메인 온보딩 ───────────────────────────────────────
export default function OnboardingScreen() {
  const { currentStep, nextStep, prevStep, saveOnboarding } = useOnboardingStore();
  const [isCompleted, setIsCompleted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleComplete = async () => {
    setIsSaving(true);
    try {
      await saveOnboarding();   // userId 불필요 — AsyncStorage에 직접 저장
      setIsCompleted(true);
    } catch {
      Alert.alert('오류', '저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isCompleted) {
    return (
      <SafeAreaView style={styles.container}>
        <CompletionScreen onStart={() => router.replace('/(main)')} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.topBar}>
          <ProgressBar current={currentStep} total={3} />
          <Text style={styles.stepCounter}>{currentStep} / 3</Text>
        </View>

        {currentStep === 1 && <Step1 onNext={nextStep} />}
        {currentStep === 2 && <Step2 onNext={nextStep} onPrev={prevStep} />}
        {currentStep === 3 && (
          <Step3 onComplete={handleComplete} isSaving={isSaving} onPrev={prevStep} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, padding: spacing.lg, paddingTop: spacing.xl },
  topBar: { alignItems: 'center', marginBottom: spacing.xl },
  progressRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xs },
  progressSeg: { flex: 1, height: 6, borderRadius: radius.full, backgroundColor: colors.border },
  progressSegActive: { backgroundColor: colors.primary },
  stepCounter: { ...typography.bodySmall, color: colors.text.tertiary },
  step: { flex: 1 },
  stepTitle: { ...typography.h2, marginBottom: spacing.xs },
  stepSub: { ...typography.body, color: colors.text.secondary, marginBottom: spacing.xl },
  label: { ...typography.bodySmall, fontWeight: '600', color: colors.text.primary, marginBottom: spacing.sm },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderRadius: radius.full, backgroundColor: colors.surface,
    borderWidth: 1.5, borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { ...typography.body, fontWeight: '600', color: colors.text.primary },
  chipTextActive: { color: colors.text.inverse },
  input: {
    backgroundColor: colors.surface, borderRadius: radius.md,
    padding: spacing.md, ...typography.body,
    borderWidth: 1.5, borderColor: colors.border,
  },
  textArea: { minHeight: 130, textAlignVertical: 'top' },
  activityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  actCard: {
    width: '30%', aspectRatio: 1, backgroundColor: colors.surface,
    borderRadius: radius.xl, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: colors.border, gap: 4,
  },
  actCardActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  actEmoji: { fontSize: 28 },
  actLabel: { ...typography.bodySmall, fontWeight: '600', color: colors.text.secondary },
  actLabelActive: { color: colors.text.inverse },
  btn: { marginTop: spacing.xl },
  btnRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl },
  btnHalf: { flex: 1 },
  skipBtn: { alignItems: 'center', paddingVertical: spacing.md },
  skipText: { ...typography.body, color: colors.text.tertiary },
  completion: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, gap: spacing.md },
  completionEmoji: { fontSize: 72 },
  completionTitle: { ...typography.h1 },
  completionSub: { ...typography.body, color: colors.text.secondary, textAlign: 'center', lineHeight: 24 },
});
