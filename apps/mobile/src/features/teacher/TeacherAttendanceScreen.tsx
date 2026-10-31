import React, { useEffect, useState } from 'react';
import { Alert, Pressable, View, StyleSheet } from 'react-native';
import { Screen } from '../../components/common/Screen';
import { QueryBoundary } from '../../components/common/QueryBoundary';
import { BatchPicker } from '../../components/common/BatchPicker';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Caption, Subtitle } from '../../components/common/Typography';
import { useAttendanceSession, useRoster, useSaveAttendance } from '../../hooks/useTeacherData';
import type { AttendanceStatus } from '../../services/api/teacherService';
import { errorMessage, todayIso } from '../../lib/format';

const ORDER: AttendanceStatus[] = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'];
const VARIANT = { PRESENT: 'success', ABSENT: 'error', LATE: 'warning', EXCUSED: 'neutral' } as const;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const TeacherAttendanceScreen: React.FC = () => {
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

  const cycle = (id: string) =>
    setMarks((m) => ({ ...m, [id]: ORDER[(ORDER.indexOf(m[id] ?? 'PRESENT') + 1) % ORDER.length] }));
  const setAll = (status: AttendanceStatus) =>
    setMarks((m) => Object.fromEntries(Object.keys(m).map((id) => [id, status])));

  const counts = ORDER.map((s) => `${Object.values(marks).filter((v) => v === s).length} ${s.toLowerCase()}`).join(' · ');

  const onSave = () =>
    save.mutate(
      {
        batchId: batchId as string,
        date,
        records: Object.entries(marks).map(([studentId, status]) => ({ studentId, status })),
      },
      {
        onSuccess: () => Alert.alert('Attendance saved', counts),
        onError: (e) => Alert.alert('Could not save', errorMessage(e)),
      },
    );

  return (
    <Screen eyebrow="ATTENDANCE" title="Mark attendance" subtitle="Tap a student to cycle present, absent, late, excused">
      <BatchPicker value={batchId} onChange={setBatchId} />
      <Input label="Date (YYYY-MM-DD)" value={date} onChangeText={setDate} autoCapitalize="none" error={validDate ? null : 'Use YYYY-MM-DD'} />

      {!batchId ? (
        <Caption>Select a batch to begin.</Caption>
      ) : (
        <QueryBoundary
          query={roster}
          isEmpty={(r) => r.students.length === 0}
          emptyTitle="No students in this batch"
          emptyDescription="Students appear here after they join with an invitation code."
        >
          {(r) => (
            <>
              <View style={styles.bar}>
                <Button title="All present" variant="secondary" size="sm" onPress={() => setAll('PRESENT')} />
                <Button title="All absent" variant="secondary" size="sm" onPress={() => setAll('ABSENT')} />
              </View>
              <Caption style={{ marginVertical: 8 }}>{counts}</Caption>
              {r.students.map((s) => {
                const status = marks[s.id] ?? 'PRESENT';
                return (
                  <Pressable key={s.id} accessibilityRole="button" accessibilityLabel={`${s.fullName}, ${status}`} onPress={() => cycle(s.id)}>
                    <Card style={{ marginBottom: 8 }}>
                      <View style={styles.row}>
                        <View style={{ flex: 1 }}>
                          <Subtitle>{s.fullName}</Subtitle>
                          <Caption>{s.rollNumber}</Caption>
                        </View>
                        <Badge label={status} variant={VARIANT[status]} />
                      </View>
                    </Card>
                  </Pressable>
                );
              })}
              <Button
                title="Save attendance"
                loading={save.isPending}
                disabled={!validDate || Object.keys(marks).length === 0}
                onPress={onSave}
                style={{ marginTop: 8 }}
              />
            </>
          )}
        </QueryBoundary>
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bar: { flexDirection: 'row', gap: 8 },
});
