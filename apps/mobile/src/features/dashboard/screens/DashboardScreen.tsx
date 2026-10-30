import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  FlatList,
} from 'react-native';
import { ScreenContainer } from '../../../components/common/ScreenContainer';
import { Title, Subtitle, Body, Caption, StatValue } from '../../../components/common/Typography';
import { Card } from '../../../components/common/Card';
import { Badge } from '../../../components/common/Badge';
import { Skeleton } from '../../../components/common/Skeleton';
import { ErrorState } from '../../../components/common/ErrorState';
import { useAuthStore } from '../../../store/useAuthStore';
import { useNavigationStore } from '../../../store/useNavigationStore';
import {
  useAttendanceData,
  useResultsData,
  useAnnouncementsData,
} from '../../../hooks/useStudentData';
import { useTheme } from '../../../theme/ThemeContext';

export const DashboardScreen: React.FC = () => {
  const { colors, spacing } = useTheme();
  const { session } = useAuthStore();
  const { setTab } = useNavigationStore();

  const {
    data: attendance,
    isLoading: isAttendanceLoading,
    error: attendanceError,
    refetch: refetchAttendance,
  } = useAttendanceData();

  const {
    data: results,
    isLoading: isResultsLoading,
    error: resultsError,
    refetch: refetchResults,
  } = useResultsData();

  const {
    data: announcements,
    isLoading: isAnnounceLoading,
    refetch: refetchAnnouncements,
  } = useAnnouncementsData();

  const isRefreshing = isAttendanceLoading || isResultsLoading || isAnnounceLoading;

  const onRefresh = () => {
    refetchAttendance();
    refetchResults();
    refetchAnnouncements();
  };

  const studentName = session?.user?.name || 'Student';
  const instituteName = session?.user?.instituteName || 'Tuition Institute';
  const rollNumber = session?.user?.rollNumber || 'Roll #--';

  const latestResult = results && results.length > 0 ? results[0] : null;

  return (
    <ScreenContainer edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { padding: spacing.lg }]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header Greeting */}
        <View style={[styles.headerRow, { marginBottom: spacing.xl }]}>
          <View style={{ flex: 1 }}>
            <Caption style={{ textTransform: 'uppercase', letterSpacing: 0.8 }}>
              {instituteName}
            </Caption>
            <Title style={{ marginTop: spacing.xxs }}>{studentName}</Title>
          </View>
          <Badge label={rollNumber} variant="primary" />
        </View>

        {/* Primary Metric Row */}
        <View style={[styles.statsRow, { marginBottom: spacing.xl, gap: spacing.md }]}>
          {/* Attendance KPI */}
          <Card
            style={styles.statCard}
            onPress={() => setTab('attendance')}
            variant="flat"
          >
            <Caption style={{ marginBottom: spacing.xs }}>Attendance</Caption>
            {isAttendanceLoading ? (
              <Skeleton width={60} height={32} />
            ) : (
              <StatValue color={attendance && attendance.percentage < 75 ? colors.warning : colors.primary}>
                {attendance ? `${Math.round(attendance.percentage)}%` : '--'}
              </StatValue>
            )}
            <Caption style={{ marginTop: spacing.xs }}>
              {attendance ? `${attendance.attended}/${attendance.totalClasses} classes` : 'View records'}
            </Caption>
          </Card>

          {/* Latest Test KPI */}
          <Card
            style={styles.statCard}
            onPress={() => setTab('results')}
            variant="flat"
          >
            <Caption style={{ marginBottom: spacing.xs }}>Latest Score</Caption>
            {isResultsLoading ? (
              <Skeleton width={60} height={32} />
            ) : latestResult ? (
              <StatValue color={colors.textPrimary}>
                {`${latestResult.marksObtained}/${latestResult.maxMarks}`}
              </StatValue>
            ) : (
              <StatValue color={colors.textMuted}>--</StatValue>
            )}
            <Caption style={{ marginTop: spacing.xs }} numberOfLines={1}>
              {latestResult ? latestResult.subject : 'No tests recorded'}
            </Caption>
          </Card>
        </View>

        {/* Tuition Announcements */}
        <View style={{ marginBottom: spacing.xl }}>
          <View style={[styles.sectionHeader, { marginBottom: spacing.md }]}>
            <Subtitle>Noticeboard</Subtitle>
          </View>

          {isAnnounceLoading ? (
            <View style={{ gap: spacing.sm }}>
              <Skeleton height={60} />
              <Skeleton height={60} />
            </View>
          ) : announcements && announcements.length > 0 ? (
            <View style={{ gap: spacing.sm }}>
              {announcements.slice(0, 3).map((notice) => (
                <Card key={notice.id} variant="outlined" style={{ padding: spacing.md }}>
                  <View style={[styles.noticeRow, { marginBottom: spacing.xxs }]}>
                    <Body style={{ fontWeight: '600', flex: 1 }}>{notice.title}</Body>
                    {notice.priority === 'URGENT' && (
                      <Badge label="Urgent" variant="error" />
                    )}
                  </View>
                  <Caption style={{ marginBottom: spacing.xs }}>
                    {notice.content}
                  </Caption>
                  <Caption>{notice.date}</Caption>
                </Card>
              ))}
            </View>
          ) : (
            <Card variant="flat" style={{ padding: spacing.lg }}>
              <Caption align="center">No announcements posted today.</Caption>
            </Card>
          )}
        </View>

        {/* Quick Links / Recent Results preview */}
        <View style={{ marginBottom: spacing.xxl }}>
          <View style={[styles.sectionHeader, { marginBottom: spacing.md }]}>
            <Subtitle>Recent Evaluations</Subtitle>
          </View>

          {isResultsLoading ? (
            <Skeleton height={80} />
          ) : results && results.length > 0 ? (
            <View style={{ gap: spacing.sm }}>
              {results.slice(0, 3).map((result) => (
                <Card
                  key={result.id}
                  variant="outlined"
                  onPress={() => setTab('results')}
                  style={{ padding: spacing.md }}
                >
                  <View style={styles.resultItemRow}>
                    <View style={{ flex: 1 }}>
                      <Body style={{ fontWeight: '600' }}>{result.title}</Body>
                      <Caption style={{ marginTop: spacing.xxs }}>
                        {result.subject} • {result.examDate}
                      </Caption>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Body style={{ fontWeight: '700', color: colors.primary }}>
                        {result.marksObtained}/{result.maxMarks}
                      </Body>
                      <Caption>{Math.round(result.percentage)}%</Caption>
                    </View>
                  </View>
                </Card>
              ))}
            </View>
          ) : (
            <Card variant="flat" style={{ padding: spacing.lg }}>
              <Caption align="center">No published results available yet.</Caption>
            </Card>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statsRow: {
    flexDirection: 'row',
  },
  statCard: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  noticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resultItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
