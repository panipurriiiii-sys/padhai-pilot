import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Screen, SectionTitle } from '../../components/common/Screen';
import { QueryBoundary } from '../../components/common/QueryBoundary';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Body, Caption, StatValue, Subtitle } from '../../components/common/Typography';
import { useTeacherDashboard } from '../../hooks/useTeacherData';
import { useAuthStore } from '../../store/useAuthStore';
import { useNavigationStore } from '../../store/useNavigationStore';
import { useTheme } from '../../theme/ThemeContext';
import { formatDate } from '../../lib/format';

export const TeacherDashboardScreen: React.FC = () => {
  const { spacing } = useTheme();
  const session = useAuthStore((s) => s.session);
  const { setTab } = useNavigationStore();
  const query = useTeacherDashboard();

  return (
    <Screen
      eyebrow={session?.user?.instituteName?.toUpperCase()}
      title={session?.user?.fullName || session?.user?.name || 'Faculty'}
      subtitle="Your classes today"
      refreshing={query.isRefetching}
      onRefresh={() => query.refetch()}
    >
      <QueryBoundary query={query}>
        {(d) => (
          <>
            <View style={styles.grid}>
              <Card style={styles.kpi} onPress={() => setTab('teacher_classes')}>
                <Caption>Classes today</Caption>
                <StatValue>{String(d.todayClassesCount)}</StatValue>
              </Card>
              <Card style={styles.kpi} onPress={() => setTab('teacher_classes')}>
                <Caption>Batches</Caption>
                <StatValue>{String(d.assignedBatchesCount)}</StatValue>
                <Caption>{`${d.totalStudentsCount} students`}</Caption>
              </Card>
              <Card style={styles.kpi} onPress={() => setTab('teacher_attendance')}>
                <Caption>Attendance pending</Caption>
                <StatValue>{String(d.pendingAttendanceCount)}</StatValue>
              </Card>
              <Card style={styles.kpi} onPress={() => setTab('teacher_more')}>
                <Caption>To review</Caption>
                <StatValue>{String(d.pendingReviewsCount)}</StatValue>
                <Caption>submissions</Caption>
              </Card>
            </View>

            <SectionTitle>Today&apos;s schedule</SectionTitle>
            {d.todaySchedule.length === 0 ? (
              <Caption>No classes scheduled today.</Caption>
            ) : (
              d.todaySchedule.map((s) => (
                <Card key={s.id} style={{ marginBottom: spacing.sm }}>
                  <Subtitle>{`${s.subject} · ${s.batchName}`}</Subtitle>
                  <Caption>{`${s.startTime} – ${s.endTime}${s.room ? ` · ${s.room}` : ''}`}</Caption>
                </Card>
              ))
            )}

            <SectionTitle>Announcements</SectionTitle>
            {d.recentAnnouncements.length === 0 ? (
              <Caption>No announcements.</Caption>
            ) : (
              d.recentAnnouncements.map((a) => (
                <Card key={a.id} style={{ marginBottom: spacing.sm }}>
                  <View style={styles.row}>
                    <Subtitle style={{ flex: 1 }}>{a.title}</Subtitle>
                    {a.priority === 'URGENT' ? <Badge label="URGENT" variant="error" /> : null}
                  </View>
                  <Body numberOfLines={2}>{a.content}</Body>
                  <Caption>{`${a.authorName} · ${formatDate(a.createdAt)}`}</Caption>
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
