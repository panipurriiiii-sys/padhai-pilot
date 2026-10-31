import React, { useState } from 'react';
import { Alert, View, StyleSheet } from 'react-native';
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
const MODES: PaymentMode[] = ['CASH', 'UPI', 'BANK_TRANSFER', 'CHEQUE', 'CARD', 'OTHER'];
const STATUS_VARIANT = { PAID: 'success', PARTIAL: 'warning', PENDING: 'neutral', OVERDUE: 'error', VOID: 'neutral' } as const;

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
  const { colors } = useTheme();
  const summary = useFeeSummary(batchId);
  const structures = useFeeStructures(batchId);
  const ledger = useFeeLedger(batchId);
  const { createStructure, sendReminders } = useFeeMutations(batchId);
  const [title, setTitle] = useState('Tuition fee');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(todayIso());
  const valid = !!title.trim() && Number(amount) > 0 && ISO_DAY.test(dueDate);
  const hasStructure = (structures.data ?? []).some((s) => s.status === 'ACTIVE');

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
        <Subtitle>{hasStructure ? 'Add another fee' : 'Set batch fee'}</Subtitle>
        <Caption>Every enrolled student starts as PENDING. Payments are marked by you.</Caption>
        <Input label="Title" value={title} onChangeText={setTitle} />
        <Input label="Amount per student (INR)" keyboardType="decimal-pad" value={amount} onChangeText={setAmount} />
        <Input label="Due date (YYYY-MM-DD)" value={dueDate} onChangeText={setDueDate} autoCapitalize="none" />
        <Button
          title="Create fee for batch"
          disabled={!valid}
          loading={createStructure.isPending}
          onPress={() =>
            createStructure.mutate(
              { title: title.trim(), amount: Number(amount), dueDate },
              {
                onSuccess: (r) => { setAmount(''); Alert.alert('Fee created', `${r.studentsCharged} students charged ${formatInr(r.totalPerStudent)}.`); },
                onError: (e) => Alert.alert('Could not create fee', errorMessage(e)),
              },
            )
          }
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
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  kpi: { flexGrow: 1, flexBasis: '30%' },
});
