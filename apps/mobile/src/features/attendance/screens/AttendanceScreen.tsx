import React, { useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  ListRenderItem,
} from 'react-native';
import { ScreenContainer } from '../../../components/common/ScreenContainer';
import { Title, Subtitle, Body, Caption, StatValue } from '../../../components/common/Typography';
import { Card } from '../../../components/common/Card';
import { Badge, BadgeVariant } from '../../../components/common/Badge';
import { Skeleton } from '../../../components/common/Skeleton';
import { EmptyState } from '../../../components/common/EmptyState';
import { ErrorState } from '../../../components/common/ErrorState';
import { useAttendanceData } from '../../../hooks/useStudentData';
import { AttendanceRecord } from '../../../services/api/studentService';
import { useTheme } from '../../../theme/ThemeContext';

export const AttendanceScreen: React.FC = () => {
  const { colors, spacing } = useTheme();
  const { data, isLoading, error, refetch, isRefetching } = useAttendanceData();

  const metrics = useMemo(() => {
    if (!data) return { total: 0, attended: 0, absent: 0, percentage: 0 };
    const attended = data.attended || 0;
    const total = data.totalClasses || 0;
    const absent = Math.max(0, total - attended);
    const percentage = total > 0 ? (attended / total) * 100 : 0;
    return { total, attended, absent, percentage };
  }, [data]);

  const getStatusBadge = (status: AttendanceRecord['status']): { label: string; variant: BadgeVariant } => {
    switch (status) {
      case 'PRESENT':
        return { label: 'Present', variant: 'success' };
      case 'ABSENT':
        return { label: 'Absent', variant: 'error' };
      case 'LATE':
        return { label: 'Late', variant: 'warning' };
      case 'EXCUSED':
        return { label: 'Excused', variant: 'neutral' };
      default:
        return { label: status, variant: 'neutral' };
    }
  };

  const renderAttendanceItem: ListRenderItem<AttendanceRecord> = useCallback(
    ({ item }) => {
      const badge = getStatusBadge(item.status);
      return (
        <View
          style={[
            styles.recordItem,
            {
              borderBottomColor: colors.borderSubtle,
              paddingVertical: spacing.md,
            },
          ]}
        >
          <View style={{ flex: 1 }}>
            <Body style={{ fontWeight: '500' }}>
              {item.subjectName || 'Class Session'}
            </Body>
            <Caption style={{ marginTop: spacing.xxs }}>
              {item.date} {item.remarks ? `• ${item.remarks}` : ''}
            </Caption>
          </View>
          <Badge label={badge.label} variant={badge.variant} />
        </View>
      );
    },
    [colors.borderSubtle, spacing],
  );

  const keyExtractor = useCallback((item: AttendanceRecord) => item.id, []);

  return (
    <ScreenContainer edges={['top', 'left', 'right']}>
      <View style={[styles.header, { paddingHorizontal: spacing.lg, paddingTop: spacing.md }]}>
        <Title>Attendance Register</Title>
        <Caption style={{ marginTop: spacing.xxs }}>
          Verified classroom roll call records
        </Caption>
      </View>

      {/* KPI Overview Summary */}
      <View style={[styles.summaryContainer, { paddingHorizontal: spacing.lg, marginVertical: spacing.lg }]}>
        <Card variant="flat" style={{ padding: spacing.lg }}>
          <View style={styles.kpiRow}>
            <View>
              <Caption>Overall Attendance</Caption>
              <StatValue
                color={metrics.percentage < 75 ? colors.warning : colors.primary}
                style={{ marginTop: spacing.xxs }}
              >
                {isLoading ? '--' : `${Math.round(metrics.percentage)}%`}
              </StatValue>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Caption>Total Classes</Caption>
              <Body style={{ fontWeight: '600', marginTop: spacing.xxs }}>
                {metrics.total}
              </Body>
              <Caption style={{ marginTop: spacing.xxs }}>
                {metrics.attended} Present • {metrics.absent} Absent
              </Caption>
            </View>
          </View>
        </Card>
      </View>

      {/* Records List */}
      <View style={{ flex: 1, paddingHorizontal: spacing.lg }}>
        <Subtitle style={{ marginBottom: spacing.sm }}>Session History</Subtitle>

        {isLoading ? (
          <View style={{ gap: spacing.md }}>
            <Skeleton height={48} />
            <Skeleton height={48} />
            <Skeleton height={48} />
          </View>
        ) : error ? (
          <ErrorState
            message="Unable to load attendance register."
            onRetry={refetch}
          />
        ) : !data || data.records.length === 0 ? (
          <EmptyState
            title="No Attendance Logged Yet"
            description="Your attendance will appear here once your teacher completes roll call."
          />
        ) : (
          <FlatList
            data={data.records}
            renderItem={renderAttendanceItem}
            keyExtractor={keyExtractor}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={refetch}
                tintColor={colors.primary}
              />
            }
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
          />
        )}
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  header: {},
  summaryContainer: {},
  kpiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
});

