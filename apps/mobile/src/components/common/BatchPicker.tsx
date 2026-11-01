import React, { useEffect, useState } from 'react';
import { ScrollView, Pressable, Text, View, Alert, Modal, StyleSheet } from 'react-native';
import { useBatches, useBatchMutations } from '../../hooks/useTeacherData';
import { QueryBoundary } from './QueryBoundary';
import { useTheme } from '../../theme/ThemeContext';
import { Button } from './Button';
import { Input } from './Input';
import { Subtitle } from './Typography';
import { errorMessage } from '../../lib/format';

interface BatchPickerProps {
  value?: string;
  onChange: (batchId: string) => void;
  allowCreate?: boolean;
  showAllOption?: boolean;
  allLabel?: string;
}

/** Horizontal chip list of the batches this faculty member is assigned to (server-filtered). Auto-selects first batch if none selected. */
export const BatchPicker: React.FC<BatchPickerProps> = ({
  value,
  onChange,
  allowCreate = true,
  showAllOption = false,
  allLabel = 'All Batches',
}) => {
  const { colors, spacing, radii, typography } = useTheme();
  const query = useBatches();
  const { create } = useBatchMutations();

  // Create Batch Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBatchName, setNewBatchName] = useState('');
  const [newBatchSubject, setNewBatchSubject] = useState('');
  const [newBatchGrade, setNewBatchGrade] = useState('');
  const [newBatchRoom, setNewBatchRoom] = useState('');

  // Auto-select first batch if none currently selected and showAllOption is false
  useEffect(() => {
    if (!showAllOption && !value && query.data && query.data.length > 0) {
      onChange(query.data[0].id);
    }
  }, [value, query.data, onChange, showAllOption]);

  const handleCreateBatch = () => {
    const name = newBatchName.trim();
    const subject = newBatchSubject.trim();
    if (!name || !subject) {
      Alert.alert('Required Fields', 'Please enter both Batch Name and Subject.');
      return;
    }

    create.mutate(
      {
        name,
        subject,
        gradeLevel: newBatchGrade.trim() || undefined,
        room: newBatchRoom.trim() || undefined,
      },
      {
        onSuccess: (created) => {
          setShowCreateModal(false);
          setNewBatchName('');
          setNewBatchSubject('');
          setNewBatchGrade('');
          setNewBatchRoom('');
          if (created?.id) {
            onChange(created.id);
          }
          Alert.alert('Batch Created', `Batch "${name}" created successfully.`);
        },
        onError: (e) => Alert.alert('Could not create batch', errorMessage(e)),
      },
    );
  };

  return (
    <>
      <QueryBoundary
        query={query}
        isEmpty={(b) => b.length === 0}
        emptyTitle="No Batches Found"
        emptyDescription="Create your first batch to start recording attendance, marks, and lesson plans."
      >
        {(batches) => (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md }}>
            {showAllOption ? (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: !value }}
                onPress={() => onChange('')}
                style={{
                  marginRight: spacing.sm,
                  paddingVertical: spacing.sm,
                  paddingHorizontal: spacing.md,
                  borderRadius: radii.full,
                  borderWidth: 1,
                  borderColor: !value ? colors.primary : colors.border,
                  backgroundColor: !value ? colors.primarySubtle : colors.surface,
                }}
              >
                <Text
                  style={{
                    fontFamily: typography.fonts.ui,
                    fontSize: 12,
                    fontWeight: '700',
                    color: !value ? colors.primary : colors.textSecondary,
                  }}
                >
                  {allLabel}
                </Text>
              </Pressable>
            ) : null}

            {batches.map((b) => {
              const active = b.id === value;
              return (
                <Pressable
                  key={b.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  onPress={() => onChange(b.id)}
                  style={{
                    marginRight: spacing.sm,
                    paddingVertical: spacing.sm,
                    paddingHorizontal: spacing.md,
                    borderRadius: radii.full,
                    borderWidth: 1,
                    borderColor: active ? colors.primary : colors.border,
                    backgroundColor: active ? colors.primarySubtle : colors.surface,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: typography.fonts.ui,
                      fontSize: 12,
                      fontWeight: '700',
                      color: active ? colors.primary : colors.textSecondary,
                    }}
                  >
                    {`${b.name} · ${b.subject}`}
                  </Text>
                </Pressable>
              );
            })}

            {allowCreate ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Create new batch"
                onPress={() => setShowCreateModal(true)}
                style={{
                  marginRight: spacing.sm,
                  paddingVertical: spacing.sm,
                  paddingHorizontal: spacing.md,
                  borderRadius: radii.full,
                  borderWidth: 1,
                  borderStyle: 'dashed',
                  borderColor: colors.primary,
                  backgroundColor: 'transparent',
                }}
              >
                <Text
                  style={{
                    fontFamily: typography.fonts.ui,
                    fontSize: 12,
                    fontWeight: '700',
                    color: colors.primary,
                  }}
                >
                  + Add Batch
                </Text>
              </Pressable>
            ) : null}
          </ScrollView>
        )}
      </QueryBoundary>

      {query.data?.length === 0 && allowCreate ? (
        <View style={{ marginBottom: spacing.md }}>
          <Button
            title="+ Create New Batch"
            variant="primary"
            size="md"
            onPress={() => setShowCreateModal(true)}
          />
        </View>
      ) : null}

      {/* Quick Create Batch Modal */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.borderSubtle,
              },
            ]}
          >
            <Subtitle style={{ marginBottom: 12 }}>Create New Batch</Subtitle>

            <Input
              label="Batch Name *"
              placeholder="e.g. Class 10 - Mathematics"
              value={newBatchName}
              onChangeText={setNewBatchName}
            />

            <Input
              label="Subject *"
              placeholder="e.g. Mathematics"
              value={newBatchSubject}
              onChangeText={setNewBatchSubject}
            />

            <Input
              label="Grade / Level"
              placeholder="e.g. Class 10"
              value={newBatchGrade}
              onChangeText={setNewBatchGrade}
            />

            <Input
              label="Room / Hall (Optional)"
              placeholder="e.g. Room 204"
              value={newBatchRoom}
              onChangeText={setNewBatchRoom}
            />

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
              <Button
                title="Cancel"
                variant="outline"
                size="md"
                style={{ flex: 1 }}
                onPress={() => setShowCreateModal(false)}
              />
              <Button
                title="Create Batch"
                variant="primary"
                size="md"
                style={{ flex: 1 }}
                loading={create.isPending}
                onPress={handleCreateBatch}
              />
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 20,
    borderWidth: 1,
    padding: 22,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
});
