import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DayData } from '../types';
import { C, GOALS, fmtKz } from '../hooks/useEarningsData';

interface Props {
  current: DayData;
  onOpenObjectives: () => void;
}

export default function GoalsCard({ current, onOpenObjectives }: Props) {
  const ratePerMin = current.timeOnline > 0 ? current.deliveries / current.timeOnline : 0;

  function estimateETA(target: number): string {
    if (current.deliveries >= target) return 'Concluído ✓';
    if (ratePerMin <= 0) return '—';
    const minsLeft = (target - current.deliveries) / ratePerMin;
    const d = new Date();
    d.setMinutes(d.getMinutes() + minsLeft);
    return `~${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
  }

  return (
    <View style={s.card}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.title}>Metas do Dia</Text>
          <Text style={s.sub}>Progresso em tempo real</Text>
        </View>
        <TouchableOpacity style={s.detailBtn} onPress={onOpenObjectives} activeOpacity={0.8}>
          <Text style={s.detailText}>Objectivos</Text>
          <Ionicons name="arrow-forward" size={13} color={C.blue} />
        </TouchableOpacity>
      </View>

      {/* Goals row */}
      <View style={s.goalsRow}>
        {GOALS.map((goal) => {
          const delivProg = Math.min(current.deliveries / goal.targetDeliveries, 1);
          const kzProg = Math.min(current.earnings / goal.targetKz, 1);
          const done = delivProg >= 1 && kzProg >= 1;
          const eta = estimateETA(goal.targetDeliveries);

          return (
            <GoalTile
              key={goal.tier}
              label={goal.label}
              color={goal.color}
              progress={delivProg}
              kzProgress={kzProg}
              deliveries={current.deliveries}
              targetDeliveries={goal.targetDeliveries}
              earnings={current.earnings}
              targetKz={goal.targetKz}
              eta={eta}
              done={done}
              bonusKz={goal.bonusKz}
            />
          );
        })}
      </View>
    </View>
  );
}

function ProgressArc({
  progress,
  size,
  stroke,
  color,
  children,
}: {
  progress: number;
  size: number;
  stroke: number;
  color: string;
  children?: React.ReactNode;
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: Math.min(progress, 1),
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const clamp = Math.min(progress, 1);
  const deg = clamp * 360;

  // Two-semicircle CSS trick for arc
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Track */}
      <View style={{
        position: 'absolute',
        width: size, height: size,
        borderRadius: size / 2,
        borderWidth: stroke,
        borderColor: `${color}22`,
      }} />

      {/* Fill */}
      {deg > 0 && (
        <View style={{ position: 'absolute', width: size, height: size }}>
          {/* Top half */}
          <View style={{
            position: 'absolute',
            top: 0, left: 0,
            width: size, height: size / 2,
            borderTopLeftRadius: size / 2,
            borderTopRightRadius: size / 2,
            overflow: 'hidden',
          }}>
            <View style={{
              width: size, height: size,
              borderRadius: size / 2,
              borderWidth: stroke,
              borderColor: deg >= 180 ? color : 'transparent',
              borderBottomColor: 'transparent',
              borderLeftColor: 'transparent',
              transform: [{ rotate: `${Math.min(deg, 180) - 90}deg` }],
            }} />
          </View>
          {/* Bottom half */}
          {deg > 180 && (
            <View style={{
              position: 'absolute',
              bottom: 0, left: 0,
              width: size, height: size / 2,
              borderBottomLeftRadius: size / 2,
              borderBottomRightRadius: size / 2,
              overflow: 'hidden',
            }}>
              <View style={{
                width: size, height: size,
                borderRadius: size / 2,
                borderWidth: stroke,
                borderColor: color,
                borderTopColor: 'transparent',
                borderRightColor: 'transparent',
                transform: [{ rotate: `${(deg - 180) - 90}deg` }],
                position: 'absolute',
                bottom: 0,
              }} />
            </View>
          )}
        </View>
      )}

      {children}
    </View>
  );
}

function GoalTile({
  label, color, progress, kzProgress,
  deliveries, targetDeliveries, earnings, targetKz,
  eta, done, bonusKz,
}: {
  label: string; color: string; progress: number; kzProgress: number;
  deliveries: number; targetDeliveries: number; earnings: number; targetKz: number;
  eta: string; done: boolean; bonusKz?: number;
}) {
  return (
    <View style={[s.goalTile, done && { borderColor: `${color}35` }]}>
      {/* Tier badge */}
      <View style={[s.tierBadge, { backgroundColor: `${color}18` }]}>
        <Text style={[s.tierLabel, { color }]}>{label}</Text>
      </View>

      {/* Ring */}
      <View style={s.ringWrap}>
        <ProgressArc progress={progress} size={76} stroke={7} color={color}>
          <View style={{ alignItems: 'center' }}>
            <Text style={[s.ringPct, { color }]}>
              {Math.round(progress * 100)}%
            </Text>
          </View>
        </ProgressArc>
      </View>

      {/* Deliveries */}
      <Text style={s.delivCount}>
        <Text style={{ color: C.white, fontFamily: 'Poppins_700Bold' }}>{deliveries}</Text>
        <Text style={{ color: C.muted2, fontFamily: 'Poppins_400Regular' }}>/{targetDeliveries}</Text>
      </Text>

      {/* Kz progress */}
      <Text style={s.kzLine}>
        {(earnings / 1000).toFixed(1)}k / {(targetKz / 1000).toFixed(0)}k Kz
      </Text>

      {/* Kz mini bar */}
      <View style={s.kzBarBg}>
        <View style={[s.kzBarFill, {
          width: `${Math.min(kzProgress * 100, 100)}%` as any,
          backgroundColor: color,
        }]} />
      </View>

      {/* ETA / done */}
      {done ? (
        <View style={[s.etaBadge, { backgroundColor: `${color}20` }]}>
          <Ionicons name="checkmark-circle" size={12} color={color} />
          <Text style={[s.etaText, { color }]}>Concluído</Text>
        </View>
      ) : (
        <View style={s.etaBadge}>
          <Ionicons name="time-outline" size={11} color={C.muted2} />
          <Text style={[s.etaText, { color: C.muted2 }]}>{eta}</Text>
        </View>
      )}

      {bonusKz && (
        <Text style={s.bonusText}>+{(bonusKz / 1000).toFixed(1)}k bónus</Text>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: C.card,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontSize: 15,
    color: C.white,
    fontFamily: 'Poppins_600SemiBold',
  },
  sub: {
    fontSize: 11,
    color: C.muted2,
    fontFamily: 'Poppins_400Regular',
    marginTop: 2,
  },
  detailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: C.blueDim,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  detailText: {
    fontSize: 12,
    color: C.blue,
    fontFamily: 'Poppins_600SemiBold',
  },
  goalsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  goalTile: {
    flex: 1,
    backgroundColor: C.card2,
    borderRadius: 18,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
    gap: 4,
  },
  tierBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 4,
  },
  tierLabel: {
    fontSize: 10,
    fontFamily: 'Poppins_700Bold',
  },
  ringWrap: {
    marginVertical: 6,
  },
  ringPct: {
    fontSize: 14,
    fontFamily: 'Poppins_700Bold',
  },
  delivCount: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
  },
  kzLine: {
    fontSize: 9,
    color: C.muted2,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
  },
  kzBarBg: {
    width: '100%',
    height: 3,
    backgroundColor: C.card,
    borderRadius: 2,
    overflow: 'hidden',
    marginVertical: 4,
  },
  kzBarFill: {
    height: 3,
    borderRadius: 2,
  },
  etaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: 7,
    paddingHorizontal: 7,
    paddingVertical: 3,
    backgroundColor: C.sep,
    marginTop: 2,
  },
  etaText: {
    fontSize: 9,
    fontFamily: 'Poppins_500Medium',
  },
  bonusText: {
    fontSize: 9,
    color: C.amber,
    fontFamily: 'Poppins_500Medium',
    marginTop: 2,
  },
});
