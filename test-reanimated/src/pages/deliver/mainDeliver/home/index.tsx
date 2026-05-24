// src/pages/deliver/mainDeliver/home/index.tsx

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Dimensions, Platform, FlatList,
} from 'react-native';
import MapView, { PROVIDER_GOOGLE, Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';

import { TAB_BAR_HEIGHT } from '../../../../components/common/curvedTabs/index';
import { useDeliverFlow, LatLng } from './hooks/useDeliverFlow';
import { useEarningsData } from '../earnings/hooks/useEarningsData';
import { OrderCard, ORDER_CARD_WIDTH } from './components/OrderCard';
import { OrderDetailsModal } from './components/orderDetailsModal';
import { PhaseContent } from './components/phaseContent';
import { ChatSheet } from './components/chatSheet';
import { ConfirmDeliverySheet } from './components/confirmDeliverySheet';
import { RatingModal } from './components/ratingModal';
import { PauseSheet } from './components/pauseSheet';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Map style ────────────────────────────────────────────────────────────────
const MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#303E4D' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#FFFFFF' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1F2933' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#3D5166' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#1F2933' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#FFFFFF' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#4A6080' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#1a2a3a' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#2A3A4A' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#FFFFFF' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#2A3A4A' }] },
  { featureType: 'administrative', elementType: 'labels.text.fill', stylers: [{ color: '#FFFFFF' }] },
];

// ─── Marcadores ───────────────────────────────────────────────────────────────
function PickupMarker() {
  return (
    <View style={{ width: 22, height: 22, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{
        width: 16, height: 16, borderRadius: 8,
        backgroundColor: '#FF2D55', borderWidth: 3, borderColor: '#fff', elevation: 6,
      }} />
    </View>
  );
}

function DeliveryMarker() {
  return (
    <View style={{ width: 22, height: 22, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{
        width: 16, height: 16, borderRadius: 8,
        backgroundColor: '#2D60FF', borderWidth: 3, borderColor: '#fff', elevation: 6,
      }} />
    </View>
  );
}

// ─── Status config ────────────────────────────────────────────────────────────
function getStatusConfig(phase: string, isOnline: boolean) {
  if (!isOnline) return { label: 'Desligado', dot: '#ffffff40', bg: '#1F2933' };
  if (phase === 'orders' || phase === 'order_details') return { label: 'Em linha', dot: '#f59e0b', bg: '#1a1600' };
  if (phase === 'pickup') return { label: 'A caminho', dot: '#f59e0b', bg: '#1a1600' };
  if (phase === 'paused') return { label: 'Em pausa', dot: '#f59e0b', bg: '#1a1600' };
  if (phase === 'delivery') return { label: 'A entregar', dot: '#CB1D00', bg: '#1a0a00' };
  return { label: 'Desligado', dot: '#ffffff40', bg: '#1F2933' };
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function DeliverHome() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [snapIndex, setSnapIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [chatVisible, setChatVisible] = useState(false);

  const bottomSheetRef = useRef<BottomSheet>(null);
  const mapRef = useRef<MapView>(null);

  const flow = useDeliverFlow();
  const earnings = useEarningsData();

  // Snap points
  const snapPoints = useMemo(() => {
    const avail = SCREEN_HEIGHT - TAB_BAR_HEIGHT;
    return [
      Math.round(avail * 0.22),
      Math.round(avail * 0.50),
      Math.round(avail * 0.80),
    ];
  }, []);

  // Botão localização
  const locBtnBottom = useMemo(() => {
    if (snapIndex === 0) return snapPoints[0] + TAB_BAR_HEIGHT + 12;
    if (snapIndex === 1) return snapPoints[1] + TAB_BAR_HEIGHT + 12;
    return null;
  }, [snapIndex, snapPoints]);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setErrorMsg('Permissão negada'); return; }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLocation(loc);
    })();
  }, []);

  // Controla snap do sheet conforme a fase
  useEffect(() => {
    switch (flow.phase) {
      case 'idle':
        bottomSheetRef.current?.snapToIndex(0);
        break;
      case 'orders':
        bottomSheetRef.current?.snapToIndex(1);
        break;
      case 'pickup':
      case 'delivery':
      case 'paused':
        bottomSheetRef.current?.snapToIndex(1);
        setExpanded(false);
        if (flow.activeOrder) {
          setTimeout(() => {
            mapRef.current?.fitToCoordinates(
              [flow.activeOrder!.pickupCoords, flow.activeOrder!.deliveryCoords],
              { edgePadding: { top: 80, right: 40, bottom: snapPoints[1] + TAB_BAR_HEIGHT + 20, left: 40 }, animated: true }
            );
          }, 350);
        }
        break;
    }
  }, [flow.phase]);

  const currentLocation: LatLng | null = location
    ? { latitude: location.coords.latitude, longitude: location.coords.longitude }
    : null;

  const statusCfg = getStatusConfig(flow.phase, flow.isOnline);
  const canCancel = flow.phase === 'pickup'; // só antes de recolher
  const showDistBadge = flow.phase === 'pickup' || flow.phase === 'delivery' || flow.phase === 'paused';

  // Fase activa para passar ao PhaseContent
  const activePhaseForContent: 'pickup' | 'delivery' | 'paused' =
    flow.phase === 'paused' ? 'paused' :
    flow.phase === 'delivery' ? 'delivery' : 'pickup';

  if (!location) {
    return (
      <View style={s.loading}>
        <ActivityIndicator size="large" color="#CB1D00" />
        <Text style={s.loadingTxt}>{errorMsg ?? 'A obter localização...'}</Text>
      </View>
    );
  }

  return (
    <View style={s.container}>
      {/* ── MAPA ── */}
      <MapView
        ref={mapRef}
        style={s.map}
        provider={PROVIDER_GOOGLE}
        customMapStyle={MAP_STYLE}
        initialRegion={{
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {flow.routeCoords.length > 1 && (
          <Polyline coordinates={flow.routeCoords} strokeColor="#2D60FF" strokeWidth={4} />
        )}
        {flow.activeOrder && (flow.phase === 'pickup' || flow.phase === 'delivery' || flow.phase === 'paused') && (
          <>
            <Marker coordinate={flow.activeOrder.pickupCoords} anchor={{ x: 0.5, y: 0.5 }}>
              <PickupMarker />
            </Marker>
            <Marker coordinate={flow.activeOrder.deliveryCoords} anchor={{ x: 0.5, y: 0.5 }}>
              <DeliveryMarker />
            </Marker>
          </>
        )}
      </MapView>

      {/* ── STATUS BUTTON (centro topo) ── */}
      <TouchableOpacity
        style={[s.statusBtn, { backgroundColor: statusCfg.bg }]}
        onPress={() => flow.handleToggleOnline(currentLocation)}
        disabled={
          flow.phase === 'pickup' || flow.phase === 'delivery' ||
          flow.phase === 'confirm_delivery' || flow.phase === 'paused'
        }
      >
        <View style={[s.statusDot, { backgroundColor: statusCfg.dot }]} />
        <Text style={s.statusTxt}>{statusCfg.label}</Text>
      </TouchableOpacity>

      {/* ── CANCELAR (só pickup) ── */}
      {canCancel && (
        <TouchableOpacity style={s.cancelBtn} onPress={flow.handleCancel}>
          <Ionicons name="close" size={13} color="#fff" />
          <Text style={s.cancelTxt}>Cancelar entrega</Text>
        </TouchableOpacity>
      )}

      {/* ── DISTÂNCIA + SIM ── */}
      {showDistBadge && (
        <View style={s.distBadge}>
          <Text style={s.distTxt}>{flow.simDistance.toFixed(2)} km</Text>
          {/* REMOVER EM PRODUÇÃO */}
          <TouchableOpacity style={s.simBtn} onPress={flow.handleSimApproach}>
            <Text style={s.simTxt}>sim →</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── BOTÃO LOCALIZAÇÃO ── */}
      {locBtnBottom !== null && (
        <TouchableOpacity
          style={[s.locBtn, { bottom: locBtnBottom }]}
          onPress={() => {
            if (!location) return;
            mapRef.current?.animateToRegion({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              latitudeDelta: 0.01, longitudeDelta: 0.01,
            }, 800);
          }}
        >
          <Ionicons name="navigate" size={16} color="#2D60FF" />
          <Text style={s.locTxt}>A minha localização</Text>
        </TouchableOpacity>
      )}

      {/* ── BOTTOM SHEET ── */}
      <BottomSheet
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        backgroundStyle={s.sheetBg}
        handleIndicatorStyle={s.sheetHandle}
        onChange={setSnapIndex}
        style={{ marginBottom: TAB_BAR_HEIGHT }}
      >
        <BottomSheetScrollView
          style={s.sheetContent}
          contentContainerStyle={{ paddingBottom: 28 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* ── IDLE ── */}
          {flow.phase === 'idle' && (
            <View style={s.statsRow}>
              <View style={s.statCard}>
                <Ionicons name="wallet-outline" size={20} color="#85D5EB" />
                <Text style={s.statLabel}>Rendimento hoje</Text>
                <Text style={s.statValue}>
                  {earnings.days.length > 0
                    ? `${earnings.days[earnings.days.length - 1].earnings.toLocaleString('pt-AO')} Kz`
                    : '0 Kz'}
                </Text>
              </View>
              <View style={s.statCard}>
                <Ionicons name="flag-outline" size={20} color="#85D5EB" />
                <Text style={s.statLabel}>Objectivo</Text>
                {(() => {
                  const totalDel = earnings.days.reduce((s, d) => s + d.deliveries, 0);
                  const goal = 20;
                  const pct = Math.min(100, Math.round((totalDel / goal) * 100));
                  return (
                    <>
                      <View style={s.progressBar}>
                        <View style={[s.progressFill, { width: `${pct}%` }]} />
                      </View>
                      <Text style={s.progressTxt}>{totalDel} de {goal} entregas</Text>
                    </>
                  );
                })()}
              </View>
            </View>
          )}

          {/* ── ORDERS ── */}
          {flow.phase === 'orders' && (
            <View>
              <View style={s.ordersHeader}>
                <Text style={s.sectionTitle}>
                  {flow.orders.length} {flow.orders.length === 1 ? 'pedido' : 'pedidos'} disponíveis
                </Text>
                {flow.orders.length > 1 && (
                  <Text style={s.scrollHint}>Desliza →</Text>
                )}
              </View>
              <FlatList
                data={flow.orders}
                keyExtractor={o => o.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                snapToInterval={ORDER_CARD_WIDTH + 12}
                decelerationRate="fast"
                contentContainerStyle={{ paddingRight: 20, gap: 12 }}
                renderItem={({ item }) => (
                  <OrderCard
                    order={item}
                    isOnline={flow.isOnline}
                    onViewDetails={flow.handleViewOrderDetails}
                    onIgnore={flow.handleIgnoreOrder}
                  />
                )}
              />
            </View>
          )}

          {/* ── PICKUP / DELIVERY / PAUSED ── */}
          {(flow.phase === 'pickup' || flow.phase === 'delivery' || flow.phase === 'paused') && flow.activeOrder && (
            <PhaseContent
              phase={activePhaseForContent}
              order={flow.activeOrder}
              expanded={expanded}
              onToggle={() => setExpanded(e => !e)}
              onComplete={
                flow.phase === 'delivery'
                  ? flow.handleDeliveryComplete
                  : () => flow.handlePickupComplete(currentLocation)
              }
              onOpenChat={() => setChatVisible(true)}
              onOpenPauseSheet={() => flow.setPausaSheetVisible(true)}
              pausaMotivo={flow.pausaMotivo}
              pausaSegsRestantes={flow.pausaSegsRestantes}
              onResumePause={flow.handleResumePause}
            />
          )}

        </BottomSheetScrollView>
      </BottomSheet>

      {/* ── ORDER DETAILS MODAL ── */}
      <OrderDetailsModal
        order={flow.selectedOrderForDetails}
        visible={flow.phase === 'order_details' && flow.selectedOrderForDetails !== null}
        onClose={() => {
          flow.setSelectedOrderForDetails(null);
          flow.setPhase('orders');
        }}
        onAccept={(order, price) => flow.handleAcceptOrder(order, price, currentLocation)}
        isOnline={flow.isOnline}
      />

      {/* ── CHAT ── */}
      <ChatSheet
        visible={chatVisible}
        onClose={() => setChatVisible(false)}
        messages={flow.chatMessages}
        onSend={flow.handleSendMessage}
        clientName={flow.activeOrder?.clientName ?? 'Cliente'}
      />

      {/* ── CONFIRM DELIVERY ── */}
      <ConfirmDeliverySheet
        visible={flow.phase === 'confirm_delivery'}
        correctCode={flow.activeOrder?.codigoNumerico ?? ''}
        onConfirmed={(metodo, codigo) => flow.handleConfirmDelivery(metodo, codigo, currentLocation ?? undefined)}
        onClose={() => flow.setPhase('delivery')}
      />

      {/* ── PAUSE SHEET ── */}
      <PauseSheet
        visible={flow.pausaSheetVisible}
        onConfirm={motivo =>
          flow.handleStartPause(
            motivo,
            flow.phase === 'delivery' ? 'delivery' : 'pickup',
          )
        }
        onClose={() => flow.setPausaSheetVisible(false)}
      />

      {/* ── RATING ── */}
      <RatingModal
        visible={flow.ratingVisible}
        clientName={flow.activeOrder?.clientName ?? 'cliente'}
        earnedKz={flow.agreedPrice}
        onClose={flow.handleRatingClose}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1F2933' },
  map: { flex: 1 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1F2933', gap: 12 },
  loadingTxt: { color: '#fff', fontFamily: 'Poppins_500Medium', fontSize: 14 },

  statusBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 54 : 40,
    alignSelf: 'center', left: '50%', transform: [{ translateX: -62 }],
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 18, paddingVertical: 10,
    borderRadius: 24, gap: 8, elevation: 8, zIndex: 10,
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 4,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusTxt: { color: '#fff', fontFamily: 'Poppins_500Medium', fontSize: 13 },

  cancelBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 54 : 40, left: 16,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#1F2933', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 9,
    elevation: 6, zIndex: 10,
  },
  cancelTxt: { color: '#fff', fontFamily: 'Poppins_400Regular', fontSize: 12 },

  distBadge: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 54 : 40, right: 16,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#1F2933', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 9,
    elevation: 6, zIndex: 10,
  },
  distTxt: { color: '#fff', fontFamily: 'Poppins_600SemiBold', fontSize: 13 },
  simBtn: { backgroundColor: '#CB1D00', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  simTxt: { color: '#fff', fontSize: 10, fontFamily: 'Poppins_500Medium' },

  locBtn: {
    position: 'absolute', left: 16,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1F2933', paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 22, gap: 8, elevation: 8, zIndex: 20,
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 4,
  },
  locTxt: { color: '#fff', fontFamily: 'Poppins_400Regular', fontSize: 13 },

  sheetBg: { backgroundColor: '#1F2933', borderTopLeftRadius: 22, borderTopRightRadius: 22 },
  sheetHandle: { backgroundColor: '#ffffff30', width: 40 },
  sheetContent: { flex: 1, paddingHorizontal: 20, paddingTop: 12 },

  ordersHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 14,
  },
  sectionTitle: { fontSize: 14, color: '#fff', fontFamily: 'Poppins_600SemiBold' },
  scrollHint: { fontSize: 11, color: '#9CA3AF', fontFamily: 'Poppins_400Regular' },

  statsRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  statCard: { flex: 1, backgroundColor: '#253040', borderRadius: 18, padding: 16, gap: 6 },
  statLabel: { color: '#9CA3AF', fontFamily: 'Poppins_400Regular', fontSize: 12 },
  statValue: { color: '#fff', fontFamily: 'Poppins_600SemiBold', fontSize: 15 },
  progressBar: { height: 6, backgroundColor: '#ffffff20', borderRadius: 3, marginTop: 4 },
  progressFill: { height: 6, backgroundColor: '#CB1D00', borderRadius: 3 },
  progressTxt: { color: '#9CA3AF', fontFamily: 'Poppins_400Regular', fontSize: 11, textAlign: 'right' },
});