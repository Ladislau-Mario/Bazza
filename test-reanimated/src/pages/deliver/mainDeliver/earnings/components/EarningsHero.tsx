import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, Animated, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DayData } from '../types';
import { C, fmtKz, fmtTime } from '../hooks/useEarningsData';

interface Props {
  current: DayData;
  previous: DayData | null;
}

export default function EarningsHero({ current, previous }: Props) {
  const diff = previous && previous.earnings > 0
    ? ((current.earnings - previous.earnings) / previous.earnings) * 100
    : 0;
  const isUp = diff >= 0;
  const avgPerDelivery = current.deliveries > 0
    ? Math.round(current.earnings / current.deliveries)
    : 0;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    fadeAnim.setValue(0);
    translateY.setValue(12);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, damping: 20 }),
    ]).start();
  }, [current]);

  return (
    <View style={s.card}>
      {/* Glow accent top */}
      <View style={[s.topAccent, { backgroundColor: isUp ? C.blue : C.red }]} />

      {/* Header row */}
      <View style={s.headerRow}>
        <Text style={s.label}>Ganhos do Dia</Text>
        <View style={[s.badge, { backgroundColor: isUp ? C.greenDim : C.redDim }]}>
          <Ionicons
            name={isUp ? 'trending-up' : 'trending-down'}
            size={13}
            color={isUp ? C.green : C.red}
          />
          <Text style={[s.badgeText, { color: isUp ? C.green : C.red }]}>
            {Math.abs(diff).toFixed(1)}%
          </Text>
        </View>
      </View>

      {/* Main value */}
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY }] }}>
        <Text style={s.mainValue}>
          {current.earnings.toLocaleString('pt-AO')} <Text style={s.kzLabel}>Kz</Text>
        </Text>
      </Animated.View>

      {/* Comparison */}
      <Text style={[s.comparison, { color: isUp ? C.green : C.red }]}>
        {isUp ? '↑' : '↓'}{' '}
        <Text style={{ color: C.muted }}>
          {previous
            ? `${Math.abs(current.earnings - previous.earnings).toLocaleString('pt-AO')} Kz em relação a ontem`
            : 'Sem dados anteriores'}
        </Text>
      </Text>

      {/* Divider */}
      <View style={s.divider} />

      {/* Stats grid — 3 columns */}
      <View style={s.statsRow}>
        <StatItem
          icon="bicycle-outline"
          iconColor={C.blue}
          value={`${current.deliveries}`}
          label="Entregas"
        />
        <View style={s.statSep} />
        <StatItem
          icon="time-outline"
          iconColor={C.cyan}
          value={fmtTime(current.timeOnline)}
          label="Online"
        />
        <View style={s.statSep} />
        <StatItem
          icon="wallet-outline"
          iconColor={C.amber}
          value={avgPerDelivery.toLocaleString('pt-AO')}
          label="Kz/entrega"
        />
      </View>
    </View>
  );
}

function StatItem({
  icon, iconColor, value, label,
}: {
  icon: string; iconColor: string; value: string; label: string;
}) {
  return (
    <View style={s.statItem}>
      <View style={[s.statIconWrap, { backgroundColor: `${iconColor}15` }]}>
        <Ionicons name={icon as any} size={16} color={iconColor} />
      </View>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 24,
    backgroundColor: C.card,
    padding: 22,
    borderWidth: 1,
    borderColor: C.border2,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
  topAccent: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 2,
    opacity: 0.9,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  label: {
    fontSize: 12,
    color: C.muted,
    fontFamily: 'Poppins_500Medium',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  mainValue: {
    fontSize: 38,
    color: C.white,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: -1,
    marginBottom: 4,
  },
  kzLabel: {
    fontSize: 22,
    color: C.muted,
    fontFamily: 'Poppins_500Medium',
  },
  comparison: {
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    marginBottom: 18,
  },
  divider: {
    height: 1,
    backgroundColor: C.sep,
    marginBottom: 18,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 5,
  },
  statSep: {
    width: 1,
    height: 40,
    backgroundColor: C.sep,
  },
  statIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 15,
    color: C.white,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: 10,
    color: C.muted2,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
  },
});
