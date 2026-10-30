import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Title, Subtitle, Body, Caption, Label, StatValue } from '../../components/common/Typography';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { useTheme } from '../../theme/ThemeContext';
import { studentService, FeeReceiptItem } from '../../services/api/studentService';

export const FeesScreen: React.FC = () => {
  const { colors, spacing } = useTheme();

  const [receipts, setReceipts] = useState<FeeReceiptItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadFees();
  }, []);

  const loadFees = async () => {
    setIsLoading(true);
    try {
      const data = await studentService.getFees();
      if (data && data.length > 0) {
        setReceipts(data);
      } else {
        setReceipts([
          {
            id: 'rec_01',
            title: 'Term 1 Tuition & Comprehensive Test Series',
            dueDate: '2026-08-15',
            amount: 20000,
            status: 'PAID',
            paidDate: '2026-08-10',
            receiptNumber: 'REC-2026-0941',
          },
          {
            id: 'rec_02',
            title: 'Term 2 Study Vault & Problem Practice Batch',
            dueDate: '2026-11-15',
            amount: 15000,
            status: 'PENDING',
            receiptNumber: 'INV-2026-1102',
          },
        ]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const total = receipts.reduce((acc, r) => acc + r.amount, 0);
  const paid = receipts.filter((r) => r.status === 'PAID').reduce((acc, r) => acc + r.amount, 0);
  const balance = total - paid;

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={[styles.content, { padding: spacing.lg }]}>
        <View style={{ marginBottom: spacing.md }}>
          <Badge label="ACADEMIC DUES" variant="primary" />
          <Title style={{ marginTop: 4 }}>Fees & Receipts</Title>
          <Caption>Official tuition receipts and upcoming semester payments.</Caption>
        </View>

        {/* Dues Overview Grid */}
        <View style={[styles.statsGrid, { marginBottom: spacing.lg }]}>
          <Card style={[styles.statCard, { marginRight: spacing.sm }]}>
            <Caption>TOTAL DUES</Caption>
            <StatValue color={colors.textPrimary}>₹{total.toLocaleString('en-IN')}</StatValue>
            <Caption>Full academic year</Caption>
          </Card>

          <Card style={styles.statCard}>
            <Caption>PAID AMOUNT</Caption>
            <StatValue color={colors.success}>₹{paid.toLocaleString('en-IN')}</StatValue>
            <Caption>Verified cleared</Caption>
          </Card>
        </View>

        <Card variant="elevated" style={{ marginBottom: spacing.lg }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Caption>BALANCE PENDING</Caption>
              <StatValue color={balance > 0 ? colors.warning : colors.success}>
                ₹{balance.toLocaleString('en-IN')}
              </StatValue>
            </View>
            <Badge label={balance <= 0 ? 'CLEARED' : 'TERM 2 DUE'} variant={balance <= 0 ? 'success' : 'warning'} />
          </View>
        </Card>

        {/* Receipts List */}
        <Subtitle style={{ marginBottom: spacing.sm }}>Payment Receipts ({receipts.length})</Subtitle>
        {receipts.map((rec) => (
          <Card key={rec.id} style={{ marginBottom: spacing.sm }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Label style={{ color: colors.textPrimary }}>{rec.title}</Label>
                <Caption style={{ marginTop: 2 }}>{rec.receiptNumber} • Due {rec.dueDate}</Caption>
              </View>
              <Badge
                label={rec.status}
                variant={rec.status === 'PAID' ? 'success' : 'warning'}
              />
            </View>

            <View style={[styles.receiptFooter, { marginTop: spacing.md, borderTopColor: colors.borderSubtle, borderTopWidth: 1, paddingTop: spacing.sm }]}>
              <Label style={{ fontSize: 16, color: colors.textPrimary, fontWeight: 'bold' }}>
                ₹{rec.amount.toLocaleString('en-IN')}
              </Label>
              <Button
                title="Receipt"
                variant="outline"
                size="sm"
                onPress={() => Alert.alert('Receipt', `Receipt ${rec.receiptNumber} downloaded.`)}
              />
            </View>
          </Card>
        ))}
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingBottom: 40,
  },
  statsGrid: {
    flexDirection: 'row',
  },
  statCard: {
    flex: 1,
  },
  receiptFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});

