import {
  TabList,
  Tabs,
  TabSlot,
  TabTrigger,
  type TabListProps,
  type TabTriggerSlotProps,
} from 'expo-router/ui';
import type { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { UndoBanner } from '@/features/tasks/UndoBanner';
import { getEnabledModules } from '@/modules/registry';
import { useNotificationSync } from '@/notifications/useNotificationSync';
import { useSession } from '@/state/session';
import { Text, colors, maxContentWidth, minTouchSize, radii, shadows, spacing } from '@/ui';

export default function TabsLayout() {
  const { t } = useTranslation();
  const household = useSession((state) => state.household);
  const visibleModules = getEnabledModules(household?.enabledModules ?? {});
  useNotificationSync();

  return (
    <Tabs style={styles.root}>
      <View style={styles.slot}>
        <TabSlot style={styles.slot} />
        <UndoBanner />
      </View>
      <TabList asChild>
        <TabBar>
          <TabTrigger name="today" href="/" asChild>
            <TabButton icon="🏠" label={t('tabs.today')} />
          </TabTrigger>
          {visibleModules.map((module) => (
            <TabTrigger key={module.id} name={module.id} href={module.href} asChild>
              <TabButton icon={module.icon} label={t(`tabs.${module.id}`)} />
            </TabTrigger>
          ))}
        </TabBar>
      </TabList>
    </Tabs>
  );
}

function TabBar({ children, style: _style, ...props }: TabListProps) {
  const insets = useSafeAreaInsets();
  return (
    <View
      {...props}
      style={[styles.bar, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
      <View style={styles.barInner}>{children}</View>
    </View>
  );
}

type TabButtonProps = TabTriggerSlotProps & {
  icon: string;
  label: string;
};

function TabButton({
  icon,
  label,
  isFocused,
  ref,
  style: _style,
  children: _children,
  ...props
}: TabButtonProps) {
  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(isFocused ? 1.15 : 1, { damping: 12, stiffness: 220 }) }],
  }));

  return (
    <Pressable
      {...props}
      // Los tipos de `View` de expo-router y de `Pressable` no coinciden; en ejecución es el mismo ref.
      ref={ref as ComponentProps<typeof Pressable>['ref']}
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: !!isFocused }}
      style={styles.tabButton}>
      <View style={[styles.iconPill, isFocused && styles.iconPillFocused]}>
        <Animated.View style={iconStyle}>
          <Text style={styles.tabIcon}>{icon}</Text>
        </Animated.View>
      </View>
      <Text variant="label" color={isFocused ? 'ink' : 'inkSoft'}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  slot: {
    flex: 1,
  },
  bar: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    ...shadows.raised,
  },
  barInner: {
    flexDirection: 'row',
    width: '100%',
    maxWidth: maxContentWidth,
  },
  tabButton: {
    flex: 1,
    minHeight: minTouchSize,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xxs,
  },
  iconPill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xxs,
    borderRadius: radii.pill,
  },
  iconPillFocused: {
    backgroundColor: colors.peachSoft,
  },
  tabIcon: {
    fontSize: 22,
    lineHeight: 28,
  },
});
