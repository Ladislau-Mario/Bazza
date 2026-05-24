// src/pages/deliver/mainDeliver/home/components/OrderCard.tsx

import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DeliveryOrder } from '../hooks/useDeliverFlow';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
export const ORDER_CARD_WIDTH = SCREEN_WIDTH * 0.85;

interface Props {
  order: DeliveryOrder;
  isOnline: boolean;
  onViewDetails: (order: DeliveryOrder) => void;
  onIgnore: (id: string) => void;
}

export function OrderCard({ order, isOnline, onViewDetails, onIgnore }: Props) {
  const [remaining, setRemaining] = useState(order.timeoutSeconds);
  const progress = useRef(new Animated.Value(1)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 0,
      duration: order.timeoutSeconds * 1000,
      useNativeDriver: false,
    }).start();

    const t = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) { clearInterval(t); onIgnore(order.id); return 0; }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  // Pulse animation quando < 10s
  useEffect(() => {
    if (remaining <= 10 && remaining > 0) {
      Animated.sequence([
        Animated.timing(buttonScale, { toValue: 1.04, duration: 200, useNativeDriver: true }),
        Animated.timing(buttonScale, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [remaining]);

  const barWidth = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  const barColor = progress.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: ['#EF4444', '#f59e0b', '#CB1D00'],
  });
  const isUrgent = remaining <= 10;
  const distanciaKmValue = Number(order.distanciaKm ?? 0);
  const precoBaseValue = Number(order.precoBase ?? 0);
  const distanciaKm = Number.isFinite(distanciaKmValue) ? distanciaKmValue : 0;
  const precoBase = Number.isFinite(precoBaseValue) ? precoBaseValue : 0;

  return (
    <View style={[s.card, { width: ORDER_CARD_WIDTH }]}>
      {/* Header: cliente + distância + timer */}
      <View style={s.header}>
        <View style={s.avatarWrap}>
          <Ionicons name="person" size={18} color="#CB1D00" />
        </View>
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={s.name}>{order.clientName}</Text>
          <View style={s.metaRow}>
            <View style={s.tag}>
              <Text style={s.tagTxt}>{order.packageType}</Text>
            </View>
            <Text style={s.dist}>{distanciaKm.toFixed(2)} km</Text>
          </View>
        </View>
        {/* Timer */}
        <View style={[s.timerWrap, isUrgent && s.timerWrapUrgent]}>
          <Text style={[s.timerNum, isUrgent && s.timerNumUrgent]}>
            00:{String(remaining).padStart(2, '0')}
          </Text>
          <View style={s.timerBar}>
            <Animated.View style={[s.timerFill, { width: barWidth, backgroundColor: barColor }]} />
          </View>
        </View>
      </View>

      {/* Rota */}
      <View style={s.route}>
        <View style={s.routeRow}>
          <View style={[s.dot, { backgroundColor: '#2D60FF' }]} />
          <View>
            <Text style={s.routeLabel}>Recolha</Text>
            <Text style={s.routeAddr} numberOfLines={1}>{order.pickupAddress}</Text>
          </View>
        </View>
        <View style={s.connector} />
        <View style={s.routeRow}>
          <View style={[s.dot, { backgroundColor: '#FF2D55' }]} />
          <View>
            <Text style={s.routeLabel}>Entrega</Text>
            <Text style={s.routeAddr} numberOfLines={1}>{order.deliveryAddress}</Text>
          </View>
        </View>
      </View>

      {/* Preço */}
      <View style={s.priceRow}>
        <Text style={s.price}>{precoBase.toLocaleString('pt-AO')} Kz</Text>
        <Text style={s.priceLabel}>Valor acordado</Text>
      </View>

      {/* Acções */}
      <View style={s.actions}>
        <TouchableOpacity style={s.ignoreBtn} onPress={() => onIgnore(order.id)}>
          <Ionicons name="close" size={16} color="#9CA3AF" />
          <Text style={s.ignoreTxt}>Ignorar</Text>
        </TouchableOpacity>
        <Animated.View style={[{ flex: 2 }, { transform: [{ scale: buttonScale }] }]}>
          <TouchableOpacity
            style={[s.acceptBtn, !isOnline && s.acceptBtnOff]}
            disabled={!isOnline}
            onPress={() => isOnline && onViewDetails(order)}
            activeOpacity={0.85}
          >
            <Text style={s.acceptTxt}>Ver detalhes</Text>
            <Ionicons name="arrow-forward" size={16} color="#fff" />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: '#1E2A35', borderRadius: 22,
    padding: 18, borderWidth: 1, borderColor: '#ffffff0D',
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 16 },
  avatarWrap: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#CB1D0015', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#CB1D0030', flexShrink: 0,
  },
  name: { fontSize: 15, color: '#fff', fontFamily: 'Poppins_600SemiBold' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tag: { backgroundColor: '#CB1D0020', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  tagTxt: { fontSize: 10, color: '#CB1D00', fontFamily: 'Poppins_500Medium' },
  dist: { fontSize: 11, color: '#9CA3AF', fontFamily: 'Poppins_400Regular' },

  timerWrap: { alignItems: 'flex-end', gap: 5 },
  timerWrapUrgent: {},
  timerNum: { fontSize: 18, color: '#fff', fontFamily: 'Poppins_700Bold' },
  timerNumUrgent: { color: '#EF4444' },
  timerBar: { width: 56, height: 3, backgroundColor: '#ffffff15', borderRadius: 2, overflow: 'hidden' },
  timerFill: { height: 3, borderRadius: 2 },

  route: { gap: 0, marginBottom: 14 },
  routeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  dot: { width: 10, height: 10, borderRadius: 5, marginTop: 4, flexShrink: 0 },
  routeLabel: { fontSize: 10, color: '#6B7280', fontFamily: 'Poppins_400Regular' },
  routeAddr: { fontSize: 13, color: '#E2E8F0', fontFamily: 'Poppins_500Medium' },
  connector: { width: 2, height: 12, backgroundColor: '#ffffff15', marginLeft: 4, marginVertical: 2 },

  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 16 },
  price: { fontSize: 22, color: '#fff', fontFamily: 'Poppins_700Bold' },
  priceLabel: { fontSize: 11, color: '#6B7280', fontFamily: 'Poppins_400Regular' },

  actions: { flexDirection: 'row', gap: 10 },
  ignoreBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, borderRadius: 14, paddingVertical: 13,
    backgroundColor: '#253040', borderWidth: 1, borderColor: '#ffffff10',
  },
  ignoreTxt: { color: '#9CA3AF', fontFamily: 'Poppins_500Medium', fontSize: 13 },
  acceptBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, backgroundColor: '#2D60FF', borderRadius: 14, paddingVertical: 13,
  },
  acceptBtnOff: { backgroundColor: '#2D60FF40' },
  acceptTxt: { color: '#fff', fontFamily: 'Poppins_600SemiBold', fontSize: 14 },
});
