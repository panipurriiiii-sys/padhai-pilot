import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  Linking,
} from 'react-native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Title, Subtitle, Body, Caption, Label } from '../../components/common/Typography';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { useTheme } from '../../theme/ThemeContext';
import {
  studentService,
  StudentDiaryEntry,
  StudentStudyMaterial,
} from '../../services/api/studentService';

type TabView = 'diary' | 'vault';

export const StudentDiaryScreen: React.FC = () => {
  const { colors, spacing, radii, typography } = useTheme();

  const [activeTab, setActiveTab] = useState<TabView>('diary');
  const [diaryEntries, setDiaryEntries] = useState<StudentDiaryEntry[]>([]);
  const [materials, setMaterials] = useState<StudentStudyMaterial[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [dList, mList] = await Promise.all([
        studentService.getDiary(),
        studentService.getMaterials(),
      ]);
      setDiaryEntries(dList);
      setMaterials(mList);
    } finally {
      setIsLoading(false);
    }
  };

  const subjects = ['ALL', 'Mathematics', 'Physics', 'Chemistry'];

  const filteredDiary = diaryEntries.filter((d) => {
    const matchSub = selectedSubject === 'ALL' || d.subject === selectedSubject;
    const matchQ =
      d.topicsCovered.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.chapter && d.chapter.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchSub && matchQ;
  });

  const filteredMaterials = materials.filter((m) => {
    const matchSub = selectedSubject === 'ALL' || m.subject === selectedSubject;
    const matchQ =
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.chapter && m.chapter.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchSub && matchQ;
  });

  const openDocument = (url?: string) => {
    if (url) {
      Linking.openURL(url).catch(() => {});
    }
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={[styles.content, { padding: spacing.lg }]}>
        {/* Header Title */}
        <View style={{ marginBottom: spacing.md }}>
          <Title style={{ fontFamily: typography.fonts.display }}>Academic Vault</Title>
          <Caption>Daily lecture diary, concepts & study resources</Caption>
        </View>

        {/* Tab Toggle: Diary vs Vault */}
        <View
          style={[
            styles.tabBar,
            { backgroundColor: colors.surfaceSubtle, borderRadius: radii.lg, padding: 4, marginBottom: spacing.md },
          ]}
        >
          <Pressable
            onPress={() => setActiveTab('diary')}
            style={[
              styles.tabBtn,
              {
                borderRadius: radii.md,
                backgroundColor: activeTab === 'diary' ? colors.surface : 'transparent',
              },
            ]}
          >
            <Label
              style={{
                color: activeTab === 'diary' ? colors.primary : colors.textMuted,
                fontWeight: activeTab === 'diary' ? '700' : '500',
              }}
            >
              📓 Daily Teaching Diary ({diaryEntries.length})
            </Label>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('vault')}
            style={[
              styles.tabBtn,
              {
                borderRadius: radii.md,
                backgroundColor: activeTab === 'vault' ? colors.surface : 'transparent',
              },
            ]}
          >
            <Label
              style={{
                color: activeTab === 'vault' ? colors.primary : colors.textMuted,
                fontWeight: activeTab === 'vault' ? '700' : '500',
              }}
            >
              ▤ Study Vault ({materials.length})
            </Label>
          </Pressable>
        </View>

        {/* Subject Filter Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md }}>
          <View style={styles.pillsRow}>
            {subjects.map((sub) => {
              const active = selectedSubject === sub;
              return (
                <Pressable
                  key={sub}
                  onPress={() => setSelectedSubject(sub)}
                  style={[
                    styles.subPill,
                    {
                      backgroundColor: active ? colors.primary : colors.surfaceSubtle,
                      borderColor: active ? colors.primary : colors.border,
                      borderRadius: radii.lg,
                    },
                  ]}
                >
                  <Label
                    style={{
                      color: active ? colors.primaryContrast : colors.textPrimary,
                      fontSize: 12,
                      fontWeight: active ? '700' : '500',
                    }}
                  >
                    {sub}
                  </Label>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        {/* Search */}
        <View
          style={[
            styles.searchBar,
            { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.md, marginBottom: spacing.md },
          ]}
        >
          <TextInput
            placeholder="Search concepts, chapters, formulas..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchInput, { color: colors.textPrimary }]}
          />
        </View>

        {/* 1. DAILY TEACHING DIARY FEED */}
        {activeTab === 'diary' && (
          <View>
            {filteredDiary.map((entry) => (
              <Card key={entry.id} variant="elevated" style={{ marginBottom: spacing.md }}>
                <View style={styles.entryHeader}>
                  <View style={{ flex: 1, marginRight: spacing.sm }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <Badge variant="primary" label={entry.subject} />
                      <Caption style={{ fontVariant: ['tabular-nums'] }}>{entry.entryDate}</Caption>
                    </View>
                    <Subtitle style={{ fontFamily: typography.fonts.display, fontSize: 16 }}>
                      {entry.chapter || entry.subject}
                    </Subtitle>
                    <Caption>Taught by {entry.facultyName}</Caption>
                  </View>
                </View>

                {/* Concepts Taught */}
                <View style={[styles.conceptBox, { backgroundColor: colors.surfaceSubtle, borderRadius: radii.md, padding: 10, marginVertical: 8 }]}>
                  <Label style={{ fontSize: 11, color: colors.textMuted, marginBottom: 2 }}>Concepts & Topics</Label>
                  <Body style={{ fontSize: 13, color: colors.textPrimary }}>{entry.topicsCovered}</Body>
                </View>

                {/* Student Notes / Key Takeaways */}
                {entry.studentNotes && (
                  <View style={{ marginBottom: 6 }}>
                    <Label style={{ fontSize: 11, color: colors.primary, fontWeight: 'bold' }}>Faculty Key Note</Label>
                    <Caption style={{ color: colors.textSecondary }}>&quot;{entry.studentNotes}&quot;</Caption>
                  </View>
                )}

                {/* Homework Assigned */}
                {entry.homeworkAssigned && (
                  <View style={[styles.hwBox, { borderColor: colors.accent, borderLeftWidth: 3, paddingLeft: 8, marginVertical: 4 }]}>
                    <Label style={{ fontSize: 11, color: colors.accent, fontWeight: 'bold' }}>Homework Assigned</Label>
                    <Caption style={{ color: colors.textPrimary }}>{entry.homeworkAssigned}</Caption>
                  </View>
                )}

                {/* Attachment button if available */}
                {entry.fileUrl && (
                  <Pressable
                    onPress={() => openDocument(entry.fileUrl)}
                    style={[styles.fileBtn, { backgroundColor: colors.primarySubtle, borderRadius: radii.sm, marginTop: 8 }]}
                  >
                    <Caption style={{ color: colors.primary, fontWeight: 'bold' }}>
                      📄 View Attached Handout
                    </Caption>
                  </Pressable>
                )}
              </Card>
            ))}
          </View>
        )}

        {/* 2. STUDY MATERIAL VAULT */}
        {activeTab === 'vault' && (
          <View>
            {filteredMaterials.map((mat) => (
              <Card key={mat.id} style={{ marginBottom: spacing.md }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <View style={{ flex: 1, marginRight: spacing.sm }}>
                    <Badge variant="default" label={mat.category} />
                    <Label style={{ fontWeight: '700', fontSize: 15, marginTop: 4, color: colors.textPrimary }}>
                      {mat.title}
                    </Label>
                    <Caption>{mat.subject} • {mat.chapter || 'All Chapters'}</Caption>
                  </View>
                  {mat.fileSize && (
                    <Caption style={{ fontVariant: ['tabular-nums'], color: colors.textMuted }}>
                      {mat.fileSize}
                    </Caption>
                  )}
                </View>

                {mat.content && (
                  <Caption style={{ color: colors.textSecondary, marginBottom: 8 }}>
                    {mat.content}
                  </Caption>
                )}

                {mat.fileUrl && (
                  <Button
                    title="Download / View PDF"
                    variant="outline"
                    size="small"
                    onPress={() => openDocument(mat.fileUrl)}
                  />
                )}
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingBottom: 40,
  },
  tabBar: {
    flexDirection: 'row',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  subPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  searchBar: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    fontSize: 13,
    padding: 0,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  conceptBox: {},
  hwBox: {},
  fileBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignSelf: 'flex-start',
  },
});

