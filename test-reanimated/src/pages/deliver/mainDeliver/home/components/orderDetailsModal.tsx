// src/pages/deliver/mainDeliver/home/components/OrderDetailsModal.tsx

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  ScrollView, Dimensions, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DeliveryOrder } from '../hooks/useDeliverFlow';
import { SwipeConfirm } from './swipeConfirm';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Props {
  order: DeliveryOrder | null;
  visible: boolean;
  onClose: () => void;
  onAccept: (order: DeliveryOrder, price: number) => void;
  isOnline: boolean;
}

const PACKAGE_ICONS: Record<string, string> = {
  'Documento':    'document-text-outline',
  'Comida':       'fast-food-outline',
  'Roupa':        'shirt-outline',
  'Electrónico':  'phone-portrait-outline',
  'Medicamento':  'medkit-outline',
  'Livros':       'book-outline',
  'Peça':         'construct-outline',
  'Outro':        'ellipsis-horizontal-circle-outline',
};

const WEIGHT_ICONS: Record<string, string> = {
  'Leve':   'feather-outline',
  'Normal': 'cube-outline',
  'Pesado': 'barbell-outline',
};

export function OrderDetailsModal({ order, visible, onClose, onAccept, isOnline }: Props) {
  const [price, setPrice] = useState(order?.precoFinal ?? 0);
  const [confirmed, setConfirmed] = useState(false);

  if (!order) return null;

  const packageIcon = PACKAGE_ICONS[order.packageType] ?? 'cube-outline';
  const weightIcon  = WEIGHT_ICONS[order.packageWeight] ?? 'cube-outline';

  const handleSwipeComplete = () => {
    setConfirmed(true);
    setTimeout(() => {
      onAccept(order, price);
      setConfirmed(false);
      setPrice(order.precoFinal);
    }, 400);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={s.container}>
        {/* Handle + fechar */}
        <View style={s.topBar}>
          <TouchableOpacity style={s.closeBtn} onPress={onClose}>
            <Ionicons name="chevron-down" size={22} color="#9CA3AF" />
          </TouchableOpacity>
          <Text style={s.topTitle}>Detalhes do Pedido</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Cliente */}
          <View style={s.clientCard}>
            <View style={s.clientAvatar}>
              <Ionicons name="person" size={26} color="#CB1D00" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.clientName}>{order.clientName}</Text>
              <Text style={s.clientPhone}>{order.clientPhone}</Text>
            </View>
            <View style={s.distBadge}>
              {/* distanciaKm — campo renomeado (era distanceKm) */}
              <Text style={s.distBadgeTxt}>{order.distanciaKm.toFixed(2)} km</Text>
            </View>
          </View>

          {/* Rota */}
          <View style={s.routeCard}>
            <View style={s.routeRow}>
              <View style={[s.routeIconWrap, { backgroundColor: '#2D60FF20' }]}>
                <Ionicons name="location" size={18} color="#2D60FF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.routeLabel}>Recolha</Text>
                <Text style={s.routeAddr}>{order.pickupAddress}</Text>
              </View>
            </View>
            <View style={s.routeConnector}>
              <View style={s.connectorDash} />
            </View>
            <View style={s.routeRow}>
              <View style={[s.routeIconWrap, { backgroundColor: '#EF444420' }]}>
                <Ionicons name="flag" size={18} color="#EF4444" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.routeLabel}>Entrega</Text>
                <Text style={s.routeAddr}>{order.deliveryAddress}</Text>
              </View>
            </View>
          </View>

          {/* Info extra: tempo estimado + pagamento */}
          <View style={s.infoRow}>
            <View style={s.infoCard}>
              <Ionicons name="time-outline" size={18} color="#2D60FF" />
              <Text style={s.infoLabel}>Tempo estimado</Text>
              <Text style={s.infoValue}>{order.tempoEstimadoMin} min</Text>
            </View>
            <View style={s.infoCard}>
              <Ionicons name="cash-outline" size={18} color="#10B981" />
              <Text style={s.infoLabel}>Pagamento</Text>
              <Text style={s.infoValue}>{order.metodoPagamento}</Text>
            </View>
          </View>

          {/* Detalhes da encomenda */}
          <Text style={s.sectionTitle}>Encomenda</Text>
          <View style={s.detailsGrid}>
            <View style={s.detailCard}>
              <Ionicons name={packageIcon as any} size={24} color="#2D60FF" />
              <Text style={s.detailLabel}>Tipo</Text>
              <Text style={s.detailValue}>{order.packageType}</Text>
            </View>
            <View style={s.detailCard}>
              <Ionicons name={weightIcon as any} size={24} color="#f59e0b" />
              <Text style={s.detailLabel}>Peso</Text>
              <Text style={s.detailValue}>{order.packageWeight}</Text>
            </View>
          </View>

          {/* Observações */}
          {order.observations && (
            <View style={s.obsCard}>
              <Ionicons name="chatbubble-outline" size={16} color="#9CA3AF" />
              <View style={{ flex: 1 }}>
                <Text style={s.obsLabel}>Observações do cliente</Text>
                <Text style={s.obsText}>{order.observations}</Text>
              </View>
            </View>
          )}

          {/* Preço ajustável */}
          <Text style={s.sectionTitle}>Valor acordado</Text>
          <View style={s.priceRow}>
            <TouchableOpacity
              style={s.priceBtn}
              onPress={() => setPrice(p => Math.max(order.precoBase - 600, p - 200))}
            >
              <Text style={s.priceBtnTxt}>−200</Text>
            </TouchableOpacity>
            <View style={{ alignItems: 'center' }}>
              <Text style={s.priceVal}>{price.toLocaleString('pt-AO')} Kz</Text>
              <Text style={s.priceHint}>Toca para ajustar</Text>
            </View>
            <TouchableOpacity style={s.priceBtn} onPress={() => setPrice(p => p + 200)}>
              <Text style={s.priceBtnTxt}>+200</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Swipe fixo no fundo */}
        <View style={s.footer}>
          <SwipeConfirm
            onComplete={handleSwipeComplete}
            label="Deslize para aceitar"
            completed={confirmed}
          />
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F13',
    paddingTop: Platform.OS === 'ios' ? 50 : 32,
  },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: '#ffffff08',
  },
  closeBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#1E2A35', alignItems: 'center', justifyContent: 'center',
  },
  topTitle: { fontSize: 16, color: '#fff', fontFamily: 'Poppins_600SemiBold' },

  scroll: { padding: 20, paddingBottom: 120, gap: 16 },

  clientCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#1E2A35', borderRadius: 18, padding: 16,
    borderWidth: 1, borderColor: '#ffffff0D',
  },
  clientAvatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: '#CB1D0015', alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#CB1D0030',
  },
  clientName: { fontSize: 16, color: '#fff', fontFamily: 'Poppins_600SemiBold' },
  clientPhone: { fontSize: 12, color: '#9CA3AF', fontFamily: 'Poppins_400Regular', marginTop: 2 },
  distBadge: { backgroundColor: '#2D60FF20', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  distBadgeTxt: { fontSize: 12, color: '#2D60FF', fontFamily: 'Poppins_600SemiBold' },

  routeCard: {
    backgroundColor: '#1E2A35', borderRadius: 18, padding: 16,
    borderWidth: 1, borderColor: '#ffffff0D',
  },
  routeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  routeIconWrap: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  routeLabel: { fontSize: 10, color: '#6B7280', fontFamily: 'Poppins_400Regular' },
  routeAddr: { fontSize: 14, color: '#E2E8F0', fontFamily: 'Poppins_500Medium', marginTop: 1 },
  routeConnector: { paddingLeft: 19, paddingVertical: 6 },
  connectorDash: { width: 2, height: 16, backgroundColor: '#ffffff15', borderRadius: 1 },

  infoRow: { flexDirection: 'row', gap: 12 },
  infoCard: {
    flex: 1, backgroundColor: '#1E2A35', borderRadius: 14, padding: 14,
    alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#ffffff0D',
  },
  infoLabel: { fontSize: 10, color: '#6B7280', fontFamily: 'Poppins_400Regular' },
  infoValue: { fontSize: 13, color: '#fff', fontFamily: 'Poppins_600SemiBold', textAlign: 'center' },

  sectionTitle: { fontSize: 12, color: '#6B7280', fontFamily: 'Poppins_500Medium', textTransform: 'uppercase', letterSpacing: 0.8 },

  detailsGrid: { flexDirection: 'row', gap: 12 },
  detailCard: {
    flex: 1, backgroundColor: '#1E2A35', borderRadius: 16, padding: 16,
    alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#ffffff0D',
  },
  detailLabel: { fontSize: 10, color: '#6B7280', fontFamily: 'Poppins_400Regular' },
  detailValue: { fontSize: 14, color: '#fff', fontFamily: 'Poppins_600SemiBold' },

  obsCard: {
    flexDirection: 'row', gap: 12, alignItems: 'flex-start',
    backgroundColor: '#1E2A35', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: '#ffffff0D', borderLeftWidth: 3, borderLeftColor: '#f59e0b',
  },
  obsLabel: { fontSize: 10, color: '#6B7280', fontFamily: 'Poppins_400Regular', marginBottom: 2 },
  obsText: { fontSize: 13, color: '#E2E8F0', fontFamily: 'Poppins_400Regular', lineHeight: 20 },

  priceRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#1E2A35', borderRadius: 18, padding: 16,
    borderWidth: 1, borderColor: '#ffffff0D',
  },
  priceBtn: { backgroundColor: '#253040', borderRadius: 12, paddingHorizontal: 18, paddingVertical: 10, borderWidth: 1, borderColor: '#ffffff10' },
  priceBtnTxt: { color: '#fff', fontFamily: 'Poppins_600SemiBold', fontSize: 16 },
  priceVal: { fontSize: 24, color: '#fff', fontFamily: 'Poppins_700Bold' },
  priceHint: { fontSize: 10, color: '#6B7280', fontFamily: 'Poppins_400Regular', marginTop: 2 },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 20, paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    paddingTop: 12, backgroundColor: '#0B0F13',
    borderTopWidth: 1, borderTopColor: '#ffffff08',
  },
});