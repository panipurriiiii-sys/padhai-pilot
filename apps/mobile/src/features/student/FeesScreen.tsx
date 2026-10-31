import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Screen, SectionTitle } from '../../components/common/Screen';
import { QueryBoundary } from '../../components/common/QueryBoundary';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Body, Caption, StatValue, Subtitle } from '../../components/common/Typography';
import { useStudentFeeLedger } from '../../hooks/useFinanceData';
import { useTheme } from '../../theme/ThemeContext';
import { formatDate, formatInr } from '../../lib/format';
import { openPdf } from '../../lib/pdf';
import { documentPaths } from '../../services/api/financeService';

const VARIANT = { PAID: 'success', PARTIAL: 'warning', PENDING: 'neutral', OVERDUE: 'error', VOID: 'neutral' } as const;

export const FeesScreen: React.FC = () => {
  const { colors, spacing } = useTheme();
  const query = useStudentFeeLedger();

  return (
    <Screen
      eyebrow="ACADEMIC DUES"
      title="Fees & receipts"
      subtitle="Payment status changes only after your teacher records it"
      refreshing={query.isRefetching}
      onRefresh={() => query.refetch()}
    >
      <QueryBoundary
        query={query}
        isEmpty={(f) => f.fees.length === 0}
        emptyTitle="No fee records"
        emptyDescription="Your teacher has not set a fee for your batch yet."
      >
        {(f) => (
          <>
            {f.overdueAmount > 0 ? (
              <Card style={{ marginBottom: spacing.md, borderColor: colors.error }}>
                <Subtitle color={colors.error}>{`Overdue: ${formatInr(f.overdueAmount)}`}</Subtitle>
                <Caption>Please contact your teacher to clear the balance.</Caption>
              </Card>
            ) : null}
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
                <StatValue color={f.balanceDue > 0 ? colors.warning : colors.success}>{formatInr(f.balanceDue)}</StatValue>
              </Card>
            </View>

            <SectionTitle>Fees</SectionTitle>
            {f.fees.map((fee) => (
              <Card key={fee.id} style={{ marginBottom: spacing.sm }}>
                <View style={styles.row}>
                  <Subtitle style={{ flex: 1 }}>{fee.feeTitle}</Subtitle>
                  <Badge label={fee.status} variant={VARIANT[fee.status]} />
                </View>
                <Body>{`${formatInr(fee.paidAmount)} of ${formatInr(fee.totalAmount)}`}</Body>
                <Caption>{`Due ${formatDate(fee.dueDate)}${fee.balanceDue > 0 ? ` · balance ${formatInr(fee.balanceDue)}` : ''}`}</Caption>
              </Card>
            ))}

            <SectionTitle>Receipts</SectionTitle>
            {f.receipts.length === 0 ? <Caption>No payments recorded yet.</Caption> : null}
            {f.receipts.map((r) => (
              <Card key={r.id} style={{ marginBottom: spacing.sm }}>
                <View style={styles.row}>
                  <Subtitle style={{ flex: 1 }}>{r.receiptNumber}</Subtitle>
                  <Badge label={r.status} variant={r.status === 'ISSUED' ? 'success' : 'neutral'} />
                </View>
                <Body>{formatInr(r.amount)}</Body>
                <Caption>{`${formatDate(r.paidOn)} · ${r.mode.replace('_', ' ')}${r.reference ? ` · ${r.reference}` : ''}`}</Caption>
                {r.status === 'ISSUED' ? (
                  <Button
                    title="Open receipt PDF"
                    size="sm"
                    variant="outline"
                    style={{ marginTop: spacing.sm }}
                    onPress={() => void openPdf(documentPaths.feeReceipt(r.id), r.receiptNumber)}
                  />
                ) : null}
              </Card>
            ))}
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
