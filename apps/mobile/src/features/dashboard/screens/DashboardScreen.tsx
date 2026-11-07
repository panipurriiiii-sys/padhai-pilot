import React from 'react';
import { View, Text } from 'react-native';
import { Screen } from '../../../components/common/Screen';
import { QueryBoundary } from '../../../components/common/QueryBoundary';
import { Card } from '../../../components/common/Card';
import { Badge } from '../../../components/common/Badge';
import { EmptyPaper, KpiCard, QuickActionsBar, SectionHeader, TimeBlock } from '../../../components/common/Paper';
import { useDashboardData } from '../../../hooks/useStudentData';
import { useNavigationStore } from '../../../store/useNavigationStore';
import { useAuthStore } from '../../../store/useAuthStore';
import { useTheme } from '../../../theme/ThemeContext';
import { formatDate, formatInr } from '../../../lib/format';

export const DashboardScreen: React.FC = () => {
  const { colors, typography } = useTheme();
  const { setTab } = useNavigationStore();
  const session = useAuthStore((s) => s.session);
  const query = useDashboardData();
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <Screen
      eyebrow={session?.user?.instituteName ?? 'Student Portal'}
      title={session?.user?.fullName || session?.user?.name || 'Student'}
      subtitle={today}
      refreshing={query.isRefetching}
      onRefresh={() => query.refetch()}
    >
      <QuickActionsBar
        items={[
          { label: 'Homework', icon: 'file-check-2', tone: 'blue', onPress: () => setTab('student_academics') },
          { label: 'Vault', icon: 'notebook-pen', tone: 'teal', onPress: () => setTab('student_diary') },
          { label: 'Results', icon: 'award', tone: 'emerald', onPress: () => setTab('student_results') },
          { label: 'Fees', icon: 'receipt', tone: 'amber', onPress: () => setTab('student_fees') },
        ]}
      />

      <QueryBoundary query={query}>
        {(d) => (
          <>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              <KpiCard
                label="Attendance"
                value={`${Math.round(d.stats.attendanceRate)}%`}
                caption={`${d.stats.classesAttended}/${d.stats.totalClasses} attended`}
                icon="calendar-check"
                tone={d.stats.attendanceRate < 75 ? 'amber' : 'emerald'}
                onPress={() => setTab('student_results')}
              />
              <KpiCard
                label="Avg Score"
                value={d.stats.totalTests ? `${d.stats.avgPercentage}%` : '—'}
                caption={`${d.stats.totalTests} results published`}
                icon="award"
                tone="blue"
                onPress={() => setTab('student_results')}
              />
              <KpiCard
                label="Homework Due"
                value={String(d.stats.pendingAssignments)}
                caption={`${d.stats.upcomingTests} upcoming tests`}
                icon="file-check-2"
                tone="rose"
                onPress={() => setTab('student_academics')}
              />
              <KpiCard
                label="Fee Balance"
                value={formatInr(d.stats.feeBalance)}
                caption={d.stats.feeBalance > 0 ? 'Pending payment' : 'All clear'}
                icon="receipt"
                tone={d.stats.feeBalance > 0 ? 'amber' : 'emerald'}
                onPress={() => setTab('student_fees')}
              />
            </View>

            <SectionHeader title="Today's Classes" icon="clock" action="Full Timetable" onAction={() => setTab('student_more')} />
            {d.timetable.length === 0 ? (
              <EmptyPaper message="No classes scheduled for today. Check your timetable for upcoming lectures." />
            ) : (
              d.timetable.map((slot) => (
                <Card key={`${slot.time}-${slot.subject}`} style={{ marginBottom: 10, padding: 14 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <TimeBlock start={slot.time} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: typography.fonts.ui, fontSize: 14, fontWeight: '700', color: colors.textPrimary }}>
                        {slot.subject}
                      </Text>
                      <Text style={{ fontFamily: typography.fonts.ui, fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
                        {`${slot.room}${slot.faculty ? ` · ${slot.faculty}` : ''}`}
                      </Text>
                    </View>
                  </View>
                </Card>
              ))
            )}

            <SectionHeader title="Homework & Submissions" icon="file-text" action="View All" onAction={() => setTab('student_academics')} />
            {d.upcomingAssignments.length === 0 ? (
              <EmptyPaper message="All caught up! No pending homework assignments." />
            ) : (
              d.upcomingAssignments.map((a) => (
                <Card key={a.id} style={{ marginBottom: 10, padding: 14 }} onPress={() => setTab('student_academics')}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                    <Text style={{ flex: 1, fontFamily: typography.fonts.ui, fontSize: 14, fontWeight: '700', color: colors.textPrimary }}>
                      {a.title}
                    </Text>
                    <Badge label={a.status} variant={a.status === 'GRADED' ? 'success' : 'warning'} />
                  </View>
                  <Text style={{ fontFamily: typography.fonts.ui, fontSize: 12, color: colors.textMuted }}>
                    {`${a.subject} · due ${formatDate(a.dueDate)}`}
                  </Text>
                </Card>
              ))
            )}

            <SectionHeader title="Latest from Teachers" icon="book-open" action="Open Vault" onAction={() => setTab('student_diary')} />
            {d.recentDiaries.length === 0 ? (
              <EmptyPaper message="No teacher diary notes posted recently." />
            ) : (
              d.recentDiaries.map((e) => (
                <Card key={e.id} style={{ marginBottom: 10, padding: 14 }} onPress={() => setTab('student_diary')}>
                  <Text style={{ fontFamily: typography.fonts.ui, fontSize: 14, fontWeight: '700', color: colors.textPrimary }}>
                    {e.chapterTitle}
                  </Text>
                  <Text style={{ fontFamily: typography.fonts.ui, fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
                    {`${e.subject} · ${e.facultyName} · ${formatDate(e.lessonDate)}`}
                  </Text>
                  {e.conceptsTaught ? (
                    <Text numberOfLines={2} style={{ fontFamily: typography.fonts.ui, fontSize: 12, lineHeight: 17, color: colors.textSecondary, marginTop: 6 }}>
                      {e.conceptsTaught}
                    </Text>
                  ) : null}
                </Card>
              ))
            )}
          </>
        )}
      </QueryBoundary>
    </Screen>
  );
};
