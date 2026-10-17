import React from 'react';
import { Text, View, StyleSheet, TextStyle, ViewStyle } from 'react-native';
import { Colors } from '../../constants/colors';

export type IconName =
  | 'wallet'
  | 'home'
  | 'orders'
  | 'team'
  | 'rewards'
  | 'profile'
  | 'bell'
  | 'send'
  | 'receive'
  | 'swap'
  | 'buy'
  | 'sell'
  | 'arrow-right'
  | 'arrow-left'
  | 'check'
  | 'copy'
  | 'share'
  | 'lock'
  | 'shield'
  | 'star'
  | 'info'
  | 'settings'
  | 'logout'
  | 'chevron-right'
  | 'chevron-down'
  | 'sparkle'
  | 'gift'
  | 'users'
  | 'search'
  | 'edit'
  | 'crypto'
  | 'filter';

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  style?: ViewStyle;
}

const ICON_SYMBOL_MAP: Record<IconName, string> = {
  wallet: '💼',
  home: '🏠',
  orders: '📋',
  team: '👥',
  rewards: '🎁',
  profile: '👤',
  bell: '🔔',
  send: '↗️',
  receive: '↙️',
  swap: '🔄',
  buy: '💳',
  sell: '🪙',
  'arrow-right': '➔',
  'arrow-left': '‹',
  check: '✓',
  copy: '📄',
  share: '🔗',
  lock: '🔒',
  shield: '🛡️',
  star: '⭐',
  info: 'ℹ️',
  settings: '⚙️',
  logout: '🚪',
  'chevron-right': '›',
  'chevron-down': '˅',
  sparkle: '✨',
  gift: '🎉',
  users: '🧑‍🤝‍🧑',
  search: '🔍',
  edit: '✏️',
  crypto: '⚡',
  filter: '⚡',
};

export const AppIcon: React.FC<IconProps> = ({
  name,
  size = 20,
  color = Colors.primary,
  style,
}) => {
  return (
    <View style={[styles.container, { width: size + 4, height: size + 4 }, style]}>
      <Text style={{ fontSize: size * 0.9, textAlign: 'center' }}>
        {ICON_SYMBOL_MAP[name] || '•'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
