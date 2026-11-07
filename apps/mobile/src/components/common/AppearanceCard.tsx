import React from 'react';
import { Caption, Subtitle } from './Typography';
import { Card } from './Card';
import { Segmented } from './Segmented';
import { ColorSchemePreference, useTheme } from '../../theme/ThemeContext';

/** Light / dark / follow-system switch (the shared paper-desk palette has a matching dark set). */
export const AppearanceCard: React.FC = () => {
  const { preference, setPreference } = useTheme();
  return (
    <Card style={{ marginBottom: 16 }}>
      <Subtitle>Appearance</Subtitle>
      <Caption style={{ marginBottom: 8 }}>Paper-desk light theme by default; dark follows the shared dark palette.</Caption>
      <Segmented<ColorSchemePreference>
        value={preference}
        onChange={setPreference}
        options={[
          { key: 'light', label: 'Light' },
          { key: 'dark', label: 'Dark' },
          { key: 'system', label: 'System' },
        ]}
      />
    </Card>
  );
};
