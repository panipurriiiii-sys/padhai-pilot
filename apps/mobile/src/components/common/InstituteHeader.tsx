import React, { useState } from 'react';
import { Image, Text, View } from 'react-native';
import { useBranding } from '../../hooks/useFinanceData';
import { useAuthStore } from '../../store/useAuthStore';
import { useTheme } from '../../theme/ThemeContext';
import { Card } from './Card';

/**
 * Institute identity from GET /branding (logo, name, address/contact, signatory). Read-only on mobile.
 * Branding is decorative: a failed request silently falls back to the institute name from the session and never
 * blocks the screen. The platform name is never shown here.
 */
export const InstituteHeader: React.FC<{ compact?: boolean; showLetterhead?: boolean }> = ({ compact, showLetterhead }) => {
  const { colors, typography } = useTheme();
  const q = useBranding();
  const fallback = useAuthStore((s) => s.session?.user?.instituteName);
  const [logoFailed, setLogoFailed] = useState(false);
  const b = q.data;
  const name = (b?.name && b.name.trim()) || fallback;
  if (!name && !b?.logoUrl) return null;
  const logo = b?.logoUrl && /^https:\/\//i.test(b.logoUrl) && !logoFailed ? b.logoUrl : null;
  const size = compact ? 36 : 48;
  const contact = [b?.address, b?.contactPhone, b?.contactEmail, b?.website].filter(Boolean).join(' · ');

  return (
    <Card style={{ marginBottom: 14, padding: compact ? 10 : 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        {logo ? (
          <Image
            source={{ uri: logo }}
            onError={() => setLogoFailed(true)}
            accessibilityLabel={`${name ?? 'Institute'} logo`}
            style={{ width: size, height: size, borderRadius: 10, backgroundColor: colors.surfaceElevated }}
            resizeMode="contain"
          />
        ) : (
          <View style={{ width: size, height: size, borderRadius: 10, backgroundColor: colors.primarySubtle, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontFamily: typography.fonts.display, fontSize: size * 0.45, fontWeight: '700', color: colors.primary }}>
              {(name ?? '?').trim().charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text numberOfLines={2} style={{ fontFamily: typography.fonts.display, fontSize: compact ? 15 : 17, fontWeight: '700', color: colors.textPrimary }}>
            {name}
          </Text>
          {contact ? (
            <Text numberOfLines={showLetterhead ? 4 : 2} style={{ fontFamily: typography.fonts.ui, fontSize: 11.5, lineHeight: 16, color: colors.textMuted, marginTop: 2 }}>
              {contact}
            </Text>
          ) : null}
        </View>
      </View>
      {showLetterhead && (b?.signatoryName || b?.footerText) ? (
        <View style={{ marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border }}>
          {b?.signatoryName ? (
            <Text style={{ fontFamily: typography.fonts.ui, fontSize: 12, color: colors.textSecondary }}>
              {`Signatory: ${b.signatoryName}${b.signatoryTitle ? `, ${b.signatoryTitle}` : ''}`}
            </Text>
          ) : null}
          {b?.footerText ? (
            <Text style={{ fontFamily: typography.fonts.ui, fontSize: 11, color: colors.textMuted, marginTop: 2 }}>{b.footerText}</Text>
          ) : null}
        </View>
      ) : null}
    </Card>
  );
};
