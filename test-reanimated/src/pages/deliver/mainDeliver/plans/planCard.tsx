import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Plan } from './types';

interface Props {
  plan: Plan;
  onChoose: (plan: Plan) => void;
}

export default function PlanCard({ plan, onChoose }: Props) {
  return (
    <TouchableOpacity
      style={s.card}
      onPress={() => onChoose(plan)}
      activeOpacity={0.92}
    >
      <LinearGradient
        colors={plan.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Top row: icon + badge */}
      <View style={s.topRow}>
        <View style={s.iconBox}>
          <Ionicons name="flash" size={26} color="#fff" />
        </View>
        {plan.badge && (
          <View style={s.badge}>
            <Ionicons name="star-outline" size={10} color="#fff" />
            <Text style={s.badgeText}>{plan.badge}</Text>
          </View>
        )}
      </View>

      {/* Middle: pricing */}
      <View style={s.middle}>
        <Text style={s.planLabel}>{plan.label}</Text>
        <View style={s.priceRow}>
          <Text style={s.price}>{plan.price.toLocaleString('pt-AO')}</Text>
          <Text style={s.currency}> Kz</Text>
        </View>
        <Text style={s.duration}>{plan.duration} · {plan.pricePerDay.toLocaleString('pt-AO')} Kz/dia</Text>

        {plan.savingsLabel && (
          <View style={s.savingsBadge}>
            <Ionicons name="trending-down" size={11} color="rgba(255,255,255,0.9)" />
            <Text style={s.savingsText}>{plan.savingsLabel}</Text>
          </View>
        )}
      </View>

      {/* Features */}
      <View style={s.features}>
        {plan.features.map((f, i) => (
          <View key={i} style={s.featureRow}>
            <Ionicons name="checkmark-circle" size={13} color="rgba(255,255,255,0.85)" />
            <Text style={s.featureText}>{f}</Text>
          </View>
        ))}
      </View>

      {/* CTA bottom */}
      <View style={s.bottom}>
        <TouchableOpacity style={s.ctaBtn} onPress={() => onChoose(plan)} activeOpacity={0.85}>
          <Text style={s.ctaText}>Activar Plano</Text>
          <Ionicons name="arrow-forward" size={16} color="rgba(0,0,0,0.7)" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card: {
    width: '100%',
    height: 420,
    borderRadius: 28,
    overflow: 'hidden',
    padding: 24,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.22)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.22)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    color: '#fff',
    fontFamily: 'Poppins_600SemiBold',
  },
  middle: {
    gap: 4,
  },
  planLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    fontFamily: 'Poppins_500Medium',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 46,
    color: '#fff',
    fontFamily: 'Poppins_700Bold',
    letterSpacing: -1.5,
    lineHeight: 52,
  },
  currency: {
    fontSize: 20,
    color: 'rgba(255,255,255,0.75)',
    fontFamily: 'Poppins_500Medium',
    marginBottom: 6,
  },
  duration: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.65)',
    fontFamily: 'Poppins_400Regular',
  },
  savingsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.18)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 6,
  },
  savingsText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.9)',
    fontFamily: 'Poppins_600SemiBold',
  },
  features: {
    gap: 6,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  featureText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontFamily: 'Poppins_400Regular',
  },
  bottom: {
    marginTop: 4,
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 16,
    paddingVertical: 14,
  },
  ctaText: {
    fontSize: 14,
    color: 'rgba(0,0,0,0.75)',
    fontFamily: 'Poppins_700Bold',
  },
});