import React, { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { presentAlert as Alert } from '../../store/useAlertStore';
import { openPdf } from '../../lib/pdf';
import { documentPaths } from '../../services/api/financeService';
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
  const isDirtyRef = useRef(false);
  const prevKeyRef = useRef<string>('');

  const validDate = DATE_RE.test(date);
  const roster = useRoster(batchId);
  const session = useAttendanceSession(batchId, validDate ? date : undefined);
  const save = useSaveAttendance();

  // Seed editable state safely. Never wipe in-progress edits on background query refetches!
  useEffect(() => {
    if (!roster.data) return;
    const currentKey = `${batchId || ''}_${date}`;
    const targetChanged = prevKeyRef.current !== currentKey;

    if (targetChanged || !isDirtyRef.current) {
      const saved = new Map((session.data?.records ?? []).map((r) => [r.studentId, r.status]));
      setMarks(Object.fromEntries(roster.data.students.map((s) => [s.id, saved.get(s.id) ?? 'PRESENT'])));
      if (targetChanged) {
        prevKeyRef.current = currentKey;
        isDirtyRef.current = false;
      }
    }
  }, [roster.data, session.data, batchId, date]);

  const setAll = (status: AttendanceStatus) => {
    isDirtyRef.current = true;
    setMarks((m) => Object.fromEntries(Object.keys(m).map((id) => [id, status])));
  };

  const count = (s: AttendanceStatus) => Object.values(marks).filter((v) => v === s).length;
  const summary = `${count('PRESENT')} present · ${count('ABSENT')} absent · ${count('LATE')} late · ${count('EXCUSED')} excused`;

  const onSave = () => {
    if (!batchId || !validDate) return;
    save.mutate(
      { batchId, date, records: Object.entries(marks).map(([studentId, status]) => ({ studentId, status })) },
      {
        onSuccess: () => {
          isDirtyRef.current = false;
          Alert.alert('Attendance saved', summary);
        },
        onError: (e) => Alert.alert('Could not save', errorMessage(e)),
      },
    );
  };

  return (
    <Screen eyebrow="Classroom & Academic" title="Mark Attendance" subtitle="Stamp each student: P present, A absent, L late, E excused">
      <BatchPicker value={batchId} onChange={setBatchId} />
      <Input label="Session date (YYYY-MM-DD)" value={date} onChangeText={setDate} autoCapitalize="none" error={validDate ? null : 'Use YYYY-MM-DD'} />

      {batchId ? (
        <Button title="Attendance report PDF (last 30 days)" variant="outline" size="sm" style={{ alignSelf: 'flex-start', marginBottom: 8 }} onPress={() => void openPdf(documentPaths.attendanceReport({ batchId }), 'attendance-report')} />
      ) : null}

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
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 8 }}>
                <Button title="All present" variant="subtle" size="sm" onPress={() => setAll('PRESENT')} />
                <Button title="All absent" variant="secondary" size="sm" onPress={() => setAll('ABSENT')} />
              </View>
              <SectionHeader title={`Roster · ${r.students.length}`} icon="users" />
              <Text style={{ fontFamily: typography.fonts.data, fontSize: 11, color: colors.textMuted, marginBottom: 10 }}>{summary}</Text>
              {r.students.map((s) => {
                const status = marks[s.id] ?? 'PRESENT';
                return (
                  <Card key={s.id} style={{ marginBottom: 8, padding: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <View style={{ flex: 1, marginRight: 8 }}>
                        <Text numberOfLines={1} style={{ fontFamily: typography.fonts.ui, fontSize: 14, fontWeight: '700', color: colors.textPrimary }}>
                          {s.fullName}
                        </Text>
                        <Text style={{ fontFamily: typography.fonts.data, fontSize: 11, color: colors.textMuted, marginTop: 2 }}>
                          {s.rollNumber ? `Roll #${s.rollNumber}` : 'Student'}
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', gap: 6 }}>
                        {KINDS.map(([kind, value]) => (
                          <Stamp
                            key={kind}
                            kind={kind}
                            active={status === value}
                            onPress={() => {
                              isDirtyRef.current = true;
                              setMarks((m) => ({ ...m, [s.id]: value }));
                            }}
                          />
                        ))}
                      </View>
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
                style={{ marginTop: 12 }}
              />
            </>
          )}
        </QueryBoundary>
      )}
    </Screen>
  );
};
