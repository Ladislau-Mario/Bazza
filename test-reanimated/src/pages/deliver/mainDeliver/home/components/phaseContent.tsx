// src/pages/deliver/mainDeliver/home/components/PhaseContent.tsx

import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DeliveryOrder, PausaMotivo, PAUSA_MOTIVOS } from '../hooks/useDeliverFlow';
import { SwipeConfirm } from './swipeConfirm';

interface Props {
  phase: 'pickup' | 'delivery' | 'paused';
  order: DeliveryOrder;
  expanded: boolean;
  onToggle: () => void;
  onComplete: () => void;
  onOpenChat: () => void;
  // Pausa
  onOpenPauseSheet: () => void;
  pausaMotivo: PausaMotivo | null;
  pausaSegsRestantes: number;
  onResumePause: () => void;
}

export function PhaseContent({
  phase, order, expanded, onToggle, onComplete,
  onOpenChat, onOpenPauseSheet,
  pausaMotivo, pausaSegsRestantes, onResumePause,
}: Props) {
  const [elapsed, setElapsed] = useState(0);

  // Temporizador de fase activa (não conta durante a pausa)
  useEffect(() => {
    if (phase === 'paused') return;
    const t = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(t);
  }, [phase]);

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  // Formatar tempo restante da pausa
  const pausaMins = Math.floor(pausaSegsRestantes / 60);
  const pausaSecs = pausaSegsRestantes % 60;
  const pausaTimeStr = `${String(pausaMins).padStart(2, '0')}:${String(pausaSecs).padStart(2, '0')}`;

  const isPickup = phase === 'pickup' || (phase === 'paused' && order.status === 'a_caminho_recolha');
  const phaseNum = isPickup ? 1 : 2;
  const phaseLabel = phase === 'paused'
    ? 'Entrega em pausa'
    : isPickup ? 'Pegar encomenda' : 'Destino';
  const addr = isPickup ? order.pickupAddress : order.deliveryAddress;

  const isPaused = phase === 'paused';

  return (
    <View style={s.wrap}>
      {/* Linha de fase */}
      <View style={s.header}>
        <View style={[s.badge, isPaused && s.badgePaused]}>
          {isPaused
            ? <Ionicons name="pause" size={16} color="#fff" />
            : <Text style={s.badgeNum}>{phaseNum}</Text>
          }
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[s.phaseLabel, isPaused && s.phaseLabelPaused]}>{phaseLabel}</Text>
          <Text style={s.addr} numberOfLines={1}>{addr}</Text>
        </View>
        {!isPaused && <Text style={s.timer}>{timeStr}</Text>}
        {isPaused && (
          <View style={s.pauseTimerWrap}>
            <Ionicons name="time-outline" size={12} color="#f59e0b" />
            <Text style={s.pauseTimerTxt}>{pausaTimeStr}</Text>
          </View>
        )}
        <TouchableOpacity style={s.toggleBtn} onPress={onToggle}>
          <Text style={s.toggleTxt}>{expanded ? 'Esconder' : 'Mostrar'}</Text>
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={13} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      {/* Banner de pausa activa */}
      {isPaused && pausaMotivo && (
        <View style={s.pauseBanner}>
          <Ionicons name="warning-outline" size={14} color="#f59e0b" />
          <View style={{ flex: 1 }}>
            <Text style={s.pauseBannerTitle}>Entrega pausada</Text>
            <Text style={s.pauseBannerSub}>{PAUSA_MOTIVOS[pausaMotivo]}</Text>
          </View>
          <Text style={s.pauseBannerTime}>Retoma em {pausaTimeStr}</Text>
        </View>
      )}

      {/* Acções expandidas (só quando não pausado) */}
      {expanded && !isPaused && (
        <View style={s.actions}>
          <TouchableOpacity style={s.altRoute}>
            <Text style={s.altRouteTxt}>Escolha outro caminho</Text>
            <Ionicons name="location-outline" size={13} color="#9CA3AF" />
          </TouchableOpacity>
          <View style={s.grid}>
            <TouchableOpacity style={[s.gridCard, { backgroundColor: '#16a34a' }]} onPress={onOpenChat}>
              <Ionicons name="chatbubble-outline" size={22} color="#fff" />
              <Text style={s.gridLabel}>Chat</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.gridCard, { backgroundColor: '#253040', borderWidth: 1, borderColor: '#ffffff12' }]}
              onPress={onOpenPauseSheet}
            >
              <Ionicons name="pause-outline" size={22} color="#f59e0b" />
              <Text style={[s.gridLabel, { color: '#f59e0b' }]}>Pausar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Swipe ou botão de retomar */}
      <View style={s.swipeWrap}>
        {isPaused ? (
          <TouchableOpacity style={s.resumeBtn} onPress={onResumePause} activeOpacity={0.85}>
            <Ionicons name="play" size={20} color="#fff" />
            <Text style={s.resumeBtnTxt}>Voltar à corrida</Text>
          </TouchableOpacity>
        ) : (
          <SwipeConfirm
            key={phase}
            onComplete={onComplete}
            label={isPickup ? 'Deslize — Peguei a encomenda' : 'Deslize — Entrega concluída'}
          />
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { gap: 0 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  badge: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#CB1D00', alignItems: 'center', justifyContent: 'center',
  },
  badgePaused: { backgroundColor: '#f59e0b' },
  badgeNum: { color: '#fff', fontFamily: 'Poppins_700Bold', fontSize: 14 },
  phaseLabel: { fontSize: 15, color: '#fff', fontFamily: 'Poppins_600SemiBold' },
  phaseLabelPaused: { color: '#f59e0b' },
  addr: { fontSize: 11, color: '#9CA3AF', fontFamily: 'Poppins_400Regular', marginTop: 1 },
  timer: { fontSize: 18, color: '#fff', fontFamily: 'Poppins_700Bold' },
  toggleBtn: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  toggleTxt: { fontSize: 11, color: '#9CA3AF', fontFamily: 'Poppins_400Regular' },

  pauseTimerWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  pauseTimerTxt: { fontSize: 15, color: '#f59e0b', fontFamily: 'Poppins_700Bold' },

  pauseBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#f59e0b12', borderRadius: 14,
    borderWidth: 1, borderColor: '#f59e0b25',
    paddingHorizontal: 14, paddingVertical: 12, marginVertical: 10,
  },
  pauseBannerTitle: { fontSize: 12, color: '#f59e0b', fontFamily: 'Poppins_600SemiBold' },
  pauseBannerSub: { fontSize: 11, color: '#9CA3AF', fontFamily: 'Poppins_400Regular', marginTop: 1 },
  pauseBannerTime: { fontSize: 12, color: '#f59e0b', fontFamily: 'Poppins_700Bold' },

  actions: { gap: 10, marginTop: 12, marginBottom: 4 },
  altRoute: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#253040', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
  },
  altRouteTxt: { fontSize: 12, color: '#9CA3AF', fontFamily: 'Poppins_400Regular' },
  grid: { flexDirection: 'row', gap: 10 },
  gridCard: { flex: 1, borderRadius: 16, padding: 16, alignItems: 'center', gap: 8 },
  gridLabel: { fontSize: 13, color: '#fff', fontFamily: 'Poppins_500Medium' },

  swipeWrap: { marginTop: 14 },

  resumeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, backgroundColor: '#16a34a', borderRadius: 30,
    paddingVertical: 16,
  },
  resumeBtnTxt: { color: '#fff', fontFamily: 'Poppins_600SemiBold', fontSize: 16 },
});