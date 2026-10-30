import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Subtitle, Body } from './Typography';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message,
  onRetry,
  style,
}) => {
  const { colors, spacing } = useTheme();

  return (
    <View style={[styles.container, { padding: spacing.xxl }, style]}>
      <Subtitle
        align="center"
        color={colors.error}
        style={{ marginBottom: spacing.xs }}
      >
        {title}
      </Subtitle>
      <Body align="center" style={{ marginBottom: onRetry ? spacing.lg : 0 }}>
        {message}
      </Body>
      {onRetry && (
        <Button
          title="Try again"
          onPress={onRetry}
          variant="secondary"
          size="md"
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

