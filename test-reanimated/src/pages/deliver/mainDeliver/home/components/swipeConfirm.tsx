// src/pages/deliver/mainDeliver/home/components/SwipeConfirm.tsx

import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, PanResponder, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Props {
  onComplete: () => void;
  label?: string;
  completed?: boolean;
}

export function SwipeConfirm({ onComplete, label = 'Deslize para confirmar', completed = false }: Props) {
  const HANDLE_W = 56;
  const TRACK_W = SCREEN_WIDTH - 40;
  const MAX_X = TRACK_W - HANDLE_W - 8;

  const tx = useRef(new Animated.Value(0)).current;
  const done = useRef(false);

  // Reset quando a fase muda (label diferente) ou quando completed volta a false
  useEffect(() => {
    done.current = false;
    tx.setValue(0);
  }, [label, completed]);

  const bgColor = tx.interpolate({
    inputRange: [0, MAX_X],
    outputRange: ['#CB1D00', '#CB1D00'],
    extrapolate: 'clamp',
  });

  const completedBg = completed ? '#16a34a' : undefined;

  const checkOpacity = tx.interpolate({
    inputRange: [MAX_X * 0.55, MAX_X],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const labelOpacity = tx.interpolate({
    inputRange: [0, MAX_X * 0.3],
    outputRange: [1, 0.4],
    extrapolate: 'clamp',
  });

  const pan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => !done.current && !completed,
    onPanResponderMove: (_, g) => {
      tx.setValue(Math.max(0, Math.min(g.dx, MAX_X)));
    },
    onPanResponderRelease: (_, g) => {
      if (g.dx >= MAX_X * 0.72 && !done.current) {
        done.current = true;
        Animated.timing(tx, { toValue: MAX_X, duration: 110, useNativeDriver: true }).start(() => onComplete());
      } else {
        Animated.spring(tx, { toValue: 0, useNativeDriver: true, bounciness: 10 }).start();
      }
    },
  })).current;

  if (completed) {
    return (
      <View style={[s.track, { backgroundColor: '#16a34a' }]}>
        <Text style={s.label}>Confirmado ✓</Text>
      </View>
    );
  }

  return (
    <Animated.View style={[s.track, { backgroundColor: bgColor }]}>
      <Animated.Text style={[s.label, { opacity: labelOpacity }]}>{label}</Animated.Text>
      <Animated.View style={[s.checkWrap, { opacity: checkOpacity }]}>
        <Ionicons name="checkmark" size={20} color="#ffffff80" />
      </Animated.View>
      <Animated.View
        style={[s.handle, { transform: [{ translateX: tx }] }]}
        {...pan.panHandlers}
      >
        <Ionicons name="arrow-forward" size={22} color="#CB1D00" />
      </Animated.View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  track: {
    height: 60, borderRadius: 30,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', overflow: 'hidden',
    position: 'relative', marginHorizontal: 0,
  },
  label: { color: '#fff', fontFamily: 'Poppins_600SemiBold', fontSize: 16 },
  checkWrap: { position: 'absolute', right: 22 },
  handle: {
    position: 'absolute', left: 4,
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4,
  },
});