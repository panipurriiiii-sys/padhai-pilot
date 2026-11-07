import React from 'react';
import { View, Text } from 'react-native';
import { QueryBoundary } from '../../components/common/QueryBoundary';
import { Card } from '../../components/common/Card';
import { KpiCard, SectionHeader, EmptyPaper } from '../../components/common/Paper';
import { Subtitle, Caption } from '../../components/common/Typography';
import { TeacherAnalyticsCharts } from './TeacherAnalyticsCharts';
import { useTeacherReports } from '../../hooks/useTeacherData';
import { useTheme } from '../../theme/ThemeContext';

export const TeacherReportsPanel: React.FC = () => {
  const { spacing, colors, typography } = useTheme();
  const reportsQuery = useTeacherReports();

  return (
    <View style={{ flex: 1, gap: spacing.md }}>
      <QueryBoundary query={reportsQuery}>
        {(rep: any) => {
          const summary = rep.summary || {};
          const batchPerf = rep.batchPerformance || [];
          const trends = rep.attendanceTrends || [];

          return (
            <View style={{ gap: spacing.md }}>
              <SectionHeader title="Performance Overview" icon="trending-up" />
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                <KpiCard
                  label="Total Batches"
                  value={String(summary.totalBatches ?? 0)}
                  caption="Active teaching groups"
                  icon="users"
                  tone="blue"
                />
                <KpiCard
                  label="Enrolled Students"
                  value={String(summary.totalStudents ?? 0)}
                  caption="Total roster strength"
                  icon="graduation-cap"
                  tone="emerald"
                />
                <KpiCard
                  label="Average Attendance"
                  value={String(summary.averageClassAttendance ?? '—')}
                  caption="Last 30 days"
                  icon="calendar-check"
                  tone="amber"
                />
                <KpiCard
                  label="Tests Conducted"
                  value={String(summary.totalTestsConducted ?? 0)}
                  caption="Completed assessments"
                  icon="award"
                  tone="teal"
                />
              </View>

              <SectionHeader title="Weekly Attendance Trends" icon="calendar" />
              {trends.length === 0 ? (
                <EmptyPaper message="Attendance trends will generate once sessions are conducted." />
              ) : (
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {trends.map((t: any, i: number) => (
                    <Card key={i} style={{ flex: 1, padding: 10, alignItems: 'center' }}>
                      <Text style={{ fontFamily: typography.fonts.ui, fontSize: 16, fontWeight: '700', color: colors.textPrimary }}>
                        {t.rate != null ? `${t.rate}%` : '—'}
                      </Text>
                      <Caption style={{ marginTop: 2 }}>{t.label}</Caption>
                    </Card>
                  ))}
                </View>
              )}

              <SectionHeader title="Batch Breakdown" icon="layers" />
              {batchPerf.length === 0 ? (
                <EmptyPaper message="No batch analytics available." />
              ) : (
                batchPerf.map((b: any, idx: number) => (
                  <Card key={idx} style={{ padding: 12 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Subtitle>{b.batchName}</Subtitle>
                      <Caption>{b.code}</Caption>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                      <Caption>{`Students: ${b.studentCount}`}</Caption>
                      <Caption>{`Attendance: ${b.averageAttendance}%`}</Caption>
                      <Caption>{`Turnaround: ${b.assignmentTurnaround}`}</Caption>
                    </View>
                  </Card>
                ))
              )}
            </View>
          );
        }}
      </QueryBoundary>
      <TeacherAnalyticsCharts />
    </View>
  );
};
