import React, { useState } from 'react';
import { Alert, View, Text, StyleSheet } from 'react-native';
import { Screen, SectionTitle } from '../../components/common/Screen';
import { QueryBoundary } from '../../components/common/QueryBoundary';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Icon, IconName } from '../../components/common/Icon';
import { IconChip, Tone } from '../../components/common/Paper';
import { Body, Caption, Subtitle } from '../../components/common/Typography';
import { FeesScreen } from './FeesScreen';
import { useBackToMenu } from '../../hooks/useBackToMenu';
import { AppearanceCard } from '../../components/common/AppearanceCard';
import { InstituteHeader } from '../../components/common/InstituteHeader';
import { StudentLeaveApply } from '../leave/StudentLeavePanels';
import {
  useAnnouncementsData,
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

type View_ =
  | 'menu'
  | 'timetable'
  | 'announcements'
  | 'planner'
  | 'doubts'
  | 'documents'
  | 'notifications'
  | 'fees'
  | 'leave'
  | 'profile';

const MENU: Array<{ key: Exclude<View_, 'menu'>; label: string; hint: string; icon: IconName; tone: Tone }> = [
  { key: 'timetable', label: 'Weekly Timetable', hint: 'Weekly lecture schedule & room slots', icon: 'clock', tone: 'blue' },
  { key: 'fees', label: 'Fees & Receipts', hint: 'Dues breakdown and paid receipt PDFs', icon: 'receipt', tone: 'emerald' },
  { key: 'leave', label: 'Apply for Leave', hint: 'Request leave from faculty & track approval', icon: 'calendar-check', tone: 'amber' },
  { key: 'announcements', label: 'Noticeboard', hint: 'Institute & batch notices', icon: 'megaphone', tone: 'rose' },
  { key: 'planner', label: 'Study Planner', hint: 'Your personal daily task list', icon: 'file-check-2', tone: 'teal' },
  { key: 'doubts', label: 'Ask a Teacher (Doubts)', hint: 'Ask questions & read faculty replies', icon: 'help-circle', tone: 'blue' },
  { key: 'documents', label: 'Documents & Certificates', hint: 'ID cards, report cards & receipts', icon: 'folder', tone: 'teal' },
  { key: 'notifications', label: 'Notifications', hint: 'Results, dues and attendance alerts', icon: 'bell', tone: 'amber' },
  { key: 'profile', label: 'Profile & Batch Code', hint: 'Account, join a batch, sign out', icon: 'user', tone: 'blue' },
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
                <Caption>{`${s.time} · ${s.room ? `Room ${s.room}` : 'Classroom'} · ${s.faculty}`}</Caption>
              </Card>
            ))}
          </View>
        ))
      }
    </QueryBoundary>
  );
};

const Announcements: React.FC = () => {
  const { spacing } = useTheme();
  const q = useAnnouncementsData();
  return (
    <QueryBoundary query={q} isEmpty={(d) => d.length === 0} emptyTitle="No announcements" emptyDescription="School & batch notices will appear here.">
      {(items) =>
        items.map((a) => (
          <Card key={a.id} style={{ marginBottom: spacing.sm }}>
            <View style={styles.row}>
              <Subtitle style={{ flex: 1 }}>{a.title}</Subtitle>
              {a.priority === 'URGENT' ? <Badge label="Urgent" variant="error" /> : null}
            </View>
            <Body numberOfLines={4} style={{ marginTop: spacing.xs }}>{a.content}</Body>
            <Caption style={{ marginTop: spacing.xs }}>{`${a.authorName ?? "Faculty"} · ${formatDate(a.date)}`}</Caption>
          </Card>
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
        <Input label="New task" value={title} onChangeText={setTitle} placeholder="e.g. Revise Chapter 4 formulas" />
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
        <Input label="Subject" value={subject} onChangeText={setSubject} placeholder="e.g. Physics" />
        <Input label="Your question" value={question} onChangeText={setQuestion} multiline placeholder="Type your doubt or academic query..." />
        <Button
          title="Send to faculty"
          loading={ask.isPending}
          disabled={!subject.trim() || !question.trim()}
          onPress={() =>
            ask.mutate(
              { subject: subject.trim(), questionText: question.trim() },
              { onSuccess: () => { setQuestion(''); Alert.alert('Sent', 'Your doubt has been submitted to faculty.'); }, onError: (e) => Alert.alert('Could not send', errorMessage(e)) },
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
              {d.facultyReply ? (
                <View style={{ marginTop: 8, padding: 8, backgroundColor: 'rgba(22, 119, 255, 0.06)', borderRadius: 8 }}>
                  <Caption style={{ fontWeight: '700', color: '#1677FF' }}>{`${d.facultyName ?? 'Faculty'}:`}</Caption>
                  <Body style={{ marginTop: 2 }}>{d.facultyReply}</Body>
                </View>
              ) : null}
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
            <Button title="Open Document ↗" variant="secondary" size="sm" style={{ marginTop: spacing.sm }} onPress={() => openUrl(d.downloadUrl)} />
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
            <Caption style={{ marginTop: 4 }}>{formatDateTime(n.createdAt)}</Caption>
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
      <InstituteHeader showLetterhead />
      <QueryBoundary query={q}>
        {(p) => (
          <Card style={{ marginBottom: spacing.md }}>
            <Subtitle>{p.fullName}</Subtitle>
            <Caption>{p.email}</Caption>
            <Body style={{ marginTop: spacing.xs }}>{`${p.instituteName} · ${p.batchName}`}</Body>
            <Caption>{`Roll Number: ${p.rollNumber} · Academic Year: ${p.academicYear}`}</Caption>
          </Card>
        )}
      </QueryBoundary>
      <Card style={{ marginBottom: spacing.md }}>
        <Subtitle>Join a Batch</Subtitle>
        <Caption>Enter the invitation code provided by your teacher.</Caption>
        <Input value={code} onChangeText={setCode} autoCapitalize="characters" placeholder="e.g. APEX-1234" />
        <Button
          title="Join Batch"
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
      <AppearanceCard />
      <Button title="Sign Out" variant="outline" onPress={logout} />
    </>
  );
};

export const StudentMoreScreen: React.FC = () => {
  const { spacing } = useTheme();
  const currentTab = useNavigationStore((s) => s.currentTab);
  const [view, setView] = useState<View_>(currentTab === 'student_fees' ? 'fees' : 'menu');
  const current = MENU.find((m) => m.key === view);
  const toMenu = React.useCallback(() => setView('menu'), []);
  useBackToMenu(view !== 'menu', toMenu);

  if (view === 'fees') {
    return (
      <>
        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md }}>
          <Button title="‹ Back to Menu" variant="ghost" size="sm" onPress={() => setView('menu')} />
        </View>
        <FeesScreen />
      </>
    );
  }

  const { colors, typography } = useTheme();

  return (
    <Screen eyebrow="STUDENT HUB" title={current?.label ?? 'Student Services'} subtitle={current?.hint ?? 'Academic utilities & personal records'}>
      {view === 'menu' ? (
        <>
          {/* Quick link to Fees */}
          <Card style={{ marginBottom: 10, padding: 14 }} onPress={() => setView('fees')}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <IconChip icon="receipt" tone="emerald" size={38} />
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                  <Text style={{ fontFamily: typography.fonts.ui, fontSize: 14, fontWeight: '700', color: colors.textPrimary }}>
                    Fees & Receipts Ledger
                  </Text>
                  <Badge label="Finance" variant="info" />
                </View>
                <Text style={{ fontFamily: typography.fonts.ui, fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
                  Term dues, fee balances & receipt PDFs
                </Text>
              </View>
              <Icon name="arrow-right" size={14} color={colors.textFaint} />
            </View>
          </Card>

          {MENU.map((m) => (
            <Card key={m.key} style={{ marginBottom: 10, padding: 14 }} onPress={() => setView(m.key)}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <IconChip icon={m.icon} tone={m.tone} size={38} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: typography.fonts.ui, fontSize: 14, fontWeight: '700', color: colors.textPrimary }}>
                    {m.label}
                  </Text>
                  <Text style={{ fontFamily: typography.fonts.ui, fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
                    {m.hint}
                  </Text>
                </View>
                <Icon name="arrow-right" size={14} color={colors.textFaint} />
              </View>
            </Card>
          ))}
        </>
      ) : (
        <>
          <Button title="‹ Back to Menu" variant="ghost" size="sm" onPress={() => setView('menu')} style={{ alignSelf: 'flex-start', marginBottom: spacing.sm }} />
          {view === 'timetable' ? <Timetable /> : null}
          {view === 'announcements' ? <Announcements /> : null}
          {view === 'leave' ? <StudentLeaveApply /> : null}
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
