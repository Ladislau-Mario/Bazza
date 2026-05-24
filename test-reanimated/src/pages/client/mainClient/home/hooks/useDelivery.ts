/**
 * src/pages/client/mainClient/home/hooks/useDelivery.ts
 *
 * Hook central — usa a API real do backend (Bazza).
 *   POST   /pedidos                    → criar pedido
 *   GET    /pedidos/:id                → polling de status
 *   PATCH  /pedidos/:id/cancelar       → cancelar
 *   PATCH  /pedidos/:id/confirmar-entrega → confirmar com código
 *   POST   /pedidos/:id/avaliar        → avaliar
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import api from '../../../../../components/modules/services/api/api';
import { getSocket, releaseSocket } from '../../../../../components/modules/services/socket';
import type { DeliveryOrder, DeliveryStatus, CreateOrderPayload, Motoqueiro, LocationCoords } from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// Utilitários
// ─────────────────────────────────────────────────────────────────────────────

export function calcDistance(a: LocationCoords, b: LocationCoords): number {
  const R = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.latitude * Math.PI) / 180) *
      Math.cos((b.latitude * Math.PI) / 180) *
      Math.sin(((b.longitude - a.longitude) * Math.PI / 180) / 2) ** 2;
  return parseFloat((R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))).toFixed(2));
}

function normalizeNumber(value: any, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizePeso(value: string): string {
  const normalized = value?.toLowerCase?.() || 'normal';
  if (normalized.includes('pes')) return 'pesado';
  if (normalized.includes('lev')) return 'leve';
  return 'normal';
}

function normalizeTipoPagamento(value: string): 'numerario' | 'carteira' | 'stripe' {
  const normalized = value?.toLowerCase?.() || '';
  if (normalized.includes('carteira')) return 'carteira';
  if (normalized.includes('stripe') || normalized.includes('cart')) return 'stripe';
  return 'numerario';
}

function normalizePedido(pedido: any, fallback?: Partial<DeliveryOrder>): DeliveryOrder {
  const distanciaKm = normalizeNumber(pedido?.distanciaKm, normalizeNumber((fallback as any)?.distanciaKm));
  const valorEntrega = normalizeNumber(pedido?.valorEntrega ?? pedido?.precoFinal ?? pedido?.precoBase, normalizeNumber((fallback as any)?.precoFinal));

  // Mapear relação motoqueiro aninhada para formato flat
  let motoqueiro = pedido?.motoqueiro;
  if (motoqueiro && typeof motoqueiro === 'object' && motoqueiro.user) {
    motoqueiro = {
      id: motoqueiro.id || motoqueiro.user?.id || '',
      nome: motoqueiro.user?.nome || motoqueiro.nome || '',
      telefone: motoqueiro.user?.telefone || motoqueiro.telefone || '',
      fotoPerfil: motoqueiro.user?.fotoPerfilUrl || motoqueiro.fotoPerfil || '',
      rating: normalizeNumber(motoqueiro.classificacaoMedia, normalizeNumber(motoqueiro.rating)),
      totalAvaliacoes: normalizeNumber(motoqueiro.totalAvaliacoes),
    };
  }

  return {
    ...(fallback as DeliveryOrder),
    ...pedido,
    id: String(pedido?.id ?? pedido?._id ?? fallback?.id ?? ''),
    distanciaKm,
    precoBase: normalizeNumber(pedido?.precoBase, valorEntrega),
    precoFinal: normalizeNumber(pedido?.precoFinal, valorEntrega),
    valorEntrega,
    codigoQr: pedido?.codigoQr ?? fallback?.codigoQr ?? '',
    codigoNumerico: pedido?.codigoNumerico ?? fallback?.codigoNumerico ?? '',
    motoqueiro: motoqueiro || (fallback as any)?.motoqueiro,
  } as DeliveryOrder;
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export function useDelivery() {
  // ── Estado ────────────────────────────────────────────────────────────────
  const [activeOrder, setActiveOrder] = useState<DeliveryOrder | null>(null);
  const [deliveryStatus, setDeliveryStatus] = useState<DeliveryStatus>('idle');
  const [searching, setSearching] = useState(false);
  const [priceAdjustment, _setPriceAdjustment] = useState(0);
  const [priceAdjusted, setPriceAdjusted] = useState(false);
  const [codigoEntrega, setCodigoEntrega] = useState<string | null>(null);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const socketRef = useRef<any>(null);

  const setPriceAdjustment = useCallback((fn: (prev: number) => number) => {
    _setPriceAdjustment((prev) => fn(prev));
  }, []);

  // ── Polling de status do pedido ───────────────────────────────────────────
  const startPolling = useCallback((pedidoId: string) => {
    stopPolling();
    pollingRef.current = setInterval(async () => {
      try {
        const res = await api.get(`/pedidos/${pedidoId}`);
        const p = res.data;
        if (!p) return;

        // Mapear status do backend para status do mobile
        const status = p.status as DeliveryStatus;
        const normalized = normalizePedido(p);
        setActiveOrder((prev) => prev ? { ...prev, ...normalized } : normalized as any);
        setDeliveryStatus(status);

        // Buscar dados do motoqueiro se atribuído
        if (p.motoqueiro && (status === 'motoqueiro_atribuido' || status === 'a_caminho_recolha' || status === 'recolhido' || status === 'entregando')) {
          setSearching(false);
        }

        // Se entregue, parar polling
        if (status === 'entregue' || status === 'cancelado') {
          stopPolling();
        }
      } catch (e) {
        // Silencioso — continuará no próximo tick
      }
    }, 4000); // Poll a cada 4 segundos
  }, []);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  // ── Socket: escutar atualizações do pedido ────────────────────────────────
  useEffect(() => {
    if (!activeOrder?.id) return;

    let mounted = true;

    const setupSocket = async () => {
      try {
        const socket = await getSocket();
        if (!mounted) return;
        socketRef.current = socket;

        socket.emit('order:join', { pedidoId: activeOrder.id });

        socket.on('order:status_update', (data: any) => {
          const { status, motoqueiro: motoqueiroSocket } = data;
          setDeliveryStatus(status);

          // Atualizar activeOrder sem sobrescrever motoqueiro com string UUID
          setActiveOrder(prev => {
            if (!prev) return prev;
            const update: any = { ...data };
            delete update.motoqueiroId;
            if (motoqueiroSocket && typeof motoqueiroSocket === 'object') {
              update.motoqueiro = motoqueiroSocket;
            } else {
              delete update.motoqueiro;
            }
            return { ...prev, ...update };
          });

          if (motoqueiroSocket || status === 'motoqueiro_atribuido' || status === 'a_caminho_recolha') {
            setSearching(false);
          }
          if (status === 'entregue' || status === 'cancelado') {
            stopPolling();
          }
        });

      } catch (e: any) {
        console.warn('[useDelivery] Socket setup failed, relying on polling:', e?.message);
      }
    };

    setupSocket();

    return () => {
      mounted = false;
      if (socketRef.current) {
        socketRef.current.off('order:status_update');
        socketRef.current = null;
      }
      releaseSocket();
    };
  }, [activeOrder?.id, stopPolling]);

  // ── Cleanup ───────────────────────────────────────────────────────────────
  useEffect(() => {
    return () => { stopPolling(); };
  }, [stopPolling]);

  // ─────────────────────────────────────────────────────────────────────────
  // CRIAR PEDIDO — POST /pedidos
  // ─────────────────────────────────────────────────────────────────────────

  const confirmOrder = useCallback(async (payload: CreateOrderPayload) => {
    try {
      const distanciaKm = calcDistance(payload.origemCoords, payload.destinoCoords);
      const res = await api.post('/pedidos', {
        origemLatitude: payload.origemCoords.latitude,
        origemLongitude: payload.origemCoords.longitude,
        origemEndereco: payload.origemEndereco,
        destinoLatitude: payload.destinoCoords.latitude,
        destinoLongitude: payload.destinoCoords.longitude,
        destinoEndereco: payload.destinoEndereco,
        tipo: payload.tipoEncomenda,
        peso: normalizePeso(payload.peso),
        descricaoEncomenda: payload.observacoes || payload.tipoEncomenda,
        notas: payload.observacoes || '',
        tipoPagamento: normalizeTipoPagamento(payload.metodoPagamento),
        metodoPagamento: payload.metodoPagamento,
        distanciaKm,
      });

      const pedido = res.data;
      console.log('[confirmOrder] Pedido criado:', pedido);

      const pedidoId = pedido.id || pedido._id;
      if (!pedidoId) {
        Alert.alert('Erro', 'O servidor não retornou o ID do pedido.');
        return;
      }

      const normalizedPedido = normalizePedido(pedido, {
        ...payload,
        distanciaKm,
        precoBase: payload.precoFinal,
        precoFinal: payload.precoFinal,
      } as any);
      setActiveOrder({ ...normalizedPedido, id: pedidoId });
      setDeliveryStatus('a_procurar_motoqueiro');
      setSearching(true);

      // Iniciar polling para encontrar motoqueiro
      startPolling(pedidoId);
    } catch (err: any) {
      console.error('[confirmOrder] Erro:', err?.response?.status, err?.response?.data || err?.message);
      Alert.alert('Erro', err?.response?.data?.message || 'Não foi possível criar o pedido. Tenta novamente.');
    }
  }, [startPolling]);

  // ─────────────────────────────────────────────────────────────────────────
  // CANCELAR PEDIDO — PATCH /pedidos/:id/cancelar
  // ─────────────────────────────────────────────────────────────────────────

  const cancelOrder = useCallback(async (motivo: string) => {
    if (!activeOrder) return;
    try {
      await api.patch(`/pedidos/${activeOrder.id}/cancelar`, { motivo });
      setActiveOrder(prev => prev ? { ...prev, status: 'cancelado', canceladoEm: new Date().toISOString(), motivoCancelamento: motivo } : null);
      setDeliveryStatus('cancelado');
      stopPolling();
      setTimeout(resetFlow, 2000);
    } catch (err: any) {
      Alert.alert('Erro', err?.response?.data?.message || 'Não foi possível cancelar o pedido.');
    }
  }, [activeOrder, stopPolling]);

  // ─────────────────────────────────────────────────────────────────────────
  // CONFIRMAR ENTREGA — PATCH /pedidos/:id/confirmar-entrega
  // ─────────────────────────────────────────────────────────────────────────

  const completeDelivery = useCallback(async (codigo?: string) => {
    if (!activeOrder) return;
    try {
      await api.patch(`/pedidos/${activeOrder.id}/confirmar-entrega`, {
        metodo: 'codigo',
        codigoUsado: codigo || codigoEntrega || activeOrder.codigoNumerico,
      });
      setActiveOrder(prev => prev ? { ...prev, status: 'entregue', entregueEm: new Date().toISOString() } : null);
      setDeliveryStatus('entregue');
      stopPolling();
    } catch (err: any) {
      Alert.alert('Erro', err?.response?.data?.message || 'Não foi possível confirmar a entrega.');
    }
  }, [activeOrder, codigoEntrega, stopPolling]);

  // ─────────────────────────────────────────────────────────────────────────
  // AVALIAR — POST /pedidos/:id/avaliar
  // ─────────────────────────────────────────────────────────────────────────

  const submitRating = useCallback(async (estrelas: number, comentario?: string) => {
    if (!activeOrder || estrelas === 0) return;
    try {
      await api.post(`/pedidos/${activeOrder.id}/avaliar`, { nota: estrelas, comentario: comentario || '' });
      resetFlow();
    } catch (err: any) {
      Alert.alert('Erro', err?.response?.data?.message || 'Não foi possível enviar a avaliação.');
    }
  }, [activeOrder]);

  const submitReport = useCallback(async (motivos: string[], descricao?: string) => {
    if (!activeOrder || motivos.length === 0) return;
    try {
      await api.post(`/pedidos/${activeOrder.id}/avaliar`, { nota: 1, comentario: `[DENÚNCIA] ${motivos.join(', ')} — ${descricao || ''}` });
      resetFlow();
    } catch (err: any) {
      Alert.alert('Erro', err?.response?.data?.message || 'Não foi possível enviar a denúncia.');
    }
  }, [activeOrder]);

  // ─────────────────────────────────────────────────────────────────────────
  // CHAT — Socket
  // ─────────────────────────────────────────────────────────────────────────

  // ─────────────────────────────────────────────────────────────────────────
  // RESET
  // ─────────────────────────────────────────────────────────────────────────

  const resetFlow = useCallback(() => {
    stopPolling();
    setActiveOrder(null);
    setDeliveryStatus('idle');
    setSearching(false);
    _setPriceAdjustment(0);
    setPriceAdjusted(false);
    setCodigoEntrega(null);
  }, [stopPolling]);

  return {
    activeOrder,
    deliveryStatus,
    searching,
    priceAdjustment,
    priceAdjusted,
    setPriceAdjustment,
    setPriceAdjusted,
    pauseEvent: null,
    confirmOrder,
    cancelOrder,
    submitRating,
    submitReport,
    completeDelivery,
    resetFlow,
    codigoEntrega,
    setCodigoEntrega,
  };
}
