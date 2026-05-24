import { useCallback, useEffect, useRef, useState } from 'react';
import { getSocket, releaseSocket, getSocketSync } from '../components/modules/services/socket';
import type { Socket } from 'socket.io-client';

interface ToastData {
  titulo: string;
  mensagem: string;
  tipo: 'pedido' | 'status' | 'info';
}

export function useRealtimeNotifications() {
  const [toast, setToast] = useState<ToastData | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const showToast = useCallback((data: ToastData) => {
    setToast(data);
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  useEffect(() => {
    let mounted = true;

    getSocket().then((socket) => {
      if (!mounted) {
        releaseSocket();
        return;
      }
      socketRef.current = socket;

      const onOrderNew = (data: any) => {
        showToast({
          titulo: 'Novo Pedido!',
          mensagem: data.descricao || 'Um novo pedido está disponível para aceitar.',
          tipo: 'pedido',
        });
      };

      const onStatusUpdate = (data: any) => {
        const statusMessages: Record<string, string> = {
          motoqueiro_atribuido: 'Um motoqueiro aceitou o seu pedido!',
          a_caminho_recolha: 'O motoqueiro está a caminho da recolha.',
          recolhido: 'O pedido foi recolhido!',
          entregando: 'O pedido está a ser entregue.',
          entregue: 'O pedido foi entregue com sucesso!',
          cancelado: 'O pedido foi cancelado.',
        };
        showToast({
          titulo: 'Actualização do Pedido',
          mensagem: statusMessages[data.status] || `Status: ${data.status}`,
          tipo: 'status',
        });
      };

      const onOrderCancelled = () => {
        showToast({
          titulo: 'Pedido Cancelado',
          mensagem: 'O pedido foi cancelado pelo cliente.',
          tipo: 'info',
        });
      };

      const onNotification = (data: any) => {
        showToast({
          titulo: data.titulo || 'Nova Notificação',
          mensagem: data.mensagem || '',
          tipo: 'info',
        });
      };

      socket.on('order:new', onOrderNew);
      socket.on('order:status_update', onStatusUpdate);
      socket.on('order:cancelled', onOrderCancelled);
      socket.on('notification:new', onNotification);

      // Store cleanup functions
      (socketRef.current as any).__cleanupFns = () => {
        socket.off('order:new', onOrderNew);
        socket.off('order:status_update', onStatusUpdate);
        socket.off('order:cancelled', onOrderCancelled);
        socket.off('notification:new', onNotification);
      };
    });

    return () => {
      mounted = false;
      const s = socketRef.current;
      if (s && (s as any).__cleanupFns) {
        (s as any).__cleanupFns();
      }
      releaseSocket();
    };
  }, []); // Empty deps - only run once on mount

  return { toast, hideToast };
}
