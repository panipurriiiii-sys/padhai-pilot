import React, { useState } from 'react';
import { Alert, View, StyleSheet } from 'react-native';
import { Screen, SectionTitle } from '../../components/common/Screen';
import { QueryBoundary } from '../../components/common/QueryBoundary';
import { BatchPicker } from '../../components/common/BatchPicker';
import { Segmented } from '../../components/common/Segmented';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Body, Caption, Subtitle } from '../../components/common/Typography';
import { useCreateDiary, useCreateMaterial, useDiaries, useTeacherMaterials } from '../../hooks/useTeacherData';
import type { StudyMaterialCategory } from '../../services/api/teacherService';
import { errorMessage, formatDate, todayIso } from '../../lib/format';
import { openUrl } from '../../lib/links';

type Tab = 'diary' | 'materials';

const DiaryForm: React.FC = () => {
  const [batchId, setBatchId] = useState<string>();
  const [subject, setSubject] = useState('');
  const [chapter, setChapter] = useState('');
  const [concepts, setConcepts] = useState('');
  const [homework, setHomework] = useState('');
  const create = useCreateDiary();

  const submit = (publish: boolean) =>
    create.mutate(
      {
        batchId: batchId as string,
        lessonDate: todayIso(),
        subject: subject.trim(),
        chapterTitle: chapter.trim(),
        conceptsTaught: concepts.trim(),
        homeworkAssigned: homework.trim() || undefined,
        status: publish ? 'PUBLISHED' : 'DRAFT',
        audience: publish ? 'BATCH' : 'PRIVATE_DRAFT',
      },
      {
        onSuccess: () => {
          setConcepts('');
          setHomework('');
          setChapter('');
          Alert.alert(publish ? 'Published' : 'Draft saved', publish ? 'Your batch can now see this entry.' : 'Only you can see this draft.');
        },
        onError: (e) => Alert.alert('Could not save', errorMessage(e)),
      },
    );

  const ready = !!batchId && subject.trim() && chapter.trim() && concepts.trim();
  return (
    <Card style={{ marginBottom: 16 }}>
      <Subtitle>Today&apos;s lesson</Subtitle>
      <BatchPicker value={batchId} onChange={setBatchId} />
      <Input label="Subject" value={subject} onChangeText={setSubject} />
      <Input label="Chapter" value={chapter} onChangeText={setChapter} />
      <Input label="What did you teach?" value={concepts} onChangeText={setConcepts} multiline />
      <Input label="Homework (optional)" value={homework} onChangeText={setHomework} multiline />
      <View style={styles.row}>
        <Button title="Save draft" variant="secondary" style={{ flex: 1 }} disabled={!ready} loading={create.isPending} onPress={() => submit(false)} />
        <Button title="Publish" style={{ flex: 1 }} disabled={!ready} loading={create.isPending} onPress={() => submit(true)} />
      </View>
    </Card>
  );
};

const DiaryHistory: React.FC = () => {
  const q = useDiaries();
  return (
    <>
      <SectionTitle>Past Diary Entries</SectionTitle>
      <QueryBoundary
        query={q}
        isEmpty={(d) => d.length === 0}
        emptyTitle="No diary entries yet"
        emptyDescription="Published lessons and drafts will appear here."
      >
        {(entries) =>
          entries.map((e) => (
            <Card key={e.id} style={{ marginBottom: 10 }}>
              <View style={styles.between}>
                <Subtitle style={{ flex: 1 }}>{e.chapterTitle || e.subject}</Subtitle>
                <Badge
                  label={e.status}
                  variant={e.status === 'PUBLISHED' ? 'success' : 'neutral'}
                />
              </View>
              <Caption>{`${e.batchName ?? 'Batch'} · ${e.subject} · ${formatDate(e.lessonDate)}`}</Caption>
              {e.conceptsTaught ? (
                <Body numberOfLines={3} style={{ marginTop: 4 }}>
                  {`Concepts: ${e.conceptsTaught}`}
                </Body>
              ) : null}
              {e.homeworkAssigned ? (
                <Caption style={{ marginTop: 4 }}>
                  {`Homework: ${e.homeworkAssigned}`}
                </Caption>
              ) : null}
            </Card>
          ))
        }
      </QueryBoundary>
    </>
  );
};

const CATEGORIES: StudyMaterialCategory[] = ['CHAPTER_NOTES', 'WORKSHEET', 'FORMULA_SHEET', 'HANDOUT', 'REVISION_GUIDE', 'PRACTICE_PAPER'];

const MaterialForm: React.FC = () => {
  const [batchId, setBatchId] = useState<string>();
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [link, setLink] = useState('');
  const [category, setCategory] = useState<StudyMaterialCategory>('CHAPTER_NOTES');
  const create = useCreateMaterial();
  const linkOk = link.trim() === '' || /^https:\/\//i.test(link.trim());
  const ready = !!batchId && title.trim() && subject.trim() && link.trim() && linkOk;

  return (
    <Card style={{ marginBottom: 16 }}>
      <Subtitle>Share a file</Subtitle>
      <Caption>Paste a link to an already-uploaded document (https).</Caption>
      <BatchPicker value={batchId} onChange={setBatchId} />
      <Input label="Title" value={title} onChangeText={setTitle} />
      <Input label="Subject" value={subject} onChangeText={setSubject} />
      <Input label="File link" value={link} onChangeText={setLink} autoCapitalize="none" keyboardType="url" error={linkOk ? null : 'Must start with https://'} />
      <View style={[styles.row, { flexWrap: 'wrap', marginBottom: 12 }]}>
        {CATEGORIES.map((c) => (
          <Button key={c} title={c.replace(/_/g, ' ')} size="sm" variant={c === category ? 'primary' : 'secondary'} onPress={() => setCategory(c)} />
        ))}
      </View>
      <Button
        title="Publish to batch"
        disabled={!ready}
        loading={create.isPending}
        onPress={() =>
          create.mutate(
            { batchId: batchId as string, title: title.trim(), subject: subject.trim(), category, fileUrl: link.trim(), status: 'PUBLISHED', isStudentVisible: true },
            {
              onSuccess: () => { setTitle(''); setLink(''); Alert.alert('Published', 'Students in this batch can now open it.'); },
              onError: (e) => Alert.alert('Could not save', errorMessage(e)),
            },
          )
        }
      />
    </Card>
  );
};

const MaterialsList: React.FC = () => {
  const q = useTeacherMaterials();
  return (
    <>
      <SectionTitle>Shared Study Materials</SectionTitle>
      <QueryBoundary
        query={q}
        isEmpty={(m) => m.length === 0}
        emptyTitle="No materials uploaded"
        emptyDescription="Documents shared with your batches will appear here."
      >
        {(materials) =>
          materials.map((m) => (
            <Card key={m.id} style={{ marginBottom: 10 }}>
              <View style={styles.between}>
                <Subtitle style={{ flex: 1 }}>{m.title}</Subtitle>
                <Badge label={m.category.replace(/_/g, ' ')} variant="neutral" />
              </View>
              <Caption>{`${m.batchName ?? 'Batch'} · ${m.subject} · ${formatDate(m.createdAt)}`}</Caption>
              {m.fileUrl ? (
                <Button
                  title="Open Document ↗"
                  size="sm"
                  variant="outline"
                  onPress={() => openUrl(m.fileUrl)}
                  style={{ alignSelf: 'flex-start', marginTop: 8 }}
                />
              ) : null}
            </Card>
          ))
        }
      </QueryBoundary>
    </>
  );
};

export const TeachingDiaryScreen: React.FC = () => {
  const [tab, setTab] = useState<Tab>('diary');
  return (
    <Screen
      eyebrow="TEACHING"
      title="Lesson diary & materials"
      subtitle="Record what you taught each day, or share materials with your batches"
    >
      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { key: 'diary', label: 'Daily diary' },
          { key: 'materials', label: 'Study material' },
        ]}
      />
      {tab === 'diary' ? (
        <>
          <DiaryForm />
          <DiaryHistory />
        </>
      ) : (
        <>
          <MaterialForm />
          <MaterialsList />
        </>
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
});
