import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

const { width } = Dimensions.get('window');

export type AlertType = 'error' | 'success' | 'warning' | 'info';

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

export interface CustomAlertModalProps {
  visible: boolean;
  title: string;
  message?: string;
  type?: AlertType;
  badgeText?: string;
  buttons?: AlertButton[];
  onDismiss?: () => void;
  dismissable?: boolean;
}

export const CustomAlertModal: React.FC<CustomAlertModalProps> = ({
  visible,
  title,
  message,
  type = 'info',
  badgeText,
  buttons,
  onDismiss,
  dismissable = true,
}) => {
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 70,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.85);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  if (!visible) return null;

  // Visual Theme Configuration based on type
  const theme = {
    error: {
      gradient: ['#EF4444', '#DC2626'] as [string, string],
      iconBg: '#FEEFEE',
      iconColor: '#EE5D50',
      iconName: 'alert-circle' as const,
      badgeBg: '#FEEFEE',
      badgeColor: '#EE5D50',
      defaultBadge: 'ALERT NOTICE',
      glowColor: 'rgba(238, 93, 80, 0.25)',
    },
    success: {
      gradient: ['#10B981', '#05CD99'] as [string, string],
      iconBg: '#E6FAF5',
      iconColor: '#05CD99',
      iconName: 'checkmark-circle' as const,
      badgeBg: '#E6FAF5',
      badgeColor: '#05CD99',
      defaultBadge: 'SUCCESS',
      glowColor: 'rgba(5, 205, 153, 0.25)',
    },
    warning: {
      gradient: ['#F59E0B', '#D97706'] as [string, string],
      iconBg: '#FFF7EB',
      iconColor: '#FFB547',
      iconName: 'warning' as const,
      badgeBg: '#FFF7EB',
      badgeColor: '#D97706',
      defaultBadge: 'ATTENTION',
      glowColor: 'rgba(255, 181, 71, 0.25)',
    },
    info: {
      gradient: ['#4318FF', '#6B35FF'] as [string, string],
      iconBg: '#F4F7FE',
      iconColor: Colors.primary,
      iconName: 'information-circle' as const,
      badgeBg: '#F4F7FE',
      badgeColor: Colors.primary,
      defaultBadge: 'ZAPP PAY NOTICE',
      glowColor: 'rgba(67, 24, 255, 0.22)',
    },
  }[type];

  // Resolve buttons
  const alertButtons = buttons && buttons.length > 0
    ? buttons
    : [{ text: 'Understood', style: 'default' as const, onPress: onDismiss }];

  const handleBackdropPress = () => {
    if (dismissable && onDismiss) {
      onDismiss();
    }
  };

  const handleButtonPress = (btn: AlertButton) => {
    if (btn.onPress) {
      btn.onPress();
    } else if (onDismiss) {
      onDismiss();
    }
  };

  const isMultiButton = alertButtons.length > 1;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleBackdropPress}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation?.()}>
            <Animated.View
              style={[
                styles.card,
                {
                  opacity: opacityAnim,
                  transform: [{ scale: scaleAnim }],
                  shadowColor: theme.glowColor,
                },
              ]}
            >
              {/* Optional Dismiss Close button */}
              {dismissable && (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={onDismiss}
                  style={styles.closeBtn}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Ionicons name="close" size={18} color="#A3AED0" />
                </TouchableOpacity>
              )}

              {/* Icon Container with Outer Halo Glow */}
              <View style={[styles.iconHalo, { backgroundColor: theme.glowColor }]}>
                <View style={[styles.iconBadge, { backgroundColor: theme.iconBg }]}>
                  <Ionicons name={theme.iconName} size={36} color={theme.iconColor} />
                </View>
              </View>

              {/* Status Pill Badge */}
              <View style={[styles.pillBadge, { backgroundColor: theme.badgeBg }]}>
                <Text style={[styles.pillText, { color: theme.badgeColor }]}>
                  {badgeText || theme.defaultBadge}
                </Text>
              </View>

              {/* Title */}
              <Text style={styles.title}>{title}</Text>

              {/* Message */}
              {!!message && <Text style={styles.message}>{message}</Text>}

              {/* Action Buttons Row / Column */}
              <View
                style={[
                  styles.buttonContainer,
                  isMultiButton ? styles.buttonRow : styles.buttonCol,
                ]}
              >
                {alertButtons.map((btn, idx) => {
                  const isCancel = btn.style === 'cancel';
                  const isDestructive = btn.style === 'destructive';

                  if (isCancel) {
                    return (
                      <TouchableOpacity
                        key={idx}
                        activeOpacity={0.7}
                        style={[styles.cancelBtn, isMultiButton && { flex: 1 }]}
                        onPress={() => handleButtonPress(btn)}
                      >
                        <Text style={styles.cancelBtnText}>{btn.text}</Text>
                      </TouchableOpacity>
                    );
                  }

                  const btnGradient = isDestructive
                    ? (['#EF4444', '#DC2626'] as [string, string])
                    : theme.gradient;

                  return (
                    <TouchableOpacity
                      key={idx}
                      activeOpacity={0.88}
                      style={[styles.primaryBtnWrapper, isMultiButton && { flex: 1 }]}
                      onPress={() => handleButtonPress(btn)}
                    >
                      <LinearGradient
                        colors={btnGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.primaryBtnGradient}
                      >
                        <Text style={styles.primaryBtnText}>{btn.text}</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(11, 14, 40, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    ...(Platform.OS === 'web'
      ? ({
          backdropFilter: 'blur(8px)',
        } as any)
      : {}),
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingTop: 28,
    paddingBottom: 22,
    paddingHorizontal: 22,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.28,
    shadowRadius: 28,
    elevation: 16,
    borderWidth: 1,
    borderColor: '#F0F4FD',
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F4F7FE',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  iconHalo: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  iconBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  pillBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4.5,
    borderRadius: 12,
    marginBottom: 12,
  },
  pillText: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 19,
    fontWeight: '800',
    color: '#1B2559',
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: 8,
    paddingHorizontal: 6,
  },
  message: {
    fontSize: 13.5,
    color: '#707EAE',
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '500',
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  buttonContainer: {
    width: '100%',
    gap: 10,
    marginTop: 4,
  },
  buttonCol: {
    flexDirection: 'column',
  },
  buttonRow: {
    flexDirection: 'row',
  },
  primaryBtnWrapper: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 4,
  },
  primaryBtnGradient: {
    paddingVertical: 13,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  cancelBtn: {
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: '#F4F7FE',
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '700',
  },
});
