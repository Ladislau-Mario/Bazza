// src/pages/deliver/mainDeliver/home/components/RatingModal.tsx

import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity, Animated, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  visible: boolean;
  clientName: string;
  earnedKz: number;
  onClose: (rating: number) => void;
}

const RATING_LABELS = ['', 'Muito mau', 'Mau', 'Razoável', 'Bom', 'Excelente!'];

export function RatingModal({ visible, clientName, earnedKz, onClose }: Props) {
  const [stars, setStars] = useState(0);
  const scaleAnim = useRef(new Animated.Value(0.88)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setStars(0);
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, bounciness: 7 }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();
    } else {
      scaleAnim.setValue(0.88);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={() => onClose(stars)}>
      <Animated.View style={[s.overlay, { opacity: opacityAnim }]}>
        <Animated.View style={[s.card, { transform: [{ scale: scaleAnim }] }]}>
          {/* Anel de sucesso */}
          <View style={s.ring}>
            <View style={s.ringInner}>
              <Ionicons name="checkmark" size={38} color="#CB1D00" />
            </View>
          </View>

          <Text style={s.title}>Entrega concluída!</Text>
          <Text style={s.sub}>
            Como foi a experiência com{'\n'}
            <Text style={{ color: '#fff', fontFamily: 'Poppins_600SemiBold' }}>{clientName}</Text>?
          </Text>

          {/* Ganho */}
          <View style={s.earningCard}>
            <Ionicons name="wallet-outline" size={18} color="#CB1D00" />
            <View>
              <Text style={s.earningLabel}>Ganhou nesta entrega</Text>
              <Text style={s.earningValue}>{earnedKz.toLocaleString('pt-AO')} Kz</Text>
            </View>
          </View>

          {/* Estrelas */}
          <View style={s.starsRow}>
            {[1, 2, 3, 4, 5].map(n => (
              <TouchableOpacity key={n} onPress={() => setStars(n)} activeOpacity={0.7}>
                <Ionicons
                  name={n <= stars ? 'star' : 'star-outline'}
                  size={42}
                  color={n <= stars ? '#f59e0b' : '#ffffff18'}
                />
              </TouchableOpacity>
            ))}
          </View>

          {stars > 0 && (
            <Text style={s.ratingLabel}>{RATING_LABELS[stars]}</Text>
          )}

          <TouchableOpacity
            style={[s.btn, !stars && s.btnDisabled]}
            disabled={!stars}
            onPress={() => onClose(stars)}
            activeOpacity={0.85}
          >
            <Text style={s.btnTxt}>Confirmar</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => onClose(0)} style={s.skip}>
            <Text style={s.skipTxt}>Saltar avaliação</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: '#000000CC',
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24,
  },
  card: {
    width: '100%', backgroundColor: '#1E2A35',
    borderRadius: 28, padding: 28, alignItems: 'center',
    borderWidth: 1, borderColor: '#ffffff0D',
  },
  ring: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: '#CB1D0015', borderWidth: 2, borderColor: '#CB1D0030',
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  ringInner: {
    width: 62, height: 62, borderRadius: 31,
    backgroundColor: '#CB1D0022', alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 22, color: '#fff', fontFamily: 'Poppins_700Bold', marginBottom: 8 },
  sub: {
    fontSize: 14, color: '#9CA3AF', fontFamily: 'Poppins_400Regular',
    textAlign: 'center', lineHeight: 22, marginBottom: 20,
  },
  earningCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    width: '100%', backgroundColor: '#253040',
    borderRadius: 16, padding: 16, marginBottom: 24,
    borderWidth: 1, borderColor: '#CB1D0020',
  },
  earningLabel: { fontSize: 11, color: '#9CA3AF', fontFamily: 'Poppins_400Regular' },
  earningValue: { fontSize: 20, color: '#CB1D00', fontFamily: 'Poppins_700Bold', marginTop: 2 },
  starsRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  ratingLabel: {
    fontSize: 14, color: '#f59e0b', fontFamily: 'Poppins_500Medium', marginBottom: 16,
  },
  btn: {
    width: '100%', backgroundColor: '#CB1D00',
    borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 8,
  },
  btnDisabled: { backgroundColor: '#CB1D0040' },
  btnTxt: { color: '#fff', fontFamily: 'Poppins_600SemiBold', fontSize: 16 },
  skip: { marginTop: 14 },
  skipTxt: { color: '#ffffff30', fontFamily: 'Poppins_400Regular', fontSize: 13 },
});
