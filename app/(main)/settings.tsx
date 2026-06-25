import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/authStore';
import { useLanguageStore } from '@/stores/languageStore';
import { Button } from '@/components/Button';
import { AgeGroup, TodayActivity, TODAY_ACTIVITY_LABELS } from '@/types';
import { colors, typography, spacing, radius, shadow } from '@/constants/theme';
import type { Language } from '@/i18n';

const AGE_OPTIONS: AgeGroup[] = ['10대', '20대', '30대', '40대', '50대 이상'];
const ACTIVITY_OPTIONS: TodayActivity[] = ['등교', '출근', '운동', '데이트', '기타'];

function SettingsRow({ label, value, onPress }: { label: string; value?: string; onPress?: () => void }) {
  return (
    <TouchableOpacity style={s.row} onPress={onPress} disabled={!onPress} activeOpacity={0.7}>
      <Text style={s.rowLabel}>{label}</Text>
      <View style={s.rowRight}>
        {value && <Text style={s.rowValue}>{value}</Text>}
        {onPress && <Text style={s.rowArrow}>›</Text>}
      </View>
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { user, updateProfile, resetProfile } = useAuthStore();
  const { language, setLanguage } = useLanguageStore();

  const [isEditing, setIsEditing] = useState(false);
  const [ageGroup, setAgeGroup] = useState<AgeGroup | null>(
    (user?.age_group as AgeGroup) ?? null
  );
  const [job, setJob] = useState(user?.job ?? '');
  const [todayActivity, setTodayActivity] = useState<TodayActivity | null>(
    (user?.today_activity as TodayActivity) ?? null
  );
  const [additionalRequest, setAdditionalRequest] = useState(user?.additional_request ?? '');
  const [isSaving, setIsSaving] = useState(false);

  const saveProfile = async () => {
    setIsSaving(true);
    try {
      await updateProfile({
        age_group: ageGroup ?? undefined,
        job,
        today_activity: todayActivity ?? undefined,
        additional_request: additionalRequest,
      });
      setIsEditing(false);
      Alert.alert(t('common.ok'), t('settings.savedMsg'));
    } catch {
      Alert.alert(t('common.error'), t('settings.saveError'));
    } finally {
      setIsSaving(false);
    }
  };

  const cancelEdit = () => {
    setAgeGroup((user?.age_group as AgeGroup) ?? null);
    setJob(user?.job ?? '');
    setTodayActivity((user?.today_activity as TodayActivity) ?? null);
    setAdditionalRequest(user?.additional_request ?? '');
    setIsEditing(false);
  };

  const handleReset = () => {
    Alert.alert(
      t('settings.resetTitle'),
      t('settings.resetMsg'),
      [
        { text: t('settings.resetCancel'), style: 'cancel' },
        {
          text: t('settings.resetConfirm'), style: 'destructive', onPress: async () => {
            await resetProfile();
          },
        },
      ],
    );
  };

  const handleLanguageToggle = async (lang: Language) => {
    await setLanguage(lang);
  };

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.title}>{t('settings.title')}</Text>

        {/* 내 프로필 */}
        <View style={[s.section, shadow.sm]}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>{t('settings.profileSection')}</Text>
            {!isEditing && (
              <TouchableOpacity onPress={() => setIsEditing(true)} style={s.editBtn}>
                <Text style={s.editBtnText}>{t('common.edit')}</Text>
              </TouchableOpacity>
            )}
          </View>

          {!isEditing ? (
            <>
              <SettingsRow
                label={t('settings.ageLabel')}
                value={user?.age_group ? t(`ageGroups.${user.age_group}` as any) : t('settings.notSet')}
              />
              <SettingsRow label={t('settings.jobLabel')} value={user?.job || t('settings.notSet')} />
              <SettingsRow
                label={t('settings.activityLabel')}
                value={
                  user?.today_activity
                    ? `${TODAY_ACTIVITY_LABELS[user.today_activity as TodayActivity]?.emoji ?? ''} ${t(`activities.${user.today_activity}` as any)}`
                    : t('settings.notSet')
                }
              />
              <SettingsRow
                label={t('settings.requestLabel')}
                value={user?.additional_request
                  ? user.additional_request.slice(0, 30) + (user.additional_request.length > 30 ? '…' : '')
                  : t('settings.none')}
              />
            </>
          ) : (
            <View style={s.editor}>
              {/* 연령대 */}
              <Text style={s.editorLabel}>{t('settings.ageLabel')}</Text>
              <View style={s.chipRow}>
                {AGE_OPTIONS.map((age) => (
                  <TouchableOpacity
                    key={age}
                    style={[s.chip, ageGroup === age && s.chipActive]}
                    onPress={() => setAgeGroup(age)}
                  >
                    <Text style={[s.chipText, ageGroup === age && s.chipTextActive]}>
                      {t(`ageGroups.${age}` as any)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* 직업 */}
              <Text style={[s.editorLabel, { marginTop: spacing.md }]}>{t('settings.jobLabel')}</Text>
              <TextInput
                style={s.input}
                value={job}
                onChangeText={setJob}
                placeholder={t('settings.jobPlaceholder')}
                placeholderTextColor={colors.text.tertiary}
              />

              {/* 오늘 활동 */}
              <Text style={[s.editorLabel, { marginTop: spacing.md }]}>{t('settings.activityLabel')}</Text>
              <View style={s.activityRow}>
                {ACTIVITY_OPTIONS.map((act) => (
                  <TouchableOpacity
                    key={act}
                    style={[s.actChip, todayActivity === act && s.actChipActive]}
                    onPress={() => setTodayActivity(act)}
                  >
                    <Text style={s.actEmoji}>{TODAY_ACTIVITY_LABELS[act].emoji}</Text>
                    <Text style={[s.actLabel, todayActivity === act && s.actLabelActive]}>
                      {t(`activities.${act}` as any)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* 추가 요청사항 */}
              <Text style={[s.editorLabel, { marginTop: spacing.md }]}>{t('settings.requestLabel')}</Text>
              <TextInput
                style={[s.input, s.textArea]}
                value={additionalRequest}
                onChangeText={setAdditionalRequest}
                placeholder={t('settings.requestPlaceholder')}
                placeholderTextColor={colors.text.tertiary}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              <View style={s.editorBtns}>
                <Button title={t('common.cancel')} onPress={cancelEdit} variant="secondary" style={s.btnHalf} />
                <Button title={t('common.save')} onPress={saveProfile} isLoading={isSaving} style={s.btnHalf} />
              </View>
            </View>
          )}
        </View>

        {/* 언어 설정 */}
        <View style={[s.section, shadow.sm]}>
          <View style={s.sectionHeaderFlat}>
            <Text style={s.sectionTitle}>{t('settings.languageSection')}</Text>
          </View>
          <View style={s.langToggleRow}>
            <TouchableOpacity
              style={[s.langToggleBtn, language === 'ko' && s.langToggleBtnActive]}
              onPress={() => handleLanguageToggle('ko')}
            >
              <Text style={[s.langToggleText, language === 'ko' && s.langToggleTextActive]}>
                🇰🇷 한국어
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.langToggleBtn, language === 'en' && s.langToggleBtnActive]}
              onPress={() => handleLanguageToggle('en')}
            >
              <Text style={[s.langToggleText, language === 'en' && s.langToggleTextActive]}>
                🇺🇸 English
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 앱 정보 */}
        <View style={[s.section, shadow.sm]}>
          <Text style={s.sectionTitle}>{t('settings.appInfoSection')}</Text>
          <SettingsRow label={t('settings.version')} value={t('common.version')} />
          <SettingsRow label={t('settings.privacy')} onPress={() => {}} />
          <SettingsRow label={t('settings.terms')} onPress={() => {}} />
        </View>

        <Button title={t('settings.resetBtn')} onPress={handleReset} variant="secondary" style={s.signOutBtn} />
        <Text style={s.version}>{t('settings.appTagline')}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  title: { ...typography.h2, marginBottom: spacing.xl },

  section: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  sectionHeaderFlat: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  sectionTitle: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  editBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
    backgroundColor: colors.accentLight,
  },
  editBtnText: { ...typography.bodySmall, fontWeight: '700', color: colors.accent },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  rowLabel: { ...typography.body, color: colors.text.primary },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rowValue: { ...typography.body, color: colors.text.secondary },
  rowArrow: { fontSize: 20, color: colors.text.tertiary },

  editor: { padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  editorLabel: { ...typography.bodySmall, fontWeight: '600', color: colors.text.primary, marginBottom: spacing.sm },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: radius.full, backgroundColor: colors.background,
    borderWidth: 1.5, borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { ...typography.bodySmall, fontWeight: '600', color: colors.text.secondary },
  chipTextActive: { color: '#fff' },

  activityRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  actChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: radius.full, backgroundColor: colors.background,
    borderWidth: 1.5, borderColor: colors.border,
  },
  actChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  actEmoji: { fontSize: 16 },
  actLabel: { ...typography.bodySmall, fontWeight: '600', color: colors.text.secondary },
  actLabelActive: { color: '#fff' },

  input: {
    backgroundColor: colors.background, borderRadius: radius.md,
    padding: spacing.md, ...typography.body,
    borderWidth: 1.5, borderColor: colors.border,
  },
  textArea: { minHeight: 100, textAlignVertical: 'top' },

  editorBtns: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  btnHalf: { flex: 1 },

  // 언어 토글
  langToggleRow: {
    flexDirection: 'row', gap: spacing.sm,
    padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border,
  },
  langToggleBtn: {
    flex: 1, paddingVertical: spacing.sm, alignItems: 'center',
    borderRadius: radius.full, borderWidth: 1.5, borderColor: colors.border,
    backgroundColor: colors.background,
  },
  langToggleBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  langToggleText: { ...typography.bodySmall, fontWeight: '700', color: colors.text.secondary },
  langToggleTextActive: { color: '#fff' },

  signOutBtn: { marginBottom: spacing.lg },
  version: { ...typography.caption, textAlign: 'center', color: colors.text.tertiary },
});
