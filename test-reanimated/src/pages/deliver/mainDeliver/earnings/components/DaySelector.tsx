import React, { useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, Animated,
} from 'react-native';
import { DayData } from '../types';
import { C } from '../hooks/useEarningsData';

interface Props {
  days: DayData[];
  selected: number;
  onSelect: (i: number) => void;
}

export default function DaySelector({ days, selected, onSelect }: Props) {
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={s.row}
    >
      {days.map((d, i) => {
        const isActive = i === selected;
        return (
          <ChipItem key={i} day={d} isActive={isActive} onPress={() => onSelect(i)} />
        );
      })}
    </ScrollView>
  );
}

function ChipItem({ day, isActive, onPress }: { day: DayData; isActive: boolean; onPress: () => void }) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.92, duration: 80, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
    ]).start();
    onPress();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={[s.chip, isActive && s.chipActive]}
        onPress={handlePress}
        activeOpacity={0.85}
      >
        <Text style={[s.weekday, isActive && s.weekdayActive]}>{day.weekday}</Text>
        <Text style={[s.day, isActive && s.dayActive]}>{day.day}</Text>
        {isActive && <View style={s.activeDot} />}
      </TouchableOpacity>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  row: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 8,
    flexDirection: 'row',
  },
  chip: {
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    minWidth: 56,
    gap: 2,
  },
  chipActive: {
    backgroundColor: C.blue,
    borderColor: C.blue,
    shadowColor: C.blue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8,
  },
  weekday: {
    fontSize: 10,
    color: C.muted2,
    fontFamily: 'Poppins_400Regular',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  weekdayActive: { color: 'rgba(255,255,255,0.75)' },
  day: {
    fontSize: 17,
    color: C.white,
    fontFamily: 'Poppins_700Bold',
    marginTop: 1,
  },
  dayActive: { color: C.white },
  activeDot: {
    width: 4, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.6)',
    marginTop: 3,
  },
});
