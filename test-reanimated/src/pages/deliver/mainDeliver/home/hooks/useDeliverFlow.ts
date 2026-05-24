// src/pages/deliver/mainDeliver/home/hooks/useDeliverFlow.ts
// Hook do motoqueiro — usa a API real do backend (Bazza).

import { useState, useCallback, useRef, useEffect } from 'react';
import api from '../../../../../components/modules/services/api/api';
import { getSocket, releaseSocket } from '../../../../../components/modules/services/socket';

// ─── Fases do fluxo do deliver ────────────────────────────────────────────────
export type DeliverPhase =
  | 'idle'
  | 'orders'
  | 'order_details'
  | 'pickup'
  | 'paused'
  | 'delivery'
  | 'confirm_delivery'
  | 'rating';

export type PausaMotivo =
  | 'transito_intenso'
  | 'problema_veiculo'
  | 'acidente_via'
  | 'pneu_furado'
  | 'recolha_demorada'
  | 'outro';

export const PAUSA_MOTIVOS: Record<PausaMotivo, string> = {
  transito_intenso:  'Trânsito intenso',
  problema_veiculo:  'Problema com o veículo',
  acidente_via:      'Acidente na via',
  pneu_furado:       'Pneu furado',
  recolha_demorada:  'Recolha demorada',
  outro:             'Outro',
};

export type LatLng = { latitude: number; longitude: number };

export interface DeliveryOrder {
  id: string;
  numeroPedido: string;
  codigoQr: string;
  codigoNumerico: string;
  clientName: string;
  clientPhone: string;
  pickupAddress: string;
  pickupCoords: LatLng;
  deliveryAddress: string;
  deliveryCoords: LatLng;
  packageType: string;
  packageWeight: string;
  observations: string;
  precoBase: number;
  precoFinal: number;
  distanciaKm: number;
  tempoEstimadoMin: number;
  metodoPagamento: string;
  timeoutSeconds: number;
  status: string;
}

export type DeliverPhaseStatus =
  | 'motoqueiro_atribuido'
  | 'a_caminho_recolha'
  | 'em_pausa'
  | 'recolhido'
  | 'entregando'
  | 'entregue'
  | 'cancelado';

export interface ChatMessage {
  id: string;
  pedidoId: string;
  text: string;
  sender: 'deliver' | 'client';
  timestamp: Date;
  read: boolean;
}

const PAUSA_MAX_SEGUNDOS = 5 * 60;

// ─── Helpers ─────────────────────────────────────────────────────────────────
function buildSimRoute(from: LatLng, to: LatLng, steps = 14): LatLng[] {
  return Array.from({ length: steps + 1 }, (_, i) => ({
    latitude: from.latitude + (to.latitude - from.latitude) * (i / steps),
    longitude: from.longitude + (to.longitude - from.longitude) * (i / steps),
  }));
}

async function fetchRealRoute(from: LatLng, to: LatLng): Promise<LatLng[]> {
  try {
    const { getRoute } = await import('../../../../../components/modules/services/routeService');
    const result = await getRoute(from, to);
    if (result && result.coords.length > 1) return result.coords;
  } catch (e) {
    console.warn('[useDeliverFlow] Rota real falhou, usando simulação:', e);
  }
  return buildSimRoute(from, to);
}

function normalizeNumber(value: any, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeOrder(pedido: any): DeliveryOrder {
  const distanciaKm = normalizeNumber(pedido?.distanciaKm);
  const preco = normalizeNumber(pedido?.precoFinal ?? pedido?.precoBase ?? pedido?.valorEntrega);
  const pickupCoords = {
    latitude: normalizeNumber(pedido?.pickupCoords?.latitude ?? pedido?.origemLatitude),
    longitude: normalizeNumber(pedido?.pickupCoords?.longitude ?? pedido?.origemLongitude),
  };
  const deliveryCoords = {
    latitude: normalizeNumber(pedido?.deliveryCoords?.latitude ?? pedido?.destinoLatitude),
    longitude: normalizeNumber(pedido?.deliveryCoords?.longitude ?? pedido?.destinoLongitude),
  };

  return {
    id: String(pedido?.id ?? ''),
    numeroPedido: String(pedido?.numeroPedido ?? ''),
    codigoQr: String(pedido?.codigoQr ?? ''),
    codigoNumerico: String(pedido?.codigoNumerico ?? ''),
    clientName: pedido?.clientName ?? pedido?.cliente?.nome ?? pedido?.cliente?.nomeCompleto ?? 'Cliente',
    clientPhone: pedido?.clientPhone ?? pedido?.cliente?.telefone ?? '',
    pickupAddress: pedido?.pickupAddress ?? pedido?.origemEndereco ?? 'Origem não informada',
    pickupCoords,
    deliveryAddress: pedido?.deliveryAddress ?? pedido?.destinoEndereco ?? 'Destino não informado',
    deliveryCoords,
    packageType: pedido?.packageType ?? pedido?.tipo ?? 'documento',
    packageWeight: pedido?.packageWeight ?? pedido?.peso ?? 'normal',
    observations: pedido?.observations ?? pedido?.descricaoEncomenda ?? pedido?.notas ?? '',
    precoBase: preco,
    precoFinal: normalizeNumber(pedido?.precoFinal, preco),
    distanciaKm,
    tempoEstimadoMin: normalizeNumber(pedido?.tempoEstimadoMin ?? pedido?.duracaoMinutos, 5),
    metodoPagamento: pedido?.metodoPagamento ?? pedido?.tipoPagamento ?? 'numerario',
    timeoutSeconds: normalizeNumber(pedido?.timeoutSeconds, 60),
    status: pedido?.status ?? 'a_procurar_motoqueiro',
  };
}

// ─── Hook principal ───────────────────────────────────────────────────────────
export function useDeliverFlow() {
  const [isOnline, setIsOnline] = useState(false);
  const [phase, setPhase] = useState<DeliverPhase>('idle');
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [activeOrder, setActiveOrder] = useState<DeliveryOrder | null>(null);
  const [agreedPrice, setAgreedPrice] = useState(0);
  const [routeCoords, setRouteCoords] = useState<LatLng[]>([]);
  const [simDistance, setSimDistance] = useState(0);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'sys_1', pedidoId: '', text: 'Chat com o cliente disponível. As mensagens são encriptadas.',
      sender: 'client', timestamp: new Date(), read: true,
    },
  ]);
  const [ratingVisible, setRatingVisible] = useState(false);
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState<DeliveryOrder | null>(null);

  // ── Pausa ──────────────────────────────────────────────────────────────────
  const [pausaMotivo, setPausaMotivo] = useState<PausaMotivo | null>(null);
  const [pausaSegsRestantes, setPausaSegsRestantes] = useState(PAUSA_MAX_SEGUNDOS);
  const [pausaSheetVisible, setPausaSheetVisible] = useState(false);
  const pausaTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const phaseBeforePause = useRef<'pickup' | 'delivery'>('pickup');
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const socketRef = useRef<any>(null);
  const phaseRef = useRef<DeliverPhase>('idle');
  const activeOrderRef = useRef<DeliveryOrder | null>(null);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    activeOrderRef.current = activeOrder;
  }, [activeOrder]);

  // ── Polling de pedidos disponíveis ─────────────────────────────────────────
  const startOrdersPolling = useCallback(() => {
    stopOrdersPolling();
    const fetch = async () => {
      try {
        const res = await api.get('/pedidos/disponiveis');
        setOrders((res.data || []).map(normalizeOrder));
      } catch {}
    };
    fetch(); // Primeira chamada imediata
    pollingRef.current = setInterval(fetch, 8000);
  }, []);

  const stopOrdersPolling = useCallback(() => {
    if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
  }, []);

  // ── Socket: ouvir novos pedidos e chat ──────────────────────────────────────
  useEffect(() => {
    let socket: any;
    let acquiredSocket = false;

    const setup = async () => {
      try {
        socket = await getSocket();
        acquiredSocket = true;
        socketRef.current = socket;
        socket.on('chat:received', (msg: any) => {
          const isOwn = msg.remetenteTipo === 'motoqueiro' || msg.senderType === 'motoqueiro';
          const mapped: ChatMessage = {
            id: msg.id,
            pedidoId: msg.pedidoId,
            text: msg.texto || msg.text || '',
            sender: isOwn ? 'deliver' : 'client',
            timestamp: msg.criadoEm || msg.timestamp || new Date(),
            read: msg.lida ?? msg.read ?? false,
          };
          setChatMessages(prev => {
            if (prev.some(m => m.id === mapped.id)) return prev;
            // Dedup: evitar duplicata do echo socket (mensagem local já existe com texto igual)
            if (isOwn && prev.some(m => m.sender === 'deliver' && m.text === mapped.text)) return prev;
            return [...prev, mapped];
          });
        });
        socket.on('order:new', (data: any) => {
          if (phaseRef.current === 'orders') {
            const pedido = data?.pedido ?? data;
            setOrders(prev => {
              const normalized = normalizeOrder(pedido);
              if (!normalized.id || prev.some(order => order.id === normalized.id)) return prev;
              return [normalized, ...prev];
            });
            api.get('/pedidos/disponiveis').then(res => setOrders((res.data || []).map(normalizeOrder))).catch(() => {});
          }
        });
        socket.on('order:status_update', (data: any) => {
          const currentOrder = activeOrderRef.current;
          if (currentOrder && data.pedidoId === currentOrder.id) {
            setActiveOrder(prev => prev ? { ...prev, status: data.status } : null);
          }
        });
      } catch {}
    };

    if (isOnline) setup();

    return () => {
      if (socket) {
        socket.off('chat:received');
        socket.off('order:new');
        socket.off('order:status_update');
        socketRef.current = null;
      }
      if (acquiredSocket) releaseSocket();
    };
  }, [isOnline]);

  // ── Cleanup polling ────────────────────────────────────────────────────────
  useEffect(() => {
    return () => { stopOrdersPolling(); if (pausaTimerRef.current) clearInterval(pausaTimerRef.current); };
  }, [stopOrdersPolling]);

  // ── Toggle online ──────────────────────────────────────────────────────────
  const handleToggleOnline = useCallback(async (currentLocation: LatLng | null) => {
    if (phase === 'pickup' || phase === 'delivery' || phase === 'confirm_delivery' || phase === 'paused') return;
    const next = !isOnline;

    try {
      await api.patch('/motoqueiros/status', { status: next ? 'online' : 'offline' });

      if (next && currentLocation) {
        await api.patch('/motoqueiros/localizacao', {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
        });
      }

      setIsOnline(next);
      if (next) {
        setPhase('orders');
        startOrdersPolling();
      } else {
        stopOrdersPolling();
        setPhase('idle');
        setOrders([]);
      }
    } catch (error: any) {
      console.warn('Erro ao atualizar disponibilidade:', error?.response?.data || error?.message || error);
    }
  }, [isOnline, phase, startOrdersPolling, stopOrdersPolling]);

  // ── Ver detalhes ──────────────────────────────────────────────────────────
  const handleViewOrderDetails = useCallback((order: DeliveryOrder) => {
    setSelectedOrderForDetails(order);
    setPhase('order_details');
  }, []);

  // ── Aceitar pedido — PATCH /pedidos/:id/aceitar ────────────────────────────
  const handleAcceptOrder = useCallback(async (order: DeliveryOrder, price: number, currentLocation: LatLng | null) => {
    if (!isOnline) return;
    try {
      const res = await api.patch(`/pedidos/${order.id}/aceitar`, { precoAcordado: price });
      const pedido = res.data;
      setActiveOrder(pedido ? normalizeOrder({ ...order, ...pedido, precoFinal: price }) : { ...order, precoFinal: price, status: 'a_caminho_recolha' });
      setAgreedPrice(price);
      setSimDistance(Number(order.distanciaKm));
      const from = currentLocation ?? order.pickupCoords;
      setRouteCoords(await fetchRealRoute(from, order.pickupCoords));
      setPhase('pickup');
      setSelectedOrderForDetails(null);
      stopOrdersPolling();

      // Entrar na sala do pedido para receber atualizações em tempo real
      socketRef.current?.emit('order:join', { pedidoId: order.id });
    } catch (err: any) {
      console.warn('Erro ao aceitar pedido:', err?.response?.data);
    }
  }, [isOnline, stopOrdersPolling]);

  // ── Ignorar pedido ────────────────────────────────────────────────────────
  const handleIgnoreOrder = useCallback((orderId: string) => {
    setOrders(prev => {
      const rest = prev.filter(o => o.id !== orderId);
      if (rest.length === 0) { setPhase('idle'); }
      return rest;
    });
  }, []);

  // ── Cancelar — PATCH /pedidos/:id/cancelar ─────────────────────────────────
  const handleCancel = useCallback(async () => {
    if (!activeOrder) return;
    try {
      await api.patch(`/pedidos/${activeOrder.id}/cancelar`, { motivo: 'Cancelado pelo motoqueiro' });
    } catch {}
    setActiveOrder(null);
    setRouteCoords([]);
    setSimDistance(0);
    setOrders([]);
    setIsOnline(false);
    setPhase('idle');
  }, [activeOrder]);

  // ── Iniciar pausa ─────────────────────────────────────────────────────────
  const handleStartPause = useCallback((motivo: PausaMotivo, currentPhase: 'pickup' | 'delivery') => {
    if (!activeOrder) return;
    phaseBeforePause.current = currentPhase;
    setPausaMotivo(motivo);
    setPausaSegsRestantes(PAUSA_MAX_SEGUNDOS);
    setPausaSheetVisible(false);
    setPhase('paused');

    // Notificar backend
    api.patch(`/pedidos/${activeOrder.id}/status`, { status: 'em_pausa' }).catch(() => {});

    pausaTimerRef.current = setInterval(() => {
      setPausaSegsRestantes(prev => {
        if (prev <= 1) { clearInterval(pausaTimerRef.current!); handleResumePause(); return 0; }
        return prev - 1;
      });
    }, 1000);
  }, [activeOrder]);

  // ── Retomar pausa ──────────────────────────────────────────────────────────
  const handleResumePause = useCallback(() => {
    if (pausaTimerRef.current) { clearInterval(pausaTimerRef.current); pausaTimerRef.current = null; }
    setPausaMotivo(null);
    setPausaSegsRestantes(PAUSA_MAX_SEGUNDOS);
    const resumePhase = phaseBeforePause.current;
    setPhase(resumePhase);

    if (!activeOrder) return;
    const status = resumePhase === 'pickup' ? 'a_caminho_recolha' : 'entregando';
    api.patch(`/pedidos/${activeOrder.id}/status`, { status }).catch(() => {});
  }, [activeOrder]);

  // ── Pickup completo — PATCH /pedidos/:id/status (entregando) ──────────────
  const handlePickupComplete = useCallback(async (currentLocation: LatLng | null) => {
    if (!activeOrder) return;
    const from = currentLocation ?? activeOrder.pickupCoords;
    setRouteCoords(await fetchRealRoute(from, activeOrder.deliveryCoords));
    setSimDistance(Number(activeOrder.distanciaKm) * 0.85);
    setPhase('delivery');
    api.patch(`/pedidos/${activeOrder.id}/status`, { status: 'entregando' }).catch(() => {});
  }, [activeOrder]);

  // ── Delivery completo → confirm sheet ─────────────────────────────────────
  const handleDeliveryComplete = useCallback(() => {
    if (!activeOrder) return;
    setPhase('confirm_delivery');
  }, [activeOrder]);

  // ── Confirmar entrega — PATCH /pedidos/:id/confirmar-entrega ──────────────
  const handleConfirmDelivery = useCallback(async (metodo: 'qr' | 'codigo', codigoUsado: string, coordenadas?: LatLng) => {
    if (!activeOrder) return;
    try {
      await api.patch(`/pedidos/${activeOrder.id}/confirmar-entrega`, { metodo, codigoUsado });
      setPhase('rating');
      setRatingVisible(true);
    } catch (err: any) {
      console.warn('Erro ao confirmar entrega:', err?.response?.data);
    }
  }, [activeOrder]);

  // ── Rating do deliver sobre o cliente ─────────────────────────────────────
  const handleRatingClose = useCallback((rating: number) => {
    if (activeOrder && rating > 0) {
      api.post(`/pedidos/${activeOrder.id}/avaliar`, { nota: rating, comentario: '' }).catch(() => {});
    }
    setRatingVisible(false);
    setActiveOrder(null);
    setAgreedPrice(0);
    setRouteCoords([]);
    setSimDistance(0);
    setOrders([]);
    setIsOnline(false);
    setPhase('idle');
    setChatMessages([{
      id: 'sys_1', pedidoId: '', text: 'Chat com o cliente disponível. As mensagens são encriptadas.',
      sender: 'client', timestamp: new Date(), read: true,
    }]);
  }, [activeOrder]);

  // ── Chat — via socket ou API ───────────────────────────────────────────────
  const handleSendMessage = useCallback((text: string) => {
    if (!text.trim() || !activeOrder) return;
    const msg: ChatMessage = {
      id: `msg_${Date.now()}`, pedidoId: activeOrder.id,
      text: text.trim(), sender: 'deliver',
      timestamp: new Date(), read: false,
    };
    setChatMessages(prev => [...prev, msg]);
    if (socketRef.current) {
      socketRef.current?.emit('chat:send', {
        pedidoId: activeOrder.id,
        senderType: 'motoqueiro',
        senderId: 'motoqueiro',
        text: text.trim(),
      });
    } else {
      api.post(`/chat/${activeOrder.id}`, { text: text.trim() }).catch(() => {});
    }
  }, [activeOrder]);

  // ── Aproximação (deprecado, manter para compatibilidade) ──────────────────
  const handleSimApproach = useCallback(() => {
    setSimDistance(d => parseFloat(Math.max(0, d - 0.3).toFixed(2)));
  }, []);

  return {
    isOnline, phase, orders, activeOrder, agreedPrice,
    routeCoords, simDistance, chatMessages, ratingVisible,
    selectedOrderForDetails,
    pausaMotivo, pausaSegsRestantes, pausaSheetVisible,
    handleToggleOnline, handleViewOrderDetails, handleAcceptOrder,
    handleIgnoreOrder, handleCancel,
    handleStartPause, handleResumePause,
    setPausaSheetVisible,
    handlePickupComplete, handleDeliveryComplete, handleConfirmDelivery,
    handleRatingClose, handleSimApproach, handleSendMessage,
    setSelectedOrderForDetails, setPhase,
  };
}
