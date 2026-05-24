// src/pages/client/mainClient/history.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, Pressable, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { themes } from '../../../../global/themes';
import api from '../../../../components/modules/services/api/api';

// ── Tipos ──────────────────────────────────────────────────────────────────
interface HistoryItem {
  id: string;
  numeroPedido: string;
  origemEndereco: string;
  destinoEndereco: string;
  valorEntrega: number;
  distanciaKm: number;
  status: 'entregue' | 'cancelado' | 'a_procurar_motoqueiro' | 'motoqueiro_atribuido' | 'recolhido' | 'entregando';
  criadoEm: string;
  entregueEm?: string;
  canceladoEm?: string;
  motivoCancelamento?: string;
  motoqueiro?: { user?: { nome?: string } };
}

// ── Helpers ────────────────────────────────────────────────────────────────
function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 60) return `há ${diffMins}min`;
  if (diffHours < 24) return `há ${diffHours}h`;
  if (diffDays === 1) return 'ontem';
  const months = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
  return `${date.getDate()} ${months[date.getMonth()]}`;
}

function getTypeConfig(status: HistoryItem['status']) {
  const entregue = status === 'entregue';
  return {
    icon: entregue ? ('checkmark-circle' as const) : ('close-circle' as const),
    color: entregue ? '#2D60FF' : '#EF4444',
    bg: entregue ? '#2D60FF18' : '#EF444418',
    label: entregue ? 'Confirmada' : 'Cancelada',
    labelColor: entregue ? '#2D60FF' : '#EF4444',
    labelBg: entregue ? '#2D60FF15' : '#EF444415',
  };
}

function fmtKz(val: number) {
  return `${Number(val).toLocaleString('pt-AO')} Kz`;
}

// ── Modais ─────────────────────────────────────────────────────────────────
function DetailModal({ item, visible, onClose }: { item: HistoryItem; visible: boolean; onClose: () => void }) {
  const cfg = getTypeConfig(item.status);
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <Pressable style={s.modalOverlay} onPress={onClose}>
        <Pressable style={s.modalBox} onPress={() => {}}>
          <View style={[s.modalIconWrap, { backgroundColor: cfg.bg }]}>
            <Ionicons name={cfg.icon} size={30} color={cfg.color} />
          </View>
          <View style={[s.modalBadge, { backgroundColor: cfg.labelBg }]}>
            <Text style={[s.modalBadgeTxt, { color: cfg.labelColor }]}>{cfg.label}</Text>
          </View>
          <Text style={s.modalTitle}>{item.numeroPedido}</Text>
          <Text style={s.modalDate}>{formatDate(item.criadoEm)}</Text>
          <View style={s.modalDivider} />
          <View style={s.modalRoute}>
            <View style={s.modalRouteRow}>
              <View style={[s.modalRouteDot, { backgroundColor: '#2D60FF' }]} />
              <View style={{ flex: 1 }}>
                <Text style={s.modalRouteLabel}>Recolha</Text>
                <Text style={s.modalRouteAddr}>{item.origemEndereco}</Text>
              </View>
            </View>
            <View style={s.modalRouteConnector} />
            <View style={s.modalRouteRow}>
              <View style={[s.modalRouteDot, { backgroundColor: '#EF4444' }]} />
              <View style={{ flex: 1 }}>
                <Text style={s.modalRouteLabel}>Entrega</Text>
                <Text style={s.modalRouteAddr}>{item.destinoEndereco}</Text>
              </View>
            </View>
          </View>
          <View style={s.modalMetrics}>
            <View style={s.modalMetricItem}>
              <Ionicons name="navigate-outline" size={16} color="#9CA3AF" />
              <Text style={s.modalMetricVal}>{Number(item.distanciaKm).toFixed(1)} km</Text>
            </View>
            <View style={s.modalMetricDivider} />
            <View style={s.modalMetricItem}>
              <Ionicons name="wallet-outline" size={16} color="#9CA3AF" />
              <Text style={s.modalMetricVal}>{fmtKz(item.valorEntrega)}</Text>
            </View>
          </View>
          {item.motivoCancelamento && (
            <Text style={[s.modalMessage, { color: '#EF4444' }]}>
              Motivo: {item.motivoCancelamento}
            </Text>
          )}
          <TouchableOpacity style={s.modalCloseBtn} onPress={onClose}>
            <Text style={s.modalCloseBtnText}>Fechar</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function DeleteModal({ item, visible, onClose, onConfirm }: { item: HistoryItem; visible: boolean; onClose: () => void; onConfirm: () => void }) {
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <Pressable style={s.modalOverlay} onPress={onClose}>
        <Pressable style={s.modalBox} onPress={() => {}}>
          <View style={[s.modalIconWrap, { backgroundColor: '#EF444420' }]}>
            <Ionicons name="trash-outline" size={28} color="#EF4444" />
          </View>
          <Text style={s.modalTitle}>Remover do histórico?</Text>
          <Text style={s.modalMessage}>
            Tens a certeza que queres remover o pedido "{item.numeroPedido}"?
          </Text>
          <View style={s.modalActions}>
            <TouchableOpacity style={s.modalCancelBtn} onPress={onClose}>
              <Text style={s.modalCancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.modalDeleteBtn} onPress={onConfirm}>
              <Ionicons name="trash-outline" size={15} color="#fff" />
              <Text style={s.modalDeleteText}>Remover</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ── Card ───────────────────────────────────────────────────────────────────
function HistoryCard({ item, onDelete }: { item: HistoryItem; onDelete: (id: string) => void }) {
  const [detailVisible, setDetailVisible] = useState(false);
  const [deleteVisible, setDeleteVisible] = useState(false);
  const cfg = getTypeConfig(item.status);

  return (
    <>
      <DetailModal item={item} visible={detailVisible} onClose={() => setDetailVisible(false)} />
      <DeleteModal
        item={item}
        visible={deleteVisible}
        onClose={() => setDeleteVisible(false)}
        onConfirm={() => { setDeleteVisible(false); onDelete(item.id); }}
      />
      <TouchableOpacity
        style={[s.card, item.status !== 'entregue' && item.status !== 'cancelado' && s.cardRead]}
        onPress={() => setDetailVisible(true)}
        activeOpacity={0.8}
      >
        <View style={[s.cardStripe, { backgroundColor: cfg.color }]} />
        <View style={[s.iconContainer, { backgroundColor: cfg.bg }]}>
          <Ionicons name={cfg.icon} size={21} color={cfg.color} />
        </View>
        <View style={s.cardContent}>
          <View style={s.cardHeader}>
            <Text style={s.cardTitle} numberOfLines={1}>{item.numeroPedido}</Text>
            <View style={s.cardHeaderRight}>
              <Text style={s.cardDate}>{formatDate(item.criadoEm)}</Text>
            </View>
          </View>
          <View style={s.cardRoute}>
            <Text style={s.cardRouteText} numberOfLines={1}>
              {item.origemEndereco} → {item.destinoEndereco}
            </Text>
          </View>
          <Text style={s.cardMessage} numberOfLines={1}>
            {fmtKz(item.valorEntrega)} · {Number(item.distanciaKm).toFixed(1)} km
          </Text>
          <View style={s.cardFooter}>
            <View style={[s.cardBadge, { backgroundColor: cfg.labelBg }]}>
              <Text style={[s.cardBadgeTxt, { color: cfg.labelColor }]}>{cfg.label}</Text>
            </View>
            <View style={s.cardActions}>
              <TouchableOpacity
                style={[s.actionBtn, { backgroundColor: '#2D60FF15' }]}
                onPress={() => setDetailVisible(true)}
              >
                <Ionicons name="eye-outline" size={15} color="#2D60FF" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.actionBtn, { backgroundColor: '#EF444415' }]}
                onPress={() => setDeleteVisible(true)}
              >
                <Ionicons name="trash-outline" size={15} color="#EF4444" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </>
  );
}

// ── Página ─────────────────────────────────────────────────────────────────
export default function History() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<any>();

  const carregar = useCallback(async () => {
    try {
      const res = await api.get('/pedidos/meus');
      // Mostrar só entregues e cancelados no histórico
      const filtrados = (res.data || []).filter(
        (p: HistoryItem) => p.status === 'entregue' || p.status === 'cancelado',
      );
      setHistory(filtrados);
    } catch (error) {
      console.warn('Erro ao carregar histórico:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const confirmed = history.filter((h) => h.status === 'entregue').length;
  const cancelled = history.filter((h) => h.status === 'cancelado').length;

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity
          style={s.menuBtn}
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
        >
          <Ionicons name="menu" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Histórico</Text>
        {history.length > 0 ? (
          <TouchableOpacity onPress={() => setHistory([])}>
            <Text style={s.clearAll}>Limpar</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 50 }} />
        )}
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#2D60FF" />
        </View>
      ) : (
        <>
          {history.length > 0 && (
            <View style={s.summary}>
              <View style={s.summaryItem}>
                <Text style={s.summaryNum}>{confirmed}</Text>
                <Text style={s.summaryLabel}>Confirmadas</Text>
              </View>
              <View style={s.summaryDivider} />
              <View style={s.summaryItem}>
                <Text style={[s.summaryNum, { color: '#EF4444' }]}>{cancelled}</Text>
                <Text style={s.summaryLabel}>Canceladas</Text>
              </View>
              <View style={s.summaryDivider} />
              <View style={s.summaryItem}>
                <Text style={s.summaryNum}>{history.length}</Text>
                <Text style={s.summaryLabel}>Total</Text>
              </View>
            </View>
          )}

          {history.length === 0 ? (
            <View style={s.emptyState}>
              <View style={s.emptyIconWrap}>
                <Ionicons name="time-outline" size={40} color="#4B5563" />
              </View>
              <Text style={s.emptyTitle}>Sem histórico</Text>
              <Text style={s.emptySubtitle}>
                As tuas entregas anteriores vão aparecer aqui.
              </Text>
            </View>
          ) : (
            <ScrollView
              contentContainerStyle={s.list}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={() => { setRefreshing(true); carregar(); }}
                  tintColor="#2D60FF"
                />
              }
            >
              {history.map((item) => (
                <HistoryCard
                  key={item.id}
                  item={item}
                  onDelete={(id) => setHistory((prev) => prev.filter((h) => h.id !== id))}
                />
              ))}
            </ScrollView>
          )}
        </>
      )}
    </View>
  );
}

// ── Estilos (mantidos do original) ─────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121921' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#1E2A35' },
  menuBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontFamily: themes.fonts.poppinsSemi, color: '#fff' },
  clearAll: { fontSize: 13, fontFamily: themes.fonts.poppinsMedium, color: '#EF4444', width: 50, textAlign: 'right' },
  summary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', marginHorizontal: 16, marginTop: 14, marginBottom: 4, backgroundColor: '#1E2A35', borderRadius: 16, paddingVertical: 14 },
  summaryItem: { alignItems: 'center', flex: 1 },
  summaryNum: { fontSize: 20, fontFamily: themes.fonts.poppinsBold, color: '#2D60FF' },
  summaryLabel: { fontSize: 11, fontFamily: themes.fonts.poppinsRegular, color: '#6B7280', marginTop: 2 },
  summaryDivider: { width: 1, height: 28, backgroundColor: '#2D3748' },
  list: { padding: 16, gap: 10, paddingBottom: 100 },
  card: { backgroundColor: '#1E2A35', borderRadius: 16, padding: 14, flexDirection: 'row', gap: 12, overflow: 'hidden' },
  cardRead: { opacity: 0.55 },
  cardStripe: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, borderRadius: 2 },
  iconContainer: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  cardContent: { flex: 1, gap: 4 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  cardHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0 },
  cardTitle: { flex: 1, fontSize: 13, fontFamily: themes.fonts.poppinsSemi, color: '#fff' },
  cardDate: { fontSize: 11, fontFamily: themes.fonts.poppinsRegular, color: '#6B7280' },
  cardRoute: { backgroundColor: '#ffffff08', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  cardRouteText: { fontSize: 11, fontFamily: themes.fonts.poppinsRegular, color: '#9CA3AF' },
  cardMessage: { fontSize: 12, fontFamily: themes.fonts.poppinsRegular, color: '#6B7280', lineHeight: 18 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  cardBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  cardBadgeTxt: { fontSize: 10, fontFamily: themes.fonts.poppinsMedium },
  cardActions: { flexDirection: 'row', gap: 6 },
  actionBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  modalBox: { backgroundColor: '#1E2A35', borderRadius: 24, padding: 24, alignItems: 'center', gap: 10, width: '100%' },
  modalIconWrap: { width: 66, height: 66, borderRadius: 33, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  modalBadge: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 4 },
  modalBadgeTxt: { fontSize: 11, fontFamily: themes.fonts.poppinsMedium },
  modalTitle: { fontSize: 17, fontFamily: themes.fonts.poppinsBold, color: '#fff', textAlign: 'center' },
  modalDate: { fontSize: 12, fontFamily: themes.fonts.poppinsRegular, color: '#6B7280' },
  modalDivider: { width: '100%', height: 1, backgroundColor: '#2D3748', marginVertical: 2 },
  modalRoute: { width: '100%', gap: 0 },
  modalRouteRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  modalRouteDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4, flexShrink: 0 },
  modalRouteLabel: { fontSize: 10, fontFamily: themes.fonts.poppinsRegular, color: '#6B7280' },
  modalRouteAddr: { fontSize: 13, fontFamily: themes.fonts.poppinsMedium, color: '#e2e8f0' },
  modalRouteConnector: { width: 2, height: 12, backgroundColor: '#2D3748', marginLeft: 4, marginVertical: 2 },
  modalMetrics: { flexDirection: 'row', width: '100%', backgroundColor: '#253040', borderRadius: 14, paddingVertical: 12 },
  modalMetricItem: { flex: 1, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 },
  modalMetricDivider: { width: 1, backgroundColor: '#2D3748' },
  modalMetricVal: { fontSize: 13, fontFamily: themes.fonts.poppinsSemi, color: '#fff' },
  modalMessage: { fontSize: 13, fontFamily: themes.fonts.poppinsRegular, color: '#9CA3AF', textAlign: 'center', lineHeight: 21 },
  modalCloseBtn: { width: '100%', backgroundColor: '#2D60FF', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  modalCloseBtnText: { fontSize: 15, fontFamily: themes.fonts.poppinsSemi, color: '#fff' },
  modalActions: { flexDirection: 'row', gap: 10, width: '100%', marginTop: 4 },
  modalCancelBtn: { flex: 1, backgroundColor: '#2D3748', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  modalCancelText: { fontSize: 15, fontFamily: themes.fonts.poppinsSemi, color: '#fff' },
  modalDeleteBtn: { flex: 1, flexDirection: 'row', gap: 6, backgroundColor: '#EF4444', borderRadius: 14, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  modalDeleteText: { fontSize: 15, fontFamily: themes.fonts.poppinsSemi, color: '#fff' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 40 },
  emptyIconWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#1E2A35', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  emptyTitle: { fontSize: 18, fontFamily: themes.fonts.poppinsSemi, color: '#fff' },
  emptySubtitle: { fontSize: 13, fontFamily: themes.fonts.poppinsRegular, color: '#6B7280', textAlign: 'center', lineHeight: 20 },
});