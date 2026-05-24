// src/pages/deliver/mainDeliver/home/components/PauseSheet.tsx

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PausaMotivo, PAUSA_MOTIVOS } from '../hooks/useDeliverFlow';

interface Props {
  visible: boolean;
  onConfirm: (motivo: PausaMotivo) => void;
  onClose: () => void;
}

const PAUSA_MOTIVO_KEYS = Object.keys(PAUSA_MOTIVOS) as PausaMotivo[];

export function PauseSheet({ visible, onConfirm, onClose }: Props) {
  const [selected, setSelected] = useState<PausaMotivo | null>(null);

  const handleConfirm = () => {
    if (!selected) return;
    onConfirm(selected);
    setSelected(null);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={s.overlay}>
        <View style={s.sheet}>
          {/* Handle */}
          <View style={s.handle} />

          {/* Header */}
          <View style={s.header}>
            <View style={s.iconWrap}>
              <Ionicons name="pause-circle-outline" size={26} color="#f59e0b" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.title}>Pausar entrega</Text>
              <Text style={s.sub}>A entrega ficará em pausa por no máximo 5 minutos</Text>
            </View>
            <TouchableOpacity style={s.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* Aviso de limite */}
          <View style={s.warnBanner}>
            <Ionicons name="time-outline" size={14} color="#f59e0b" />
            <Text style={s.warnTxt}>
              Limite de <Text style={{ color: '#f59e0b', fontFamily: 'Poppins_600SemiBold' }}>5 minutos</Text>. Após isso a entrega retoma automaticamente.
            </Text>
          </View>

          {/* Opções */}
          <Text style={s.sectionLabel}>Selecciona o motivo da pausa</Text>
          {PAUSA_MOTIVO_KEYS.map(key => (
            <TouchableOpacity
              key={key}
              style={[s.option, selected === key && s.optionActive]}
              onPress={() => setSelected(key)}
              activeOpacity={0.75}
            >
              <View style={[s.radio, selected === key && s.radioActive]}>
                {selected === key && <View style={s.radioDot} />}
              </View>
              <Text style={[s.optionTxt, selected === key && s.optionTxtActive]}>
                {PAUSA_MOTIVOS[key]}
              </Text>
            </TouchableOpacity>
          ))}

          {/* Botão confirmar */}
          <TouchableOpacity
            style={[s.confirmBtn, !selected && s.confirmBtnOff]}
            disabled={!selected}
            onPress={handleConfirm}
            activeOpacity={0.85}
          >
            <Ionicons name="pause" size={18} color="#fff" />
            <Text style={s.confirmBtnTxt}>Pausar entrega</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#1E2A35',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 20, paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    paddingTop: 12,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: '#ffffff30', alignSelf: 'center', marginBottom: 16,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14 },
  iconWrap: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#f59e0b15', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#f59e0b30',
  },
  title: { fontSize: 16, color: '#fff', fontFamily: 'Poppins_600SemiBold' },
  sub: { fontSize: 12, color: '#9CA3AF', fontFamily: 'Poppins_400Regular', marginTop: 2, lineHeight: 18 },
  closeBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#253040', alignItems: 'center', justifyContent: 'center',
  },

  warnBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#f59e0b12', borderRadius: 12, borderWidth: 1, borderColor: '#f59e0b25',
    paddingHorizontal: 14, paddingVertical: 10, marginBottom: 18,
  },
  warnTxt: { flex: 1, fontSize: 12, color: '#9CA3AF', fontFamily: 'Poppins_400Regular', lineHeight: 18 },

  sectionLabel: {
    fontSize: 11, color: '#6B7280', fontFamily: 'Poppins_500Medium',
    textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 10,
  },

  option: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#253040', borderRadius: 14, padding: 14,
    marginBottom: 8, borderWidth: 1.5, borderColor: 'transparent',
  },
  optionActive: { borderColor: '#f59e0b', backgroundColor: '#f59e0b08' },
  radio: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: '#6B7280',
    alignItems: 'center', justifyContent: 'center',
  },
  radioActive: { borderColor: '#f59e0b' },
  radioDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#f59e0b' },
  optionTxt: { fontSize: 13, color: '#9CA3AF', fontFamily: 'Poppins_400Regular', flex: 1 },
  optionTxtActive: { color: '#fff', fontFamily: 'Poppins_500Medium' },

  confirmBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: '#f59e0b', borderRadius: 16,
    paddingVertical: 15, marginTop: 6,
  },
  confirmBtnOff: { backgroundColor: '#f59e0b40' },
  confirmBtnTxt: { color: '#fff', fontFamily: 'Poppins_600SemiBold', fontSize: 15 },
});