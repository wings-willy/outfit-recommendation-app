import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/services/supabase';
import { Button } from '@/components/Button';
import { colors, typography, spacing, radius } from '@/constants/theme';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('오류', '모든 항목을 입력해주세요.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('오류', '비밀번호가 일치하지 않습니다.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('오류', '비밀번호는 6자 이상이어야 합니다.');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;

      if (data.user) {
        // users 테이블에 프로필 생성
        await supabase.from('users').insert({
          id: data.user.id,
          email: data.user.email,
          style_tags: [],
          onboarding_completed: false,
          subscription_plan: 'free',
        });
      }

      Alert.alert(
        '가입 완료!',
        '이메일 인증 링크가 발송되었습니다. 인증 후 로그인해주세요.',
        [{ text: '확인', onPress: () => router.replace('/(auth)/login') }]
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : '회원가입에 실패했습니다.';
      Alert.alert('회원가입 실패', msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← 뒤로</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>회원가입</Text>
          <Text style={styles.subtitle}>오늘 뭐 입지와 함께 시작해요</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>이메일</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="이메일 주소"
              placeholderTextColor={colors.text.tertiary}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>비밀번호</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="6자 이상"
              placeholderTextColor={colors.text.tertiary}
              secureTextEntry
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>비밀번호 확인</Text>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="비밀번호를 다시 입력하세요"
              placeholderTextColor={colors.text.tertiary}
              secureTextEntry
            />
          </View>

          <Button
            title="가입하기"
            onPress={handleRegister}
            isLoading={isLoading}
            style={styles.registerButton}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flexGrow: 1,
    padding: spacing.lg,
    paddingTop: spacing.xxl,
  },
  backButton: {
    marginBottom: spacing.xl,
  },
  backText: {
    ...typography.body,
    color: colors.text.secondary,
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.h1,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.text.secondary,
  },
  form: {
    gap: spacing.md,
  },
  inputGroup: {
    gap: spacing.xs,
  },
  label: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.text.primary,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    ...typography.body,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  registerButton: {
    marginTop: spacing.sm,
  },
});
