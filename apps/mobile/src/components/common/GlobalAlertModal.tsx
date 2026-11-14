import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useAlertStore, AlertType } from '../../store/useAlertStore';
import { useTheme } from '../../theme/ThemeContext';
import { LuxuryIcon, LuxuryIconTone } from './LuxuryIcon';
import { IconName } from './iconNodes';

const TYPE_CONFIG: Record<AlertType, { tone: LuxuryIconTone; icon: IconName; defaultTitle: string }> = {
  success: { tone: 'emerald', icon: 'checkCircle', defaultTitle: 'Success' },
  error: { tone: 'ruby', icon: 'alertTriangle', defaultTitle: 'Attention' },
  warning: { tone: 'gold', icon: 'alertCircle', defaultTitle: 'Warning' },
  confirm: { tone: 'sapphire', icon: 'helpCircle', defaultTitle: 'Confirm Action' },
  info: { tone: 'emerald', icon: 'info', defaultTitle: 'Notice' },
};

export const GlobalAlertModal: React.FC = () => {
  const { activeAlert, closeAlert } = useAlertStore();
  const { colors, isDark, typography } = useTheme();

  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (activeAlert) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 65,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.92);
      opacityAnim.setValue(0);
    }
  }, [activeAlert, scaleAnim, opacityAnim]);

  if (!activeAlert) return null;

  const config = TYPE_CONFIG[activeAlert.type] || TYPE_CONFIG.info;
  const isConfirm = activeAlert.type === 'confirm' || Boolean(activeAlert.cancelText);

  const handleConfirm = () => {
    const cb = activeAlert.onConfirm;
    closeAlert();
    cb?.();
  };

  const handleCancel = () => {
    const cb = activeAlert.onCancel;
    closeAlert();
    cb?.();
  };

  return (
    <Modal
      transparent
      visible={Boolean(activeAlert)}
      animationType="none"
      onRequestClose={handleCancel}
      statusBarTranslucent
    >
      <View style={[styles.overlay, { backgroundColor: colors.scrim || 'rgba(0,0,0,0.6)' }]}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={isConfirm ? undefined : handleCancel}
        />

        <Animated.View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          {/* Top Luxury Icon Badge */}
          <View style={styles.iconContainer}>
            <LuxuryIcon
              name={config.icon}
              tone={config.tone}
              size="lg"
              variant="glow"
            />
          </View>

          {/* Title with Playfair Display typography */}
          <Text
            style={[
              styles.title,
              {
                color: colors.textPrimary,
                fontFamily: typography.fonts.display,
              },
            ]}
          >
            {activeAlert.title || config.defaultTitle}
          </Text>

          {/* Description text with Inter typography */}
          {Boolean(activeAlert.message) && (
            <Text
              style={[
                styles.message,
                {
                  color: colors.textSecondary,
                  fontFamily: typography.fonts.data,
                },
              ]}
            >
              {activeAlert.message}
            </Text>
          )}

          {/* Action Buttons */}
          <View style={[styles.buttonRow, isConfirm ? styles.dualButtonRow : undefined]}>
            {isConfirm && (
              <Pressable
                onPress={handleCancel}
                style={({ pressed }) => [
                  styles.button,
                  styles.cancelButton,
                  {
                    borderColor: colors.borderStrong,
                    backgroundColor: pressed
                      ? colors.surfaceElevated
                      : colors.surfaceSubtle,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.cancelButtonText,
                    {
                      color: colors.textSecondary,
                      fontFamily: typography.fonts.ui,
                    },
                  ]}
                >
                  {activeAlert.cancelText || 'Cancel'}
                </Text>
              </Pressable>
            )}

            <Pressable
              onPress={handleConfirm}
              style={({ pressed }) => [
                styles.button,
                styles.confirmButton,
                {
                  backgroundColor: activeAlert.isDestructive
                    ? (colors.errorSolid || '#F43F5E')
                    : colors.primary,
                  opacity: pressed ? 0.88 : 1,
                },
              ]}
            >
              <Text
                style={[
                  styles.confirmButtonText,
                  {
                    color: colors.primaryContrast || '#FFFFFF',
                    fontFamily: typography.fonts.ui,
                  },
                ]}
              >
                {activeAlert.confirmText || (isConfirm ? 'Confirm' : 'Done')}
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 22,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: -0.2,
  },
  message: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: 24,
  },
  buttonRow: {
    width: '100%',
    flexDirection: 'row',
  },
  dualButtonRow: {
    gap: 12,
  },
  button: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  confirmButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
