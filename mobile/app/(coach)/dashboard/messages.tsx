import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Colors } from '@/theme/colors';
import LoadingScreen from '@/components/LoadingScreen';
import Avatar from '@/components/Avatar';
import Button from '@/components/Button';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import type { CoachMessageThread, Message, Athlete, Coach } from '@/lib/types';
import { formatDistanceToNow, parseISO } from 'date-fns';

export default function CoachMessagesTab() {
  const { user, role } = useAuth();
  const coach = role === 'coach' ? (user as Coach) : null;
  const queryClient = useQueryClient();

  const [activeChatAthlete, setActiveChatAthlete] = useState<Athlete | null>(null);
  const [newMessage, setNewMessage] = useState('');

  const { data: threads, isLoading } = useQuery<CoachMessageThread[]>({
    queryKey: ['/api/coaches', coach?.id, 'messages'],
    queryFn: () => api.get<CoachMessageThread[]>(`/api/coaches/${coach?.id}/messages`),
    enabled: !!coach?.id,
    refetchInterval: 10_000,
  });

  const { data: chatMessages = [] } = useQuery<Message[]>({
    queryKey: ['/api/messages', activeChatAthlete?.id, coach?.id],
    queryFn: () => api.get<Message[]>(`/api/messages/${activeChatAthlete?.id}/${coach?.id}`),
    enabled: !!activeChatAthlete?.id && !!coach?.id,
    refetchInterval: 5_000,
  });

  const sendMutation = useMutation({
    mutationFn: (msg: string) => api.post('/api/messages', {
      athleteId: activeChatAthlete?.id,
      coachId: coach?.id,
      message: msg,
      senderType: 'coach',
    }),
    onSuccess: () => {
      setNewMessage('');
      queryClient.invalidateQueries({ queryKey: ['/api/messages', activeChatAthlete?.id, coach?.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/coaches', coach?.id, 'messages'] });
    },
  });

  if (isLoading) return <LoadingScreen message="Loading messages..." />;

  const formatTime = (dateStr: string) => {
    try { return formatDistanceToNow(parseISO(dateStr), { addSuffix: true }); } catch { return ''; }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Messages</Text>
      </View>

      <FlatList
        data={threads || []}
        keyExtractor={item => item.athlete.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.threadItem}
            onPress={() => setActiveChatAthlete(item.athlete)}
            activeOpacity={0.7}
          >
            <Avatar name={item.athlete.name} imageUri={item.athlete.profileImage} size={52} />
            <View style={styles.threadContent}>
              <View style={styles.threadHeader}>
                <Text style={styles.threadName}>{item.athlete.name}</Text>
                <Text style={styles.threadTime}>{formatTime(item.lastMessage.createdAt)}</Text>
              </View>
              <View style={styles.threadPreview}>
                <Text style={styles.threadPreviewText} numberOfLines={1}>
                  {item.lastMessage.senderType === 'coach' ? 'You: ' : ''}
                  {item.lastMessage.message}
                </Text>
                {item.unreadCount > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadCount}>{item.unreadCount}</Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="chatbubble-outline" size={48} color={Colors.border} />
            <Text style={styles.emptyTitle}>No messages yet</Text>
            <Text style={styles.emptyDesc}>Athletes will message you when they're interested in your coaching</Text>
          </View>
        }
      />

      <Modal visible={!!activeChatAthlete} animationType="slide" presentationStyle="pageSheet">
        {activeChatAthlete && (
          <SafeAreaView style={styles.chatContainer}>
            <View style={styles.chatHeader}>
              <View style={styles.chatHeaderInfo}>
                <Avatar name={activeChatAthlete.name} imageUri={activeChatAthlete.profileImage} size={36} />
                <View>
                  <Text style={styles.chatAthleteName}>{activeChatAthlete.name}</Text>
                  <Text style={styles.chatAthleteSport}>{activeChatAthlete.sport}</Text>
                </View>
              </View>
              <Button title="Close" variant="ghost" size="sm" onPress={() => setActiveChatAthlete(null)} />
            </View>

            <ScrollView
              contentContainerStyle={styles.chatMessages}
              ref={ref => { if (ref && chatMessages.length > 0) ref.scrollToEnd({ animated: false }); }}
            >
              {chatMessages.length === 0 ? (
                <View style={styles.chatEmpty}>
                  <Text style={styles.chatEmptyText}>No messages yet</Text>
                </View>
              ) : chatMessages.map(m => {
                const isOwn = m.senderType === 'coach';
                return (
                  <View key={m.id} style={[styles.msgWrapper, isOwn ? styles.msgOwn : styles.msgOther]}>
                    <View style={[styles.msgBubble, isOwn ? styles.msgBubbleOwn : styles.msgBubbleOther]}>
                      <Text style={[styles.msgText, isOwn ? styles.msgTextOwn : styles.msgTextOther]}>
                        {m.message}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </ScrollView>

            <View style={styles.chatInputRow}>
              <TextInput
                style={styles.chatInput}
                value={newMessage}
                onChangeText={setNewMessage}
                placeholder="Type a message..."
                placeholderTextColor={Colors.textTertiary}
                multiline
                maxLength={500}
              />
              <Button
                title="Send"
                size="sm"
                onPress={() => { if (newMessage.trim()) sendMutation.mutate(newMessage.trim()); }}
                loading={sendMutation.isPending}
                disabled={!newMessage.trim()}
              />
            </View>
          </SafeAreaView>
        )}
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  pageTitle: { fontSize: 28, fontWeight: '800', color: Colors.text },
  list: { paddingBottom: 32, flexGrow: 1 },
  threadItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  threadContent: { flex: 1, gap: 4 },
  threadHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  threadName: { fontSize: 16, fontWeight: '600', color: Colors.text },
  threadTime: { fontSize: 12, color: Colors.textTertiary },
  threadPreview: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  threadPreviewText: { flex: 1, fontSize: 14, color: Colors.textSecondary },
  unreadBadge: { minWidth: 20, height: 20, borderRadius: 10, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  unreadCount: { fontSize: 11, fontWeight: '700', color: '#fff' },
  separator: { height: 1, backgroundColor: Colors.border, marginLeft: 80 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: Colors.text },
  emptyDesc: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  chatContainer: { flex: 1, backgroundColor: Colors.background },
  chatHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  chatHeaderInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  chatAthleteName: { fontSize: 16, fontWeight: '700', color: Colors.text },
  chatAthleteSport: { fontSize: 12, color: Colors.textSecondary },
  chatMessages: { paddingHorizontal: 16, paddingVertical: 16, gap: 8, flexGrow: 1, minHeight: 200 },
  chatEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 40 },
  chatEmptyText: { fontSize: 14, color: Colors.textTertiary },
  msgWrapper: { maxWidth: '80%' },
  msgOwn: { alignSelf: 'flex-end' },
  msgOther: { alignSelf: 'flex-start' },
  msgBubble: { borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  msgBubbleOwn: { backgroundColor: Colors.primary },
  msgBubbleOther: { backgroundColor: Colors.surfaceSecondary },
  msgText: { fontSize: 15, lineHeight: 20 },
  msgTextOwn: { color: '#fff' },
  msgTextOther: { color: Colors.text },
  chatInputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.surface },
  chatInput: { flex: 1, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, maxHeight: 100, fontSize: 15, color: Colors.text, backgroundColor: Colors.surface },
});
