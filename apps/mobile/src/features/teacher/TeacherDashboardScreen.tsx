import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  RefreshControl,
} from 'react-native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Title, Subtitle, Body, Caption, StatValue, Label } from '../../components/common/Typography';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { useAuthStore } from '../../store/useAuthStore';
import { useNavigationStore } from '../../store/useNavigationStore';
import { useTheme } from '../../theme/ThemeContext';
import { teacherService, TeacherDashboardMetrics } from '../../services/api/teacherService';

export const TeacherDashboardScreen: React.FC = () => {
  const { colors, spacing, radii } = useTheme();
  const { session } = useAuthStore();
  const { setTab, setSelectedBatchId } = useNavigationStore();

  const [metrics, setMetrics] = useState<TeacherDashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const data = await teacherService.getDashboard();
      setMetrics(data);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const facultyName = session?.user?.fullName || session?.user?.name || 'Prof. Rajesh Sharma';
  const instituteName = session?.user?.instituteName || 'Apex IIT-JEE & Medical Academy';

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={[styles.content, { padding: spacing.lg }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Header Card */}
        <Card variant="elevated" style={{ marginBottom: spacing.lg }}>
          <View style={styles.badgeRow}>
            <Badge label="FACULTY PORTAL" variant="primary" />
            <Caption style={{ fontVariant: ['tabular-nums'] }}>{new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</Caption>
          </View>
          <Title style={{ marginTop: spacing.xs, marginBottom: spacing.xxs }}>{facultyName}</Title>
          <Caption>{instituteName} • Department of Mathematics</Caption>
        </Card>

        {/* Quick Action Shortcuts */}
        <View style={[styles.quickActionsRow, { marginBottom: spacing.lg }]}>
          <Pressable
            onPress={() => setTab('teacher_marks')}
            style={({ pressed }) => [
              styles.quickActionBtn,
              {
                backgroundColor: colors.primary,
                borderRadius: radii.md,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Body style={[styles.btnIcon, { color: colors.primaryContrast }]}>✎</Body>
            <Label style={{ color: colors.primaryContrast, fontSize: 12 }}>Bulk Marks Entry</Label>
          </Pressable>

          <Pressable
            onPress={() => setTab('teacher_materials')}
            style={({ pressed }) => [
              styles.quickActionBtn,
              {
                backgroundColor: colors.surfaceElevated,
                borderColor: colors.border,
                borderWidth: 1,
                borderRadius: radii.md,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Body style={[styles.btnIcon, { color: colors.primary }]}>▤</Body>
            <Label style={{ fontSize: 12 }}>Upload Material</Label>
          </Pressable>

          <Pressable
            onPress={() => setTab('teacher_diary')}
            style={({ pressed }) => [
              styles.quickActionBtn,
              {
                backgroundColor: colors.surfaceElevated,
                borderColor: colors.border,
                borderWidth: 1,
                borderRadius: radii.md,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Body style={[styles.btnIcon, { color: colors.primary }]}>📓</Body>
            <Label style={{ fontSize: 12 }}>Teaching Diary</Label>
          </Pressable>
        </View>

        {/* KPI Metrics Grid */}
        <View style={[styles.statsGrid, { marginBottom: spacing.lg }]}>
          <Card style={[styles.statCard, { marginRight: spacing.sm }]}>
            <Caption>ACTIVE BATCHES</Caption>
            <StatValue color={colors.primary}>{metrics?.assignedBatchesCount ?? 3}</StatValue>
            <Caption>Under supervision</Caption>
          </Card>

          <Card style={styles.statCard}>
            <Caption>TOTAL STUDENTS</Caption>
            <StatValue color={colors.success}>{metrics?.totalStudentsCount ?? 84}</StatValue>
            <Caption>Enrolled learners</Caption>
          </Card>
        </View>

        <View style={[styles.statsGrid, { marginBottom: spacing.lg }]}>
          <Card style={[styles.statCard, { marginRight: spacing.sm }]}>
            <Caption>TODAY CLASSES</Caption>
            <StatValue>{metrics?.todayClassesCount ?? 2}</StatValue>
            <Caption>Scheduled lectures</Caption>
          </Card>

          <Card style={styles.statCard}>
            <Caption>PENDING ENTRIES</Caption>
            <StatValue color={colors.warning}>{metrics?.pendingAttendanceCount ?? 1}</StatValue>
            <Caption>Requires submission</Caption>
          </Card>
        </View>

        {/* Today's Schedule */}
        <Subtitle style={{ marginBottom: spacing.sm }}>Today&apos;s Lecture Schedule</Subtitle>
        <Card style={{ marginBottom: spacing.lg }}>
          {metrics?.todaySchedule && metrics.todaySchedule.length > 0 ? (
            metrics.todaySchedule.map((item, index) => (
              <View
                key={item.id}
                style={[
                  styles.scheduleItem,
                  index > 0 && { borderTopWidth: 1, borderTopColor: colors.borderSubtle, paddingTop: spacing.md, marginTop: spacing.md },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Label style={{ color: colors.textPrimary }}>{item.batchName}</Label>
                  <Caption>{item.subject} • {item.room}</Caption>
                </View>
                <Badge label={item.timeSlot} variant="default" />
              </View>
            ))
          ) : (
            <Caption>No more lectures scheduled for today.</Caption>
          )}
        </Card>

        {/* Assigned Batches */}
        <Subtitle style={{ marginBottom: spacing.sm }}>Your Academic Batches</Subtitle>
        {metrics?.activeBatches && metrics.activeBatches.map((batch) => (
          <Card
            key={batch.id}
            onPress={() => {
              setSelectedBatchId(batch.id);
              setTab('teacher_marks');
            }}
            style={{ marginBottom: spacing.sm }}
          >
            <View style={styles.batchCardHeader}>
              <View style={{ flex: 1 }}>
                <Label style={{ color: colors.textPrimary }}>{batch.name}</Label>
                <Caption>{batch.code} • {batch.gradeLevel} • {batch.studentCount} Students</Caption>
              </View>
              <Badge label="Enter Marks" variant="primary" />
            </View>
          </Card>
        ))}
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingBottom: 40,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quickActionBtn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnIcon: {
    fontSize: 16,
    marginBottom: 4,
    fontWeight: 'bold',
  },
  statsGrid: {
    flexDirection: 'row',
  },
  statCard: {
    flex: 1,
  },
  scheduleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  batchCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
