// src/pages/deliver/mainDeliver/home/components/ChatSheet.tsx

import React, { useRef, useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  FlatList, TextInput, KeyboardAvoidingView, Platform, Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ChatMessage } from '../hooks/useDeliverFlow';

interface Props {
  visible: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onSend: (text: string) => void;
  clientName: string;
}

function formatTime(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export function ChatSheet({ visible, onClose, messages, onSend, clientName }: Props) {
  const [text, setText] = useState('');
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  const handleSend = () => {
    if (!text.trim()) return;
    onSend(text.trim());
    setText('');
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    if (!item || !item.id) return null;
    const isDeliver = item.sender === 'deliver';
    const isSystem = item.id.startsWith('sys_');

    if (isSystem) {
      return (
        <View style={s.systemMsgWrap}>
          <Text style={s.systemMsg}>{item.text}</Text>
        </View>
      );
    }

    return (
      <View style={[s.msgRow, isDeliver && s.msgRowRight]}>
        {!isDeliver && (
          <View style={s.msgAvatar}>
            <Ionicons name="person" size={14} color="#9CA3AF" />
          </View>
        )}
        <View style={[s.bubble, isDeliver ? s.bubbleDeliver : s.bubbleClient]}>
          <Text style={[s.bubbleText, isDeliver && s.bubbleTextDeliver]}>{item.text}</Text>
          <Text style={[s.bubbleTime, isDeliver && s.bubbleTimeDeliver]}>
            {formatTime(item.timestamp)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={s.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={onClose}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={s.headerCenter}>
            <View style={s.headerAvatar}>
              <Ionicons name="person" size={18} color="#CB1D00" />
            </View>
            <View>
              <Text style={s.headerName}>{clientName}</Text>
              <View style={s.onlineRow}>
                <View style={s.onlineDot} />
                <Text style={s.onlineText}>Online</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity style={s.callBtn}>
            <Ionicons name="call-outline" size={18} color="#2D60FF" />
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={m => m?.id ?? `msg_${Math.random()}`}
          renderItem={renderMessage}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        />

        {/* Input */}
        <View style={s.inputRow}>
          <TextInput
            style={s.input}
            value={text}
            onChangeText={setText}
            placeholder="Escreve uma mensagem..."
            placeholderTextColor="#6B7280"
            multiline
            maxLength={300}
            returnKeyType="send"
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity
            style={[s.sendBtn, !text.trim() && s.sendBtnOff]}
            onPress={handleSend}
            disabled={!text.trim()}
          >
            <Ionicons name="send" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F13',
    paddingTop: Platform.OS === 'ios' ? 50 : 32,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: '#ffffff08',
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#1E2A35', alignItems: 'center', justifyContent: 'center',
  },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#CB1D0015', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#CB1D0030',
  },
  headerName: { fontSize: 15, color: '#fff', fontFamily: 'Poppins_600SemiBold' },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 1 },
  onlineDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#4ade80' },
  onlineText: { fontSize: 11, color: '#4ade80', fontFamily: 'Poppins_400Regular' },
  callBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#2D60FF15', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#2D60FF30',
  },

  list: { padding: 16, gap: 10, paddingBottom: 12 },

  systemMsgWrap: { alignItems: 'center', paddingVertical: 8 },
  systemMsg: {
    fontSize: 11, color: '#6B7280', fontFamily: 'Poppins_400Regular',
    textAlign: 'center', paddingHorizontal: 32,
    backgroundColor: '#1E2A35', borderRadius: 12,
    /*paddingHorizontal: 16*/ paddingVertical: 6,
  },

  msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, maxWidth: '80%' },
  msgRowRight: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
  msgAvatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#1E2A35', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },

  bubble: { borderRadius: 18, padding: 12, maxWidth: '100%' },
  bubbleClient: {
    backgroundColor: '#1E2A35',
    borderBottomLeftRadius: 4,
  },
  bubbleDeliver: {
    backgroundColor: '#2D60FF',
    borderBottomRightRadius: 4,
  },
  bubbleText: { fontSize: 14, color: '#E2E8F0', fontFamily: 'Poppins_400Regular', lineHeight: 20 },
  bubbleTextDeliver: { color: '#fff' },
  bubbleTime: { fontSize: 10, color: '#6B7280', fontFamily: 'Poppins_400Regular', marginTop: 4, textAlign: 'right' },
  bubbleTimeDeliver: { color: '#ffffff60' },

  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: '#ffffff08',
    backgroundColor: '#0B0F13',
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
  },
  input: {
    flex: 1, backgroundColor: '#1E2A35', borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 10,
    color: '#fff', fontFamily: 'Poppins_400Regular', fontSize: 14,
    maxHeight: 100, borderWidth: 1, borderColor: '#ffffff0D',
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#2D60FF', alignItems: 'center', justifyContent: 'center',
  },
  sendBtnOff: { backgroundColor: '#2D60FF50' },
});
