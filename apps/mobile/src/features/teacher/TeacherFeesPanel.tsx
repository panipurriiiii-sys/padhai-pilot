import React, { useState } from 'react';
import { Alert, View, Text, StyleSheet } from 'react-native';
import { QueryBoundary } from '../../components/common/QueryBoundary';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Body, Caption, StatValue, Subtitle } from '../../components/common/Typography';
import { useFeeLedger, useFeeMutations, useFeeStructures, useFeeSummary } from '../../hooks/useFinanceData';
import { useTheme } from '../../theme/ThemeContext';
import { errorMessage, formatDate, formatInr, todayIso } from '../../lib/format';
import { openPdf } from '../../lib/pdf';
import { documentPaths } from '../../services/api/financeService';
import type { FeeLedgerItem, FeePaymentItem } from '../../services/api/financeService';
import type { PaymentMode } from '@padhai-pilot/shared';

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;
const MODES: PaymentMode[] = ['CASH', 'UPI', 'BANK_TRANSFER', 'CHEQUE', 'CARD', 'OTHER', 'RAZORPAY'];
const STATUS_VARIANT = { PAID: 'success', PARTIAL: 'warning', PENDING: 'neutral', OVERDUE: 'error', VOID: 'neutral' } as const;

type BillingCycle = 'MONTHLY' | 'HALF_YEARLY' | 'YEARLY' | 'ONE_TIME';

function addMonthsToDate(isoDate: string, monthsToAdd: number): string {
  const d = new Date(isoDate + 'T00:00:00');
  d.setMonth(d.getMonth() + monthsToAdd);
  return d.toISOString().slice(0, 10);
}

const PaymentForm: React.FC<{ batchId: string; fee: FeeLedgerItem; onDone: () => void }> = ({ batchId, fee, onDone }) => {
  const { recordPayment } = useFeeMutations(batchId);
  const [amount, setAmount] = useState(String(fee.balanceDue));
  const [paidOn, setPaidOn] = useState(todayIso());
  const [mode, setMode] = useState<PaymentMode>('CASH');
  const [reference, setReference] = useState('');
  const amt = Number(amount);
  const valid = amt > 0 && amt <= fee.balanceDue && ISO_DAY.test(paidOn);
  return (
    <View style={{ marginTop: 12 }}>
      <Input
        label={`Amount (balance ${formatInr(fee.balanceDue)})`}
        keyboardType="decimal-pad"
        value={amount}
        onChangeText={setAmount}
        error={amt > fee.balanceDue ? 'More than the balance due' : null}
      />
      <Input label="Received on (YYYY-MM-DD)" value={paidOn} onChangeText={setPaidOn} autoCapitalize="none" />
      <View style={styles.wrap}>
        {MODES.map((m) => (
          <Button key={m} size="sm" variant={mode === m ? 'primary' : 'outline'} title={m.replace('_', ' ')} onPress={() => setMode(m)} />
        ))}
      </View>
      <Input label="Reference (optional)" value={reference} onChangeText={setReference} autoCapitalize="none" />
      <Button
        title="Mark payment received"
        disabled={!valid}
        loading={recordPayment.isPending}
        onPress={() =>
          recordPayment.mutate(
            { feeRecordId: fee.id, data: { amount: amt, paidOn, mode, reference: reference.trim() || undefined } },
            {
              onSuccess: (p: FeePaymentItem) => {
                Alert.alert('Payment recorded', `Receipt ${p.receiptNumber}. The student has been notified.`);
                onDone();
              },
              onError: (e) => Alert.alert('Could not record payment', errorMessage(e)),
            },
          )
        }
      />
    </View>
  );
};

const FeeRow: React.FC<{ batchId: string; fee: FeeLedgerItem }> = ({ batchId, fee }) => {
  const [open, setOpen] = useState(false);
  const { voidPayment } = useFeeMutations(batchId);
  return (
    <Card style={{ marginBottom: 8 }}>
      <View style={styles.row}>
        <Subtitle style={{ flex: 1 }}>{fee.studentName ?? 'Student'}</Subtitle>
        <Badge label={fee.status} variant={STATUS_VARIANT[fee.status]} />
      </View>
      <Caption>{`${fee.feeTitle} · ${formatInr(fee.paidAmount)} of ${formatInr(fee.totalAmount)} · due ${formatDate(fee.dueDate)}`}</Caption>
      {fee.payments.map((p) => (
        <View key={p.id} style={[styles.row, { marginTop: 6 }]}>
          <Caption style={{ flex: 1 }}>{`${p.receiptNumber} · ${formatInr(p.amount)} · ${p.mode} · ${formatDate(p.paidOn)}${p.status === 'VOIDED' ? ' · VOIDED' : ''}`}</Caption>
          {p.status === 'ISSUED' ? (
            <>
              <Button title="Receipt" size="sm" variant="outline" onPress={() => void openPdf(documentPaths.feeReceipt(p.id), p.receiptNumber)} />
              <Button
                title="Void"
                size="sm"
                variant="outline"
                onPress={() =>
                  Alert.alert('Void this payment?', 'The receipt number is kept and marked void. Record it again if you need to correct it.', [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Void',
                      style: 'destructive',
                      onPress: () =>
                        voidPayment.mutate({ paymentId: p.id, reason: 'Corrected by teacher' }, { onError: (e) => Alert.alert('Could not void', errorMessage(e)) }),
                    },
                  ])
                }
              />
            </>
          ) : null}
        </View>
      ))}
      {fee.balanceDue > 0 ? (
        <Button title={open ? 'Close' : 'Record payment'} size="sm" variant="outline" style={{ marginTop: 8 }} onPress={() => setOpen((v) => !v)} />
      ) : null}
      {open ? <PaymentForm batchId={batchId} fee={fee} onDone={() => setOpen(false)} /> : null}
    </Card>
  );
};

/** Batch fees for the selected batch: set fee, per-student status, mark payments, send reminders. */
export const TeacherFeesPanel: React.FC<{ batchId: string }> = ({ batchId }) => {
  const { colors, typography } = useTheme();
  const summary = useFeeSummary(batchId);
  const structures = useFeeStructures(batchId);
  const ledger = useFeeLedger(batchId);
  const { createStructure, sendReminders } = useFeeMutations(batchId);

  const [cycle, setCycle] = useState<BillingCycle>('MONTHLY');
  const [title, setTitle] = useState('Monthly Tuition fee');
  const [amount, setAmount] = useState('');
  const [monthCount, setMonthCount] = useState(1);
  const [dueDate, setDueDate] = useState(todayIso());

  const numAmt = Number(amount);
  const valid = !!title.trim() && numAmt > 0 && ISO_DAY.test(dueDate);
  const hasStructure = (structures.data ?? []).some((s) => s.status === 'ACTIVE');

  const handleSelectCycle = (newCycle: BillingCycle) => {
    setCycle(newCycle);
    if (newCycle === 'MONTHLY') setTitle('Monthly Tuition fee');
    else if (newCycle === 'HALF_YEARLY') setTitle('Semester Tuition fee');
    else if (newCycle === 'YEARLY') setTitle('Annual Tuition fee');
    else setTitle('Course fee');
  };

  const handleCreate = () => {
    if (!valid) return;

    if (cycle === 'MONTHLY' && monthCount > 1) {
      const instalments = Array.from({ length: monthCount }, (_, i) => ({
        label: `Month ${i + 1}`,
        amount: numAmt,
        dueDate: addMonthsToDate(dueDate, i),
      }));
      createStructure.mutate(
        {
          title: `${title.trim()} (${monthCount} Months)`,
          amount: numAmt * monthCount,
          dueDate,
          instalments,
        },
        {
          onSuccess: (r) => {
            setAmount('');
            Alert.alert('Fee Schedule Created', `${r.studentsCharged} students charged ${formatInr(r.totalPerStudent)} across ${monthCount} monthly instalments.`);
          },
          onError: (e) => Alert.alert('Could not create fee', errorMessage(e)),
        },
      );
    } else if (cycle === 'HALF_YEARLY') {
      const instalments = [
        { label: 'Term 1 (First Half)', amount: numAmt, dueDate },
        { label: 'Term 2 (Second Half)', amount: numAmt, dueDate: addMonthsToDate(dueDate, 6) },
      ];
      createStructure.mutate(
        {
          title: `${title.trim()} (Half-Yearly / 2 Terms)`,
          amount: numAmt * 2,
          dueDate,
          instalments,
        },
        {
          onSuccess: (r) => {
            setAmount('');
            Alert.alert('Fee Schedule Created', `${r.studentsCharged} students charged ${formatInr(r.totalPerStudent)} across 2 terms.`);
          },
          onError: (e) => Alert.alert('Could not create fee', errorMessage(e)),
        },
      );
    } else {
      createStructure.mutate(
        { title: title.trim(), amount: numAmt, dueDate },
        {
          onSuccess: (r) => {
            setAmount('');
            Alert.alert('Fee Created', `${r.studentsCharged} students charged ${formatInr(r.totalPerStudent)}.`);
          },
          onError: (e) => Alert.alert('Could not create fee', errorMessage(e)),
        },
      );
    }
  };

  return (
    <>
      <QueryBoundary query={summary}>
        {(s) => (
          <View style={styles.grid}>
            <Card style={styles.kpi}><Caption>Collected</Caption><StatValue color={colors.success}>{formatInr(s.totalCollected)}</StatValue></Card>
            <Card style={styles.kpi}><Caption>Pending</Caption><StatValue color={colors.warning}>{formatInr(s.totalPending)}</StatValue></Card>
            <Card style={styles.kpi}><Caption>Overdue</Caption><StatValue color={colors.error}>{formatInr(s.overdueAmount)}</StatValue></Card>
          </View>
        )}
      </QueryBoundary>

      <Card style={{ marginVertical: 12 }}>
        <Subtitle>{hasStructure ? 'Add Fee Schedule' : 'Set Batch Fee Schedule'}</Subtitle>
        <Caption>Configure monthly, half-yearly or annual plans for all enrolled students.</Caption>

        {/* Billing Cycle Selector */}
        <Caption style={{ marginTop: 10, fontWeight: '700' }}>Billing Cycle / Frequency</Caption>
        <View style={[styles.wrap, { marginVertical: 6 }]}>
          {(['MONTHLY', 'HALF_YEARLY', 'YEARLY', 'ONE_TIME'] as BillingCycle[]).map((c) => (
            <Button
              key={c}
              size="sm"
              variant={cycle === c ? 'primary' : 'outline'}
              title={c === 'HALF_YEARLY' ? 'Half-Yearly' : c === 'ONE_TIME' ? 'One-Time' : c.charAt(0) + c.slice(1).toLowerCase()}
              onPress={() => handleSelectCycle(c)}
            />
          ))}
        </View>

        <Input label="Fee Title" value={title} onChangeText={setTitle} />
        <Input
          label={
            cycle === 'MONTHLY'
              ? 'Monthly Fee per Student (INR)'
              : cycle === 'HALF_YEARLY'
              ? 'Fee per Half-Year / Term (INR)'
              : cycle === 'YEARLY'
              ? 'Annual Fee per Student (INR)'
              : 'Fee Amount per Student (INR)'
          }
          keyboardType="decimal-pad"
          value={amount}
          onChangeText={setAmount}
        />

        {cycle === 'MONTHLY' && (
          <View style={{ marginBottom: 10 }}>
            <Caption style={{ marginBottom: 6, fontWeight: '600' }}>Number of Months to Schedule</Caption>
            <View style={styles.wrap}>
              {[1, 3, 6, 10, 12].map((m) => (
                <Button
                  key={m}
                  size="sm"
                  variant={monthCount === m ? 'primary' : 'outline'}
                  title={`${m} Mo`}
                  onPress={() => setMonthCount(m)}
                />
              ))}
            </View>
            {numAmt > 0 && (
              <Text style={{ fontFamily: typography.fonts.ui, fontSize: 12, color: colors.primary, marginTop: 4 }}>
                {`Plan: ${formatInr(numAmt)}/mo × ${monthCount} = ${formatInr(numAmt * monthCount)} total per student (${monthCount} instalments).`}
              </Text>
            )}
          </View>
        )}

        {cycle === 'HALF_YEARLY' && numAmt > 0 && (
          <Text style={{ fontFamily: typography.fonts.ui, fontSize: 12, color: colors.primary, marginBottom: 8 }}>
            {`Plan: 2 Terms (6 months apart) × ${formatInr(numAmt)} = ${formatInr(numAmt * 2)} annual total per student.`}
          </Text>
        )}

        {cycle === 'YEARLY' && numAmt > 0 && (
          <Text style={{ fontFamily: typography.fonts.ui, fontSize: 12, color: colors.primary, marginBottom: 8 }}>
            {`Plan: Full annual fee of ${formatInr(numAmt)} per student.`}
          </Text>
        )}

        <Input label="Due date (First Installment, YYYY-MM-DD)" value={dueDate} onChangeText={setDueDate} autoCapitalize="none" />
        <Button
          title={cycle === 'MONTHLY' && monthCount > 1 ? `Create ${monthCount}-Month Fee Schedule` : 'Create Fee Schedule'}
          disabled={!valid}
          loading={createStructure.isPending}
          onPress={handleCreate}
        />
      </Card>

      <Button
        title="Send fee reminders (in-app)"
        variant="outline"
        loading={sendReminders.isPending}
        onPress={() =>
          sendReminders.mutate(undefined, {
            onSuccess: (r) =>
              Alert.alert('Reminders', `${r.inAppCreated} sent, ${r.skippedDuplicates} already reminded today (${r.considered} considered).`),
            onError: (e) => Alert.alert('Could not send', errorMessage(e)),
          })
        }
      />

      <View style={{ marginTop: 12 }}>
        <QueryBoundary query={ledger} isEmpty={(l) => l.length === 0} emptyTitle="No fee records" emptyDescription="Create a batch fee above; students enrolled now and later are charged automatically.">
          {(rows) => (
            <>
              {rows.map((f) => <FeeRow key={f.id} batchId={batchId} fee={f} />)}
              <Body>{' '}</Body>
            </>
          )}
        </QueryBoundary>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  kpi: { flex: 1, padding: 12 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
});
