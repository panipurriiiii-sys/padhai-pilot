import React, { useState } from 'react';
import { Alert, View, StyleSheet } from 'react-native';
import { Screen } from '../../components/common/Screen';
import { QueryBoundary } from '../../components/common/QueryBoundary';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Body, Caption, Subtitle } from '../../components/common/Typography';
import { FeesScreen } from './FeesScreen';
import {
  useAskQuery,
  useDocumentsData,
  useJoinBatch,
  useMarkNotificationRead,
  useNotificationsData,
  useProfileData,
  useQueriesData,
  useStudyTasksData,
  useTaskMutations,
  useTimetableData,
} from '../../hooks/useStudentData';
import { useAuthStore } from '../../store/useAuthStore';
import { useNavigationStore } from '../../store/useNavigationStore';
import { useTheme } from '../../theme/ThemeContext';
import { errorMessage, formatDate, formatDateTime } from '../../lib/format';
import { openUrl } from '../../lib/links';

type View_ = 'menu' | 'timetable' | 'planner' | 'doubts' | 'documents' | 'notifications' | 'fees' | 'profile';

const MENU: Array<{ key: Exclude<View_, 'menu'>; label: string; hint: string }> = [
  { key: 'timetable', label: 'Timetable', hint: 'Weekly class schedule' },
  { key: 'notifications', label: 'Notifications', hint: 'Results, fees and announcements' },
  { key: 'fees', label: 'Fees & receipts', hint: 'Dues and payment status' },
  { key: 'planner', label: 'Study planner', hint: 'Your personal task list' },
  { key: 'doubts', label: 'Ask a teacher', hint: 'Doubts and answers' },
  { key: 'documents', label: 'Documents', hint: 'Report cards and receipts' },
  { key: 'profile', label: 'Profile & batch', hint: 'Account, join a batch, sign out' },
];

const Timetable: React.FC = () => {
  const { spacing } = useTheme();
  const q = useTimetableData();
  return (
    <QueryBoundary query={q} isEmpty={(d) => d.length === 0} emptyTitle="No timetable yet" emptyDescription="Your batch timetable has not been published.">
      {(days) =>
        days.map((d) => (
          <View key={d.day} style={{ marginBottom: spacing.md }}>
            <Subtitle>{d.day}</Subtitle>
            {d.slots.map((s) => (
              <Card key={`${d.day}-${s.time}-${s.subject}`} style={{ marginTop: spacing.xs }}>
                <Body>{s.subject}</Body>
                <Caption>{`${s.time} · ${s.room} · ${s.faculty}`}</Caption>
              </Card>
            ))}
          </View>
        ))
      }
    </QueryBoundary>
  );
};

const Planner: React.FC = () => {
  const { spacing } = useTheme();
  const q = useStudyTasksData();
  const { create, toggle, remove } = useTaskMutations();
  const [title, setTitle] = useState('');
  return (
    <>
      <Card style={{ marginBottom: spacing.md }}>
        <Input label="New task" value={title} onChangeText={setTitle} />
        <Button
          title="Add task"
          loading={create.isPending}
          disabled={!title.trim()}
          onPress={() =>
            create.mutate({ title: title.trim() }, { onSuccess: () => setTitle(''), onError: (e) => Alert.alert('Could not add', errorMessage(e)) })
          }
        />
      </Card>
      <QueryBoundary query={q} isEmpty={(d) => d.length === 0} emptyTitle="No tasks" emptyDescription="Add something you want to get done.">
        {(tasks) =>
          tasks.map((t) => (
            <Card key={t.id} style={{ marginBottom: spacing.sm }}>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Body style={t.isCompleted ? styles.done : undefined}>{t.title}</Body>
                  <Caption>{`${t.subject ?? 'General'}${t.dueDate ? ` · due ${formatDate(t.dueDate)}` : ''}`}</Caption>
                </View>
                <Button
                  title={t.isCompleted ? 'Undo' : 'Done'}
                  variant="secondary"
                  size="sm"
                  onPress={() => toggle.mutate({ id: t.id, isCompleted: !t.isCompleted })}
                />
                <Button title="✕" variant="ghost" size="sm" accessibilityLabel="Delete task" onPress={() => remove.mutate(t.id)} />
              </View>
            </Card>
          ))
        }
      </QueryBoundary>
    </>
  );
};

const Doubts: React.FC = () => {
  const { spacing } = useTheme();
  const q = useQueriesData();
  const ask = useAskQuery();
  const [subject, setSubject] = useState('');
  const [question, setQuestion] = useState('');
  return (
    <>
      <Card style={{ marginBottom: spacing.md }}>
        <Input label="Subject" value={subject} onChangeText={setSubject} />
        <Input label="Your question" value={question} onChangeText={setQuestion} multiline />
        <Button
          title="Send to faculty"
          loading={ask.isPending}
          disabled={!subject.trim() || !question.trim()}
          onPress={() =>
            ask.mutate(
              { subject: subject.trim(), questionText: question.trim() },
              { onSuccess: () => { setQuestion(''); }, onError: (e) => Alert.alert('Could not send', errorMessage(e)) },
            )
          }
        />
      </Card>
      <QueryBoundary query={q} isEmpty={(d) => d.length === 0} emptyTitle="No questions yet" emptyDescription="Ask your faculty anything about a topic.">
        {(items) =>
          items.map((d) => (
            <Card key={d.id} style={{ marginBottom: spacing.sm }}>
              <View style={styles.row}>
                <Badge label={d.subject} variant="primary" />
                <Badge label={d.status} variant={d.status === 'ANSWERED' ? 'success' : 'warning'} />
              </View>
              <Body style={{ marginTop: spacing.xs }}>{d.questionText}</Body>
              {d.facultyReply ? <Caption>{`${d.facultyName ?? 'Faculty'}: ${d.facultyReply}`}</Caption> : null}
            </Card>
          ))
        }
      </QueryBoundary>
    </>
  );
};

const Documents: React.FC = () => {
  const { spacing } = useTheme();
  const q = useDocumentsData();
  return (
    <QueryBoundary query={q} isEmpty={(d) => d.length === 0} emptyTitle="No documents" emptyDescription="Report cards and receipts issued by your institute appear here.">
      {(docs) =>
        docs.map((d) => (
          <Card key={d.id} style={{ marginBottom: spacing.sm }}>
            <Subtitle>{d.title}</Subtitle>
            <Caption>{`${d.category.replace(/_/g, ' ')} · ${formatDate(d.issueDate)}`}</Caption>
            <Button title="Open" variant="secondary" size="sm" style={{ marginTop: spacing.sm }} onPress={() => openUrl(d.downloadUrl)} />
          </Card>
        ))
      }
    </QueryBoundary>
  );
};

const Notifications: React.FC = () => {
  const { spacing } = useTheme();
  const q = useNotificationsData();
  const read = useMarkNotificationRead();
  return (
    <QueryBoundary query={q} isEmpty={(d) => d.length === 0} emptyTitle="You're all caught up" emptyDescription="New alerts will appear here.">
      {(items) =>
        items.map((n) => (
          <Card key={n.id} style={{ marginBottom: spacing.sm }} onPress={() => !n.isRead && read.mutate(n.id)}>
            <View style={styles.row}>
              <Subtitle style={{ flex: 1 }}>{n.title}</Subtitle>
              {!n.isRead ? <Badge label="NEW" variant="primary" /> : null}
            </View>
            <Body>{n.message}</Body>
            <Caption>{formatDateTime(n.createdAt)}</Caption>
          </Card>
        ))
      }
    </QueryBoundary>
  );
};

const Profile: React.FC = () => {
  const { spacing } = useTheme();
  const q = useProfileData();
  const join = useJoinBatch();
  const logout = useAuthStore((s) => s.logout);
  const [code, setCode] = useState('');
  return (
    <>
      <QueryBoundary query={q}>
        {(p) => (
          <Card style={{ marginBottom: spacing.md }}>
            <Subtitle>{p.fullName}</Subtitle>
            <Caption>{p.email}</Caption>
            <Body style={{ marginTop: spacing.xs }}>{`${p.instituteName} · ${p.batchName}`}</Body>
            <Caption>{`Roll ${p.rollNumber} · ${p.academicYear}`}</Caption>
          </Card>
        )}
      </QueryBoundary>
      <Card style={{ marginBottom: spacing.md }}>
        <Subtitle>Join a batch</Subtitle>
        <Caption>Enter the invitation code from your teacher.</Caption>
        <Input value={code} onChangeText={setCode} autoCapitalize="characters" placeholder="e.g. APEX-1234" />
        <Button
          title="Join"
          loading={join.isPending}
          disabled={!code.trim()}
          onPress={() =>
            join.mutate(code.trim(), {
              onSuccess: (r) => { setCode(''); Alert.alert('Joined', r.message); },
              onError: (e) => Alert.alert('Could not join', errorMessage(e)),
            })
          }
        />
      </Card>
      <Button title="Sign out" variant="outline" onPress={logout} />
    </>
  );
};

export const StudentMoreScreen: React.FC = () => {
  const { spacing } = useTheme();
  const currentTab = useNavigationStore((s) => s.currentTab);
  const [view, setView] = useState<View_>(currentTab === 'student_fees' ? 'fees' : 'menu');
  const current = MENU.find((m) => m.key === view);

  if (view === 'fees') {
    return (
      <>
        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md }}>
          <Button title="‹ Back" variant="ghost" size="sm" onPress={() => setView('menu')} />
        </View>
        <FeesScreen />
      </>
    );
  }

  return (
    <Screen eyebrow="MORE" title={current?.label ?? 'More'} subtitle={current?.hint}>
      {view === 'menu' ? (
        MENU.map((m) => (
          <Card key={m.key} style={{ marginBottom: spacing.sm }} onPress={() => setView(m.key)}>
            <Subtitle>{m.label}</Subtitle>
            <Caption>{m.hint}</Caption>
          </Card>
        ))
      ) : (
        <>
          <Button title="‹ Back" variant="ghost" size="sm" onPress={() => setView('menu')} style={{ alignSelf: 'flex-start', marginBottom: spacing.sm }} />
          {view === 'timetable' ? <Timetable /> : null}
          {view === 'planner' ? <Planner /> : null}
          {view === 'doubts' ? <Doubts /> : null}
          {view === 'documents' ? <Documents /> : null}
          {view === 'notifications' ? <Notifications /> : null}
          {view === 'profile' ? <Profile /> : null}
        </>
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  done: { textDecorationLine: 'line-through', opacity: 0.6 },
});
