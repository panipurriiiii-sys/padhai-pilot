import React, { useState } from 'react';
import { Alert, View, StyleSheet } from 'react-native';
import { Screen, SectionTitle } from '../../components/common/Screen';
import { QueryBoundary } from '../../components/common/QueryBoundary';
import { BatchPicker } from '../../components/common/BatchPicker';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Body, Caption, Subtitle } from '../../components/common/Typography';
import {
  useApplyLeave,
  useCreateAnnouncement,
  useCreateAssignment,
  useGradeSubmission,
  useLeaves,
  useSalaries,
  useSubmissions,
  useTeacherAnnouncements,
  useTeacherAssignments,
  useTeacherTimetable,
  useTimetableMutations,
} from '../../hooks/useTeacherData';
import type { TimetableConflictError, WeekDay } from '@padhai-pilot/shared';
import { StudentLeaveReview } from '../leave/StudentLeavePanels';
import { useAuthStore } from '../../store/useAuthStore';
import { useTheme } from '../../theme/ThemeContext';
import { errorMessage, formatDate, formatInr, todayIso } from '../../lib/format';

type View_ = 'menu' | 'homework' | 'announcements' | 'timetable' | 'leave' | 'studentLeave' | 'salary' | 'profile';

const MENU: Array<{ key: Exclude<View_, 'menu'>; label: string; hint: string }> = [
  { key: 'homework', label: 'Homework & grading', hint: 'Create assignments, grade submissions' },
  { key: 'announcements', label: 'Announcements', hint: 'Message your batches' },
  { key: 'timetable', label: 'Timetable', hint: 'Your weekly schedule' },
  { key: 'studentLeave', label: 'Student leave', hint: 'Approve or reject requests' },
  { key: 'leave', label: 'My leave', hint: 'Apply and track decisions' },
  { key: 'salary', label: 'My salary statements', hint: 'Visible only to you' },
  { key: 'profile', label: 'Account', hint: 'Sign out' },
];

const Grading: React.FC<{ assignmentId: string }> = ({ assignmentId }) => {
  const q = useSubmissions(assignmentId);
  const grade = useGradeSubmission(assignmentId);
  const [marks, setMarks] = useState<Record<string, string>>({});
  return (
    <QueryBoundary query={q} isEmpty={(s) => s.length === 0} emptyTitle="No submissions yet" emptyDescription="Student work will appear here.">
      {(subs) =>
        subs.map((s) => (
          <Card key={s.id} style={{ marginTop: 8 }}>
            <View style={styles.between}>
              <Subtitle style={{ flex: 1 }}>{s.studentName}</Subtitle>
              <Badge label={s.status} variant={s.status === 'GRADED' ? 'success' : 'warning'} />
            </View>
            {s.content ? <Body numberOfLines={4}>{s.content}</Body> : null}
            <Input
              label="Marks"
              keyboardType="decimal-pad"
              value={marks[s.id] ?? (s.marksObtained != null ? String(s.marksObtained) : '')}
              onChangeText={(t) => setMarks((m) => ({ ...m, [s.id]: t }))}
            />
            <Button
              title="Save grade"
              size="sm"
              loading={grade.isPending}
              disabled={marks[s.id] === undefined || Number.isNaN(Number(marks[s.id]))}
              onPress={() =>
                grade.mutate(
                  { submissionId: s.id, marksObtained: Number(marks[s.id]) },
                  { onError: (e) => Alert.alert('Could not save grade', errorMessage(e)) },
                )
              }
            />
          </Card>
        ))
      }
    </QueryBoundary>
  );
};

const Homework: React.FC = () => {
  const q = useTeacherAssignments();
  const create = useCreateAssignment();
  const [open, setOpen] = useState<string | null>(null);
  const [batchId, setBatchId] = useState<string>();
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [instructions, setInstructions] = useState('');
  const [due, setDue] = useState(todayIso());
  const [attachment, setAttachment] = useState('');
  const attachmentOk = attachment.trim() === '' || /^https:\/\/\S+$/i.test(attachment.trim());
  const ready = attachmentOk && !!batchId && title.trim() && subject.trim() && instructions.trim() && /^\d{4}-\d{2}-\d{2}$/.test(due);
  return (
    <>
      <Card style={{ marginBottom: 16 }}>
        <Subtitle>New assignment</Subtitle>
        <BatchPicker value={batchId} onChange={setBatchId} />
        <Input label="Title" value={title} onChangeText={setTitle} />
        <Input label="Subject" value={subject} onChangeText={setSubject} />
        <Input label="Instructions" value={instructions} onChangeText={setInstructions} multiline />
        <Input label="Due date (YYYY-MM-DD)" value={due} onChangeText={setDue} autoCapitalize="none" />
        <Input
          label="PDF / document link (optional, https)"
          value={attachment}
          onChangeText={setAttachment}
          autoCapitalize="none"
          error={attachmentOk ? null : 'Must start with https://'}
        />
        <Button
          title="Publish to batch"
          disabled={!ready}
          loading={create.isPending}
          onPress={() =>
            create.mutate(
              { batchId: batchId as string, title: title.trim(), subject: subject.trim(), instructions: instructions.trim(), dueDate: due, attachmentUrl: attachment.trim() || undefined },
              {
                onSuccess: () => { setTitle(''); setInstructions(''); },
                onError: (e) => Alert.alert('Could not create', errorMessage(e)),
              },
            )
          }
        />
      </Card>
      <QueryBoundary query={q} isEmpty={(a) => a.length === 0} emptyTitle="No assignments" emptyDescription="Create one above.">
        {(items) =>
          items.map((a) => (
            <Card key={a.id} style={{ marginBottom: 8 }} onPress={() => setOpen(open === a.id ? null : a.id)}>
              <Subtitle>{a.title}</Subtitle>
              <Caption>{`${a.batchName ?? ''} · due ${formatDate(a.dueDate)} · ${a.submissionCount}/${a.totalStudents} submitted`}</Caption>
              {open === a.id ? <Grading assignmentId={a.id} /> : null}
            </Card>
          ))
        }
      </QueryBoundary>
    </>
  );
};

const Announcements: React.FC = () => {
  const q = useTeacherAnnouncements();
  const create = useCreateAnnouncement();
  const [batchId, setBatchId] = useState<string>();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  return (
    <>
      <Card style={{ marginBottom: 16 }}>
        <BatchPicker value={batchId} onChange={setBatchId} />
        <Input label="Title" value={title} onChangeText={setTitle} />
        <Input label="Message" value={content} onChangeText={setContent} multiline />
        <Button
          title="Post"
          disabled={!title.trim() || !content.trim()}
          loading={create.isPending}
          onPress={() =>
            create.mutate(
              { batchId, title: title.trim(), content: content.trim() },
              { onSuccess: () => { setTitle(''); setContent(''); }, onError: (e) => Alert.alert('Could not post', errorMessage(e)) },
            )
          }
        />
      </Card>
      <QueryBoundary query={q} isEmpty={(a) => a.length === 0} emptyTitle="No announcements" emptyDescription="Post one above.">
        {(items) =>
          items.map((a) => (
            <Card key={a.id} style={{ marginBottom: 8 }}>
              <Subtitle>{a.title}</Subtitle>
              <Body numberOfLines={3}>{a.content}</Body>
              <Caption>{`${a.authorName} · ${formatDate(a.createdAt)}`}</Caption>
            </Card>
          ))
        }
      </QueryBoundary>
    </>
  );
};

const DAYS: WeekDay[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

const Timetable: React.FC = () => {
  const { spacing } = useTheme();
  const [batchId, setBatchId] = useState<string>();
  const q = useTeacherTimetable(batchId);
  const { create, update, remove } = useTimetableMutations();
  const [editId, setEditId] = useState<string | null>(null);
  const [subject, setSubject] = useState('');
  const [day, setDay] = useState<WeekDay>('MONDAY');
  const [start, setStart] = useState('16:00');
  const [end, setEnd] = useState('17:00');
  const [room, setRoom] = useState('');
  const valid = !!batchId && !!subject.trim() && HHMM.test(start) && HHMM.test(end) && end > start;
  const reset = () => { setEditId(null); setSubject(''); setRoom(''); };
  const conflictText = (e: unknown) => {
    const payload = (e as { errorPayload?: TimetableConflictError })?.errorPayload;
    if (payload?.conflicts?.length) {
      return payload.conflicts
        .map((c) => `${c.kind.toLowerCase()} clash with ${c.batchName} ${c.startTime}-${c.endTime}`)
        .join(', ');
    }
    return errorMessage(e);
  };
  const submit = () => {
    const data = { subject: subject.trim(), dayOfWeek: day, startTime: start, endTime: end, room: room.trim() || undefined };
    const opts = { onSuccess: reset, onError: (e: unknown) => Alert.alert('Could not save slot', conflictText(e)) };
    if (editId) update.mutate({ slotId: editId, data }, opts);
    else create.mutate({ batchId: batchId as string, data }, opts);
  };
  return (
    <>
      <BatchPicker value={batchId} onChange={setBatchId} />
      <Card style={{ marginBottom: 16 }}>
        <Subtitle>{editId ? 'Edit slot' : 'New weekly slot'}</Subtitle>
        <Input label="Subject" value={subject} onChangeText={setSubject} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: spacing.md }}>
          {DAYS.map((d) => (
            <Button key={d} size="sm" variant={day === d ? 'primary' : 'outline'} title={d.slice(0, 3)} onPress={() => setDay(d)} />
          ))}
        </View>
        <Input label="Start (HH:mm)" value={start} onChangeText={setStart} autoCapitalize="none" />
        <Input label="End (HH:mm)" value={end} onChangeText={setEnd} autoCapitalize="none" />
        <Input label="Room" value={room} onChangeText={setRoom} />
        <Button
          title={editId ? 'Save slot' : 'Add slot'}
          disabled={!valid}
          loading={create.isPending || update.isPending}
          onPress={submit}
        />
        {editId ? <Button title="Cancel edit" variant="ghost" size="sm" onPress={reset} /> : null}
        {!batchId ? <Caption>Select a batch above to add slots.</Caption> : null}
      </Card>
      <QueryBoundary query={q} isEmpty={(t) => t.length === 0} emptyTitle="No timetable" emptyDescription="Add the weekly classes for a batch; students see them instantly.">
        {(slots) =>
          [...slots]
            .sort((a, b) => DAYS.indexOf(a.dayOfWeek) - DAYS.indexOf(b.dayOfWeek) || a.startTime.localeCompare(b.startTime))
            .map((s) => (
              <Card key={s.id} style={{ marginBottom: 8 }}>
                <Subtitle>{`${s.subject} · ${s.batchName}`}</Subtitle>
                <Caption>{`${s.dayOfWeek} ${s.startTime}–${s.endTime}${s.room ? ` · ${s.room}` : ''}`}</Caption>
                <View style={[styles.between, { justifyContent: 'flex-start', marginTop: 8 }]}>
                  <Button
                    title="Edit"
                    size="sm"
                    variant="outline"
                    onPress={() => {
                      setBatchId(s.batchId); setEditId(s.id); setSubject(s.subject); setDay(s.dayOfWeek);
                      setStart(s.startTime); setEnd(s.endTime); setRoom(s.room ?? '');
                    }}
                  />
                  <Button
                    title="Delete"
                    size="sm"
                    variant="outline"
                    onPress={() =>
                      Alert.alert('Delete slot?', `${s.subject} on ${s.dayOfWeek}`, [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Delete', style: 'destructive', onPress: () => remove.mutate(s.id, { onError: (e) => Alert.alert('Could not delete', errorMessage(e)) }) },
                      ])
                    }
                  />
                </View>
              </Card>
            ))
        }
      </QueryBoundary>
    </>
  );
};

const Leave: React.FC = () => {
  const q = useLeaves();
  const apply = useApplyLeave();
  const [start, setStart] = useState(todayIso());
  const [end, setEnd] = useState(todayIso());
  const [reason, setReason] = useState('');
  const days = Math.max(1, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86400000) + 1);
  const valid = /^\d{4}-\d{2}-\d{2}$/.test(start) && /^\d{4}-\d{2}-\d{2}$/.test(end) && end >= start && !!reason.trim();
  return (
    <>
      <Card style={{ marginBottom: 16 }}>
        <Input label="From (YYYY-MM-DD)" value={start} onChangeText={setStart} autoCapitalize="none" />
        <Input label="To (YYYY-MM-DD)" value={end} onChangeText={setEnd} autoCapitalize="none" />
        <Input label="Reason" value={reason} onChangeText={setReason} multiline />
        <Button
          title={`Apply for ${valid ? days : '—'} day(s)`}
          disabled={!valid}
          loading={apply.isPending}
          onPress={() =>
            apply.mutate(
              { leaveType: 'CASUAL', startDate: start, endDate: end, totalDays: days, reason: reason.trim() },
              { onSuccess: () => setReason(''), onError: (e) => Alert.alert('Could not apply', errorMessage(e)) },
            )
          }
        />
      </Card>
      <QueryBoundary query={q} isEmpty={(l) => l.length === 0} emptyTitle="No leave applications" emptyDescription="Your requests and your owner's decisions appear here.">
        {(items) =>
          items.map((l) => (
            <Card key={l.id} style={{ marginBottom: 8 }}>
              <View style={styles.between}>
                <Subtitle>{`${formatDate(l.startDate)} – ${formatDate(l.endDate)}`}</Subtitle>
                <Badge label={l.status} variant={l.status === 'APPROVED' ? 'success' : l.status === 'REJECTED' ? 'error' : 'warning'} />
              </View>
              <Caption>{l.reason}</Caption>
              {l.reviewerRemarks ? <Caption>{`Owner: ${l.reviewerRemarks}`}</Caption> : null}
            </Card>
          ))
        }
      </QueryBoundary>
    </>
  );
};

const Salary: React.FC = () => {
  const q = useSalaries();
  return (
    <QueryBoundary query={q} isEmpty={(s) => s.length === 0} emptyTitle="No statements" emptyDescription="Salary statements appear here once your owner issues them.">
      {(items) =>
        items.map((s) => (
          <Card key={s.id} style={{ marginBottom: 8 }}>
            <View style={styles.between}>
              <Subtitle>{s.payPeriod}</Subtitle>
              <Badge label={s.status} variant={s.status === 'PAID' ? 'success' : 'warning'} />
            </View>
            <Body>{`Net payable ${formatInr(s.netPayable)}`}</Body>
            <Caption>{`Base ${formatInr(s.baseAmount)} + ${formatInr(s.additions)} − ${formatInr(s.deductions + s.advances)}`}</Caption>
            {s.paymentDate ? <Caption>{`Paid ${formatDate(s.paymentDate)}`}</Caption> : null}
          </Card>
        ))
      }
    </QueryBoundary>
  );
};

export const TeacherMoreScreen: React.FC = () => {
  const { spacing } = useTheme();
  const { session, logout } = useAuthStore();
  const [view, setView] = useState<View_>('menu');
  const current = MENU.find((m) => m.key === view);

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
          {view === 'homework' ? <Homework /> : null}
          {view === 'announcements' ? <Announcements /> : null}
          {view === 'timetable' ? <Timetable /> : null}
          {view === 'leave' ? <Leave /> : null}
          {view === 'studentLeave' ? <StudentLeaveReview /> : null}
          {view === 'salary' ? <Salary /> : null}
          {view === 'profile' ? (
            <>
              <Card style={{ marginBottom: spacing.md }}>
                <Subtitle>{session?.user?.fullName || session?.user?.name}</Subtitle>
                <Caption>{session?.user?.email}</Caption>
                <Caption>{`${session?.user?.instituteName ?? ''} · ${session?.user?.role ?? ''}`}</Caption>
              </Card>
              <Button title="Sign out" variant="outline" onPress={logout} />
            </>
          ) : null}
        </>
      )}
      {view === 'menu' ? <SectionTitle>Account</SectionTitle> : null}
      {view === 'menu' ? <Caption>{session?.user?.email}</Caption> : null}
    </Screen>
  );
};

const styles = StyleSheet.create({
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
});
