import React from 'react';
import { View } from 'react-native';
import { QueryBoundary } from '../../components/common/QueryBoundary';
import { Card } from '../../components/common/Card';
import { SectionHeader } from '../../components/common/Paper';
import { BarChart, HBarList, StackedBar } from '../../components/common/Charts';
import { Caption } from '../../components/common/Typography';
import { useTeacherAnalytics } from '../../hooks/useTeacherData';
import { useTheme } from '../../theme/ThemeContext';

/** Charts from GET /analytics/teacher. Null percentages are rendered as "No data", never as zero. */
export const TeacherAnalyticsCharts: React.FC = () => {
  const { spacing, colors } = useTheme();
  const q = useTeacherAnalytics();
  return (
    <QueryBoundary query={q}>
      {(a) => {
        const attendance = (a.batchAttendanceTrends ?? []).map((b) => ({ label: b.batchName, value: b.averageAttendancePercentage }));
        const grades = a.gradeDistribution ?? [];
        const subjects = (a.subjectComparison ?? []).map((s) => ({ label: s.subject, value: s.averageScorePercentage }));
        const subs = a.assignmentSubmissions ?? [];
        const syllabus = a.syllabusCoverage ?? [];
        return (
          <View style={{ gap: spacing.md }}>
            <SectionHeader title="Attendance by batch" icon="calendar-check" />
            <Card>
              <BarChart data={attendance} emptyMessage="Attendance charts appear once sessions are recorded." />
            </Card>

            <SectionHeader title="Grade distribution" icon="award" />
            <Card>
              <StackedBar
                parts={grades.map((g, i) => ({ label: g.grade, value: g.studentCount, color: colors.charts.categorical[i % colors.charts.categorical.length] }))}
                emptyMessage="Grades appear once results are published."
              />
            </Card>

            <SectionHeader title="Subject comparison" icon="layers" />
            <Card>
              <HBarList
                data={subjects}
                emptyMessage="No subject averages yet."
                caption={(_, i) => `${a.subjectComparison[i].assessmentCount} assessment(s) · ${a.subjectComparison[i].totalStudents} student(s)`}
              />
            </Card>

            <SectionHeader title="Assignment submissions" icon="file-check" />
            <Card>
              <HBarList
                data={subs.slice(0, 8).map((s) => ({ label: s.title, value: s.submissionRatePercentage }))}
                emptyMessage="No assignments published yet."
                caption={(_, i) => `${subs[i].submittedCount}/${subs[i].totalStudents} submitted`}
              />
              {subs.length > 8 ? <Caption style={{ marginTop: 8 }}>{`Showing latest 8 of ${subs.length}`}</Caption> : null}
            </Card>

            <SectionHeader title="Syllabus coverage" icon="book-open" />
            <Card>
              <HBarList
                data={syllabus.map((s) => ({ label: `${s.batchName} · ${s.subject}`, value: s.coveragePercentage }))}
                emptyMessage="Add lesson plans to track syllabus coverage."
                caption={(_, i) => `${syllabus[i].completedTopics}/${syllabus[i].totalTopics} topics`}
              />
            </Card>
          </View>
        );
      }}
    </QueryBoundary>
  );
};
