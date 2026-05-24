import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, Animated, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DayData } from '../types';
import { C, fmtKz, useEarningsSummary } from '../hooks/useEarningsData';

interface Props {
  days: DayData[];
  selectedIndex: number;
  onSelectDay: (i: number) => void;
}

export default function WeekSummary({ days, selectedIndex, onSelectDay }: Props) {
  const summary = useEarningsSummary(days);
  const max = Math.max(...days.map(d => d.earnings), 1);
  const barAnims = useRef(days.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    barAnims.forEach(a => a.setValue(0));
    Animated.stagger(50, barAnims.map(a =>
      Animated.timing(a, { toValue: 1, duration: 400, useNativeDriver: false })
    )).start();
  }, []);

  return (
    <View style={s.card}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.title}>Resumo Semanal</Text>
          <Text style={s.sub}>{days[0].weekday} {days[0].day} – {days[days.length-1].weekday} {days[days.length-1].day}</Text>
        </View>
        <View style={s.totalBadge}>
          <Text style={s.totalLabel}>Total</Text>
          <Text style={s.totalValue}>{fmtKz(summary.totalWeek)}</Text>
        </View>
      </View>

      {/* Bars */}
      <View style={s.barsArea}>
        {days.map((d, i) => {
          const pct = d.earnings / max;
          const isBest = d.earnings === summary.bestDay.earnings;
          const isSelected = i === selectedIndex;
          const barColor = isBest ? C.amber : isSelected ? C.blue : C.blue;

          return (
            <TouchableOpacity
              key={i}
              style={s.barCol}
              onPress={() => onSelectDay(i)}
              activeOpacity={0.75}
            >
              {isBest && (
                <Text style={s.bestTag}>★</Text>
              )}
              <View style={s.barTrack}>
                <Animated.View style={[
                  s.barFill,
                  {
                    height: barAnims[i].interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', `${Math.max(pct * 100, 6)}%`],
                    }),
                    backgroundColor: barColor,
                    opacity: isSelected ? 1 : isBest ? 1 : 0.5,
                    shadowColor: barColor,
                    shadowOffset: { width: 0, height: -3 },
                    shadowOpacity: isSelected || isBest ? 0.6 : 0,
                    shadowRadius: 6,
                  },
                ]} />
              </View>
              <Text style={[
                s.dayLabel,
                isBest && { color: C.amber },
                isSelected && { color: C.white },
              ]}>
                {d.weekday}
              </Text>
              <Text style={[s.dayNum, isSelected && { color: C.white }]}>{d.day}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Divider */}
      <View style={s.divider} />

      {/* Stats row */}
      <View style={s.statsRow}>
        <StatBlock
          icon="bicycle"
          iconColor={C.blue}
          value={`${summary.totalDeliveries}`}
          label="Entregas/semana"
        />
        <View style={s.statSep} />
        <StatBlock
          icon="star"
          iconColor={C.amber}
          value={`${summary.bestDay.weekday} ${summary.bestDay.day}`}
          label="Melhor dia"
        />
        <View style={s.statSep} />
        <StatBlock
          icon="trending-up"
          iconColor={C.green}
          value={fmtKz(summary.avgPerDay)}
          label="Média/dia"
        />
      </View>
    </View>
  );
}

function StatBlock({ icon, iconColor, value, label }: {
  icon: string; iconColor: string; value: string; label: string;
}) {
  return (
    <View style={s.statBlock}>
      <View style={[s.statIconWrap, { backgroundColor: `${iconColor}15` }]}>
        <Ionicons name={icon as any} size={14} color={iconColor} />
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
  totalBadge: {
    alignItems: 'flex-end',
  },
  totalLabel: {
    fontSize: 10,
    color: C.muted2,
    fontFamily: 'Poppins_400Regular',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  totalValue: {
    fontSize: 16,
    color: C.blue,
    fontFamily: 'Poppins_700Bold',
  },
  barsArea: {
    flexDirection: 'row',
    height: 90,
    alignItems: 'flex-end',
    gap: 6,
    marginBottom: 10,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
    gap: 3,
  },
  bestTag: {
    fontSize: 9,
    color: C.amber,
    fontFamily: 'Poppins_700Bold',
  },
  barTrack: {
    flex: 1,
    width: '100%',
    backgroundColor: C.card2,
    borderRadius: 7,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 7,
  },
  dayLabel: {
    fontSize: 9,
    color: C.muted2,
    fontFamily: 'Poppins_600SemiBold',
    marginTop: 2,
  },
  dayNum: {
    fontSize: 11,
    color: C.muted2,
    fontFamily: 'Poppins_400Regular',
  },
  divider: {
    height: 1,
    backgroundColor: C.sep,
    marginVertical: 14,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statBlock: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statSep: {
    width: 1,
    height: 36,
    backgroundColor: C.sep,
  },
  statIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 13,
    color: C.white,
    fontFamily: 'Poppins_700Bold',
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 9,
    color: C.muted2,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
  },
});
