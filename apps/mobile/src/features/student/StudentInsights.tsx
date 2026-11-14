import React from 'react';
import { View } from 'react-native';
import { QueryBoundary } from '../../components/common/QueryBoundary';
import { Card } from '../../components/common/Card';
import { SectionHeader } from '../../components/common/Paper';
import { HBarList, LineChart, StackedBar } from '../../components/common/Charts';
import { Caption, StatValue } from '../../components/common/Typography';
import { useStudentAnalytics } from '../../hooks/useStudentData';
import { useTheme } from '../../theme/ThemeContext';
import { formatDate } from '../../lib/format';

const STATUS_VALUE = { PRESENT: 100, LATE: 70, EXCUSED: 50, ABSENT: 0 } as const;

interface StudentInsightsProps {
  hideAttendance?: boolean;
}

/** Charts from GET /analytics/student. Null rates render as empty states, never as 0%. */
export const StudentInsights: React.FC<StudentInsightsProps> = ({ hideAttendance = false }) => {
  const { spacing, colors } = useTheme();
  const q = useStudentAnalytics();
  return (
    <QueryBoundary query={q}>
      {(a) => {
        const att = a.attendanceTrend ?? [];
        const attPoints = att.map((d) => ({ label: formatDate(d.date).slice(0, 6), value: STATUS_VALUE[d.status] }));
        const subjects = (a.subjectPerformance ?? []).map((s) => ({ label: s.subject, value: s.percentage }));
        const exams = a.examScoreTrend ?? [];
        const hw = a.homeworkSummary;
        const c = colors.charts;
        return (
          <View style={{ gap: spacing.md }}>
            {!hideAttendance && (
              <>
                <SectionHeader title="Attendance" icon="calendar-check" />
                <Card>
                  <StatValue>{a.attendanceRate != null ? `${Math.round(a.attendanceRate)}%` : '—'}</StatValue>
                  <Caption>{a.attendanceRate != null ? 'Overall attendance rate' : 'No attendance recorded yet'}</Caption>
                  <View style={{ marginTop: spacing.sm }}>
                    <LineChart data={attPoints} emptyMessage="Your recent sessions will chart here." />
                  </View>
                  {att.length ? <Caption style={{ marginTop: 4 }}>Present 100 · Late 70 · Excused 50 · Absent 0 (per session)</Caption> : null}
                </Card>
              </>
            )}

            <SectionHeader title="Subject marks" icon="layers" />
            <Card>
              <HBarList
                data={subjects}
                emptyMessage="Subject marks appear once results are published."
                caption={(_, i) => {
                  const s = a.subjectPerformance[i];
                  return `${s.marksObtained}/${s.maxMarks} · Grade ${s.grade} · ${s.assessmentsCount} assessment(s)`;
                }}
              />
            </Card>

            <SectionHeader title="Exam trend" icon="trending-up" />
            <Card>
              <LineChart
                data={exams.map((e) => ({ label: e.title, value: e.percentage }))}
                compare={exams.map((e) => ({ label: e.title, value: e.classAveragePercentage }))}
                compareLabel="class average"
                emptyMessage="Your exam scores will chart here."
              />
            </Card>

            <SectionHeader title="Homework completion" icon="file-check" />
            <Card>
              <StatValue>{hw.completionRatePercentage != null ? `${Math.round(hw.completionRatePercentage)}%` : '—'}</StatValue>
              <Caption>{hw.totalAssigned ? `${hw.submitted} of ${hw.totalAssigned} submitted` : 'No homework assigned yet'}</Caption>
              <View style={{ marginTop: spacing.sm }}>
                <StackedBar
                  parts={[
                    { label: 'Graded', value: hw.graded, color: c.attendance.present },
                    { label: 'Submitted', value: Math.max(hw.submitted - hw.graded, 0), color: c.categorical[0] },
                    { label: 'Pending', value: hw.pending, color: c.attendance.late },
                  ]}
                  emptyMessage="Homework progress shows here once assignments are published."
                />
              </View>
            </Card>
          </View>
        );
      }}
    </QueryBoundary>
  );
};
