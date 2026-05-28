import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '@/constants/theme';

function TabIcon({ emoji, label, focused }: { emoji: string; label: string; focused: boolean }) {
  return (
    <View style={tab.wrap}>
      <Text style={tab.emoji}>{emoji}</Text>
      <Text style={[tab.label, focused && tab.labelOn]}>{label}</Text>
    </View>
  );
}

const tab = StyleSheet.create({
  wrap: { alignItems: 'center', paddingTop: 4 },
  emoji: { fontSize: 22 },
  label: { fontSize: 10, marginTop: 2, color: colors.text.tertiary },
  labelOn: { color: colors.primary, fontWeight: '600' },
});

export default function MainLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: 80,
          paddingBottom: spacing.md,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" label="홈" focused={focused} /> }}
      />
      <Tabs.Screen
        name="feedback"
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="📸" label="평가" focused={focused} /> }}
      />
      <Tabs.Screen
        name="wardrobe"
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="👔" label="옷장" focused={focused} /> }}
      />
      <Tabs.Screen
        name="settings"
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="⚙️" label="설정" focused={focused} /> }}
      />
      {/* 숨김 처리 (탭에는 노출 안 하지만 라우트로 접근 가능) */}
      <Tabs.Screen name="recommendation" options={{ href: null }} />
    </Tabs>
  );
}
