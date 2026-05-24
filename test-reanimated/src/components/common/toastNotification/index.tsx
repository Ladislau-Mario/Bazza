import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Vibration } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { useTheme } from '../../../global/ThemeContext';

interface ToastProps {
  titulo: string;
  mensagem: string;
  tipo?: 'pedido' | 'status' | 'info';
  visible: boolean;
  onHide: () => void;
  duracao?: number;
}

export default function ToastNotification({
  titulo, mensagem, tipo = 'info', visible, onHide, duracao = 5000,
}: ToastProps) {
  const { theme } = useTheme();
  const c = theme.colors;
  const f = theme.fonts;
  const timer = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    if (visible) {
      Vibration.vibrate([0, 200, 100, 200]);
      timer.current = setTimeout(onHide, duracao);
    }
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [visible]);

  if (!visible) return null;

  const icon = tipo === 'pedido' ? 'bicycle' : tipo === 'status' ? 'checkmark-circle' : 'notifications';
  const iconColor = tipo === 'pedido' ? c.primary : tipo === 'status' ? '#34C759' : '#F59E0B';

  return (
    <MotiView
      from={{ translateY: -120, opacity: 0 }}
      animate={{ translateY: 0, opacity: 1 }}
      exit={{ translateY: -120, opacity: 0 }}
      transition={{ type: 'spring', damping: 15, stiffness: 150 }}
      style={[s.container, { backgroundColor: c.card, borderColor: c.border }]}
    >
      <View style={[s.iconWrap, { backgroundColor: iconColor + '20' }]}>
        <Ionicons name={icon as any} size={22} color={iconColor} />
      </View>
      <View style={s.textWrap}>
        <Text style={[s.title, { color: c.text.primary, fontFamily: f.poppinsSemi }]} numberOfLines={1}>
          {titulo}
        </Text>
        <Text style={[s.message, { color: c.text.muted, fontFamily: f.poppinsRegular }]} numberOfLines={2}>
          {mensagem}
        </Text>
      </View>
    </MotiView>
  );
}

const s = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    zIndex: 99999,
    elevation: 99,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  iconWrap: {
    width: 42, height: 42, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 12,
  },
  textWrap: { flex: 1 },
  title: { fontSize: 14, marginBottom: 2 },
  message: { fontSize: 12 },
});
