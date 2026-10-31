import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Screen, SectionTitle } from '../../../components/common/Screen';
import { QueryBoundary } from '../../../components/common/QueryBoundary';
import { Card } from '../../../components/common/Card';
import { Badge } from '../../../components/common/Badge';
import { Body, Caption, StatValue, Subtitle } from '../../../components/common/Typography';
import { useDashboardData } from '../../../hooks/useStudentData';
import { useNavigationStore } from '../../../store/useNavigationStore';
import { useAuthStore } from '../../../store/useAuthStore';
import { useTheme } from '../../../theme/ThemeContext';
import { formatDate, formatInr } from '../../../lib/format';

export const DashboardScreen: React.FC = () => {
  const { colors, spacing } = useTheme();
  const { setTab } = useNavigationStore();
  const session = useAuthStore((s) => s.session);
  const query = useDashboardData();

  return (
    <Screen
      eyebrow={session?.user?.instituteName?.toUpperCase()}
      title={session?.user?.fullName || session?.user?.name || 'Student'}
      subtitle="Your day at a glance"
      refreshing={query.isRefetching}
      onRefresh={() => query.refetch()}
    >
      <QueryBoundary query={query}>
        {(d) => (
          <>
            <View style={styles.grid}>
              <Card style={styles.kpi} onPress={() => setTab('student_results')}>
                <Caption>Attendance</Caption>
                <StatValue color={d.stats.attendanceRate < 75 ? colors.warning : colors.primary}>
                  {`${Math.round(d.stats.attendanceRate)}%`}
                </StatValue>
                <Caption>{`${d.stats.classesAttended}/${d.stats.totalClasses} classes`}</Caption>
              </Card>
              <Card style={styles.kpi} onPress={() => setTab('student_results')}>
                <Caption>Average score</Caption>
                <StatValue>{d.stats.totalTests ? `${d.stats.avgPercentage}%` : '—'}</StatValue>
                <Caption>{`${d.stats.totalTests} published results`}</Caption>
              </Card>
              <Card style={styles.kpi} onPress={() => setTab('student_academics')}>
                <Caption>Homework due</Caption>
                <StatValue>{String(d.stats.pendingAssignments)}</StatValue>
                <Caption>{`${d.stats.upcomingTests} upcoming tests`}</Caption>
              </Card>
              <Card style={styles.kpi} onPress={() => setTab('student_fees')}>
                <Caption>Fee balance</Caption>
                <StatValue color={d.stats.feeBalance > 0 ? colors.warning : colors.success}>
                  {formatInr(d.stats.feeBalance)}
                </StatValue>
                <Caption>{d.stats.feeBalance > 0 ? 'Payment pending' : 'All clear'}</Caption>
              </Card>
            </View>

            <SectionTitle>Today&apos;s classes</SectionTitle>
            {d.timetable.length === 0 ? (
              <Caption>No classes scheduled today.</Caption>
            ) : (
              d.timetable.map((slot) => (
                <Card key={`${slot.time}-${slot.subject}`} style={{ marginBottom: spacing.sm }}>
                  <Subtitle>{slot.subject}</Subtitle>
                  <Caption>{`${slot.time} · ${slot.room} · ${slot.faculty}`}</Caption>
                </Card>
              ))
            )}

            <SectionTitle>Homework</SectionTitle>
            {d.upcomingAssignments.length === 0 ? (
              <Caption>Nothing pending.</Caption>
            ) : (
              d.upcomingAssignments.map((a) => (
                <Card key={a.id} style={{ marginBottom: spacing.sm }} onPress={() => setTab('student_academics')}>
                  <View style={styles.row}>
                    <Subtitle style={{ flex: 1 }}>{a.title}</Subtitle>
                    <Badge label={a.status} variant={a.status === 'GRADED' ? 'success' : 'warning'} />
                  </View>
                  <Caption>{`${a.subject} · due ${formatDate(a.dueDate)}`}</Caption>
                </Card>
              ))
            )}

            <SectionTitle>Latest from your teachers</SectionTitle>
            {d.recentDiaries.length === 0 ? (
              <Caption>No diary entries published yet.</Caption>
            ) : (
              d.recentDiaries.map((e) => (
                <Card key={e.id} style={{ marginBottom: spacing.sm }} onPress={() => setTab('student_diary')}>
                  <Subtitle>{e.chapterTitle}</Subtitle>
                  <Caption>{`${e.subject} · ${e.facultyName} · ${formatDate(e.lessonDate)}`}</Caption>
                  <Body numberOfLines={2}>{e.conceptsTaught}</Body>
                </Card>
              ))
            )}

            <SectionTitle>Announcements</SectionTitle>
            {d.announcements.length === 0 ? (
              <Caption>No announcements.</Caption>
            ) : (
              d.announcements.map((a) => (
                <Card key={a.id} style={{ marginBottom: spacing.sm }}>
                  <View style={styles.row}>
                    <Subtitle style={{ flex: 1 }}>{a.title}</Subtitle>
                    {a.priority === 'URGENT' ? <Badge label="URGENT" variant="error" /> : null}
                  </View>
                  <Body numberOfLines={3}>{a.content}</Body>
                  <Caption>{formatDate(a.date)}</Caption>
                </Card>
              ))
            )}
          </>
        )}
      </QueryBoundary>
    </Screen>
  );
};

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  kpi: { flexGrow: 1, flexBasis: '45%' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
