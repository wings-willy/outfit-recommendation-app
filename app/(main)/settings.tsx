import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/Button';
import { AgeGroup, TodayActivity, TODAY_ACTIVITY_LABELS } from '@/types';
import { colors, typography, spacing, radius, shadow } from '@/constants/theme';

const AGE_OPTIONS: AgeGroup[] = ['10대', '20대', '30대', '40대', '50대 이상'];
const ACTIVITY_OPTIONS: TodayActivity[] = ['등교', '출근', '운동', '데이트', '기타'];

// ── 행 컴포넌트 ───────────────────────────────────────
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

// ── 메인 ─────────────────────────────────────────────
export default function SettingsScreen() {
  const { user, updateProfile, resetProfile } = useAuthStore();

  // ── 편집 상태 ──────────────────────────────────────
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
      Alert.alert('저장 완료', '프로필이 업데이트되었어요.');
    } catch {
      Alert.alert('오류', '저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const cancelEdit = () => {
    // 원래 값으로 되돌리기
    setAgeGroup((user?.age_group as AgeGroup) ?? null);
    setJob(user?.job ?? '');
    setTodayActivity((user?.today_activity as TodayActivity) ?? null);
    setAdditionalRequest(user?.additional_request ?? '');
    setIsEditing(false);
  };

  const handleReset = () => {
    Alert.alert(
      '앱 데이터 초기화',
      '프로필과 설정이 모두 삭제되고 온보딩 화면으로 돌아갑니다. 계속하시겠어요?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '초기화', style: 'destructive', onPress: async () => {
            await resetProfile();
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.title}>⚙️ 설정</Text>

        {/* 내 프로필 */}
        <View style={[s.section, shadow.sm]}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>내 프로필</Text>
            {!isEditing && (
              <TouchableOpacity onPress={() => setIsEditing(true)} style={s.editBtn}>
                <Text style={s.editBtnText}>편집</Text>
              </TouchableOpacity>
            )}
          </View>

          {!isEditing ? (
            // ── 보기 모드 ─────────────────────────────
            <>
              <SettingsRow label="연령대" value={user?.age_group || '미설정'} />
              <SettingsRow label="직업 / 소속" value={user?.job || '미설정'} />
              <SettingsRow
                label="오늘 활동"
                value={
                  user?.today_activity
                    ? `${TODAY_ACTIVITY_LABELS[user.today_activity as TodayActivity]?.emoji ?? ''} ${user.today_activity}`
                    : '미설정'
                }
              />
              <SettingsRow
                label="AI 요청사항"
                value={user?.additional_request ? user.additional_request.slice(0, 30) + (user.additional_request.length > 30 ? '…' : '') : '없음'}
              />
            </>
          ) : (
            // ── 편집 모드 ─────────────────────────────
            <View style={s.editor}>
              {/* 연령대 */}
              <Text style={s.editorLabel}>연령대</Text>
              <View style={s.chipRow}>
                {AGE_OPTIONS.map((age) => (
                  <TouchableOpacity
                    key={age}
                    style={[s.chip, ageGroup === age && s.chipActive]}
                    onPress={() => setAgeGroup(age)}
                  >
                    <Text style={[s.chipText, ageGroup === age && s.chipTextActive]}>{age}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* 직업 */}
              <Text style={[s.editorLabel, { marginTop: spacing.md }]}>직업 / 소속</Text>
              <TextInput
                style={s.input}
                value={job}
                onChangeText={setJob}
                placeholder="예: 대학생, 직장인, 프리랜서…"
                placeholderTextColor={colors.text.tertiary}
              />

              {/* 오늘 활동 */}
              <Text style={[s.editorLabel, { marginTop: spacing.md }]}>오늘 활동</Text>
              <View style={s.activityRow}>
                {ACTIVITY_OPTIONS.map((act) => (
                  <TouchableOpacity
                    key={act}
                    style={[s.actChip, todayActivity === act && s.actChipActive]}
                    onPress={() => setTodayActivity(act)}
                  >
                    <Text style={s.actEmoji}>{TODAY_ACTIVITY_LABELS[act].emoji}</Text>
                    <Text style={[s.actLabel, todayActivity === act && s.actLabelActive]}>{act}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* 추가 요청사항 */}
              <Text style={[s.editorLabel, { marginTop: spacing.md }]}>AI 요청사항</Text>
              <TextInput
                style={[s.input, s.textArea]}
                value={additionalRequest}
                onChangeText={setAdditionalRequest}
                placeholder={'예: 키가 작아서 세로로 길어 보이는 스타일을 선호해요.\n예: 색깔 조합이 튀지 않았으면 좋겠어요.'}
                placeholderTextColor={colors.text.tertiary}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              {/* 버튼 */}
              <View style={s.editorBtns}>
                <Button title="취소" onPress={cancelEdit} variant="secondary" style={s.btnHalf} />
                <Button title="저장" onPress={saveProfile} isLoading={isSaving} style={s.btnHalf} />
              </View>
            </View>
          )}
        </View>

        {/* 앱 정보 */}
        <View style={[s.section, shadow.sm]}>
          <Text style={s.sectionTitle}>앱 정보</Text>
          <SettingsRow label="버전" value="v1.0.0" />
          <SettingsRow label="개인정보 처리방침" onPress={() => {}} />
          <SettingsRow label="이용약관" onPress={() => {}} />
        </View>

        {/* 데이터 초기화 */}
        <Button title="앱 데이터 초기화" onPress={handleReset} variant="secondary" style={s.signOutBtn} />

        <Text style={s.version}>오늘 뭐 입지 • AI 패션 어시스턴트</Text>
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

  editor: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  editorLabel: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { ...typography.bodySmall, fontWeight: '600', color: colors.text.secondary },
  chipTextActive: { color: '#fff' },

  activityRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  actChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  actChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  actEmoji: { fontSize: 16 },
  actLabel: { ...typography.bodySmall, fontWeight: '600', color: colors.text.secondary },
  actLabelActive: { color: '#fff' },

  input: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: spacing.md,
    ...typography.body,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  textArea: { minHeight: 100, textAlignVertical: 'top' },

  editorBtns: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  btnHalf: { flex: 1 },

  signOutBtn: { marginBottom: spacing.lg },
  version: { ...typography.caption, textAlign: 'center', color: colors.text.tertiary },
});
