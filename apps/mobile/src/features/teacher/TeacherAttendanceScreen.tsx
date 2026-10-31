import React, { useEffect, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { Screen } from '../../components/common/Screen';
import { QueryBoundary } from '../../components/common/QueryBoundary';
import { BatchPicker } from '../../components/common/BatchPicker';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { EmptyPaper, SectionHeader, Stamp, StampKind } from '../../components/common/Paper';
import { useAttendanceSession, useRoster, useSaveAttendance } from '../../hooks/useTeacherData';
import type { AttendanceStatus } from '../../services/api/teacherService';
import { useTheme } from '../../theme/ThemeContext';
import { errorMessage, todayIso } from '../../lib/format';

const KINDS: Array<[StampKind, AttendanceStatus]> = [
  ['P', 'PRESENT'],
  ['A', 'ABSENT'],
  ['L', 'LATE'],
  ['E', 'EXCUSED'],
];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const TeacherAttendanceScreen: React.FC = () => {
  const { colors, typography } = useTheme();
  const [batchId, setBatchId] = useState<string>();
  const [date, setDate] = useState(todayIso());
  const [marks, setMarks] = useState<Record<string, AttendanceStatus>>({});
  const validDate = DATE_RE.test(date);
  const roster = useRoster(batchId);
  const session = useAttendanceSession(batchId, validDate ? date : undefined);
  const save = useSaveAttendance();

  // Seed the editable state from what the server already holds for this batch + date.
  useEffect(() => {
    if (!roster.data) return;
    const saved = new Map((session.data?.records ?? []).map((r) => [r.studentId, r.status]));
    setMarks(Object.fromEntries(roster.data.students.map((s) => [s.id, saved.get(s.id) ?? 'PRESENT'])));
  }, [roster.data, session.data]);

  const setAll = (status: AttendanceStatus) => setMarks((m) => Object.fromEntries(Object.keys(m).map((id) => [id, status])));
  const count = (s: AttendanceStatus) => Object.values(marks).filter((v) => v === s).length;
  const summary = `${count('PRESENT')} present · ${count('ABSENT')} absent · ${count('LATE')} late · ${count('EXCUSED')} excused`;

  const onSave = () =>
    save.mutate(
      { batchId: batchId as string, date, records: Object.entries(marks).map(([studentId, status]) => ({ studentId, status })) },
      { onSuccess: () => Alert.alert('Attendance saved', summary), onError: (e) => Alert.alert('Could not save', errorMessage(e)) },
    );

  return (
    <Screen eyebrow="Classroom & Academic" title="Mark Attendance" subtitle="Stamp each student: P present, A absent, L late, E excused">
      <BatchPicker value={batchId} onChange={setBatchId} />
      <Input label="Session date (YYYY-MM-DD)" value={date} onChangeText={setDate} autoCapitalize="none" error={validDate ? null : 'Use YYYY-MM-DD'} />

      {!batchId ? (
        <EmptyPaper message="Select a batch to begin." />
      ) : (
        <QueryBoundary
          query={roster}
          isEmpty={(r) => r.students.length === 0}
          emptyTitle="No students in this batch"
          emptyDescription="Students appear here after they join with an invitation code."
        >
          {(r) => (
            <>
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 6 }}>
                <Button title="All present" variant="subtle" size="sm" onPress={() => setAll('PRESENT')} />
                <Button title="All absent" variant="secondary" size="sm" onPress={() => setAll('ABSENT')} />
              </View>
              <SectionHeader title={`Roster · ${r.students.length}`} icon="users" />
              <Text style={{ fontFamily: typography.fonts.data, fontSize: 11, color: colors.textMuted, marginBottom: 10 }}>{summary}</Text>
              {r.students.map((s) => {
                const status = marks[s.id] ?? 'PRESENT';
                return (
                  <Card key={s.id} style={{ marginBottom: 10, padding: 14 }}>
                    <Text style={{ fontFamily: typography.fonts.ui, fontSize: 14, fontWeight: '700', color: colors.textPrimary }}>{s.fullName}</Text>
                    <Text style={{ fontFamily: typography.fonts.data, fontSize: 11, color: colors.textMuted, marginBottom: 10 }}>{s.rollNumber}</Text>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      {KINDS.map(([kind, value]) => (
                        <Stamp key={kind} kind={kind} active={status === value} onPress={() => setMarks((m) => ({ ...m, [s.id]: value }))} />
                      ))}
                    </View>
                  </Card>
                );
              })}
              <Button
                title="Save attendance"
                icon="check"
                loading={save.isPending}
                disabled={!validDate || Object.keys(marks).length === 0}
                onPress={onSave}
                style={{ marginTop: 6 }}
              />
            </>
          )}
        </QueryBoundary>
      )}
    </Screen>
  );
};
