import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { presentAlert as Alert } from '../../store/useAlertStore';
import { QueryBoundary } from '../../components/common/QueryBoundary';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Body, Caption, Subtitle } from '../../components/common/Typography';
import { useLeavesForReview, useReviewLeave, useStudentLeaveMutations, useStudentLeaves } from '../../hooks/useFinanceData';
import { errorMessage, formatDate, todayIso } from '../../lib/format';
import type { StudentLeaveItem } from '../../services/api/financeService';

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;
const VARIANT = { PENDING: 'warning', APPROVED: 'success', REJECTED: 'error', CANCELLED: 'neutral' } as const;

const LeaveCard: React.FC<{ l: StudentLeaveItem; children?: React.ReactNode }> = ({ l, children }) => (
  <Card style={{ marginBottom: 8 }}>
    <View style={styles.row}>
      <Subtitle style={{ flex: 1 }}>{l.studentName ? `${l.studentName} · ${formatDate(l.startDate)}` : `${formatDate(l.startDate)} – ${formatDate(l.endDate)}`}</Subtitle>
      <Badge label={l.status} variant={VARIANT[l.status]} />
    </View>
    {l.studentName ? <Caption>{`${formatDate(l.startDate)} – ${formatDate(l.endDate)} · ${l.totalDays} day(s)${l.batchName ? ` · ${l.batchName}` : ''}`}</Caption> : null}
    <Body>{l.reason}</Body>
    {l.reviewerRemarks ? <Caption>{`Remarks: ${l.reviewerRemarks}`}</Caption> : null}
    {children}
  </Card>
);

/** Student: apply for leave, see status, cancel while pending. */
export const StudentLeaveApply: React.FC = () => {
  const q = useStudentLeaves();
  const { apply, cancel } = useStudentLeaveMutations();
  const [start, setStart] = useState(todayIso());
  const [end, setEnd] = useState(todayIso());
  const [reason, setReason] = useState('');
  const valid = ISO_DAY.test(start) && ISO_DAY.test(end) && end >= start && !!reason.trim();
  return (
    <>
      <Card style={{ marginBottom: 16 }}>
        <Input label="From (YYYY-MM-DD)" value={start} onChangeText={setStart} autoCapitalize="none" />
        <Input label="To (YYYY-MM-DD)" value={end} onChangeText={setEnd} autoCapitalize="none" />
        <Input label="Reason" value={reason} onChangeText={setReason} multiline />
        <Button
          title="Apply for leave"
          disabled={!valid}
          loading={apply.isPending}
          onPress={() =>
            apply.mutate(
              { startDate: start, endDate: end, reason: reason.trim() },
              { onSuccess: () => setReason(''), onError: (e) => Alert.alert('Could not apply', errorMessage(e)) },
            )
          }
        />
      </Card>
      <QueryBoundary query={q} isEmpty={(l) => l.length === 0} emptyTitle="No leave applications" emptyDescription="Your requests and your teacher's decisions appear here.">
        {(items) =>
          items.map((l) => (
            <LeaveCard key={l.id} l={l}>
              {l.status === 'PENDING' ? (
                <Button
                  title="Cancel request"
                  size="sm"
                  variant="outline"
                  style={{ marginTop: 8 }}
                  onPress={() =>
                    Alert.alert(
                      'Cancel leave request?',
                      'Are you sure you want to withdraw this application?',
                      [
                        { text: 'Keep', style: 'cancel' },
                        {
                          text: 'Withdraw',
                          style: 'destructive',
                          onPress: () =>
                            cancel.mutate(l.id, {
                              onError: (e) => Alert.alert('Could not cancel', errorMessage(e)),
                            }),
                        },
                      ],
                    )
                  }
                />
              ) : null}
            </LeaveCard>
          ))
        }
      </QueryBoundary>
    </>
  );
};

/** Teacher: review student leave for their batches. A reason is required to reject. */
export const StudentLeaveReview: React.FC = () => {
  const q = useLeavesForReview();
  const review = useReviewLeave();
  const [remarks, setRemarks] = useState<Record<string, string>>({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isBulkApproving, setIsBulkApproving] = useState(false);

  const decide = (l: StudentLeaveItem, status: 'APPROVED' | 'REJECTED') => {
    const r = (remarks[l.id] ?? '').trim();
    if (status === 'REJECTED' && !r) {
      Alert.alert('Remarks required', 'Add a short reason before rejecting.');
      return;
    }
    setActiveId(l.id);
    review.mutate(
      { id: l.id, data: { status, remarks: r || undefined } },
      {
        onSettled: () => setActiveId(null),
        onError: (e) => Alert.alert('Could not save decision', errorMessage(e)),
      },
    );
  };

  const approveAll = (items: StudentLeaveItem[]) => {
    const pending = items.filter((l) => l.status === 'PENDING');
    if (pending.length === 0) return;
    Alert.alert(
      'Approve All Requests?',
      `Are you sure you want to approve all ${pending.length} pending leave requests?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: `Approve All (${pending.length})`,
          onPress: async () => {
            setIsBulkApproving(true);
            try {
              const results = await Promise.allSettled(
                pending.map((l) =>
                  review.mutateAsync({ id: l.id, data: { status: 'APPROVED', remarks: 'Bulk approved' } }),
                ),
              );
              const succeeded = results.filter((r) => r.status === 'fulfilled').length;
              const failed = results.filter((r) => r.status === 'rejected').length;
              if (failed > 0) {
                Alert.alert('Partially approved', `${succeeded} approved, ${failed} failed.`);
              } else {
                Alert.alert('Approved', `All ${succeeded} leave requests approved successfully.`);
              }
            } catch (e) {
              Alert.alert('Error', errorMessage(e));
            } finally {
              setIsBulkApproving(false);
            }
          },
        },
      ],
    );
  };

  return (
    <QueryBoundary query={q} isEmpty={(l) => l.length === 0} emptyTitle="No student leave" emptyDescription="Requests from your batches appear here.">
      {(items) => {
        const pending = items.filter((l) => l.status === 'PENDING');
        return (
          <>
            {pending.length > 0 && (
              <View style={{ marginBottom: 12 }}>
                <Button
                  title={isBulkApproving ? 'Approving All...' : `Approve All Pending (${pending.length})`}
                  variant="primary"
                  size="md"
                  loading={isBulkApproving}
                  onPress={() => approveAll(items)}
                />
              </View>
            )}

            {items.map((l) => (
              <LeaveCard key={l.id} l={l}>
                {l.status === 'PENDING' ? (
                  <View style={{ marginTop: 8 }}>
                    <Input label="Remarks" value={remarks[l.id] ?? ''} onChangeText={(t) => setRemarks((m) => ({ ...m, [l.id]: t }))} />
                    <View style={styles.row}>
                      <Button
                        title="Approve"
                        size="sm"
                        loading={review.isPending && activeId === l.id}
                        disabled={review.isPending && activeId !== l.id}
                        onPress={() => decide(l, 'APPROVED')}
                      />
                      <Button
                        title="Reject"
                        size="sm"
                        variant="outline"
                        disabled={review.isPending && activeId === l.id}
                        onPress={() => decide(l, 'REJECTED')}
                      />
                    </View>
                  </View>
                ) : null}
              </LeaveCard>
            ))}
          </>
        );
      }}
    </QueryBoundary>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
