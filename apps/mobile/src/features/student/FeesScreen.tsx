import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Screen } from '../../components/common/Screen';
import { QueryBoundary } from '../../components/common/QueryBoundary';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Body, Caption, StatValue, Subtitle } from '../../components/common/Typography';
import { useFeesData } from '../../hooks/useStudentData';
import { useTheme } from '../../theme/ThemeContext';
import { formatDate, formatInr } from '../../lib/format';

const VARIANT = { PAID: 'success', PENDING: 'warning', OVERDUE: 'error' } as const;

export const FeesScreen: React.FC = () => {
  const { colors, spacing } = useTheme();
  const query = useFeesData();

  return (
    <Screen
      eyebrow="ACADEMIC DUES"
      title="Fees & receipts"
      subtitle="Payment status changes only after your institute verifies it"
      refreshing={query.isRefetching}
      onRefresh={() => query.refetch()}
    >
      <QueryBoundary
        query={query}
        isEmpty={(f) => f.receipts.length === 0}
        emptyTitle="No fee records"
        emptyDescription="Your institute has not added any fee records for you yet."
      >
        {(f) => (
          <>
            <View style={styles.grid}>
              <Card style={styles.kpi}>
                <Caption>Total</Caption>
                <StatValue>{formatInr(f.totalFees)}</StatValue>
              </Card>
              <Card style={styles.kpi}>
                <Caption>Paid</Caption>
                <StatValue color={colors.success}>{formatInr(f.paidAmount)}</StatValue>
              </Card>
              <Card style={styles.kpi}>
                <Caption>Balance due</Caption>
                <StatValue color={f.balanceDue > 0 ? colors.warning : colors.success}>
                  {formatInr(f.balanceDue)}
                </StatValue>
              </Card>
            </View>

            <View style={{ marginTop: spacing.lg }}>
              {f.receipts.map((r) => (
                <Card key={r.id} style={{ marginBottom: spacing.sm }}>
                  <View style={styles.row}>
                    <Subtitle style={{ flex: 1 }}>{r.title}</Subtitle>
                    <Badge label={r.status} variant={VARIANT[r.status]} />
                  </View>
                  <Body>{`${formatInr(r.paidAmount)} of ${formatInr(r.amount)}`}</Body>
                  <Caption>
                    {r.status === 'PAID' && r.paidDate
                      ? `Paid ${formatDate(r.paidDate)}${r.receiptNumber ? ` · ${r.receiptNumber}` : ''}`
                      : `Due ${formatDate(r.dueDate)}`}
                  </Caption>
                </Card>
              ))}
            </View>
          </>
        )}
      </QueryBoundary>
    </Screen>
  );
};

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  kpi: { flexGrow: 1, flexBasis: '30%' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
