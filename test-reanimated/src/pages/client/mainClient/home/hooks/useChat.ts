/**
 * src/pages/client/mainClient/home/hooks/useChat.ts
 *
 * Hook dedicado ao chat em tempo real entre o cliente e o motoqueiro.
 *
 * Responsabilidades:
 *   - Manter a lista de mensagens (estado local + sincronizado via socket)
 *   - Enviar mensagens via socket
 *   - Marcar mensagens como lidas
 *   - Indicador de "a escrever..." do motoqueiro
 *   - Mensagens automáticas do sistema (ex: pausa do motoqueiro)
 *   - Persistência da sessão via react-query (evita perda de dados ao navegar)
 *
 * DEPENDÊNCIAS:
 *   npx expo install @tanstack/react-query
 *   (socket em src/services/socket.ts)
 *
 * BACK-END — socket events:
 *   Emitir:   'chat:send'      → ChatMessage
 *             'chat:read'      → { pedidoId, messageIds: string[] }
 *             'chat:typing'    → { pedidoId, isTyping: boolean }
 *   Receber:  'chat:received'  → ChatMessage
 *             'chat:typing'    → { isTyping: boolean }
 *             'chat:read'      → { messageIds: string[] }
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../../../../components/modules/services/api/api';
import { getSocket, getSocketSync, releaseSocket } from '../../../../../components/modules/services/socket';
import type { ChatMessage } from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────────────────────────────────────

export interface UseChatReturn {
  /** Lista de mensagens ordenadas por timestamp (crescente). */
  messages: ChatMessage[];
  /** Número de mensagens não lidas do motoqueiro. */
  unreadCount: number;
  /** O motoqueiro está a escrever? */
  motoIsTyping: boolean;
  /** A carregar histórico inicial? */
  loading: boolean;
  /** Enviar mensagem de texto. */
  sendMessage: (text: string) => void;
  /** Marcar todas as mensagens recebidas como lidas. */
  markAllRead: () => void;
  /** Adicionar mensagem de sistema (ex: pausa, retoma). */
  addSystemMessage: (text: string) => void;
  /** Limpar todas as mensagens (ao terminar o pedido). */
  clearMessages: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Chave de cache react-query
// ─────────────────────────────────────────────────────────────────────────────

const chatKey = (pedidoId: string) => ['chat', pedidoId];

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export function useChat(
  pedidoId: string | null,
  clienteId: string = 'cliente'
): UseChatReturn {
  const queryClient = useQueryClient();

  // ── Estado local ──────────────────────────────────────────────────────────
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [motoIsTyping, setMotoIsTyping] = useState(false);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Carregar histórico de mensagens do servidor ───────────────────────────
  const { data: queryData, isLoading: loading } = useQuery<ChatMessage[]>({
    queryKey: chatKey(pedidoId ?? ''),
    queryFn: async () => {
      if (!pedidoId) return [];
      try {
        const { data } = await api.get<ChatMessage[]>(`/chat/${pedidoId}`);
        return data;
      } catch {
        return [];
      }
    },
    enabled: !!pedidoId,
    staleTime: Infinity,       // Não refaz a query automaticamente (socket trata disso)
  });

  // Reagir a dados da query
  useEffect(() => {
    if (queryData) setMessages(queryData);
  }, [queryData]);

  // ─── Socket: subscrever eventos quando há um pedido activo ────────────────
  useEffect(() => {
    if (!pedidoId) return;

    let socketRef: any = null;

    const setup = async () => {
      try {
        const socket = await getSocket();
        socketRef = socket;

        socket.emit('order:join', { pedidoId });

        socket.on('chat:received', (msg: ChatMessage) => {
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
          queryClient.setQueryData<ChatMessage[]>(chatKey(pedidoId), (old = []) =>
            old.some((m) => m.id === msg.id) ? old : [...old, msg]
          );
        });

        socket.on('chat:typing', ({ isTyping }: { isTyping: boolean }) => {
          setMotoIsTyping(isTyping);
          if (isTyping) {
            if (typingTimer.current) clearTimeout(typingTimer.current);
            typingTimer.current = setTimeout(() => setMotoIsTyping(false), 4000);
          }
        });

        socket.on('chat:read', ({ messageIds }: { messageIds: string[] }) => {
          setMessages((prev) =>
            prev.map((m) => (messageIds.includes(m.id) ? { ...m, read: true } : m))
          );
        });
      } catch (e) {
        console.warn('[useChat] Socket setup failed');
      }
    };

    setup();

    return () => {
      if (socketRef) {
        socketRef.off('chat:received');
        socketRef.off('chat:typing');
        socketRef.off('chat:read');
        releaseSocket();
      }
    };
  }, [pedidoId, queryClient]);

  // ─── Enviar mensagem ──────────────────────────────────────────────────────
  const sendMessage = useCallback((text: string) => {
    if (!text.trim() || !pedidoId) return;

    const msg: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      pedidoId,
      senderId: clienteId,
      senderType: 'cliente',
      text: text.trim(),
      timestamp: new Date().toISOString(),
      read: false,
    };

    // Actualiza estado local imediatamente (optimistic update)
    setMessages((prev) => [...prev, msg]);

    // Actualiza o cache react-query (persiste se o utilizador navegar e voltar)
    queryClient.setQueryData<ChatMessage[]>(chatKey(pedidoId), (old = []) => [
      ...old,
      msg,
    ]);

    const socket = getSocketSync();
    if (socket) {
      socket.emit('chat:send', msg);
    }
  }, [pedidoId, clienteId, queryClient]);

  // ─── Marcar como lidas ────────────────────────────────────────────────────
  const markAllRead = useCallback(() => {
    if (!pedidoId) return;

    const unreadIds = messages
      .filter((m) => m.senderType === 'motoqueiro' && !m.read)
      .map((m) => m.id);

    if (unreadIds.length === 0) return;

    setMessages((prev) =>
      prev.map((m) =>
        unreadIds.includes(m.id) ? { ...m, read: true } : m
      )
    );

    const socket = getSocketSync();
    if (socket) {
      socket.emit('chat:read', { pedidoId, messageIds: unreadIds });
    }
  }, [messages, pedidoId]);

  // ─── Mensagem de sistema ──────────────────────────────────────────────────
  const addSystemMessage = useCallback((text: string) => {
    if (!pedidoId) return;
    const msg: ChatMessage = {
      id: `sys_${Date.now()}`,
      pedidoId,
      senderId: 'sistema',
      senderType: 'motoqueiro', // aparece no lado esquerdo (como se fosse do motoqueiro/sistema)
      text: `ℹ️ ${text}`,
      timestamp: new Date().toISOString(),
      read: true,
    };
    setMessages((prev) => [...prev, msg]);
    queryClient.setQueryData<ChatMessage[]>(chatKey(pedidoId), (old = []) => [
      ...old,
      msg,
    ]);
  }, [pedidoId, queryClient]);

  // ─── Limpar (ao terminar o pedido) ───────────────────────────────────────
  const clearMessages = useCallback(() => {
    setMessages([]);
    if (pedidoId) {
      queryClient.removeQueries({ queryKey: chatKey(pedidoId) });
    }
  }, [pedidoId, queryClient]);

  // ─── Contagem de não lidas ────────────────────────────────────────────────
  const unreadCount = messages.filter(
    (m) => m.senderType === 'motoqueiro' && !m.read
  ).length;

  // ─── Cleanup ──────────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (typingTimer.current) clearTimeout(typingTimer.current);
    };
  }, []);

  return {
    messages,
    unreadCount,
    motoIsTyping,
    loading,
    sendMessage,
    markAllRead,
    addSystemMessage,
    clearMessages,
  };
}
