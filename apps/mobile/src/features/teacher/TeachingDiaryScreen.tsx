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
              onError: (e) => Alert.alert('Could not publish', errorMessage(e)),
            },
          )
        }
      />
    </Card>
  );
};

export const TeachingDiaryScreen: React.FC = () => {
  const [tab, setTab] = useState<Tab>('diary');
  const diaries = useDiaries();
  const materials = useTeacherMaterials();
  const active = tab === 'diary' ? diaries : materials;

  return (
    <Screen
      eyebrow="VAULT"
      title={tab === 'diary' ? 'Teaching diary' : 'Notes & materials'}
      subtitle="Drafts stay private until you publish to the batch"
      refreshing={active.isRefetching}
      onRefresh={() => active.refetch()}
    >
      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { key: 'diary', label: 'Diary' },
          { key: 'materials', label: 'Materials' },
        ]}
      />
      {tab === 'diary' ? <DiaryForm /> : <MaterialForm />}

      <SectionTitle>{tab === 'diary' ? 'Recent entries' : 'Shared files'}</SectionTitle>
      {tab === 'diary' ? (
        <QueryBoundary query={diaries} isEmpty={(d) => d.length === 0} emptyTitle="No entries yet" emptyDescription="Log today's lesson above.">
          {(items) =>
            items.slice(0, 15).map((e) => (
              <Card key={e.id} style={{ marginBottom: 8 }}>
                <View style={styles.between}>
                  <Subtitle style={{ flex: 1 }}>{e.chapterTitle}</Subtitle>
                  <Badge label={e.status} variant={e.status === 'PUBLISHED' ? 'success' : 'warning'} />
                </View>
                <Caption>{`${e.subject} · ${e.batchName} · ${formatDate(e.lessonDate)}`}</Caption>
                <Body numberOfLines={2}>{e.conceptsTaught}</Body>
              </Card>
            ))
          }
        </QueryBoundary>
      ) : (
        <QueryBoundary query={materials} isEmpty={(d) => d.length === 0} emptyTitle="No materials yet" emptyDescription="Share notes or worksheets above.">
          {(items) =>
            items.slice(0, 15).map((m) => (
              <Card key={m.id} style={{ marginBottom: 8 }}>
                <View style={styles.between}>
                  <Subtitle style={{ flex: 1 }}>{m.title}</Subtitle>
                  <Badge label={m.status} variant={m.status === 'PUBLISHED' ? 'success' : 'warning'} />
                </View>
                <Caption>{`${m.subject} · ${m.batchName} · ${m.downloadCount} downloads`}</Caption>
                {m.fileUrl ? <Button title="Open" variant="secondary" size="sm" style={{ marginTop: 8 }} onPress={() => openUrl(m.fileUrl)} /> : null}
              </Card>
            ))
          }
        </QueryBoundary>
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
});
