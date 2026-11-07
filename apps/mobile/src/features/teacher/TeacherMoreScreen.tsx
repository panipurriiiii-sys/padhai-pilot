import React, { useState, useEffect } from 'react';
import { Alert, View, Text, StyleSheet, Image } from 'react-native';
import { Screen, SectionTitle } from '../../components/common/Screen';
import { QueryBoundary } from '../../components/common/QueryBoundary';
import { BatchPicker } from '../../components/common/BatchPicker';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Icon, IconName } from '../../components/common/Icon';
import { IconChip, Tone } from '../../components/common/Paper';
import { Body, Caption, Subtitle } from '../../components/common/Typography';
import {
  useBatches,
  useBatchMutations,
  useApplyLeave,
  useCreateAnnouncement,
  useCreateAssignment,
  useUpdateAssignment,
  useGradeSubmission,
  useLeaves,
  useSalaries,
  useSubmissions,
  useTeacherAnnouncements,
  useTeacherAssignments,
  useTeacherTimetable,
  useTimetableMutations,
  useTeacherTests,
  useToggleTestResults,
  useLessonPlans,
  useLessonPlanMutations,
} from '../../hooks/useTeacherData';
import type { Assignment, TimetableConflictError, WeekDay } from '@padhai-pilot/shared';
import { StudentLeaveReview } from '../leave/StudentLeavePanels';
import { TeacherQueriesPanel } from './TeacherQueriesPanel';
import { TeacherReportsPanel } from './TeacherReportsPanel';
import { useBackToMenu } from '../../hooks/useBackToMenu';
import { openPdf } from '../../lib/pdf';
import { openUrl } from '../../lib/links';
import { pickAndUploadMedia } from '../../lib/mediaUpload';
import { InstituteHeader } from '../../components/common/InstituteHeader';
import { documentPaths } from '../../services/api/financeService';
import { useAuthStore } from '../../store/useAuthStore';
import { useNavigationStore } from '../../store/useNavigationStore';
import { useTheme } from '../../theme/ThemeContext';
import { errorMessage, formatDate, formatInr, todayIso } from '../../lib/format';

type View_ =
  | 'menu'
  | 'homework'
  | 'tests'
  | 'lessonPlans'
  | 'announcements'
  | 'timetable'
  | 'studentLeave'
  | 'leave'
  | 'queries'
  | 'reports'
  | 'salary'
  | 'profile';

const MENU: Array<{ key: View_; label: string; hint: string; icon: IconName; tone: Tone }> = [
  { key: 'homework', label: 'Homework & Grading', hint: 'Create assignments, grade student submissions', icon: 'file-check-2', tone: 'blue' },
  { key: 'tests', label: 'Tests & Quizzes', hint: 'Classroom tests, durations & release results', icon: 'award', tone: 'amber' },
  { key: 'lessonPlans', label: 'Curriculum & Lesson Plans', hint: 'Weekly chapter syllabus & completion', icon: 'book-open', tone: 'teal' },
  { key: 'announcements', label: 'Noticeboard', hint: 'Broadcast announcements to your batches', icon: 'megaphone', tone: 'rose' },
  { key: 'timetable', label: 'Weekly Timetable', hint: 'Schedule slots, room allocations & days', icon: 'clock', tone: 'blue' },
  { key: 'studentLeave', label: 'Student Leave Requests', hint: 'Approve or reject student leave', icon: 'users', tone: 'amber' },
  { key: 'leave', label: 'My Leave', hint: 'Apply for leave & track approval', icon: 'calendar-check', tone: 'teal' },
  { key: 'queries', label: 'Student Doubts & Queries', hint: 'Answer questions asked by batch students', icon: 'help-circle', tone: 'amber' },
  { key: 'reports', label: 'Analytics & Reports', hint: 'Attendance rates, batch benchmarks & stats', icon: 'trending-up', tone: 'teal' },
  { key: 'salary', label: 'Salary Slips', hint: 'Monthly salary statements & breakdown', icon: 'receipt', tone: 'emerald' },
  { key: 'profile', label: 'Account & Sign Out', hint: 'Faculty profile and session details', icon: 'user', tone: 'blue' },
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

const AttachButton: React.FC<{ onUploaded: (url: string) => void }> = ({ onUploaded }) => {
  const [busy, setBusy] = useState(false);
  return (
    <Button
      title="Attach file from device"
      variant="outline"
      size="sm"
      loading={busy}
      style={{ alignSelf: 'flex-start', marginBottom: 12 }}
      onPress={async () => {
        setBusy(true);
        try {
          const m = await pickAndUploadMedia();
          if (m) onUploaded(m.url);
        } catch (e) {
          Alert.alert('Could not attach', errorMessage(e));
        } finally {
          setBusy(false);
        }
      }}
    />
  );
};

const EditAssignment: React.FC<{ a: Assignment; onDone: () => void }> = ({ a, onDone }) => {
  const update = useUpdateAssignment();
  const [title, setTitle] = useState(a.title);
  const [subject, setSubject] = useState(a.subject);
  const [instructions, setInstructions] = useState(a.instructions);
  const [due, setDue] = useState((a.dueDate ?? '').slice(0, 10));
  const [maxMarks, setMaxMarks] = useState(String(a.maxMarks ?? ''));
  const [attachment, setAttachment] = useState(a.attachmentUrl ?? '');
  const attachmentOk = attachment.trim() === '' || /^https:\/\/\S+$/i.test(attachment.trim());
  const marks = Number(maxMarks);
  const ready = attachmentOk && !!title.trim() && !!subject.trim() && !!instructions.trim() && /^\d{4}-\d{2}-\d{2}$/.test(due) && Number.isFinite(marks) && marks > 0;
  return (
    <View style={{ marginTop: 10 }}>
      <Input label="Title" value={title} onChangeText={setTitle} />
      <Input label="Subject" value={subject} onChangeText={setSubject} />
      <Input label="Instructions" value={instructions} onChangeText={setInstructions} multiline />
      <Input label="Due date (YYYY-MM-DD)" value={due} onChangeText={setDue} autoCapitalize="none" />
      <Input label="Max marks" value={maxMarks} onChangeText={setMaxMarks} keyboardType="numeric" />
      <Input label="Document link (https, empty removes)" value={attachment} onChangeText={setAttachment} autoCapitalize="none" error={attachmentOk ? null : 'Must start with https://'} />
      <AttachButton onUploaded={setAttachment} />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Button
          title="Save changes"
          size="sm"
          disabled={!ready}
          loading={update.isPending}
          onPress={() =>
            update.mutate(
              { id: a.id, data: { title: title.trim(), subject: subject.trim(), instructions: instructions.trim(), dueDate: due, maxMarks: marks, attachmentUrl: attachment.trim() === '' ? null : attachment.trim() } },
              { onSuccess: () => { Alert.alert('Saved', 'Assignment updated.'); onDone(); }, onError: (e) => Alert.alert('Could not save', errorMessage(e)) },
            )
          }
        />
        <Button title="Cancel" size="sm" variant="ghost" onPress={onDone} />
      </View>
    </View>
  );
};

const Homework: React.FC = () => {
  const [editing, setEditing] = useState<string | null>(null);
  const q = useTeacherAssignments();
  const create = useCreateAssignment();
  const batches = useBatches();
  const [open, setOpen] = useState<string | null>(null);
  const [batchId, setBatchId] = useState<string>();
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [instructions, setInstructions] = useState('');
  const [due, setDue] = useState(todayIso());
  const [attachment, setAttachment] = useState('');
  const attachmentOk = attachment.trim() === '' || /^https:\/\/\S+$/i.test(attachment.trim());
  useEffect(() => {
    if (batchId) {
      const b = batches.data?.find((x) => x.id === batchId);
      if (b?.subject && !subject) setSubject(b.subject);
    }
  }, [batchId, batches.data]);
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
        <AttachButton onUploaded={setAttachment} />
        <Button
          title="Publish to batch"
          disabled={!ready}
          loading={create.isPending}
          onPress={() =>
            create.mutate(
              { batchId: batchId as string, title: title.trim(), subject: subject.trim(), instructions: instructions.trim(), dueDate: due, attachmentUrl: attachment.trim() || undefined },
              {
                onSuccess: () => { setTitle(''); setInstructions(''); Alert.alert('Published', 'Assignment is visible to students.'); },
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
              {a.attachmentUrl ? <Button title="Open attached document" size="sm" variant="ghost" style={{ alignSelf: 'flex-start' }} onPress={() => void openUrl(a.attachmentUrl)} /> : null}
              {editing === a.id ? (
                <EditAssignment a={a} onDone={() => setEditing(null)} />
              ) : (
                <Button title="Edit" size="sm" variant="outline" style={{ alignSelf: 'flex-start', marginTop: 6 }} onPress={() => setEditing(a.id)} />
              )}
              {open === a.id ? <Grading assignmentId={a.id} /> : null}
            </Card>
          ))
        }
      </QueryBoundary>
    </>
  );
};

const Tests: React.FC = () => {
  const q = useTeacherTests();
  const toggleResults = useToggleTestResults();

  return (
    <QueryBoundary
      query={q}
      isEmpty={(t) => t.length === 0}
      emptyTitle="No tests found"
      emptyDescription="Tests and quizzes created on the portal will appear here."
    >
      {(tests) =>
        tests.map((t) => (
          <Card key={t.id} style={{ marginBottom: 10 }}>
            <View style={styles.between}>
              <Subtitle style={{ flex: 1 }}>{t.title}</Subtitle>
              <Badge
                label={t.resultsReleased ? 'Results Out' : t.status}
                variant={t.resultsReleased ? 'success' : 'neutral'}
              />
            </View>
            <Caption>{`${t.batchName ?? 'Batch'} · ${t.subject} · ${t.questions?.length ?? 0} questions · ${t.totalMarks ?? 0} marks`}</Caption>
            <View style={[styles.between, { marginTop: 8 }]}>
              <Caption>{`Duration: ${t.durationMinutes ?? 45} mins`}</Caption>
              <Button
                title={t.resultsReleased ? 'Hide Results' : 'Release Results'}
                size="sm"
                variant={t.resultsReleased ? 'outline' : 'primary'}
                loading={toggleResults.isPending}
                onPress={() =>
                  toggleResults.mutate(t.id, {
                    onSuccess: () =>
                      Alert.alert(
                        'Updated',
                        t.resultsReleased ? 'Results hidden.' : 'Results released to students!',
                      ),
                    onError: (e) => Alert.alert('Error', errorMessage(e)),
                  })
                }
              />
            </View>
          </Card>
        ))
      }
    </QueryBoundary>
  );
};

const LessonPlans: React.FC = () => {
  const [batchId, setBatchId] = useState<string>();
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [subject, setSubject] = useState('');
  const [weekNumber, setWeekNumber] = useState('1');
  const [content, setContent] = useState('');
  const batches = useBatches();
  const q = useLessonPlans();
  const { create, toggle } = useLessonPlanMutations();

  useEffect(() => {
    if (batchId) {
      const b = batches.data?.find((x) => x.id === batchId);
      if (b?.subject && !subject) setSubject(b.subject);
    }
  }, [batchId, batches.data]);
  const valid = !!batchId && title.trim() && topic.trim() && subject.trim() && Number(weekNumber) > 0;

  const submit = () => {
    create.mutate(
      {
        batchId: batchId as string,
        title: title.trim(),
        topic: topic.trim(),
        subject: subject.trim(),
        weekNumber: Number(weekNumber),
        content: content.trim(),
      },
      {
        onSuccess: () => {
          setTitle('');
          setTopic('');
          setContent('');
          Alert.alert('Created', 'Lesson plan added to curriculum.');
        },
        onError: (e) => Alert.alert('Error', errorMessage(e)),
      },
    );
  };

  return (
    <>
      <Card style={{ marginBottom: 16 }}>
        <Subtitle>New Lesson Plan</Subtitle>
        <BatchPicker value={batchId} onChange={setBatchId} />
        <Input label="Title" value={title} onChangeText={setTitle} placeholder="e.g. Unit 3 Trigonometry" />
        <Input label="Topic" value={topic} onChangeText={setTopic} placeholder="e.g. Heights and Distances" />
        <Input label="Subject" value={subject} onChangeText={setSubject} placeholder="e.g. Mathematics" />
        <Input label="Week Number" value={weekNumber} onChangeText={setWeekNumber} keyboardType="number-pad" />
        <Input label="Content & Milestones" value={content} onChangeText={setContent} multiline placeholder="Lesson objectives and topics..." />
        <Button
          title="Save Lesson Plan"
          disabled={!valid}
          loading={create.isPending}
          onPress={submit}
        />
      </Card>

      <QueryBoundary
        query={q}
        isEmpty={(p) => p.length === 0}
        emptyTitle="No lesson plans"
        emptyDescription="Add weekly lesson plans to track syllabus progress."
      >
        {(plans) =>
          plans.map((p) => (
            <Card key={p.id} style={{ marginBottom: 8 }}>
              <View style={styles.between}>
                <Subtitle>{`Week ${p.weekNumber}: ${p.title}`}</Subtitle>
                <Badge
                  label={p.isCompleted ? 'Completed' : 'Planned'}
                  variant={p.isCompleted ? 'success' : 'neutral'}
                />
              </View>
              <Caption>{`${p.subject} · ${p.topic}`}</Caption>
              {p.content ? <Body numberOfLines={3} style={{ marginTop: 4 }}>{p.content}</Body> : null}
              <View style={[styles.between, { marginTop: 8 }]}>
                <Button
                  title={p.isCompleted ? 'Mark Incomplete' : 'Mark Completed'}
                  size="sm"
                  variant={p.isCompleted ? 'outline' : 'secondary'}
                  loading={toggle.isPending}
                  onPress={() => toggle.mutate(p.id)}
                />
              </View>
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
              { onSuccess: () => { setTitle(''); setContent(''); Alert.alert('Posted', 'Announcement broadcasted to batch.'); }, onError: (e) => Alert.alert('Could not post', errorMessage(e)) },
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
  const { spacing, colors } = useTheme();
  const [batchId, setBatchId] = useState<string>();
  const batches = useBatches();
  const batchMutations = useBatchMutations();
  const q = useTeacherTimetable(batchId);
  const { create, update, remove } = useTimetableMutations();
  const [editId, setEditId] = useState<string | null>(null);
  const [subject, setSubject] = useState('');
  const [selectedDays, setSelectedDays] = useState<WeekDay[]>(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']);
  const [singleDay, setSingleDay] = useState<WeekDay>('MONDAY');
  const [start, setStart] = useState('16:00');
  const [end, setEnd] = useState('17:00');
  const [room, setRoom] = useState('');
  const [savingMulti, setSavingMulti] = useState(false);
  const [showPhotoSection, setShowPhotoSection] = useState(false);
  const [photoUrlInput, setPhotoUrlInput] = useState('');

  const selectedBatch = batches.data?.find((x) => x.id === batchId);
  const timetableImageUrl = selectedBatch?.schedule?.startsWith('TIMETABLE_IMAGE:')
    ? selectedBatch.schedule.replace('TIMETABLE_IMAGE:', '')
    : (selectedBatch?.schedule?.startsWith('http') ? selectedBatch.schedule : null);

  useEffect(() => {
    if (batchId) {
      const b = batches.data?.find((x) => x.id === batchId);
      if (b?.subject && !subject) setSubject(b.subject);
      if (b?.room && !room) setRoom(b.room);
    }
  }, [batchId, batches.data]);

  const toggleDay = (d: WeekDay) => {
    setSelectedDays((prev) => (prev.includes(d) ? (prev.length > 1 ? prev.filter((x) => x !== d) : prev) : [...prev, d]));
  };

  const valid = !!batchId && !!subject.trim() && HHMM.test(start) && HHMM.test(end) && end > start && (editId ? true : selectedDays.length > 0);

  const reset = () => {
    setEditId(null);
    setSubject('');
    setRoom('');
  };

  const conflictText = (e: unknown) => {
    const payload = (e as { errorPayload?: TimetableConflictError })?.errorPayload;
    if (payload?.conflicts?.length) {
      return payload.conflicts
        .map((c) => `${c.kind.toLowerCase()} clash with ${c.batchName} ${c.startTime}-${c.endTime}`)
        .join(', ');
    }
    return errorMessage(e);
  };

  const submit = async () => {
    if (editId) {
      const data = { subject: subject.trim(), dayOfWeek: singleDay, startTime: start, endTime: end, room: room.trim() || undefined };
      update.mutate(
        { slotId: editId, data },
        {
          onSuccess: reset,
          onError: (e: unknown) => Alert.alert('Could not save slot', conflictText(e)),
        }
      );
    } else {
      if (!batchId || selectedDays.length === 0) return;
      setSavingMulti(true);
      const errors: string[] = [];
      let successCount = 0;
      for (const d of selectedDays) {
        try {
          await create.mutateAsync({
            batchId,
            data: { subject: subject.trim(), dayOfWeek: d, startTime: start, endTime: end, room: room.trim() || undefined },
          });
          successCount++;
        } catch (e: unknown) {
          errors.push(`${d.slice(0, 3)}: ${conflictText(e)}`);
        }
      }
      setSavingMulti(false);
      if (errors.length > 0) {
        Alert.alert(
          successCount > 0 ? `Saved ${successCount} slot(s)` : 'Could not add slot(s)',
          errors.join('\n')
        );
      } else {
        Alert.alert('Saved', `Added slots for ${selectedDays.length} day(s)`);
        reset();
      }
    }
  };

  const savePhoto = (url: string) => {
    if (!batchId) return;
    const cleanUrl = url.trim();
    if (!cleanUrl) return;
    batchMutations.update.mutate(
      { batchId, data: { schedule: `TIMETABLE_IMAGE:${cleanUrl}` } },
      {
        onSuccess: () => {
          setPhotoUrlInput('');
          Alert.alert('Saved', 'Timetable photo attached to batch schedule.');
        },
        onError: (e) => Alert.alert('Error', errorMessage(e)),
      }
    );
  };

  const removePhoto = () => {
    if (!batchId) return;
    Alert.alert('Remove timetable image?', 'This will clear the attached timetable photo for this batch.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () =>
          batchMutations.update.mutate(
            { batchId, data: { schedule: '' } },
            {
              onSuccess: () => Alert.alert('Removed', 'Timetable photo removed.'),
              onError: (e) => Alert.alert('Error', errorMessage(e)),
            }
          ),
      },
    ]);
  };

  return (
    <>
      <BatchPicker value={batchId} onChange={setBatchId} />

      {batchId ? (
        <Card style={{ marginBottom: 16 }}>
          <View style={[styles.between, { alignItems: 'center' }]}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Subtitle>Timetable Photo Mode</Subtitle>
              <Caption>
                {timetableImageUrl ? 'Photo timetable active for this batch' : 'Attach photo or sheet instead of individual slots'}
              </Caption>
            </View>
            <Button
              size="sm"
              variant="outline"
              title={showPhotoSection ? 'Hide' : (timetableImageUrl ? 'View Photo' : 'Attach Photo')}
              onPress={() => setShowPhotoSection(!showPhotoSection)}
            />
          </View>
          {showPhotoSection && (
            <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border }}>
              {timetableImageUrl ? (
                <View style={{ alignItems: 'center', marginBottom: 8 }}>
                  <Image
                    source={{ uri: timetableImageUrl }}
                    style={{ width: '100%', height: 180, borderRadius: 8, marginBottom: 8 }}
                    resizeMode="contain"
                  />
                  <Caption style={{ marginBottom: 8 }} numberOfLines={1}>
                    {timetableImageUrl}
                  </Caption>
                  <Button size="sm" variant="outline" title="Remove Photo" onPress={removePhoto} />
                </View>
              ) : (
                <View>
                  <Input
                    label="Image URL (CDN or Link)"
                    value={photoUrlInput}
                    onChangeText={setPhotoUrlInput}
                    placeholder="https://..."
                    autoCapitalize="none"
                  />
                  <Button
                    size="sm"
                    title="Attach Photo Timetable"
                    disabled={!photoUrlInput.trim()}
                    loading={batchMutations.update.isPending}
                    onPress={() => savePhoto(photoUrlInput)}
                  />
                </View>
              )}
            </View>
          )}
        </Card>
      ) : null}

      <Card style={{ marginBottom: 16 }}>
        <Subtitle>{editId ? 'Edit slot' : 'New weekly slot'}</Subtitle>
        <Input label="Subject" value={subject} onChangeText={setSubject} />
        
        {!editId ? (
          <>
            <Caption style={{ marginBottom: 6 }}>Easy Mode: Quick Select Days</Caption>
            <View style={{ flexDirection: 'row', gap: 6, marginBottom: 10 }}>
              <Button
                size="sm"
                variant="outline"
                title="Mon–Fri"
                onPress={() => setSelectedDays(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'])}
              />
              <Button
                size="sm"
                variant="outline"
                title="Mon–Sat"
                onPress={() => setSelectedDays(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'])}
              />
              <Button
                size="sm"
                variant="outline"
                title="All 7 Days"
                onPress={() => setSelectedDays([...DAYS])}
              />
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: spacing.md }}>
              {DAYS.map((d) => {
                const selected = selectedDays.includes(d);
                return (
                  <Button
                    key={d}
                    size="sm"
                    variant={selected ? 'primary' : 'outline'}
                    title={d.slice(0, 3)}
                    onPress={() => toggleDay(d)}
                  />
                );
              })}
            </View>
          </>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: spacing.md }}>
            {DAYS.map((d) => (
              <Button
                key={d}
                size="sm"
                variant={singleDay === d ? 'primary' : 'outline'}
                title={d.slice(0, 3)}
                onPress={() => setSingleDay(d)}
              />
            ))}
          </View>
        )}

        <Input label="Start (HH:mm)" value={start} onChangeText={setStart} autoCapitalize="none" />
        <Input label="End (HH:mm)" value={end} onChangeText={setEnd} autoCapitalize="none" />
        <Input label="Room" value={room} onChangeText={setRoom} />
        <Button
          title={editId ? 'Save slot' : (selectedDays.length > 1 ? `Add slot to ${selectedDays.length} days` : 'Add slot')}
          disabled={!valid}
          loading={create.isPending || update.isPending || savingMulti}
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
                      setBatchId(s.batchId);
                      setEditId(s.id);
                      setSubject(s.subject);
                      setSingleDay(s.dayOfWeek);
                      setStart(s.startTime);
                      setEnd(s.endTime);
                      setRoom(s.room ?? '');
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
              { onSuccess: () => { setReason(''); Alert.alert('Applied', 'Leave application submitted.'); }, onError: (e) => Alert.alert('Could not apply', errorMessage(e)) },
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
            {s.status !== 'DRAFT' ? (
              <Button title="Salary slip PDF" size="sm" variant="outline" style={{ marginTop: 8, alignSelf: 'flex-start' }} onPress={() => void openPdf(documentPaths.salarySlip(s.id), `salary-slip-${s.payPeriod}`)} />
            ) : null}
          </Card>
        ))
      }
    </QueryBoundary>
  );
};

export const TeacherMoreScreen: React.FC = () => {
  const { spacing, colors, typography } = useTheme();
  const { session, logout } = useAuthStore();
  const { setTab } = useNavigationStore();
  const [view, setView] = useState<View_>('menu');
  const current = MENU.find((m) => m.key === view);
  const toMenu = React.useCallback(() => setView('menu'), []);
  useBackToMenu(view !== 'menu', toMenu);

  return (
    <Screen eyebrow="OPERATIONS" title={current?.label ?? 'Faculty Hub'} subtitle={current?.hint ?? 'Academic administration & management'}>
      {view === 'menu' ? (
        <>
          {/* Quick link to Batches & Students */}
          <Card style={{ marginBottom: 10, padding: 14 }} onPress={() => setTab('teacher_classes')}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <IconChip icon="users" tone="blue" size={38} />
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                  <Text style={{ fontFamily: typography.fonts.ui, fontSize: 14, fontWeight: '700', color: colors.textPrimary }}>
                    Batches & Students Roster
                  </Text>
                  <Badge label="Core" variant="info" />
                </View>
                <Text style={{ fontFamily: typography.fonts.ui, fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
                  Roster, invitation codes & fee status
                </Text>
              </View>
              <Icon name="arrow-right" size={14} color={colors.textFaint} />
            </View>
          </Card>

          {/* Quick link to Bulk Marks */}
          <Card style={{ marginBottom: 12, padding: 14 }} onPress={() => setTab('teacher_marks')}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <IconChip icon="file-spreadsheet" tone="emerald" size={38} />
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                  <Text style={{ fontFamily: typography.fonts.ui, fontSize: 14, fontWeight: '700', color: colors.textPrimary }}>
                    Bulk Marks Entry
                  </Text>
                  <Badge label="Grading" variant="success" />
                </View>
                <Text style={{ fontFamily: typography.fonts.ui, fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
                  Score assessments & publish results
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
          {view === 'homework' ? <Homework /> : null}
          {view === 'tests' ? <Tests /> : null}
          {view === 'lessonPlans' ? <LessonPlans /> : null}
          {view === 'announcements' ? <Announcements /> : null}
          {view === 'timetable' ? <Timetable /> : null}
          {view === 'leave' ? <Leave /> : null}
          {view === 'studentLeave' ? <StudentLeaveReview /> : null}
          {view === 'queries' ? <TeacherQueriesPanel /> : null}
          {view === 'reports' ? <TeacherReportsPanel /> : null}
          {view === 'salary' ? <Salary /> : null}
          {view === 'profile' ? (
            <>
              <InstituteHeader showLetterhead />
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
      {view === 'menu' ? <SectionTitle>Logged In As</SectionTitle> : null}
      {view === 'menu' ? <Caption>{`${session?.user?.fullName ?? ''} (${session?.user?.email})`}</Caption> : null}
    </Screen>
  );
};

const styles = StyleSheet.create({
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
});
