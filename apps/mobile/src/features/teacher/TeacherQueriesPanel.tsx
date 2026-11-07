import React, { useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { QueryBoundary } from '../../components/common/QueryBoundary';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Subtitle, Caption, Body } from '../../components/common/Typography';
import { BatchPicker } from '../../components/common/BatchPicker';
import { useTeacherQueries, useReplyToQuery } from '../../hooks/useTeacherData';
import { useTheme } from '../../theme/ThemeContext';
import { errorMessage, formatDate } from '../../lib/format';

export const TeacherQueriesPanel: React.FC = () => {
  const { spacing, colors } = useTheme();
  const [selectedBatchId, setSelectedBatchId] = useState<string | undefined>();
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);

  const query = useTeacherQueries(selectedBatchId);
  const replyMutation = useReplyToQuery();

  const handleSendReply = (queryId: string) => {
    const text = (replyText[queryId] ?? '').trim();
    if (!text || text.length < 2) {
      Alert.alert('Validation Error', 'Reply must be at least 2 characters.');
      return;
    }
    replyMutation.mutate(
      { queryId, body: text },
      {
        onSuccess: () => {
          Alert.alert('Success', 'Answer posted to student.');
          setReplyText((prev) => ({ ...prev, [queryId]: '' }));
          setActiveReplyId(null);
        },
        onError: (err) => Alert.alert('Error', errorMessage(err)),
      }
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <BatchPicker
        value={selectedBatchId}
        onChange={setSelectedBatchId}
        showAllOption
        allLabel="All Enrolled Batches"
      />

      <QueryBoundary
        query={query}
        isEmpty={(data) => data.length === 0}
        emptyTitle="No Academic Doubts"
        emptyDescription="When students ask questions about topics or lectures, they will appear here."
      >
        {(queries) => (
          <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
            {queries.map((q: any) => {
              const isAnswered = q.status === 'ANSWERED';
              const isReplying = activeReplyId === q.id;

              return (
                <Card key={q.id} style={{ padding: spacing.md }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flex: 1, marginRight: spacing.sm }}>
                      <Subtitle numberOfLines={1}>{q.subject || q.title || 'Student Doubt'}</Subtitle>
                      <Caption>{`${q.student?.fullName || 'Student'} · ${q.batch?.name || 'General'}`}</Caption>
                    </View>
                    <Badge
                      label={isAnswered ? 'Answered' : 'Pending'}
                      variant={isAnswered ? 'success' : 'warning'}
                    />
                  </View>

                  <Body style={{ marginTop: spacing.sm, color: colors.textPrimary }}>
                    {q.body || q.content || q.question}
                  </Body>

                  {q.replies && q.replies.length > 0 && (
                    <View style={{ marginTop: spacing.sm, paddingLeft: spacing.sm, borderLeftWidth: 2, borderLeftColor: colors.primary }}>
                      {q.replies.map((r: any) => (
                        <View key={r.id} style={{ marginTop: 4 }}>
                          <Caption style={{ fontWeight: '600' }}>Faculty Response:</Caption>
                          <Body style={{ fontSize: 13, color: colors.textSecondary }}>{r.body}</Body>
                          <Caption style={{ fontSize: 11 }}>{formatDate(r.createdAt)}</Caption>
                        </View>
                      ))}
                    </View>
                  )}

                  <View style={{ marginTop: spacing.md, flexDirection: 'row', gap: spacing.sm }}>
                    {!isReplying ? (
                      <Button
                        title={isAnswered ? 'Add Another Reply' : 'Answer Question'}
                        size="sm"
                        variant={isAnswered ? 'outline' : 'primary'}
                        onPress={() => setActiveReplyId(q.id)}
                      />
                    ) : (
                      <View style={{ flex: 1, gap: spacing.xs }}>
                        <Input
                          placeholder="Type your explanation or answer..."
                          value={replyText[q.id] ?? ''}
                          onChangeText={(txt) => setReplyText((prev) => ({ ...prev, [q.id]: txt }))}
                          multiline
                        />
                        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                          <Button
                            title="Post Answer"
                            size="sm"
                            loading={replyMutation.isPending}
                            onPress={() => handleSendReply(q.id)}
                          />
                          <Button
                            title="Cancel"
                            size="sm"
                            variant="ghost"
                            onPress={() => setActiveReplyId(null)}
                          />
                        </View>
                      </View>
                    )}
                  </View>
                </Card>
              );
            })}
          </View>
        )}
      </QueryBoundary>
    </View>
  );
};
