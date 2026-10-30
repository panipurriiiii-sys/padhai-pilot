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
import { Badge } from '../../../components/common/Badge';
import { Skeleton } from '../../../components/common/Skeleton';
import { EmptyState } from '../../../components/common/EmptyState';
import { ErrorState } from '../../../components/common/ErrorState';
import { useResultsData } from '../../../hooks/useStudentData';
import { AssessmentResultItem } from '../../../services/api/studentService';
import { useTheme } from '../../../theme/ThemeContext';

export const ResultsScreen: React.FC = () => {
  const { colors, spacing } = useTheme();
  const { data: results, isLoading, error, refetch, isRefetching } = useResultsData();

  const metrics = useMemo(() => {
    if (!results || results.length === 0) {
      return { totalTests: 0, averagePercentage: 0, highestScore: 0 };
    }
    const total = results.length;
    const avg =
      results.reduce((sum, item) => sum + (item.percentage || 0), 0) / total;
    const highest = Math.max(...results.map((i) => i.percentage || 0));
    return {
      totalTests: total,
      averagePercentage: Math.round(avg),
      highestScore: Math.round(highest),
    };
  }, [results]);

  const renderResultItem: ListRenderItem<AssessmentResultItem> = useCallback(
    ({ item }) => {
      const isPassed = item.percentage >= 40;
      return (
        <Card
          variant="outlined"
          style={{ marginBottom: spacing.md, padding: spacing.lg }}
        >
          <View style={[styles.cardHeader, { marginBottom: spacing.xs }]}>
            <View style={{ flex: 1 }}>
              <Body style={{ fontWeight: '600' }}>{item.title}</Body>
              <Caption style={{ marginTop: spacing.xxs }}>
                {item.subject} • {item.examDate}
              </Caption>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Body style={{ fontWeight: '700', color: colors.primary }}>
                {item.marksObtained}/{item.maxMarks}
              </Body>
              <Caption style={{ marginTop: spacing.xxs }}>
                {Math.round(item.percentage)}%
              </Caption>
            </View>
          </View>

          <View style={[styles.cardFooter, { borderTopColor: colors.borderSubtle, borderTopWidth: 1, paddingTop: spacing.sm, marginTop: spacing.xs }]}>
            <View style={styles.badgeRow}>
              {item.rank && (
                <Badge
                  label={`Rank #${item.rank}${item.totalStudents ? ` of ${item.totalStudents}` : ''}`}
                  variant="primary"
                />
              )}
              {item.grade && (
                <Badge label={`Grade ${item.grade}`} variant={isPassed ? 'success' : 'error'} />
              )}
            </View>
            {item.remarks && (
              <Caption numberOfLines={1} style={{ maxWidth: '40%' }}>
                {item.remarks}
              </Caption>
            )}
          </View>
        </Card>
      );
    },
    [colors.borderSubtle, colors.primary, spacing],
  );

  const keyExtractor = useCallback((item: AssessmentResultItem) => item.id, []);

  return (
    <ScreenContainer edges={['top', 'left', 'right']}>
      <View style={[styles.header, { paddingHorizontal: spacing.lg, paddingTop: spacing.md }]}>
        <Title>Evaluation Scorecard</Title>
        <Caption style={{ marginTop: spacing.xxs }}>
          Verified test scores and class rankings
        </Caption>
      </View>

      {/* KPI Overview Summary */}
      <View style={[styles.summaryContainer, { paddingHorizontal: spacing.lg, marginVertical: spacing.lg }]}>
        <Card variant="flat" style={{ padding: spacing.lg }}>
          <View style={styles.kpiRow}>
            <View>
              <Caption>Average Score</Caption>
              <StatValue color={colors.primary} style={{ marginTop: spacing.xxs }}>
                {isLoading ? '--' : `${metrics.averagePercentage}%`}
              </StatValue>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Caption>Total Evaluated</Caption>
              <Body style={{ fontWeight: '600', marginTop: spacing.xxs }}>
                {metrics.totalTests} Tests
              </Body>
              <Caption style={{ marginTop: spacing.xxs }}>
                Peak: {metrics.highestScore}%
              </Caption>
            </View>
          </View>
        </Card>
      </View>

      {/* Results List */}
      <View style={{ flex: 1, paddingHorizontal: spacing.lg }}>
        <Subtitle style={{ marginBottom: spacing.sm }}>Evaluations</Subtitle>

        {isLoading ? (
          <View style={{ gap: spacing.md }}>
            <Skeleton height={90} />
            <Skeleton height={90} />
          </View>
        ) : error ? (
          <ErrorState
            message="Unable to load published marks."
            onRetry={refetch}
          />
        ) : !results || results.length === 0 ? (
          <EmptyState
            title="No Results Published Yet"
            description="When your teacher enters test scores, they will appear here with your rank and percentage."
          />
        ) : (
          <FlatList
            data={results}
            renderItem={renderResultItem}
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
  },
});
