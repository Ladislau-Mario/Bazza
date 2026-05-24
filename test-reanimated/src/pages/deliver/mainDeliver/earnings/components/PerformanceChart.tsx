import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, fmtKz } from '../hooks/useEarningsData';

const HOURS = [7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22];
const { width: SW } = Dimensions.get('window');
const BAR_AREA_WIDTH = SW - 40 - 36; // card padding + card margin

interface Props {
  data: number[];
}

export default function PerformanceChart({ data }: Props) {
  const [selectedH, setSelectedH] = useState<number | null>(null);
  const barAnims = useRef(HOURS.map(() => new Animated.Value(0))).current;

  const points = HOURS.map(h => ({ h, v: data[h] ?? 0 }));
  const max = Math.max(...points.map(p => p.v), 1);
  const peakH = points.reduce((b, p) => p.v > b.v ? p : b, points[0]).h;
  const totalToday = points.reduce((s, p) => s + p.v, 0);
  const nonZeroHours = points.filter(p => p.v > 0).length;
  const avgHourly = Math.round(nonZeroHours > 0 ? totalToday / nonZeroHours : 0);

  useEffect(() => {
    // Animate bars in staggered
    const anims = barAnims.map((anim, i) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 500,
        delay: i * 30,
        useNativeDriver: false,
      })
    );
    barAnims.forEach(a => a.setValue(0));
    Animated.stagger(30, anims).start();
  }, [data]);

  const selectedPoint = selectedH != null ? points.find(p => p.h === selectedH) : null;

  return (
    <View style={s.card}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.title}>Desempenho Horário</Text>
          <Text style={s.sub}>Total: {fmtKz(totalToday)}</Text>
        </View>
        <View style={s.peakBadge}>
          <Ionicons name="flash" size={12} color={C.amber} />
          <Text style={s.peakText}>Pico {peakH}h</Text>
        </View>
      </View>

      {/* Tooltip */}
      {selectedPoint ? (
        <View style={s.tooltip}>
          <Text style={s.tooltipHour}>{selectedPoint.h}:00</Text>
          <Text style={s.tooltipVal}>{fmtKz(selectedPoint.v)}</Text>
        </View>
      ) : (
        <View style={s.tooltipPlaceholder}>
          <Text style={s.tooltipPlaceholderText}>Toca numa barra para ver detalhes</Text>
        </View>
      )}

      {/* Chart */}
      <View style={s.chartArea}>
        {/* Y-axis guides */}
        <View style={s.guides} pointerEvents="none">
          {[1, 0.66, 0.33].map(p => (
            <View key={p} style={[s.guideLine, { bottom: `${p * 100}%` as any }]}>
              <Text style={s.guideLabel}>{fmtKz(Math.round(max * p))}</Text>
            </View>
          ))}
        </View>

        {/* Bars */}
        <View style={s.barsRow}>
          {points.map(({ h, v }, idx) => {
            const pct = v / max;
            const isPeak = h === peakH;
            const isSelected = h === selectedH;
            const barColor = isPeak ? C.amber : isSelected ? C.blueLight : C.blue;

            return (
              <TouchableOpacity
                key={h}
                style={s.barCol}
                onPress={() => setSelectedH(prev => prev === h ? null : h)}
                activeOpacity={0.7}
              >
                <View style={s.barTrack}>
                  <Animated.View style={[
                    s.barFill,
                    {
                      height: barAnims[idx].interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', `${Math.max(pct * 100, v > 0 ? 4 : 0)}%`],
                      }),
                      backgroundColor: barColor,
                      opacity: v === 0 ? 0.12 : isSelected ? 1 : isPeak ? 1 : 0.72,
                    },
                  ]}>
                    {/* Shine effect on peak/selected */}
                    {(isPeak || isSelected) && (
                      <View style={s.barShine} />
                    )}
                  </Animated.View>
                </View>
                <Text style={[s.barLabel, isPeak && { color: C.amber }, isSelected && { color: C.blueLight }]}>
                  {h}h
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Legend */}
      <View style={s.legend}>
        <View style={s.legendItem}>
          <View style={[s.legendDot, { backgroundColor: C.blue }]} />
          <Text style={s.legendText}>Ganhos por hora</Text>
        </View>
        <View style={s.legendItem}>
          <View style={[s.legendDot, { backgroundColor: C.amber }]} />
          <Text style={s.legendText}>Hora de pico</Text>
        </View>
        <View style={s.legendItem}>
          <View style={[s.legendDot, { backgroundColor: C.muted2 }]} />
          <Text style={s.legendText}>Média: {fmtKz(avgHourly)}</Text>
        </View>
      </View>
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
    marginBottom: 14,
  },
  title: {
    fontSize: 15,
    color: C.white,
    fontFamily: 'Poppins_600SemiBold',
  },
  sub: {
    fontSize: 12,
    color: C.muted,
    fontFamily: 'Poppins_400Regular',
    marginTop: 2,
  },
  peakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: C.amberDim,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: `${C.amber}25`,
  },
  peakText: {
    fontSize: 12,
    color: C.amber,
    fontFamily: 'Poppins_600SemiBold',
  },
  tooltip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: C.card2,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 14,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: C.border2,
  },
  tooltipHour: {
    fontSize: 13,
    color: C.muted,
    fontFamily: 'Poppins_500Medium',
  },
  tooltipVal: {
    fontSize: 14,
    color: C.white,
    fontFamily: 'Poppins_700Bold',
  },
  tooltipPlaceholder: {
    height: 36,
    justifyContent: 'center',
    marginBottom: 14,
  },
  tooltipPlaceholderText: {
    fontSize: 11,
    color: C.muted2,
    fontFamily: 'Poppins_400Regular',
    fontStyle: 'italic',
  },
  chartArea: {
    height: 140,
    marginBottom: 12,
    position: 'relative',
  },
  guides: {
    position: 'absolute',
    top: 0, bottom: 20, left: 0, right: 0,
  },
  guideLine: {
    position: 'absolute',
    left: 0, right: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  guideLabel: {
    fontSize: 9,
    color: C.muted2,
    fontFamily: 'Poppins_400Regular',
    marginRight: 6,
    width: 42,
    textAlign: 'right',
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 120,
    marginLeft: 48,
    gap: 3,
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
    gap: 4,
  },
  barTrack: {
    flex: 1,
    width: '80%',
    backgroundColor: C.card2,
    borderRadius: 5,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 5,
    overflow: 'hidden',
  },
  barShine: {
    position: 'absolute',
    top: 0,
    left: '20%',
    width: '20%',
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 2,
  },
  barLabel: {
    fontSize: 8,
    color: C.muted2,
    fontFamily: 'Poppins_400Regular',
  },
  legend: {
    flexDirection: 'row',
    gap: 14,
    flexWrap: 'wrap',
    marginTop: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  legendText: {
    fontSize: 11,
    color: C.muted2,
    fontFamily: 'Poppins_400Regular',
  },
});
