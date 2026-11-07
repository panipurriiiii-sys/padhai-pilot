import React from 'react';
import { View, Text } from 'react-native';
import { Screen } from '../../components/common/Screen';
import { QueryBoundary } from '../../components/common/QueryBoundary';
import { InstituteHeader } from '../../components/common/InstituteHeader';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { EmptyPaper, KpiCard, QuickActionsBar, SectionHeader, TimeBlock } from '../../components/common/Paper';
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
      title="Academic Overview"
      subtitle={`${session?.user?.instituteName ?? 'Academic Center'}${session?.user?.instituteName ? ' · ' : ''}${today}`}
      refreshing={query.isRefetching}
      onRefresh={() => query.refetch()}
    >
      <InstituteHeader />
      <QuickActionsBar
        items={[
          { label: 'Attendance', icon: 'calendar-check', tone: 'emerald', onPress: () => setTab('teacher_attendance') },
          { label: 'Daily Diary', icon: 'book-open', tone: 'blue', onPress: () => setTab('teacher_learning') },
          { label: 'Enter Marks', icon: 'file-spreadsheet', tone: 'amber', onPress: () => setTab('teacher_marks') },
          { label: 'Batches', icon: 'users', tone: 'teal', onPress: () => setTab('teacher_classes') },
        ]}
      />

      <QueryBoundary query={query}>
        {(d) => (
          <>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              <KpiCard label="Today's Classes" value={String(d.todayClassesCount)} caption="Scheduled for today" icon="clock" tone="blue" />
              <KpiCard
                label="Pending Attendance"
                value={String(d.pendingAttendanceCount)}
                caption={d.pendingAttendanceCount > 0 ? 'Sessions pending' : 'All recorded'}
                icon="circle-alert"
                tone={d.pendingAttendanceCount > 0 ? 'amber' : 'emerald'}
                onPress={() => setTab('teacher_attendance')}
              />
              <KpiCard
                label="To Grade"
                value={String(d.pendingReviewsCount)}
                caption="Awaiting review"
                icon="file-check"
                tone="teal"
                onPress={() => setTab('teacher_more')}
              />
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
              <EmptyPaper message="No lectures scheduled for today. Check your timetable for upcoming slots." />
            ) : (
              d.todaySchedule.map((slot) => (
                <Card key={slot.id} onPress={() => setTab('teacher_attendance')} style={{ marginBottom: 10, padding: 14 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <TimeBlock start={slot.startTime} end={slot.endTime} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: typography.fonts.ui, fontSize: 14, fontWeight: '700', color: colors.textPrimary }}>{slot.subject}</Text>
                      <Text style={{ fontFamily: typography.fonts.ui, fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
                        {`${slot.batchName}${slot.room ? ` · Room ${slot.room}` : ''}`}
                      </Text>
                    </View>
                    <Badge label="Mark" variant="info" />
                  </View>
                </Card>
              ))
            )}

            <SectionHeader title="Noticeboard" icon="megaphone" action="Post Notice" onAction={() => setTab('teacher_more')} />
            {d.recentAnnouncements.length === 0 ? (
              <EmptyPaper message="No announcements yet." />
            ) : (
              d.recentAnnouncements.map((a) => (
                <Card key={a.id} style={{ marginBottom: 10, padding: 14 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <Text style={{ flex: 1, fontFamily: typography.fonts.ui, fontSize: 14, fontWeight: '700', color: colors.textPrimary }}>{a.title}</Text>
                    {a.priority === 'URGENT' ? <Badge label="Urgent" variant="error" /> : null}
                  </View>
                  <Text numberOfLines={3} style={{ fontFamily: typography.fonts.ui, fontSize: 12, lineHeight: 18, color: colors.textSecondary }}>{a.content}</Text>
                  <Text style={{ fontFamily: typography.fonts.data, fontSize: 10.5, color: colors.textMuted, marginTop: 8 }}>
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
