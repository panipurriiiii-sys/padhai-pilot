import React, { useState } from 'react';
import { Alert, View, StyleSheet } from 'react-native';
import { Screen, SectionTitle } from '../../../components/common/Screen';
import { QueryBoundary } from '../../../components/common/QueryBoundary';
import { Segmented } from '../../../components/common/Segmented';
import { Card } from '../../../components/common/Card';
import { Badge } from '../../../components/common/Badge';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { Body, Caption, StatValue, Subtitle } from '../../../components/common/Typography';
import { useAttendanceData, useCorrectionRequest, useResultsData } from '../../../hooks/useStudentData';
import { useNavigationStore } from '../../../store/useNavigationStore';
import { useTheme } from '../../../theme/ThemeContext';
import { errorMessage, formatDate, todayIso } from '../../../lib/format';

type Tab = 'results' | 'attendance';
const STATUS_VARIANT = { PRESENT: 'success', LATE: 'warning', EXCUSED: 'neutral', ABSENT: 'error' } as const;

export const ResultsScreen: React.FC = () => {
  const { colors, spacing } = useTheme();
  const currentTab = useNavigationStore((s) => s.currentTab);
  const [tab, setTab] = useState<Tab>(/attendance/.test(currentTab) ? 'attendance' : 'results');
  const results = useResultsData();
  const attendance = useAttendanceData();
  const correction = useCorrectionRequest();
  const [date, setDate] = useState(todayIso());
  const [reason, setReason] = useState('');
  const active = tab === 'results' ? results : attendance;

  const submitCorrection = () =>
    correction.mutate(
      { date, reason: reason.trim() },
      {
        onSuccess: (r) => {
          setReason('');
          Alert.alert('Request sent', r.message);
        },
        onError: (e) => Alert.alert('Could not send request', errorMessage(e)),
      },
    );

  return (
    <Screen
      eyebrow="PROGRESS"
      title={tab === 'results' ? 'Results' : 'Attendance'}
      subtitle={tab === 'results' ? 'Only results your faculty has published' : 'Your own attendance record'}
      refreshing={active.isRefetching}
      onRefresh={() => active.refetch()}
    >
      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { key: 'results', label: 'Results' },
          { key: 'attendance', label: 'Attendance' },
        ]}
      />

      {tab === 'results' ? (
        <QueryBoundary
          query={results}
          isEmpty={(r) => r.length === 0}
          emptyTitle="No published results"
          emptyDescription="Results appear here as soon as your faculty publishes them."
        >
          {(items) =>
            items.map((r) => (
              <Card key={r.markId} style={{ marginBottom: spacing.md }}>
                <View style={styles.row}>
                  <Badge label={r.subject} variant="primary" />
                  <Caption>{formatDate(r.assessmentDate)}</Caption>
                </View>
                <Subtitle style={{ marginTop: spacing.xs }}>{r.title}</Subtitle>
                {r.resultStatus === 'SCORED' ? (
                  <View style={styles.row}>
                    <StatValue>{`${r.obtainedMarks ?? 0}/${r.maxMarks}`}</StatValue>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Subtitle>{r.percentage != null ? `${r.percentage}%` : ''}</Subtitle>
                      {r.grade ? <Badge label={`Grade ${r.grade}`} variant="success" /> : null}
                    </View>
                  </View>
                ) : (
                  <Badge label={r.resultStatus} variant="neutral" />
                )}
                {r.feedback ? <Body style={{ marginTop: spacing.xs }}>{r.feedback}</Body> : null}
              </Card>
            ))
          }
        </QueryBoundary>
      ) : (
        <>
          <QueryBoundary query={attendance}>
            {(a) => (
              <>
                <Card style={{ marginBottom: spacing.md }}>
                  <Caption>Overall attendance</Caption>
                  <StatValue color={a.percentage < 75 ? colors.warning : colors.success}>
                    {`${Math.round(a.percentage)}%`}
                  </StatValue>
                  <Caption>{`${a.attended} present · ${a.late} late · ${a.absent} absent of ${a.totalClasses} classes`}</Caption>
                  {a.percentage < 75 ? (
                    <Caption style={{ color: colors.warning, marginTop: spacing.xs }}>
                      Below the 75% eligibility threshold.
                    </Caption>
                  ) : null}
                </Card>
                {a.records.length === 0 ? (
                  <Caption>No sessions recorded yet.</Caption>
                ) : (
                  a.records.map((rec) => (
                    <Card key={rec.id} style={{ marginBottom: spacing.sm }}>
                      <View style={styles.row}>
                        <View style={{ flex: 1 }}>
                          <Subtitle>{formatDate(rec.date)}</Subtitle>
                          <Caption>{rec.subjectName || rec.remarks || ' '}</Caption>
                        </View>
                        <Badge label={rec.status} variant={STATUS_VARIANT[rec.status]} />
                      </View>
                    </Card>
                  ))
                )}
              </>
            )}
          </QueryBoundary>

          <SectionTitle>Request a correction</SectionTitle>
          <Card>
            <Input label="Date (YYYY-MM-DD)" value={date} onChangeText={setDate} autoCapitalize="none" />
            <Input label="What is wrong?" value={reason} onChangeText={setReason} multiline />
            <Button
              title="Send request"
              loading={correction.isPending}
              disabled={!reason.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(date)}
              onPress={submitCorrection}
            />
          </Card>
        </>
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
});
