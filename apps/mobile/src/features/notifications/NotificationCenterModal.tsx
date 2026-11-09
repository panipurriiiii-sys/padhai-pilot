import React, { useState, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Icon } from '../../components/common/Icon';
import { apiClient } from '../../services/api/client';
import type { InAppNotification, NotificationCategory } from '@padhai-pilot/shared';

interface NotificationCenterModalProps {
  visible: boolean;
  onClose: () => void;
  onNavigateTab?: (tab: string) => void;
}

const CATEGORIES: Array<{ key: NotificationCategory; label: string }> = [
  { key: 'ALL', label: 'All' },
  { key: 'ACADEMICS', label: 'Academics' },
  { key: 'FEES', label: 'Fees' },
  { key: 'NOTICES', label: 'Notices' },
  { key: 'LEAVES', label: 'Leaves' },
];

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  visible,
  onClose,
  onNavigateTab,
}) => {
  const { colors } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<NotificationCategory>('ALL');
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (visible) {
      loadNotifications();
    }
  }, [visible]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<{ items: InAppNotification[] }>('/notifications');
      setNotifications(res?.items || []);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await apiClient.put(`/notifications/${id}/read`, {});
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
    } catch {
      // safe fallback
    }
  };

  const markAllRead = async () => {
    try {
      await apiClient.put('/notifications/read-all', {});
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // safe fallback
    }
  };

  const filteredItems = useMemo(() => {
    if (selectedCategory === 'ALL') return notifications;
    return notifications.filter((n) => {
      const cat = n.category || inferCategory(n.type);
      return cat === selectedCategory;
    });
  }, [notifications, selectedCategory]);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  const handleActionPress = (link?: string) => {
    if (!link) return;
    onClose();
    if (onNavigateTab) {
      const tab = link.replace(/^\//, '').toLowerCase();
      onNavigateTab(tab);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.paper, borderColor: colors.border }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerTitleRow}>
              <Icon name="bell" size={20} color={colors.brand} />
              <Text style={[styles.title, { color: colors.ink }]}>Notifications</Text>
              {unreadCount > 0 && (
                <View style={[styles.badge, { backgroundColor: colors.brand }]}>
                  <Text style={styles.badgeText}>{unreadCount}</Text>
                </View>
              )}
            </View>
            <View style={styles.headerActionRow}>
              {unreadCount > 0 && (
                <TouchableOpacity onPress={markAllRead} style={styles.markAllBtn}>
                  <Text style={[styles.markAllText, { color: colors.brand }]}>Mark all read</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Icon name="x" size={20} color={colors.inkMuted} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Category Tabs */}
          <View style={[styles.categoryRow, { borderBottomColor: colors.border }]}>
            {CATEGORIES.map((cat) => {
              const active = selectedCategory === cat.key;
              return (
                <TouchableOpacity
                  key={cat.key}
                  onPress={() => setSelectedCategory(cat.key)}
                  style={[
                    styles.categoryPill,
                    {
                      backgroundColor: active ? colors.brand : colors.paperWarm,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      { color: active ? '#ffffff' : colors.inkMuted },
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Body List */}
          {loading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator color={colors.brand} />
            </View>
          ) : filteredItems.length === 0 ? (
            <View style={styles.centerContainer}>
              <Icon name="check" size={32} color={colors.inkMuted} />
              <Text style={[styles.emptyTitle, { color: colors.inkMuted }]}>
                No notifications in {selectedCategory.toLowerCase()}
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.inkMuted }]}>
                You are all caught up!
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredItems}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => {
                const isUnread = !item.isRead;
                return (
                  <View
                    style={[
                      styles.card,
                      {
                        backgroundColor: isUnread ? colors.paperWarm : colors.paper,
                        borderColor: isUnread ? colors.brand : colors.border,
                      },
                    ]}
                  >
                    <View style={styles.cardHeader}>
                      <Text style={[styles.typeText, { color: colors.brand }]}>
                        {item.type.replace(/_/g, ' ')}
                      </Text>
                      {isUnread && (
                        <TouchableOpacity onPress={() => markAsRead(item.id)}>
                          <View style={[styles.unreadDot, { backgroundColor: colors.brand }]} />
                        </TouchableOpacity>
                      )}
                    </View>
                    <Text style={[styles.cardTitle, { color: colors.ink }]}>{item.title}</Text>
                    <Text style={[styles.cardMessage, { color: colors.inkMuted }]}>
                      {item.message}
                    </Text>

                    {item.link ? (
                      <TouchableOpacity
                        onPress={() => handleActionPress(item.link)}
                        style={[styles.actionBtn, { backgroundColor: colors.brand }]}
                      >
                        <Text style={styles.actionBtnText}>Open in App</Text>
                        <Icon name="arrowRight" size={12} color="#ffffff" />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                );
              }}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

function inferCategory(type: string): NotificationCategory {
  const upper = type.toUpperCase();
  if (upper.includes('ATTENDANCE')) return 'ATTENDANCE';
  if (upper.includes('RESULT') || upper.includes('QUIZ') || upper.includes('TEST') || upper.includes('HOMEWORK')) return 'ACADEMICS';
  if (upper.includes('FEE') || upper.includes('PAYMENT') || upper.includes('SALARY')) return 'FEES';
  if (upper.includes('LEAVE')) return 'LEAVES';
  if (upper.includes('ANNOUNCEMENT') || upper.includes('BROADCAST')) return 'NOTICES';
  return 'GENERAL';
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    height: '80%',
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  headerActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  markAllBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  markAllText: {
    fontSize: 12,
    fontWeight: '600',
  },
  closeBtn: {
    padding: 4,
  },
  categoryRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
  },
  categoryPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 12,
    marginTop: 4,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  card: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  cardMessage: {
    fontSize: 12,
    lineHeight: 18,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 6,
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
});

