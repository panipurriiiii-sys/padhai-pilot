import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Screen } from '../../components/common/Screen';
import { QueryBoundary } from '../../components/common/QueryBoundary';
import { Segmented } from '../../components/common/Segmented';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Body, Caption, Subtitle } from '../../components/common/Typography';
import { useDiaryData, useMaterialsData } from '../../hooks/useStudentData';
import { useTheme } from '../../theme/ThemeContext';
import { formatDate } from '../../lib/format';
import { openUrl } from '../../lib/links';

type Tab = 'diary' | 'notes';

export const StudentDiaryScreen: React.FC = () => {
  const { spacing } = useTheme();
  const [tab, setTab] = useState<Tab>('diary');
  const diary = useDiaryData();
  const materials = useMaterialsData();
  const active = tab === 'diary' ? diary : materials;

  return (
    <Screen
      eyebrow="LEARNING VAULT"
      title={tab === 'diary' ? 'Daily teaching diary' : 'Notes & study material'}
      subtitle="Published by your faculty for your batch"
      refreshing={active.isRefetching}
      onRefresh={() => active.refetch()}
    >
      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { key: 'diary', label: 'Diary' },
          { key: 'notes', label: 'Notes' },
        ]}
      />

      {tab === 'diary' ? (
        <QueryBoundary
          query={diary}
          isEmpty={(d) => d.length === 0}
          emptyTitle="No diary entries yet"
          emptyDescription="Your teachers' lesson summaries will appear here after each class."
        >
          {(entries) =>
            entries.map((e) => (
              <Card key={e.id} style={{ marginBottom: spacing.md }}>
                <View style={styles.row}>
                  <Badge label={e.subject} variant="primary" />
                  <Caption>{formatDate(e.lessonDate)}</Caption>
                </View>
                <Subtitle style={{ marginTop: spacing.xs }}>{e.chapterTitle}</Subtitle>
                <Caption>{`${e.facultyName}${e.sessionTime ? ` · ${e.sessionTime}` : ''}`}</Caption>
                <Body style={{ marginTop: spacing.sm }}>{e.conceptsTaught}</Body>
                {e.learningObjectives ? <Caption style={{ marginTop: spacing.xs }}>{`Goal: ${e.learningObjectives}`}</Caption> : null}
                {e.homeworkAssigned ? (
                  <Caption style={{ marginTop: spacing.xs }}>{`Homework: ${e.homeworkAssigned}`}</Caption>
                ) : null}
                {e.attachmentUrl ? (
                  <Button
                    title="Open attachment"
                    variant="secondary"
                    size="sm"
                    style={{ marginTop: spacing.sm }}
                    onPress={() => openUrl(e.attachmentUrl)}
                  />
                ) : null}
              </Card>
            ))
          }
        </QueryBoundary>
      ) : (
        <QueryBoundary
          query={materials}
          isEmpty={(d) => d.length === 0}
          emptyTitle="No study material yet"
          emptyDescription="Notes, worksheets and formula sheets shared by your faculty will appear here."
        >
          {(items) =>
            items.map((m) => (
              <Card key={m.id} style={{ marginBottom: spacing.md }}>
                <View style={styles.row}>
                  <Badge label={m.category.replace(/_/g, ' ')} variant="neutral" />
                  <Caption>{m.subject}</Caption>
                </View>
                <Subtitle style={{ marginTop: spacing.xs }}>{m.title}</Subtitle>
                <Caption>{`${m.facultyName} · ${formatDate(m.createdAt)}${m.fileSize ? ` · ${m.fileSize}` : ''}`}</Caption>
                {m.content ? <Body style={{ marginTop: spacing.sm }} numberOfLines={4}>{m.content}</Body> : null}
                {m.fileUrl ? (
                  <Button
                    title="Open"
                    variant="secondary"
                    size="sm"
                    style={{ marginTop: spacing.sm }}
                    onPress={() => openUrl(m.fileUrl)}
                  />
                ) : null}
              </Card>
            ))
          }
        </QueryBoundary>
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
});
