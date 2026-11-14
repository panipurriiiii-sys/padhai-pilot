import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, View, StyleSheet } from 'react-native';
import { presentAlert as Alert } from '../../store/useAlertStore';
import { openPdf } from '../../lib/pdf';
import { documentPaths } from '../../services/api/financeService';
import { SectionTitle } from '../../components/common/Screen';
import { QueryBoundary } from '../../components/common/QueryBoundary';
import { BatchPicker } from '../../components/common/BatchPicker';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Caption, Subtitle } from '../../components/common/Typography';
import { useAssessments, useBatches, usePublishAssessment, useRoster, useSaveMarksDraft } from '../../hooks/useTeacherData';
import { useTheme } from '../../theme/ThemeContext';
import { errorMessage, formatDate, todayIso } from '../../lib/format';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DeskBackground } from '../../components/common/Paper';
import { StatusBar, Text, RefreshControl } from 'react-native';

interface Entry {
  marks: string;
  absent: boolean;
}

interface StudentRow {
  id: string;
  fullName: string;
  rollNumber: string;
}

const StudentMarksRow = React.memo(({
  student,
  entry,
  max,
  onChange,
  onToggleAbsent,
}: {
  student: StudentRow;
  entry: Entry;
  max: number;
  onChange: (id: string, marks: string) => void;
  onToggleAbsent: (id: string) => void;
}) => {
  const rowError = (() => {
    if (entry.absent || entry.marks === '') return null;
    const n = Number(entry.marks);
    return Number.isNaN(n) || n < 0 || n > max ? `0 – ${max}` : null;
  })();

  return (
    <Card style={{ marginBottom: 8 }}>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Subtitle>{student.fullName}</Subtitle>
          <Caption>{student.rollNumber}</Caption>
        </View>
        <Button
          title={entry.absent ? 'Absent' : 'Present'}
          variant={entry.absent ? 'danger' : 'secondary'}
          size="sm"
          onPress={() => onToggleAbsent(student.id)}
        />
      </View>
      {!entry.absent ? (
        <Input
          label={`Marks (out of ${max || '—'})`}
          value={entry.marks}
          keyboardType="decimal-pad"
          returnKeyType="next"
          error={rowError}
          onChangeText={(t) => onChange(student.id, t)}
        />
      ) : null}
    </Card>
  );
});
StudentMarksRow.displayName = 'StudentMarksRow';

export const BulkMarksEntryScreen: React.FC = () => {
  const { colors, typography } = useTheme();
  const insets = useSafeAreaInsets();
  const [batchId, setBatchId] = useState<string>();
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [maxMarks, setMaxMarks] = useState('100');
  const [entries, setEntries] = useState<Record<string, Entry>>({});
  const [assessmentId, setAssessmentId] = useState<string>();
  const prevBatchIdRef = useRef<string | undefined>(undefined);
  const isDirtyRef = useRef(false);
  const roster = useRoster(batchId);
  const assessments = useAssessments();
  const saveDraft = useSaveMarksDraft();
  const publish = usePublishAssessment();
  const batches = useBatches();

  useEffect(() => {
    if (batchId) {
      const b = batches.data?.find((x) => x.id === batchId);
      if (b?.subject && !subject) setSubject(b.subject);
    }
  }, [batchId, batches.data]);

  // Only re-initialize entries when the batch actually changes, never wipe on query background refetches!
  useEffect(() => {
    if (roster.data) {
      const batchChanged = prevBatchIdRef.current !== batchId;
      if (batchChanged || !isDirtyRef.current) {
        setEntries(Object.fromEntries(roster.data.students.map((s) => [s.id, { marks: '', absent: false }])));
        if (batchChanged) {
          setAssessmentId(undefined);
          prevBatchIdRef.current = batchId;
          isDirtyRef.current = false;
        }
      }
    }
  }, [roster.data, batchId]);

  const max = Number(maxMarks);
  const hasErrors = useMemo(
    () => Object.values(entries).some((e) => {
      if (e.absent || e.marks === '') return false;
      const n = Number(e.marks);
      return Number.isNaN(n) || n < 0 || n > max;
    }),
    [entries, max],
  );
  const ready = !!batchId && title.trim() && subject.trim() && max > 0 && !hasErrors;

  const handleMarksChange = useCallback((id: string, marks: string) => {
    isDirtyRef.current = true;
    setEntries((m) => ({ ...m, [id]: { ...m[id], marks } }));
  }, []);

  const handleToggleAbsent = useCallback((id: string) => {
    isDirtyRef.current = true;
    setEntries((m) => ({ ...m, [id]: { ...m[id], absent: !m[id].absent } }));
  }, []);

  const onSave = () => {
    if (!batchId || !ready) return;
    saveDraft.mutate(
      {
        assessmentId,
        batchId,
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
          isDirtyRef.current = false;
          Alert.alert('Draft saved', 'Review the entries, then publish when ready.');
        },
        onError: (e) => Alert.alert('Could not save draft', errorMessage(e)),
      },
    );
  };

  const onPublish = () => {
    if (!assessmentId) return;
    Alert.alert('Publish results?', 'Each student will see only their own result. Corrections after this are audited.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Publish',
        onPress: () =>
          publish.mutate(assessmentId, {
            onSuccess: () => {
              setAssessmentId(undefined);
              isDirtyRef.current = false;
              Alert.alert('Published', 'Results are now visible to students.');
            },
            onError: (e) => Alert.alert('Could not publish', errorMessage(e)),
          }),
      },
    ]);
  };

  const students: StudentRow[] = roster.data?.students ?? [];

  const renderStudent = useCallback(
    ({ item }: { item: StudentRow }) => (
      <StudentMarksRow
        student={item}
        entry={entries[item.id] ?? { marks: '', absent: false }}
        max={max}
        onChange={handleMarksChange}
        onToggleAbsent={handleToggleAbsent}
      />
    ),
    [entries, max, handleMarksChange, handleToggleAbsent],
  );

  const ListHeader = (
    <View>
      <View style={{ marginBottom: 18 }}>
        <Text style={{ fontFamily: typography.fonts.ui, fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', color: colors.textMuted, marginBottom: 6 }}>
          MARKS
        </Text>
        <Text style={{ fontFamily: typography.fonts.display, fontSize: 26, lineHeight: 32, fontWeight: '700', letterSpacing: -0.4, color: colors.textPrimary }}>
          Bulk marks entry
        </Text>
        <Text style={{ fontFamily: typography.fonts.ui, fontSize: 13, lineHeight: 18, color: colors.textSecondary, marginTop: 4 }}>
          Set total marks once, enter each score, save draft, then publish
        </Text>
      </View>
      <BatchPicker value={batchId} onChange={setBatchId} />
      <Input label="Assessment title" value={title} onChangeText={setTitle} returnKeyType="next" />
      <Input label="Subject" value={subject} onChangeText={setSubject} returnKeyType="next" />
      <Input label="Total marks" value={maxMarks} onChangeText={setMaxMarks} keyboardType="number-pad" returnKeyType="done" />
      {!batchId && <Caption>Select a batch to enter marks.</Caption>}
      {batchId && roster.isLoading && <Caption>Loading students…</Caption>}
      {batchId && !roster.isLoading && students.length > 0 && (
        <Caption style={{ marginTop: 12, marginBottom: 4 }}>{`${students.length} students`}</Caption>
      )}
      {batchId && !roster.isLoading && students.length === 0 && roster.isSuccess && (
        <Caption>No students in this batch yet.</Caption>
      )}
    </View>
  );

  const ListFooter = (
    <View>
      {students.length > 0 && (
        <>
          <Button title="Save draft" loading={saveDraft.isPending} disabled={!ready} onPress={onSave} style={{ marginTop: 8 }} />
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
              <Button title="Result sheet PDF" size="sm" variant="outline" style={{ marginTop: 8, alignSelf: 'flex-start' }} onPress={() => void openPdf(documentPaths.resultSheet(a.id), `result-sheet-${a.title}`)} />
            </Card>
          ))
        }
      </QueryBoundary>
    </View>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}>
      <StatusBar barStyle={colors.textPrimary === '#fff' || colors.textPrimary?.startsWith('#f') ? 'light-content' : 'dark-content'} />
      <DeskBackground />
      <FlatList
        data={students}
        keyExtractor={(s) => s.id}
        renderItem={renderStudent}
        ListHeaderComponent={ListHeader}
        ListFooterComponent={ListFooter}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        removeClippedSubviews
        maxToRenderPerBatch={15}
        initialNumToRender={12}
        windowSize={5}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + 14, paddingHorizontal: 16, paddingBottom: 40, maxWidth: 640, alignSelf: 'center', width: '100%' }}
        refreshControl={
          <RefreshControl refreshing={!!roster.isRefetching} onRefresh={() => roster.refetch()} tintColor={colors.primary} />
        }
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
