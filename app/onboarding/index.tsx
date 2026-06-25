import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, TextInput, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { useLanguageStore } from '@/stores/languageStore';
import { Button } from '@/components/Button';
import { AgeGroup, TodayActivity, TODAY_ACTIVITY_LABELS } from '@/types';
import { colors, typography, spacing, radius } from '@/constants/theme';
import type { Language } from '@/i18n';

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

// ── Step 0: 언어 선택 ────────────────────────────────
function LanguageStep({ onNext }: { onNext: () => void }) {
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguageStore();
  const [selected, setSelected] = useState<Language>(language);

  const handleSelect = async (lang: Language) => {
    setSelected(lang);
    await setLanguage(lang);
  };

  return (
    <View style={styles.step}>
      <Text style={styles.stepTitle}>{t('language.title')}</Text>
      <Text style={styles.stepSub}>{t('language.subtitle')}</Text>

      <View style={styles.langRow}>
        <TouchableOpacity
          style={[styles.langCard, selected === 'ko' && styles.langCardActive]}
          onPress={() => handleSelect('ko')}
        >
          <Text style={styles.langFlag}>🇰🇷</Text>
          <Text style={[styles.langLabel, selected === 'ko' && styles.langLabelActive]}>
            {t('language.korean')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.langCard, selected === 'en' && styles.langCardActive]}
          onPress={() => handleSelect('en')}
        >
          <Text style={styles.langFlag}>🇺🇸</Text>
          <Text style={[styles.langLabel, selected === 'en' && styles.langLabelActive]}>
            {t('language.english')}
          </Text>
        </TouchableOpacity>
      </View>

      <Button title={t('common.next')} onPress={onNext} style={styles.btn} />
    </View>
  );
}

// ── Step 1: 연령 + 직업 ──────────────────────────────
function Step1({ onNext }: { onNext: () => void }) {
  const { t } = useTranslation();
  const { ageGroup, setAgeGroup, job, setJob } = useOnboardingStore();
  return (
    <View style={styles.step}>
      <Text style={styles.stepTitle}>{t('onboarding.step1Title')}</Text>
      <Text style={styles.stepSub}>{t('onboarding.step1Sub')}</Text>

      <Text style={styles.label}>{t('onboarding.ageLabel')}</Text>
      <View style={styles.chipRow}>
        {AGE_OPTIONS.map((age) => (
          <TouchableOpacity
            key={age}
            style={[styles.chip, ageGroup === age && styles.chipActive]}
            onPress={() => setAgeGroup(age)}
          >
            <Text style={[styles.chipText, ageGroup === age && styles.chipTextActive]}>
              {t(`ageGroups.${age}` as any)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.label, { marginTop: spacing.lg }]}>{t('onboarding.jobLabel')}</Text>
      <TextInput
        style={styles.input}
        value={job}
        onChangeText={setJob}
        placeholder={t('onboarding.jobPlaceholder')}
        placeholderTextColor={colors.text.tertiary}
      />

      <Button title={t('common.next')} onPress={onNext} style={styles.btn} />
    </View>
  );
}

// ── Step 2: 오늘 활동 ────────────────────────────────
function Step2({ onNext, onPrev }: { onNext: () => void; onPrev: () => void }) {
  const { t } = useTranslation();
  const { todayActivity, setTodayActivity, customActivity, setCustomActivity } = useOnboardingStore();
  return (
    <View style={styles.step}>
      <Text style={styles.stepTitle}>{t('onboarding.step2Title')}</Text>
      <Text style={styles.stepSub}>{t('onboarding.step2Sub')}</Text>

      <View style={styles.activityGrid}>
        {ACTIVITY_OPTIONS.map((act) => (
          <TouchableOpacity
            key={act}
            style={[styles.actCard, todayActivity === act && styles.actCardActive]}
            onPress={() => setTodayActivity(act)}
          >
            <Text style={styles.actEmoji}>{TODAY_ACTIVITY_LABELS[act].emoji}</Text>
            <Text style={[styles.actLabel, todayActivity === act && styles.actLabelActive]}>
              {t(`activities.${act}` as any)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {todayActivity === '기타' && (
        <TextInput
          style={[styles.input, { marginTop: spacing.md }]}
          value={customActivity}
          onChangeText={setCustomActivity}
          placeholder={t('onboarding.customActivityPlaceholder')}
          placeholderTextColor={colors.text.tertiary}
        />
      )}

      <View style={styles.btnRow}>
        <Button title={t('common.prev')} onPress={onPrev} variant="secondary" style={styles.btnHalf} />
        <Button title={t('common.next')} onPress={onNext} style={styles.btnHalf} />
      </View>
    </View>
  );
}

// ── Step 3: 추가 요청사항 ─────────────────────────────
function Step3({ onComplete, isSaving, onPrev }: {
  onComplete: () => void; isSaving: boolean; onPrev: () => void;
}) {
  const { t } = useTranslation();
  const { additionalRequest, setAdditionalRequest } = useOnboardingStore();
  return (
    <View style={styles.step}>
      <Text style={styles.stepTitle}>{t('onboarding.step3Title')}</Text>
      <Text style={styles.stepSub}>{t('onboarding.step3Sub')}</Text>

      <TextInput
        style={[styles.input, styles.textArea]}
        value={additionalRequest}
        onChangeText={setAdditionalRequest}
        placeholder={t('onboarding.requestPlaceholder')}
        placeholderTextColor={colors.text.tertiary}
        multiline
        numberOfLines={5}
        textAlignVertical="top"
      />

      <View style={styles.btnRow}>
        <Button title={t('common.prev')} onPress={onPrev} variant="secondary" style={styles.btnHalf} />
        <Button title={t('common.done')} onPress={onComplete} isLoading={isSaving} style={styles.btnHalf} />
      </View>
      <TouchableOpacity onPress={onComplete} style={styles.skipBtn}>
        <Text style={styles.skipText}>{t('common.skip')}</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── 완료 화면 ─────────────────────────────────────────
function CompletionScreen({ onStart }: { onStart: () => void }) {
  const { t } = useTranslation();
  return (
    <View style={styles.completion}>
      <Text style={styles.completionEmoji}>{t('onboarding.completionEmoji')}</Text>
      <Text style={styles.completionTitle}>{t('onboarding.completionTitle')}</Text>
      <Text style={styles.completionSub}>{t('onboarding.completionSub')}</Text>
      <Button title={t('onboarding.startBtn')} onPress={onStart} style={{ width: '100%' }} />
    </View>
  );
}

// ── 메인 온보딩 ───────────────────────────────────────
export default function OnboardingScreen() {
  const { t } = useTranslation();
  const { currentStep, nextStep, prevStep, saveOnboarding } = useOnboardingStore();
  const [languageSelected, setLanguageSelected] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleComplete = async () => {
    setIsSaving(true);
    try {
      await saveOnboarding();
      setIsCompleted(true);
    } catch {
      Alert.alert(t('common.error'), t('settings.saveError'));
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

  // 언어 선택 스텝
  if (!languageSelected) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.topBar}>
            <ProgressBar current={0} total={3} />
            <Text style={styles.stepCounter}>0 / 3</Text>
          </View>
          <LanguageStep onNext={() => setLanguageSelected(true)} />
        </ScrollView>
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
  // 언어 선택
  langRow: { flexDirection: 'row', gap: spacing.lg, marginBottom: spacing.xl },
  langCard: {
    flex: 1, paddingVertical: spacing.xl, alignItems: 'center', justifyContent: 'center',
    borderRadius: radius.xl, backgroundColor: colors.surface,
    borderWidth: 2, borderColor: colors.border, gap: spacing.sm,
  },
  langCardActive: { borderColor: colors.primary, backgroundColor: colors.primary + '15' },
  langFlag: { fontSize: 40 },
  langLabel: { ...typography.body, fontWeight: '700', color: colors.text.primary },
  langLabelActive: { color: colors.primary },
});
