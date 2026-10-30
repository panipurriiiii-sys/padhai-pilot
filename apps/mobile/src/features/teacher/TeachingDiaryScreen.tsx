import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
} from 'react-native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Title, Subtitle, Body, Caption, Label } from '../../components/common/Typography';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { useTheme } from '../../theme/ThemeContext';
import { teacherService } from '../../services/api/teacherService';
import type { DailyTeachingDiaryItem, BatchSummary } from '@padhai-pilot/shared';

export const TeachingDiaryScreen: React.FC = () => {
  const { colors, spacing, radii } = useTheme();

  const [entries, setEntries] = useState<DailyTeachingDiaryItem[]>([]);
  const [batches, setBatches] = useState<BatchSummary[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [topicsCovered, setTopicsCovered] = useState('');
  const [homework, setHomework] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [list, bList] = await Promise.all([
        teacherService.getDailyDiary(),
        teacherService.getBatches(),
      ]);
      setEntries(list);
      setBatches(bList);
      if (bList[0]) setSelectedBatchId(bList[0].id);
    } catch {
      // Handled
    }
  };

  const handleSaveEntry = async () => {
    if (!topicsCovered.trim()) {
      Alert.alert('Required', 'Please enter topics taught today.');
      return;
    }

    setIsSubmitting(true);
    try {
      const targetBatch = batches.find((b) => b.id === selectedBatchId) || batches[0];
      const newEntry: DailyTeachingDiaryItem = {
        id: `diary_${Date.now()}`,
        instituteId: 'inst_apex_academy',
        facultyId: 'usr_teacher_sharma',
        facultyName: 'Prof. Rajesh Sharma',
        batchId: selectedBatchId,
        batchName: targetBatch ? targetBatch.name : 'JEE Advanced Mathematics',
        entryDate: new Date().toISOString().split('T')[0],
        subject: targetBatch ? targetBatch.subject : 'Mathematics',
        topicsCovered: topicsCovered.trim(),
        homeworkAssigned: homework.trim(),
        batchPaceStatus: 'ON_TRACK',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setEntries([newEntry, ...entries]);
      setTopicsCovered('');
      setHomework('');
      Alert.alert('Saved!', 'Daily teaching diary log recorded.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={[styles.content, { padding: spacing.lg }]}>
        <View style={{ marginBottom: spacing.md }}>
          <Badge label="CURRICULUM LOG" variant="primary" />
          <Title style={{ marginTop: 4 }}>Daily Teaching Diary</Title>
          <Caption>Maintain continuous tracking of lecture coverage and assigned practice.</Caption>
        </View>

        {/* New Log Card */}
        <Card variant="elevated" style={{ marginBottom: spacing.lg }}>
          <Subtitle style={{ marginBottom: spacing.sm }}>Record Today&apos;s Lecture</Subtitle>

          <Label style={{ marginBottom: 4 }}>Batch</Label>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md }}>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {batches.map((b) => (
                <Pressable
                  key={b.id}
                  onPress={() => setSelectedBatchId(b.id)}
                  style={[
                    styles.batchPill,
                    {
                      backgroundColor: selectedBatchId === b.id ? colors.primary : colors.surfaceSubtle,
                      borderRadius: radii.sm,
                    },
                  ]}
                >
                  <Label
                    style={{
                      color: selectedBatchId === b.id ? colors.primaryContrast : colors.textPrimary,
                      fontSize: 11,
                    }}
                  >
                    {b.name}
                  </Label>
                </Pressable>
              ))}
            </View>
          </ScrollView>

          <Label style={{ marginBottom: 4 }}>Concepts & Topics Covered *</Label>
          <TextInput
            value={topicsCovered}
            onChangeText={setTopicsCovered}
            placeholder="e.g. Definite Integrals — Leibniz formula proofs"
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={2}
            style={[
              styles.input,
              {
                backgroundColor: colors.surfaceSubtle,
                color: colors.textPrimary,
                borderColor: colors.border,
                borderRadius: radii.md,
                marginBottom: spacing.md,
              },
            ]}
          />

          <Label style={{ marginBottom: 4 }}>Homework / DPP Assigned</Label>
          <TextInput
            value={homework}
            onChangeText={setHomework}
            placeholder="e.g. DPP #15 Questions 1 to 20"
            placeholderTextColor={colors.textMuted}
            style={[
              styles.input,
              {
                backgroundColor: colors.surfaceSubtle,
                color: colors.textPrimary,
                borderColor: colors.border,
                borderRadius: radii.md,
                marginBottom: spacing.md,
              },
            ]}
          />

          <Button
            title="Log Lecture Progress"
            loading={isSubmitting}
            onPress={handleSaveEntry}
          />
        </Card>

        {/* Diary History */}
        <Subtitle style={{ marginBottom: spacing.sm }}>Recent Teaching Logs ({entries.length})</Subtitle>
        {entries.map((entry) => (
          <Card key={entry.id} style={{ marginBottom: spacing.sm }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <Label style={{ color: colors.textPrimary }}>{entry.batchName}</Label>
              <Badge label={entry.batchPaceStatus || 'ON TRACK'} variant="success" />
            </View>

            <Body style={{ marginTop: 2, fontSize: 13, color: colors.textSecondary }}>{entry.topicsCovered}</Body>

            {entry.homeworkAssigned && (
              <Caption style={{ marginTop: 4 }}>Homework: {entry.homeworkAssigned}</Caption>
            )}

            <View style={{ marginTop: spacing.sm, borderTopColor: colors.borderSubtle, borderTopWidth: 1, paddingTop: 4 }}>
              <Caption style={{ fontVariant: ['tabular-nums'] }}>{entry.entryDate} • {entry.facultyName}</Caption>
            </View>
          </Card>
        ))}
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingBottom: 40,
  },
  batchPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  input: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    fontSize: 13,
  },
});

