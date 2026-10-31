import React, { useEffect, useState } from 'react';
import { Alert, View, StyleSheet } from 'react-native';
import { Screen, SectionTitle } from '../../components/common/Screen';
import { QueryBoundary } from '../../components/common/QueryBoundary';
import { BatchPicker } from '../../components/common/BatchPicker';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Caption, Subtitle } from '../../components/common/Typography';
import { useAssessments, usePublishAssessment, useRoster, useSaveMarksDraft } from '../../hooks/useTeacherData';
import { errorMessage, formatDate, todayIso } from '../../lib/format';

interface Entry {
  marks: string;
  absent: boolean;
}

export const BulkMarksEntryScreen: React.FC = () => {
  const [batchId, setBatchId] = useState<string>();
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [maxMarks, setMaxMarks] = useState('100');
  const [entries, setEntries] = useState<Record<string, Entry>>({});
  const [assessmentId, setAssessmentId] = useState<string>();
  const roster = useRoster(batchId);
  const assessments = useAssessments();
  const saveDraft = useSaveMarksDraft();
  const publish = usePublishAssessment();

  useEffect(() => {
    if (roster.data) {
      setEntries(Object.fromEntries(roster.data.students.map((s) => [s.id, { marks: '', absent: false }])));
      setAssessmentId(undefined);
    }
  }, [roster.data]);

  const max = Number(maxMarks);
  const rowError = (e: Entry): string | null => {
    if (e.absent || e.marks === '') return null;
    const n = Number(e.marks);
    return Number.isNaN(n) || n < 0 || n > max ? `0 – ${max}` : null;
  };
  const hasErrors = Object.values(entries).some((e) => rowError(e));
  const ready = !!batchId && title.trim() && subject.trim() && max > 0 && !hasErrors;

  const onSave = () =>
    saveDraft.mutate(
      {
        assessmentId,
        batchId: batchId as string,
        title: title.trim(),
        subject: subject.trim(),
        assessmentDate: todayIso(),
        maxMarks: max,
        marks: Object.entries(entries).map(([studentId, e]) => ({
          studentId,
          attendanceStatus: e.absent ? 'ABSENT' : 'PRESENT',
          obtainedMarks: e.absent || e.marks === '' ? null : Number(e.marks),
        })),
      },
      {
        onSuccess: (r) => {
          setAssessmentId(r.assessmentId);
          Alert.alert('Draft saved', 'Review the entries, then publish when ready.');
        },
        onError: (e) => Alert.alert('Could not save draft', errorMessage(e)),
      },
    );

  const onPublish = () =>
    Alert.alert('Publish results?', 'Each student will see only their own result. Corrections after this are audited.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Publish',
        onPress: () =>
          publish.mutate(assessmentId as string, {
            onSuccess: () => {
              setAssessmentId(undefined);
              Alert.alert('Published', 'Results are now visible to students.');
            },
            onError: (e) => Alert.alert('Could not publish', errorMessage(e)),
          }),
      },
    ]);

  return (
    <Screen eyebrow="MARKS" title="Bulk marks entry" subtitle="Set total marks once, enter each student's score, save, then publish">
      <BatchPicker value={batchId} onChange={setBatchId} />
      <Input label="Assessment title" value={title} onChangeText={setTitle} />
      <Input label="Subject" value={subject} onChangeText={setSubject} />
      <Input label="Total marks" value={maxMarks} onChangeText={setMaxMarks} keyboardType="number-pad" />

      {batchId ? (
        <QueryBoundary
          query={roster}
          isEmpty={(r) => r.students.length === 0}
          emptyTitle="No students in this batch"
          emptyDescription="Students appear here after they join with an invitation code."
        >
          {(r) => (
            <>
              {r.students.map((s) => {
                const e = entries[s.id] ?? { marks: '', absent: false };
                return (
                  <Card key={s.id} style={{ marginBottom: 8 }}>
                    <View style={styles.row}>
                      <View style={{ flex: 1 }}>
                        <Subtitle>{s.fullName}</Subtitle>
                        <Caption>{s.rollNumber}</Caption>
                      </View>
                      <Button
                        title={e.absent ? 'Absent' : 'Present'}
                        variant={e.absent ? 'danger' : 'secondary'}
                        size="sm"
                        onPress={() => setEntries((m) => ({ ...m, [s.id]: { ...e, absent: !e.absent } }))}
                      />
                    </View>
                    {!e.absent ? (
                      <Input
                        label={`Marks (out of ${max || '—'})`}
                        value={e.marks}
                        keyboardType="decimal-pad"
                        error={rowError(e)}
                        onChangeText={(t) => setEntries((m) => ({ ...m, [s.id]: { ...e, marks: t } }))}
                      />
                    ) : null}
                  </Card>
                );
              })}
              <Button title="Save draft" loading={saveDraft.isPending} disabled={!ready} onPress={onSave} />
              {assessmentId ? (
                <Button
                  title="Publish results"
                  variant="primary"
                  loading={publish.isPending}
                  onPress={onPublish}
                  style={{ marginTop: 8 }}
                />
              ) : null}
            </>
          )}
        </QueryBoundary>
      ) : (
        <Caption>Select a batch to enter marks.</Caption>
      )}

      <SectionTitle>Recent assessments</SectionTitle>
      <QueryBoundary query={assessments} isEmpty={(a) => a.length === 0} emptyTitle="Nothing yet" emptyDescription="Saved and published assessments appear here.">
        {(items) =>
          items.slice(0, 10).map((a) => (
            <Card key={a.id} style={{ marginBottom: 8 }}>
              <View style={styles.row}>
                <Subtitle style={{ flex: 1 }}>{a.title}</Subtitle>
                <Badge label={a.status} variant={a.status === 'PUBLISHED' ? 'success' : 'warning'} />
              </View>
              <Caption>{`${a.subject} · ${a.batchName ?? ''} · ${formatDate(a.assessmentDate)} · /${a.maxMarks}`}</Caption>
            </Card>
          ))
        }
      </QueryBoundary>
    </Screen>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
