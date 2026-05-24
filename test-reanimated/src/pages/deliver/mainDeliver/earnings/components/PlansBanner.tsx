import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { C } from '../hooks/useEarningsData';

interface Props {
  daysLeft?: number;
  plan?: string;
}

export default function PlansBanner({ daysLeft = 3, plan = 'Pro' }: Props) {
  const navigation = useNavigation<any>();

  return (
    <View style={pb.card}>
      <View style={pb.glow} />

      <View style={pb.left}>
        <View style={pb.planBadge}>
          <Ionicons name="flash" size={12} color={C.cyan} />
          <Text style={pb.planBadgeText}>Plano {plan}</Text>
        </View>
        <Text style={pb.title}>Expira em {daysLeft} dias</Text>
        <Text style={pb.sub}>
          Renova para manteres as taxas prioritárias e acesso ilimitado.
        </Text>
      </View>

      {/* ✅ Navega para a página de planos */}
      <TouchableOpacity
        style={pb.btn}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('Plans')}
      >
        <Text style={pb.btnText}>Renovar</Text>
        <Ionicons name="arrow-forward" size={13} color={C.white} />
      </TouchableOpacity>
    </View>
  );
}

const pb = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: C.cyanDim,
    borderRadius: 22,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: `${C.cyan}30`,
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    left: -40, top: -40,
    width: 120, height: 120,
    borderRadius: 60,
    backgroundColor: C.cyan,
    opacity: 0.06,
  },
  left: { flex: 1, gap: 4 },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: `${C.cyan}20`,
    borderRadius: 7,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  planBadgeText: {
    fontSize: 10,
    color: C.cyan,
    fontFamily: 'Poppins_600SemiBold',
  },
  title: {
    fontSize: 14,
    color: C.white,
    fontFamily: 'Poppins_600SemiBold',
  },
  sub: {
    fontSize: 11,
    color: C.muted,
    fontFamily: 'Poppins_400Regular',
    lineHeight: 17,
  },
  btn: {
    backgroundColor: C.cyan,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  btnText: {
    color: C.white,
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
  },
});