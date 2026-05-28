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

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('오류', '이메일과 비밀번호를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      // users 테이블에 프로필이 없으면 자동 생성 (schema 미적용 환경 대응)
      if (data.user) {
        await supabase.from('users').upsert(
          {
            id: data.user.id,
            email: data.user.email ?? email,
            style_tags: [],
            onboarding_completed: false,
            subscription_plan: 'free',
          },
          { onConflict: 'id', ignoreDuplicates: true }  // 이미 있으면 덮어쓰지 않음
        );
      }
      // 로그인 성공 → onAuthStateChange → authStore 업데이트 → index.tsx가 리다이렉트
    } catch (err) {
      const msg = err instanceof Error ? err.message : '로그인에 실패했습니다.';
      Alert.alert('로그인 실패', msg);
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
        <View style={styles.header}>
          <Text style={styles.logo}>👗</Text>
          <Text style={styles.title}>오늘 뭐 입지</Text>
          <Text style={styles.subtitle}>AI 개인 스타일리스트</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>이메일</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="이메일 주소를 입력하세요"
              placeholderTextColor={colors.text.tertiary}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>비밀번호</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="비밀번호를 입력하세요"
              placeholderTextColor={colors.text.tertiary}
              secureTextEntry
              autoComplete="password"
            />
          </View>

          <Button
            title="로그인"
            onPress={handleLogin}
            isLoading={isLoading}
            style={styles.loginButton}
          />

          <TouchableOpacity onPress={() => router.push('/(auth)/register')} style={styles.registerLink}>
            <Text style={styles.registerText}>
              계정이 없으신가요? <Text style={styles.registerHighlight}>회원가입</Text>
            </Text>
          </TouchableOpacity>
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
    justifyContent: 'center',
    padding: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  logo: {
    fontSize: 64,
    marginBottom: spacing.md,
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
  loginButton: {
    marginTop: spacing.sm,
  },
  registerLink: {
    alignItems: 'center',
    padding: spacing.sm,
  },
  registerText: {
    ...typography.body,
    color: colors.text.secondary,
  },
  registerHighlight: {
    color: colors.primary,
    fontWeight: '600',
  },
});
