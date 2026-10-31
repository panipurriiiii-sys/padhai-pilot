import React, { useState } from 'react';
import { Alert, View, StyleSheet } from 'react-native';
import { Screen, SectionTitle } from '../../components/common/Screen';
import { QueryBoundary } from '../../components/common/QueryBoundary';
import { BatchPicker } from '../../components/common/BatchPicker';
import { Segmented } from '../../components/common/Segmented';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Body, Caption, Subtitle } from '../../components/common/Typography';
import { useInvitationMutations, useInvitations, useRoster } from '../../hooks/useTeacherData';
import { useTheme } from '../../theme/ThemeContext';
import { errorMessage, formatDate } from '../../lib/format';

type Tab = 'students' | 'codes';
const CODE_VARIANT = { ACTIVE: 'success', EXPIRED: 'neutral', REVOKED: 'error', EXHAUSTED: 'warning' } as const;

export const TeacherClassesScreen: React.FC = () => {
  const { spacing } = useTheme();
  const [batchId, setBatchId] = useState<string>();
  const [tab, setTab] = useState<Tab>('students');
  const roster = useRoster(batchId);
  const invitations = useInvitations();
  const { create, revoke } = useInvitationMutations();
  const active = tab === 'students' ? roster : invitations;

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
          { key: 'codes', label: 'Invite codes' },
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
            emptyDescription="Share an invitation code so students can join this batch."
          >
            {(r) => (
              <>
                <Caption style={{ marginBottom: spacing.sm }}>{`${r.students.length} students`}</Caption>
                {r.students.map((s) => (
                  <Card key={s.id} style={{ marginBottom: spacing.sm }}>
                    <View style={styles.row}>
                      <View style={{ flex: 1 }}>
                        <Subtitle>{s.fullName}</Subtitle>
                        <Caption>{`${s.rollNumber} · ${s.email}`}</Caption>
                      </View>
                      <Badge
                        label={`${Math.round(s.attendanceRate)}%`}
                        variant={s.attendanceRate < 75 ? 'warning' : 'success'}
                      />
                    </View>
                  </Card>
                ))}
              </>
            )}
          </QueryBoundary>
        )
      ) : (
        <>
          <Button
            title="New invitation code"
            loading={create.isPending}
            onPress={() =>
              create.mutate(
                { batchId, maxUses: 100, expiryDays: 30 },
                { onError: (e) => Alert.alert('Could not create code', errorMessage(e)) },
              )
            }
          />
          <SectionTitle>Codes</SectionTitle>
          <QueryBoundary
            query={invitations}
            isEmpty={(c) => c.length === 0}
            emptyTitle="No codes"
            emptyDescription="Create a code to let students join your batch."
          >
            {(codes) =>
              codes.map((c) => (
                <Card key={c.id} style={{ marginBottom: spacing.sm }}>
                  <View style={styles.row}>
                    <Subtitle>{c.code}</Subtitle>
                    <Badge label={c.status} variant={CODE_VARIANT[c.status]} />
                  </View>
                  <Caption>{`${c.batchName ?? 'Any batch'} · ${c.usedCount}/${c.maxUses} used · expires ${formatDate(c.expiresAt)}`}</Caption>
                  {c.status === 'ACTIVE' ? (
                    <Button
                      title="Revoke"
                      variant="outline"
                      size="sm"
                      style={{ marginTop: spacing.sm }}
                      onPress={() =>
                        Alert.alert('Revoke code?', 'Students will no longer be able to join with it.', [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Revoke', style: 'destructive', onPress: () => revoke.mutate(c.code) },
                        ])
                      }
                    />
                  ) : null}
                </Card>
              ))
            }
          </QueryBoundary>
        </>
      )}
      <Body>{' '}</Body>
    </Screen>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
});
