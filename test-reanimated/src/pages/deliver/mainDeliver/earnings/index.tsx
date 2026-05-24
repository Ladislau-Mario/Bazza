import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

// Components
import DaySelector from './components/DaySelector';
import EarningsHero from './components/EarningsHero';
import GoalsCard from './components/GoalsCard';
import PerformanceChart from './components/PerformanceChart';
import WeekSummary from './components/WeekSummary';
import PlansBanner from './components/PlansBanner';
import GoalsModal from './components/GoalsModal';

// Data & utils
import { C, useEarningsData } from './hooks/useEarningsData';

export default function Earnings() {
  const navigation = useNavigation<any>();
  const { days: DAYS_DATA, loading, planName, planDaysLeft, planActive } = useEarningsData();
  const [selectedDay, setSelectedDay] = useState(Math.max(0, DAYS_DATA.length - 1));
  const [goalsModalVisible, setGoalsModalVisible] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  // Update selected day when data loads
  useEffect(() => {
    if (DAYS_DATA.length > 0) setSelectedDay(DAYS_DATA.length - 1);
  }, [DAYS_DATA.length]);

  const current = DAYS_DATA[selectedDay] || DAYS_DATA[0];
  const previous = selectedDay > 0 ? DAYS_DATA[selectedDay - 1] : null;

  // Sync week summary selection with day selector
  const weekDays = DAYS_DATA.slice(-7);
  const weekSelectedIndex = Math.max(0, selectedDay - Math.max(0, DAYS_DATA.length - weekDays.length));

  const handleSelectWeekDay = (i: number) => {
    const absoluteIndex = DAYS_DATA.length - weekDays.length + i;
    setSelectedDay(absoluteIndex);
  };

  if (loading) {
    return (
      <View style={[s.root, { justifyContent: 'center', alignItems: 'center' }]}>
        <StatusBar barStyle="light-content" backgroundColor={C.bg} />
        <ActivityIndicator size="large" color={C.blue} />
      </View>
    );
  }

  if (DAYS_DATA.length === 0) {
    return (
      <View style={[s.root, { justifyContent: 'center', alignItems: 'center' }]}>
        <StatusBar barStyle="light-content" backgroundColor={C.bg} />
        <Ionicons name="calendar-outline" size={48} color={C.muted} />
        <Text style={{ color: C.muted, fontSize: 16, marginTop: 12 }}>Sem dados de ganhos</Text>
      </View>
    );
  }

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <View style={s.header}>
        <View>
          <Text style={s.headerSub}>Baza · Estafeta</Text>
          <Text style={s.headerTitle}>Ganhos</Text>
        </View>
        <TouchableOpacity style={s.headerAction} activeOpacity={0.8}>
          <Ionicons name="download-outline" size={20} color={C.muted} />
        </TouchableOpacity>
      </View>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
        scrollEventThrottle={16}
      >
        {/* Day picker */}
        <DaySelector
          days={DAYS_DATA}
          selected={selectedDay}
          onSelect={setSelectedDay}
        />

        {/* Hero card */}
        <EarningsHero
          current={current}
          previous={previous}
        />

        {/* Goals / Metas */}
        <GoalsCard
          current={current}
          onOpenObjectives={() => setGoalsModalVisible(true)}
        />

        {/* Hourly performance chart */}
        <PerformanceChart data={current.hourlyData} />

        {/* Weekly summary */}
        <WeekSummary
          days={weekDays}
          selectedIndex={weekSelectedIndex}
          onSelectDay={handleSelectWeekDay}
        />

        {/* Pro plan banner */}
        <PlansBanner daysLeft={planDaysLeft} plan={planName} />

        {/* Bottom padding for tab bar */}
        <View style={{ height: 110 }} 
          
        />
      </ScrollView>

      {/* ── Objectives Modal ────────────────────────────────────────────── */}
      <GoalsModal
        visible={goalsModalVisible}
        onClose={() => setGoalsModalVisible(false)}
        current={current}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 54 : (StatusBar.currentHeight ?? 28) + 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.sep,
  },
  headerSub: {
    fontSize: 11,
    color: C.muted2,
    fontFamily: 'Poppins_400Regular',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  headerTitle: {
    fontSize: 26,
    color: C.white,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: -0.5,
    marginTop: 2,
  },
  headerAction: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    paddingTop: 20,
  },
});
