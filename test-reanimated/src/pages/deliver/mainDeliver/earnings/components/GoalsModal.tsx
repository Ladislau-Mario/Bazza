import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  ScrollView, Animated, TextInput, Platform,
  StatusBar, Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { C, GOALS, fmtKz } from '../hooks/useEarningsData';
import { DayData } from '../types';

const { height: SH, width: SW } = Dimensions.get('window');
const GOALS_STORAGE_KEY = '@bazza_goals';

const WEEK_DAYS = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];

function buildWeekObjectives(targets: { basic: { kz: string; del: string }; pro: { kz: string; del: string }; ninja: { kz: string; del: string } }) {
  const today = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - today.getDay() + i);
    return {
      date: d.getDate(),
      weekday: WEEK_DAYS[d.getDay()],
      isToday: d.toDateString() === today.toDateString(),
      isPast: d < today && d.toDateString() !== today.toDateString(),
      tiers: [
        { amount: Number(targets.basic.kz) || 8000, orders: Number(targets.basic.del) || 15 },
        { amount: Number(targets.pro.kz) || 18000, orders: Number(targets.pro.del) || 35 },
        { amount: Number(targets.ninja.kz) || 30000, orders: Number(targets.ninja.del) || 56 },
      ],
    };
  });
}

interface Props {
  visible: boolean;
  onClose: () => void;
  current: DayData;
}

export default function GoalsModal({ visible, onClose, current }: Props) {
  const slideAnim = useRef(new Animated.Value(SH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [activeTab, setActiveTab] = useState<'overview' | 'adjust'>('overview');
  const [selectedDay, setSelectedDay] = useState(new Date().getDay());

  const [targets, setTargets] = useState({
    basic: { kz: '8000', del: '15' },
    pro:   { kz: '18000', del: '35' },
    ninja: { kz: '30000', del: '56' },
  });

  // Load saved goals on mount
  useEffect(() => {
    AsyncStorage.getItem(GOALS_STORAGE_KEY).then(saved => {
      if (saved) {
        try { setTargets(JSON.parse(saved)); } catch {}
      }
    });
  }, []);

  const weekDays = buildWeekObjectives(targets);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 26, stiffness: 280 }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: SH, duration: 320, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const todayObj = weekDays.find(d => d.isToday) ?? weekDays[0];

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <StatusBar backgroundColor="rgba(0,0,0,0.75)" barStyle="light-content" />
      
      {/* Overlay */}
      <Animated.View style={[s.overlay, { opacity: fadeAnim }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View style={[s.sheet, { transform: [{ translateY: slideAnim }] }]}>
        {/* Handle */}
        <View style={s.handle} />

        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.headerTitle}>Objectivos</Text>
            <Text style={s.headerSub}>Hoje até {fmtKz(todayObj.tiers[2].amount)}</Text>
          </View>
          <TouchableOpacity style={s.closeBtn} onPress={onClose} activeOpacity={0.8}>
            <Ionicons name="close" size={20} color={C.muted} />
          </TouchableOpacity>
        </View>

        {/* Tab bar */}
        <View style={s.tabs}>
          {(['overview', 'adjust'] as const).map(tab => (
            <TouchableOpacity
              key={tab}
              style={[s.tab, activeTab === tab && s.tabActive]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.8}
            >
              <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>
                {tab === 'overview' ? 'Visão Geral' : 'Ajustar Metas'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
          {activeTab === 'overview' ? (
            <OverviewTab
              weekDays={weekDays}
              selectedDay={selectedDay}
              onSelectDay={setSelectedDay}
              current={current}
            />
          ) : (
            <AdjustTab targets={targets} setTargets={setTargets} onSave={onClose} />
          )}
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────
function OverviewTab({
  weekDays, selectedDay, onSelectDay, current,
}: {
  weekDays: ReturnType<typeof buildWeekObjectives>;
  selectedDay: number;
  onSelectDay: (i: number) => void;
  current: DayData;
}) {
  const selectedObj = weekDays[selectedDay] ?? weekDays[0];
  const maxTarget = GOALS[GOALS.length - 1]?.targetDeliveries || 30;
  const todayProgress = Math.min(current.deliveries / maxTarget, 1);

  return (
    <View style={ov.container}>
      {/* Day selector — pill style like image4 */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={ov.dayRow}>
        {weekDays.map((d, i) => (
          <TouchableOpacity
            key={i}
            style={[ov.dayPill, i === selectedDay && ov.dayPillActive, d.isToday && ov.dayPillToday]}
            onPress={() => onSelectDay(i)}
            activeOpacity={0.75}
          >
            <Text style={[ov.dayPillNum, i === selectedDay && ov.dayPillNumActive]}>{d.date}</Text>
            <Text style={[ov.dayPillWd, i === selectedDay && ov.dayPillWdActive]}>{d.weekday}</Text>
            {d.isToday && <View style={ov.todayDot} />}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Today's progress bar */}
      {selectedObj.isToday && (
        <View style={ov.progressCard}>
          <View style={ov.progressHeader}>
            <Text style={ov.progressLabel}>Progresso de Hoje</Text>
            <Text style={ov.progressValue}>{current.deliveries}/{maxTarget} pedidos</Text>
          </View>
          <View style={ov.progressBarBg}>
            <View style={[ov.progressBarFill, { width: `${todayProgress * 100}%` as any }]} />
            {/* Milestone markers */}
            {GOALS.map((g, i) => (
              <View key={i} style={[ov.milestone, { left: `${(g.targetDeliveries / maxTarget) * 100}%` as any }]} />
            ))}
          </View>
          <View style={ov.milestoneLabels}>
            {selectedObj.tiers.map((t, i) => (
              <Text key={i} style={ov.milestoneLabel}>{t.orders} ped.</Text>
            ))}
          </View>
        </View>
      )}

      {/* Tier cards — vertical list like image4 */}
      {selectedObj.tiers.map((tier, i) => {
        const goal = GOALS[i];
        if (!goal) return null;
        const reached = selectedObj.isToday
          ? current.deliveries >= tier.orders && current.earnings >= tier.amount
          : false;

        return (
          <TierRow
            key={i}
            goal={goal}
            tier={tier}
            reached={reached}
            isToday={selectedObj.isToday}
            currentOrders={selectedObj.isToday ? current.deliveries : (reached ? tier.orders : 0)}
          />
        );
      })}

      {/* Info row */}
      <View style={ov.infoCard}>
        <Ionicons name="information-circle-outline" size={16} color={C.muted} />
        <Text style={ov.infoText}>
          Hora do bónus: <Text style={{ color: C.amber }}>Agendada</Text>
          {'  ·  '}
          Classes: <Text style={{ color: C.white }}>Economy</Text>
        </Text>
      </View>
    </View>
  );
}

function TierRow({
  goal, tier, reached, isToday, currentOrders,
}: {
  goal: typeof GOALS[0];
  tier: { amount: number; orders: number };
  reached: boolean;
  isToday: boolean;
  currentOrders: number;
}) {
  const progress = isToday ? Math.min(currentOrders / tier.orders, 1) : (reached ? 1 : 0);

  return (
    <View style={[tr.card, reached && { borderColor: `${goal.color}30` }]}>
      <View style={tr.left}>
        {/* Amount */}
        <Text style={tr.amount}>{fmtKz(tier.amount)}</Text>
        <Text style={tr.orders}>{tier.orders} pedidos</Text>

        {/* Progress bar */}
        <View style={tr.barBg}>
          <View style={[tr.barFill, {
            width: `${progress * 100}%` as any,
            backgroundColor: goal.color,
          }]} />
        </View>

        {/* Info line */}
        <Text style={tr.infoLine}>
          Hora do bónus: <Text style={{ color: C.amber }}>Agendada</Text>
          {'\n'}Classes de serviço: <Text style={{ color: C.muted }}>Economy</Text>
        </Text>
      </View>

      <View style={tr.right}>
        {/* Tier badge */}
        <View style={[tr.tierBadge, { backgroundColor: `${goal.color}18` }]}>
          <Text style={[tr.tierLabel, { color: goal.color }]}>{goal.label}</Text>
        </View>

        {/* Status */}
        {reached ? (
          <View style={[tr.statusBadge, { backgroundColor: `${goal.color}18` }]}>
            <Ionicons name="checkmark-circle" size={14} color={goal.color} />
            <Text style={[tr.statusText, { color: goal.color }]}>Concluído</Text>
          </View>
        ) : isToday ? (
          <View style={tr.statusBadge}>
            <Text style={tr.statusPct}>{Math.round(progress * 100)}%</Text>
          </View>
        ) : null}

        {/* Bonus */}
        {goal.bonusKz && (
          <Text style={tr.bonus}>+{(goal.bonusKz / 1000).toFixed(1)}k bónus</Text>
        )}
      </View>
    </View>
  );
}

// ─── Adjust Tab ───────────────────────────────────────────────────────────────
function AdjustTab({
  targets, setTargets, onSave,
}: {
  targets: { basic: { kz: string; del: string }; pro: { kz: string; del: string }; ninja: { kz: string; del: string } };
  setTargets: React.Dispatch<React.SetStateAction<typeof targets>>;
  onSave: () => void;
}) {
  const handleSave = useCallback(async () => {
    try {
      await AsyncStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(targets));
    } catch {}
    onSave();
  }, [targets, onSave]);
  return (
    <View style={adj.container}>
      <Text style={adj.intro}>
        Define os teus objectivos diários para cada nível. Os valores são guardados localmente.
      </Text>

      {(Object.keys(targets) as Array<keyof typeof targets>).map(tier => {
        const goal = GOALS.find(g => g.tier === tier)!;
        const t = targets[tier];
        return (
          <View key={tier} style={adj.row}>
            {/* Left label */}
            <View style={[adj.tierIndicator, { backgroundColor: `${goal.color}18` }]}>
              <View style={[adj.tierDot, { backgroundColor: goal.color }]} />
              <Text style={[adj.tierName, { color: goal.color }]}>{goal.label}</Text>
            </View>

            {/* Inputs */}
            <View style={adj.inputs}>
              <View style={adj.inputWrap}>
                <Text style={adj.inputLabel}>Kz alvo</Text>
                <TextInput
                  style={adj.input}
                  value={t.kz}
                  onChangeText={v => setTargets(prev => ({ ...prev, [tier]: { ...prev[tier], kz: v } }))}
                  keyboardType="numeric"
                  placeholderTextColor={C.muted2}
                  selectionColor={goal.color}
                />
              </View>
              <View style={adj.inputWrap}>
                <Text style={adj.inputLabel}>Entregas</Text>
                <TextInput
                  style={adj.input}
                  value={t.del}
                  onChangeText={v => setTargets(prev => ({ ...prev, [tier]: { ...prev[tier], del: v } }))}
                  keyboardType="numeric"
                  placeholderTextColor={C.muted2}
                  selectionColor={goal.color}
                />
              </View>
            </View>
          </View>
        );
      })}

      {/* Save */}
      <TouchableOpacity style={adj.saveBtn} onPress={handleSave} activeOpacity={0.85}>
        <Ionicons name="checkmark-circle-outline" size={18} color={C.white} />
        <Text style={adj.saveBtnText}>Guardar Metas</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={onSave} style={adj.cancelBtn}>
        <Text style={adj.cancelText}>Cancelar</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.75)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SH * 0.92,
    backgroundColor: C.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 20,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: C.border2,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    color: C.white,
    fontFamily: 'Poppins_700Bold',
  },
  headerSub: {
    fontSize: 13,
    color: C.muted,
    fontFamily: 'Poppins_400Regular',
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: C.card2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 24,
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 11,
  },
  tabActive: {
    backgroundColor: C.blue,
    shadowColor: C.blue,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  tabText: {
    fontSize: 13,
    color: C.muted,
    fontFamily: 'Poppins_500Medium',
  },
  tabTextActive: {
    color: C.white,
    fontFamily: 'Poppins_600SemiBold',
  },
  scroll: {
    paddingBottom: 50,
  },
});

const ov = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    gap: 12,
  },
  dayRow: {
    gap: 8,
    paddingVertical: 4,
  },
  dayPill: {
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    minWidth: 52,
    gap: 2,
  },
  dayPillActive: {
    backgroundColor: C.amber,
    borderColor: C.amber,
    shadowColor: C.amber,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  dayPillToday: {
    borderColor: `${C.amber}60`,
  },
  dayPillNum: {
    fontSize: 17,
    color: C.white,
    fontFamily: 'Poppins_700Bold',
  },
  dayPillNumActive: { color: C.bg },
  dayPillWd: {
    fontSize: 9,
    color: C.muted2,
    fontFamily: 'Poppins_500Medium',
    textTransform: 'uppercase',
  },
  dayPillWdActive: { color: C.bg },
  todayDot: {
    width: 4, height: 4, borderRadius: 2,
    backgroundColor: C.amber,
    position: 'absolute',
    bottom: 4,
  },
  progressCard: {
    backgroundColor: C.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  progressLabel: {
    fontSize: 13,
    color: C.muted,
    fontFamily: 'Poppins_500Medium',
  },
  progressValue: {
    fontSize: 13,
    color: C.white,
    fontFamily: 'Poppins_700Bold',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: C.card2,
    borderRadius: 4,
    overflow: 'visible',
    position: 'relative',
    marginBottom: 6,
  },
  progressBarFill: {
    height: 8,
    backgroundColor: C.amber,
    borderRadius: 4,
    shadowColor: C.amber,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
  },
  milestone: {
    position: 'absolute',
    top: -3,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: C.amber,
    borderWidth: 2,
    borderColor: C.card,
    marginLeft: -7,
  },
  milestoneLabels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 4,
  },
  milestoneLabel: {
    fontSize: 10,
    color: C.muted2,
    fontFamily: 'Poppins_400Regular',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: C.border,
    marginTop: 4,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: C.muted,
    fontFamily: 'Poppins_400Regular',
    lineHeight: 18,
  },
});

const tr = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: C.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
    gap: 12,
  },
  left: {
    flex: 1,
    gap: 4,
  },
  right: {
    alignItems: 'flex-end',
    gap: 8,
    justifyContent: 'space-between',
  },
  amount: {
    fontSize: 20,
    color: C.white,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: -0.5,
  },
  orders: {
    fontSize: 12,
    color: C.muted,
    fontFamily: 'Poppins_400Regular',
  },
  barBg: {
    height: 4,
    backgroundColor: C.card2,
    borderRadius: 2,
    overflow: 'hidden',
    marginVertical: 6,
    marginRight: 4,
  },
  barFill: {
    height: 4,
    borderRadius: 2,
  },
  infoLine: {
    fontSize: 11,
    color: C.muted2,
    fontFamily: 'Poppins_400Regular',
    lineHeight: 17,
  },
  tierBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tierLabel: {
    fontSize: 11,
    fontFamily: 'Poppins_700Bold',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: C.card2,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
  },
  statusPct: {
    fontSize: 13,
    color: C.white,
    fontFamily: 'Poppins_700Bold',
  },
  bonus: {
    fontSize: 11,
    color: C.amber,
    fontFamily: 'Poppins_600SemiBold',
  },
});

const adj = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    gap: 14,
  },
  intro: {
    fontSize: 13,
    color: C.muted,
    fontFamily: 'Poppins_400Regular',
    lineHeight: 20,
    marginBottom: 4,
  },
  row: {
    backgroundColor: C.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
    gap: 12,
  },
  tierIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: 'flex-start',
  },
  tierDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tierName: {
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
  },
  inputs: {
    flexDirection: 'row',
    gap: 12,
  },
  inputWrap: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 11,
    color: C.muted2,
    fontFamily: 'Poppins_500Medium',
    marginBottom: 6,
  },
  input: {
    backgroundColor: C.card2,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: C.white,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    borderWidth: 1,
    borderColor: C.border2,
  },
  saveBtn: {
    backgroundColor: C.blue,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    shadowColor: C.blue,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 7,
  },
  saveBtnText: {
    color: C.white,
    fontFamily: 'Poppins_700Bold',
    fontSize: 15,
  },
  cancelBtn: {
    alignSelf: 'center',
    paddingVertical: 8,
  },
  cancelText: {
    color: C.muted2,
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
  },
});
