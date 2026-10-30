import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  Alert,
} from 'react-native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Title, Subtitle, Body, Caption, Label } from '../../components/common/Typography';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { useTheme } from '../../theme/ThemeContext';
import { useNavigationStore } from '../../store/useNavigationStore';
import { teacherService } from '../../services/api/teacherService';
import type { BatchSummary, BatchStudentRoster } from '@padhai-pilot/shared';

type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';

export const TeacherAttendanceScreen: React.FC = () => {
  const { colors, spacing, radii, typography } = useTheme();
  const { selectedBatchId } = useNavigationStore();

  const [batches, setBatches] = useState<BatchSummary[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<BatchSummary | null>(null);
  const [roster, setRoster] = useState<BatchStudentRoster | null>(null);
  const [attendanceDate, setAttendanceDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [sessionName, setSessionName] = useState('Morning Lecture #1');
  const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceStatus>>({});
  const [remarksMap, setRemarksMap] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    async function init() {
      const bList = await teacherService.getBatches();
      setBatches(bList);
      const target = (selectedBatchId && bList.find((b) => b.id === selectedBatchId)) || bList[0];
      if (target) {
        setSelectedBatch(target);
        loadStudents(target.id);
      }
    }
    init();
  }, [selectedBatchId]);

  const loadStudents = async (batchId: string) => {
    const data = await teacherService.getBatchStudents(batchId);
    setRoster(data);
    // Default all students to PRESENT
    const initial: Record<string, AttendanceStatus> = {};
    for (const s of data.students || []) {
      initial[s.id] = 'PRESENT';
    }
    setAttendanceMap(initial);
  };

  const handleSelectBatch = (b: BatchSummary) => {
    setSelectedBatch(b);
    loadStudents(b.id);
  };

  const handleSetStatus = (studentId: string, status: AttendanceStatus) => {
    setAttendanceMap((prev) => ({ ...prev, [studentId]: status }));
  };

  const markAllPresent = () => {
    if (!roster) return;
    const update: Record<string, AttendanceStatus> = {};
    for (const s of roster.students || []) {
      update[s.id] = 'PRESENT';
    }
    setAttendanceMap(update);
  };

  const markAllAbsent = () => {
    if (!roster) return;
    const update: Record<string, AttendanceStatus> = {};
    for (const s of roster.students || []) {
      update[s.id] = 'ABSENT';
    }
    setAttendanceMap(update);
  };

  // Status counts
  const counts = useMemo(() => {
    let p = 0, a = 0, l = 0, e = 0;
    Object.values(attendanceMap).forEach((st) => {
      if (st === 'PRESENT') p++;
      else if (st === 'ABSENT') a++;
      else if (st === 'LATE') l++;
      else if (st === 'EXCUSED') e++;
    });
    return { present: p, absent: a, late: l, excused: e, total: Object.keys(attendanceMap).length };
  }, [attendanceMap]);

  const handleFinalizeAttendance = async () => {
    if (!selectedBatch) return;
    setIsSubmitting(true);
    setStatusMsg(null);
    try {
      const records = Object.entries(attendanceMap).map(([studentId, status]) => ({
        studentId,
        status,
        remarks: remarksMap[studentId],
      }));

      await teacherService.saveAttendance({
        batchId: selectedBatch.id,
        date: attendanceDate,
        records,
      });

      setStatusMsg({
        text: `Attendance saved: ${counts.present} Present, ${counts.absent} Absent (${attendanceDate})`,
        type: 'success',
      });
    } catch {
      setStatusMsg({ text: 'Failed to save attendance session.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredStudents = (roster?.students || []).filter(
    (s) =>
      s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={[styles.content, { padding: spacing.lg }]}>
        {/* Header */}
        <View style={{ marginBottom: spacing.md }}>
          <Title style={{ fontFamily: typography.fonts.display }}>Daily Attendance</Title>
          <Caption>Mark class presence, late arrivals & excused leaves</Caption>
        </View>

        {statusMsg && (
          <View
            style={[
              styles.msgBanner,
              {
                backgroundColor: statusMsg.type === 'success' ? colors.successSubtle : colors.errorSubtle,
                borderRadius: radii.md,
                marginBottom: spacing.md,
              },
            ]}
          >
            <Caption style={{ color: statusMsg.type === 'success' ? colors.success : colors.error, fontWeight: 'bold' }}>
              {statusMsg.text}
            </Caption>
          </View>
        )}

        {/* Batch Selector Horizontal Scroller */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md }}>
          <View style={styles.pillsRow}>
            {batches.map((b) => {
              const active = selectedBatch?.id === b.id;
              return (
                <Pressable
                  key={b.id}
                  onPress={() => handleSelectBatch(b)}
                  style={[
                    styles.batchPill,
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
                    {b.name}
                  </Label>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        {/* Date & Session Bar */}
        <Card style={{ marginBottom: spacing.md }}>
          <View style={styles.sessionRow}>
            <View style={{ flex: 1, marginRight: spacing.sm }}>
              <Label style={{ fontSize: 11, color: colors.textMuted }}>Date (YYYY-MM-DD)</Label>
              <TextInput
                value={attendanceDate}
                onChangeText={setAttendanceDate}
                style={[styles.smallInput, { color: colors.textPrimary, borderColor: colors.border }]}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Label style={{ fontSize: 11, color: colors.textMuted }}>Class / Session</Label>
              <TextInput
                value={sessionName}
                onChangeText={setSessionName}
                style={[styles.smallInput, { color: colors.textPrimary, borderColor: colors.border }]}
              />
            </View>
          </View>
        </Card>

        {/* Status Counter Bar */}
        <View style={[styles.counterBar, { backgroundColor: colors.surfaceElevated, borderRadius: radii.lg }]}>
          <View style={styles.counterItem}>
            <Label style={{ color: colors.success, fontWeight: 'bold' }}>{counts.present}</Label>
            <Caption style={{ fontSize: 10 }}>Present (P)</Caption>
          </View>
          <View style={styles.counterItem}>
            <Label style={{ color: colors.error, fontWeight: 'bold' }}>{counts.absent}</Label>
            <Caption style={{ fontSize: 10 }}>Absent (A)</Caption>
          </View>
          <View style={styles.counterItem}>
            <Label style={{ color: colors.warning, fontWeight: 'bold' }}>{counts.late}</Label>
            <Caption style={{ fontSize: 10 }}>Late (L)</Caption>
          </View>
          <View style={styles.counterItem}>
            <Label style={{ color: colors.primary, fontWeight: 'bold' }}>{counts.excused}</Label>
            <Caption style={{ fontSize: 10 }}>Excused (E)</Caption>
          </View>
        </View>

        {/* Quick Batch Actions */}
        <View style={[styles.quickActions, { marginVertical: spacing.md }]}>
          <Button
            title="Mark All Present"
            variant="outline"
            size="small"
            onPress={markAllPresent}
            style={{ flex: 1, marginRight: spacing.xs }}
          />
          <Button
            title="Clear / Absent"
            variant="outline"
            size="small"
            onPress={markAllAbsent}
            style={{ flex: 1, marginLeft: spacing.xs }}
          />
        </View>

        {/* Search */}
        <View
          style={[
            styles.searchBar,
            { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.md, marginBottom: spacing.md },
          ]}
        >
          <TextInput
            placeholder="Search learners by name or roll..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchInput, { color: colors.textPrimary }]}
          />
        </View>

        {/* Student Attendance List */}
        {filteredStudents.map((st) => {
          const currentStatus = attendanceMap[st.id] || 'PRESENT';
          return (
            <Card key={st.id} style={{ marginBottom: spacing.sm }}>
              <View style={styles.studentCardRow}>
                <View style={{ flex: 1, marginRight: spacing.sm }}>
                  <Label style={{ fontWeight: '700', color: colors.textPrimary }}>{st.fullName}</Label>
                  <Caption style={{ fontVariant: ['tabular-nums'] }}>{st.rollNumber}</Caption>
                </View>

                {/* 4 Status Touch Buttons */}
                <View style={styles.statusGroup}>
                  {(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'] as AttendanceStatus[]).map((type) => {
                    const isSelected = currentStatus === type;
                    let bg = colors.surfaceSubtle;
                    let textCol = colors.textMuted;
                    if (isSelected) {
                      if (type === 'PRESENT') { bg = colors.success; textCol = '#FFF'; }
                      else if (type === 'ABSENT') { bg = colors.error; textCol = '#FFF'; }
                      else if (type === 'LATE') { bg = colors.warning; textCol = '#FFF'; }
                      else if (type === 'EXCUSED') { bg = colors.primary; textCol = '#FFF'; }
                    }

                    return (
                      <Pressable
                        key={type}
                        onPress={() => handleSetStatus(st.id, type)}
                        style={[styles.statusBtn, { backgroundColor: bg, borderRadius: radii.sm }]}
                      >
                        <Text style={[styles.statusText, { color: textCol, fontWeight: isSelected ? 'bold' : '500' }]}>
                          {type.charAt(0)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </Card>
          );
        })}

        {/* Save Attendance Sticky Footer */}
        <View style={{ marginTop: spacing.lg }}>
          <Button
            title={isSubmitting ? 'Finalizing Attendance...' : `Finalize & Save Attendance (${counts.present}/${counts.total})`}
            variant="primary"
            onPress={handleFinalizeAttendance}
            loading={isSubmitting}
          />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingBottom: 40,
  },
  msgBanner: {
    padding: 10,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  batchPill: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
  },
  sessionRow: {
    flexDirection: 'row',
  },
  smallInput: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 12,
    borderRadius: 6,
    marginTop: 4,
  },
  counterBar: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  counterItem: {
    alignItems: 'center',
  },
  quickActions: {
    flexDirection: 'row',
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
  studentCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusGroup: {
    flexDirection: 'row',
    gap: 4,
  },
  statusBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    fontSize: 12,
  },
});
