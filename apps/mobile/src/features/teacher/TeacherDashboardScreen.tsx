import React from 'react';
import { View, Text } from 'react-native';
import { Screen } from '../../components/common/Screen';
import { QueryBoundary } from '../../components/common/QueryBoundary';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { EmptyPaper, KpiCard, SectionHeader, TimeBlock } from '../../components/common/Paper';
import { useTeacherDashboard } from '../../hooks/useTeacherData';
import { useAuthStore } from '../../store/useAuthStore';
import { useNavigationStore } from '../../store/useNavigationStore';
import { useTheme } from '../../theme/ThemeContext';
import { formatDate } from '../../lib/format';

export const TeacherDashboardScreen: React.FC = () => {
  const { colors, typography } = useTheme();
  const session = useAuthStore((s) => s.session);
  const { setTab } = useNavigationStore();
  const query = useTeacherDashboard();
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <Screen
      eyebrow="Faculty Operations"
      title="Academic Overview & Schedule"
      subtitle={`${session?.user?.instituteName ?? ''}${session?.user?.instituteName ? ' · ' : ''}${today}`}
      refreshing={query.isRefetching}
      onRefresh={() => query.refetch()}
    >
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
        <Button title="Daily Diary" icon="book-open" onPress={() => setTab('teacher_learning')} />
        <Button title="Mark Attendance" icon="calendar-check" variant="secondary" onPress={() => setTab('teacher_attendance')} />
        <Button title="New Assignment" icon="plus" variant="subtle" onPress={() => setTab('teacher_more')} />
      </View>

      <QueryBoundary query={query}>
        {(d) => (
          <>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              <KpiCard label="Today's Classes" value={String(d.todayClassesCount)} caption="Scheduled for today" icon="clock" tone="blue" />
              <KpiCard
                label="Pending Attendance"
                value={String(d.pendingAttendanceCount)}
                caption={d.pendingAttendanceCount > 0 ? 'Sessions require submission' : 'All recorded'}
                icon="circle-alert"
                tone={d.pendingAttendanceCount > 0 ? 'amber' : 'emerald'}
                onPress={() => setTab('teacher_attendance')}
              />
              <KpiCard label="Submissions to Grade" value={String(d.pendingReviewsCount)} caption="Awaiting teacher review" icon="file-check" tone="teal" onPress={() => setTab('teacher_more')} />
              <KpiCard
                label="Total Students"
                value={String(d.totalStudentsCount)}
                caption={`Across ${d.assignedBatchesCount} batches`}
                icon="users"
                tone="emerald"
                onPress={() => setTab('teacher_classes')}
              />
            </View>

            <SectionHeader title="Today's Class Schedule" icon="clock" action="Full Timetable" onAction={() => setTab('teacher_more')} />
            {d.todaySchedule.length === 0 ? (
              <EmptyPaper message="No lectures scheduled for today. Check your full timetable for upcoming slots." />
            ) : (
              d.todaySchedule.map((slot) => (
                <Card key={slot.id} onPress={() => setTab('teacher_attendance')} style={{ marginBottom: 12, padding: 14 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                    <TimeBlock start={slot.startTime} end={slot.endTime} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: typography.fonts.ui, fontSize: 14, fontWeight: '700', color: colors.textPrimary }}>{slot.subject}</Text>
                      <Text style={{ fontFamily: typography.fonts.ui, fontSize: 12, color: colors.textMuted }}>
                        {`${slot.batchName}${slot.room ? ` · ${slot.room}` : ''}`}
                      </Text>
                    </View>
                  </View>
                </Card>
              ))
            )}

            <SectionHeader title="Noticeboard" icon="megaphone" />
            {d.recentAnnouncements.length === 0 ? (
              <EmptyPaper message="No announcements yet." />
            ) : (
              d.recentAnnouncements.map((a) => (
                <Card key={a.id} style={{ marginBottom: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <Text style={{ flex: 1, fontFamily: typography.fonts.ui, fontSize: 14, fontWeight: '700', color: colors.textPrimary }}>{a.title}</Text>
                    {a.priority === 'URGENT' ? <Badge label="Urgent" variant="error" /> : null}
                  </View>
                  <Text numberOfLines={3} style={{ fontFamily: typography.fonts.ui, fontSize: 12, color: colors.textSecondary }}>{a.content}</Text>
                  <Text style={{ fontFamily: typography.fonts.data, fontSize: 10.5, color: colors.textMuted, marginTop: 6 }}>
                    {`${a.authorName} · ${formatDate(a.createdAt)}`}
                  </Text>
                </Card>
              ))
            )}
          </>
        )}
      </QueryBoundary>
    </Screen>
  );
};
