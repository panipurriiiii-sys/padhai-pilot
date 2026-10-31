import React, { useState } from 'react';
import { Alert, Share, View, StyleSheet } from 'react-native';
import { Screen, SectionTitle } from '../../components/common/Screen';
import { QueryBoundary } from '../../components/common/QueryBoundary';
import { BatchPicker } from '../../components/common/BatchPicker';
import { Segmented } from '../../components/common/Segmented';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Body, Caption, Subtitle } from '../../components/common/Typography';
import {
  useBatches,
  useBatchMutations,
  useInvitationMutations,
  useInvitations,
  useRoster,
} from '../../hooks/useTeacherData';
import { useTheme } from '../../theme/ThemeContext';
import { errorMessage, formatDate } from '../../lib/format';
import type { EnrollmentCode, TeacherBatch } from '../../services/api/teacherService';

import { TeacherFeesPanel } from './TeacherFeesPanel';

type Tab = 'students' | 'codes' | 'fees' | 'batch';
const CODE_VARIANT = { ACTIVE: 'success', EXPIRED: 'neutral', REVOKED: 'error', EXHAUSTED: 'warning' } as const;
const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

/** Opens the native share sheet with the server-built message (code + join link). */
export const shareCode = (c: Pick<EnrollmentCode, 'shareText' | 'code'>) =>
  Share.share({ message: c.shareText || c.code }).catch(() => undefined);

const CodeCard: React.FC<{ c: EnrollmentCode }> = ({ c }) => {
  const { spacing } = useTheme();
  const { update, revoke, reactivate } = useInvitationMutations();
  const [editing, setEditing] = useState(false);
  const [maxUses, setMaxUses] = useState(String(c.maxUses));
  const [expiry, setExpiry] = useState(c.expiresAt ? c.expiresAt.slice(0, 10) : '');
  const fail = (e: unknown) => Alert.alert('Could not update code', errorMessage(e));
  const validExpiry = expiry === '' || ISO_DAY.test(expiry);
  const validUses = Number.isInteger(Number(maxUses)) && Number(maxUses) >= c.usedCount && Number(maxUses) >= 1;
  return (
    <Card style={{ marginBottom: spacing.sm }}>
      <View style={styles.row}>
        <Subtitle>{c.code}</Subtitle>
        <Badge label={c.status} variant={CODE_VARIANT[c.status]} />
      </View>
      <Caption>{`${c.batchName ?? 'Institute'} · ${c.usedCount}/${c.maxUses} used · ${c.expiresAt ? `expires ${formatDate(c.expiresAt)}` : 'no expiry'}`}</Caption>
      <View style={[styles.row, { marginTop: spacing.sm, justifyContent: 'flex-start' }]}>
        <Button title="Share" size="sm" onPress={() => void shareCode(c)} />
        <Button title={editing ? 'Close' : 'Edit'} size="sm" variant="outline" onPress={() => setEditing((v) => !v)} />
        {c.isRevoked ? (
          <Button title="Reactivate" size="sm" variant="outline" loading={reactivate.isPending} onPress={() => reactivate.mutate(c.id, { onError: fail })} />
        ) : (
          <Button
            title="Revoke"
            size="sm"
            variant="outline"
            onPress={() =>
              Alert.alert('Revoke code?', 'Students will no longer be able to join with it.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Revoke', style: 'destructive', onPress: () => revoke.mutate(c.id, { onError: fail }) },
              ])
            }
          />
        )}
      </View>
      {editing ? (
        <View style={{ marginTop: spacing.md }}>
          <Input label="Max uses" keyboardType="number-pad" value={maxUses} onChangeText={setMaxUses} />
          <Input
            label="Expiry date (YYYY-MM-DD, empty = never)"
            value={expiry}
            onChangeText={setExpiry}
            autoCapitalize="none"
            error={validExpiry ? null : 'Use YYYY-MM-DD'}
          />
          <Button
            title="Save changes"
            disabled={!validExpiry || !validUses}
            loading={update.isPending}
            onPress={() =>
              update.mutate(
                {
                  id: c.id,
                  data: {
                    maxUses: Number(maxUses),
                    expiresAt: expiry ? new Date(`${expiry}T23:59:59`).toISOString() : null,
                  },
                },
                { onSuccess: () => setEditing(false), onError: fail },
              )
            }
          />
        </View>
      ) : null}
    </Card>
  );
};

const BatchManage: React.FC<{ batch: TeacherBatch }> = ({ batch }) => {
  const { spacing } = useTheme();
  const batches = useBatches();
  const { update, promote } = useBatchMutations();
  const [name, setName] = useState(batch.name);
  const [subject, setSubject] = useState(batch.subject);
  const [gradeLevel, setGradeLevel] = useState(batch.gradeLevel ?? '');
  const [room, setRoom] = useState(batch.room ?? '');
  const [schedule, setSchedule] = useState(batch.schedule ?? '');
  const [targetId, setTargetId] = useState<string>();
  const [newName, setNewName] = useState('');
  const others = (batches.data ?? []).filter((b) => b.id !== batch.id && !b.archivedAt);
  const fail = (title: string) => (e: unknown) => Alert.alert(title, errorMessage(e));

  const runPromote = () => {
    const data = targetId
      ? { targetBatchId: targetId }
      : { newBatch: { name: newName.trim(), subject: subject.trim(), gradeLevel: gradeLevel.trim() || undefined } };
    promote.mutate(
      { batchId: batch.id, data },
      {
        onSuccess: (r) =>
          Alert.alert(
            r.alreadyPromoted ? 'Already promoted' : 'Batch promoted',
            `${r.movedCount} moved to ${r.targetBatchName}, ${r.skippedCount} skipped. History is kept.`,
          ),
        onError: fail('Could not promote batch'),
      },
    );
  };

  return (
    <>
      <Card style={{ marginBottom: spacing.md }}>
        <Subtitle>Edit batch</Subtitle>
        <Input label="Name" value={name} onChangeText={setName} />
        <Input label="Subject" value={subject} onChangeText={setSubject} />
        <Input label="Class / grade" value={gradeLevel} onChangeText={setGradeLevel} />
        <Input label="Room" value={room} onChangeText={setRoom} />
        <Input label="Schedule" value={schedule} onChangeText={setSchedule} />
        <Button
          title="Save batch"
          disabled={!name.trim() || !subject.trim()}
          loading={update.isPending}
          onPress={() =>
            update.mutate(
              {
                batchId: batch.id,
                data: {
                  name: name.trim(),
                  subject: subject.trim(),
                  gradeLevel: gradeLevel.trim(),
                  room: room.trim() || null,
                  schedule: schedule.trim() || null,
                },
              },
              { onSuccess: () => Alert.alert('Saved', 'Batch updated.'), onError: fail('Could not save batch') },
            )
          }
        />
      </Card>
      <Card>
        <Subtitle>Promote to next class</Subtitle>
        <Caption>Moves active students to another batch. Source enrolments keep their history.</Caption>
        <Caption style={{ marginTop: spacing.sm }}>Existing target batch</Caption>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: spacing.sm }}>
          {others.map((b) => (
            <Button
              key={b.id}
              size="sm"
              variant={targetId === b.id ? 'primary' : 'outline'}
              title={b.name}
              onPress={() => setTargetId(targetId === b.id ? undefined : b.id)}
            />
          ))}
        </View>
        {!targetId ? <Input label="Or create new batch" placeholder="e.g. Class 10 Maths 2027" value={newName} onChangeText={setNewName} /> : null}
        <Button
          title="Promote students"
          disabled={!targetId && !newName.trim()}
          loading={promote.isPending}
          onPress={() =>
            Alert.alert('Promote students?', `Active students of ${batch.name} will move to the target batch.`, [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Promote', onPress: runPromote },
            ])
          }
        />
      </Card>
    </>
  );
};

export const TeacherClassesScreen: React.FC = () => {
  const { spacing } = useTheme();
  const [batchId, setBatchId] = useState<string>();
  const [tab, setTab] = useState<Tab>('students');
  const batches = useBatches();
  const roster = useRoster(batchId);
  const invitations = useInvitations(batchId);
  const { create } = useInvitationMutations();
  const active = tab === 'codes' ? invitations : roster;
  const selected = (batches.data ?? []).find((b) => b.id === batchId);

  return (
    <Screen
      eyebrow="CLASSES"
      title="Batches & students"
      subtitle="Only batches assigned to you"
      refreshing={active.isRefetching}
      onRefresh={() => active.refetch()}
    >
      <BatchPicker value={batchId} onChange={setBatchId} />
      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { key: 'students', label: 'Students' },
          { key: 'codes', label: 'Codes' },
          { key: 'fees', label: 'Fees' },
          { key: 'batch', label: 'Batch' },
        ]}
      />

      {tab === 'students' ? (
        !batchId ? (
          <Caption>Select a batch to see its students.</Caption>
        ) : (
          <QueryBoundary
            query={roster}
            isEmpty={(r) => r.students.length === 0}
            emptyTitle="No students yet"
            emptyDescription="Share an enrolment code so students can join this batch."
          >
            {(r) => (
              <>
                <Caption style={{ marginBottom: spacing.sm }}>{`${r.students.length} students`}</Caption>
                {r.students.map((s) => (
                  <Card key={s.id} style={{ marginBottom: spacing.sm }}>
                    <Subtitle>{s.fullName}</Subtitle>
                    <Caption>{`Roll ${s.rollNumber} · ${s.email}`}</Caption>
                  </Card>
                ))}
              </>
            )}
          </QueryBoundary>
        )
      ) : tab === 'codes' ? (
        <>
          <Button
            title={batchId ? 'New enrolment code for this batch' : 'Select a batch first'}
            disabled={!batchId}
            loading={create.isPending}
            onPress={() =>
              create.mutate(
                { batchId, maxUses: 100 },
                {
                  onSuccess: (c) => void shareCode(c),
                  onError: (e) => Alert.alert('Could not create code', errorMessage(e)),
                },
              )
            }
          />
          <SectionTitle>Codes</SectionTitle>
          <QueryBoundary
            query={invitations}
            isEmpty={(c) => c.length === 0}
            emptyTitle="No codes"
            emptyDescription="Create a code to let students join your batch. Codes never expire unless you set a date."
          >
            {(codes) => codes.map((c) => <CodeCard key={c.id} c={c} />)}
          </QueryBoundary>
        </>
      ) : tab === 'fees' ? (
        batchId ? <TeacherFeesPanel batchId={batchId} /> : <Caption>Select a batch to manage its fees.</Caption>
      ) : selected ? (
        <BatchManage key={selected.id} batch={selected} />
      ) : (
        <Caption>Select a batch to edit or promote it.</Caption>
      )}
      <Body>{' '}</Body>
    </Screen>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
});
