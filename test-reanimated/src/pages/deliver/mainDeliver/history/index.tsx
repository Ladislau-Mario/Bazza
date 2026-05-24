// src/pages/deliver/mainDeliver/history/index.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, Pressable, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { themes } from '../../../../global/themes';
import api from '../../../../components/modules/services/api/api';

// ── Tipos ──────────────────────────────────────────────────────────────────
type DeliveryStatus = 'entregue' | 'cancelado' | 'recolhido' | 'entregando';

interface DeliveryItem {
  id: string;
  numeroPedido: string;
  clienteNome: string;
  origemEndereco: string;
  destinoEndereco: string;
  valorGanho: number;       // o que o estafeta recebeu
  valorEntrega: number;     // valor total da entrega
  distanciaKm: number;
  duracaoMin: number;
  status: DeliveryStatus;
  criadoEm: string;
  entregueEm?: string;
  canceladoEm?: string;
  motivoCancelamento?: string;
}


// ── Helpers ────────────────────────────────────────────────────────────────
function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now   = new Date();
  const diffMs    = now.getTime() - date.getTime();
  const diffMins  = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays  = Math.floor(diffMs / 86400000);
  if (diffMins  < 60) return `há ${diffMins}min`;
  if (diffHours < 24) return `há ${diffHours}h`;
  if (diffDays  === 1) return 'ontem';
  const months = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
  return `${date.getDate()} ${months[date.getMonth()]}`;
}

function getCfg(status: DeliveryStatus) {
  const ok = status === 'entregue';
  return {
    icon:       ok ? ('checkmark-circle' as const) : ('close-circle' as const),
    color:      ok ? '#22D07A' : '#EF4444',
    bg:         ok ? '#22D07A18' : '#EF444418',
    label:      ok ? 'Entregue'  : 'Cancelado',
    labelColor: ok ? '#22D07A' : '#EF4444',
    labelBg:    ok ? '#22D07A15' : '#EF444415',
  };
}

function fmtKz(val: number) { return `${Number(val).toLocaleString('pt-AO')} Kz`; }

// ── Modal de detalhe ───────────────────────────────────────────────────────
function DetailModal({ item, visible, onClose }: { item: DeliveryItem; visible: boolean; onClose: () => void }) {
  const cfg = getCfg(item.status);
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

          {/* Cliente */}
          <View style={s.modalClientRow}>
            <Ionicons name="person-outline" size={14} color="#6B7280" />
            <Text style={s.modalClientTxt}>{item.clienteNome}</Text>
          </View>

          <View style={s.modalDivider} />

          {/* Rota */}
          <View style={s.modalRoute}>
            <View style={s.modalRouteRow}>
              <View style={[s.modalRouteDot, { backgroundColor: '#3B7BFF' }]} />
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

          {/* Métricas — 3 colunas para o deliver */}
          <View style={s.modalMetrics}>
            <View style={s.modalMetricItem}>
              <Ionicons name="navigate-outline" size={15} color="#9CA3AF" />
              <Text style={s.modalMetricVal}>{Number(item.distanciaKm).toFixed(1)} km</Text>
            </View>
            <View style={s.modalMetricDivider} />
            <View style={s.modalMetricItem}>
              <Ionicons name="time-outline" size={15} color="#9CA3AF" />
              <Text style={s.modalMetricVal}>{item.duracaoMin > 0 ? `${item.duracaoMin}min` : '—'}</Text>
            </View>
            <View style={s.modalMetricDivider} />
            <View style={s.modalMetricItem}>
              <Ionicons name="wallet-outline" size={15} color="#22D07A" />
              <Text style={[s.modalMetricVal, { color: '#22D07A' }]}>{fmtKz(item.valorGanho)}</Text>
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

// ── Modal de eliminar ──────────────────────────────────────────────────────
function DeleteModal({ item, visible, onClose, onConfirm }: { item: DeliveryItem; visible: boolean; onClose: () => void; onConfirm: () => void }) {
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
function DeliveryCard({ item, onDelete }: { item: DeliveryItem; onDelete: (id: string) => void }) {
  const [detailVisible, setDetailVisible] = useState(false);
  const [deleteVisible, setDeleteVisible] = useState(false);
  const cfg = getCfg(item.status);

  return (
    <>
      <DetailModal item={item} visible={detailVisible} onClose={() => setDetailVisible(false)} />
      <DeleteModal
        item={item}
        visible={deleteVisible}
        onClose={() => setDeleteVisible(false)}
        onConfirm={() => { setDeleteVisible(false); onDelete(item.id); }}
      />

      <TouchableOpacity style={s.card} onPress={() => setDetailVisible(true)} activeOpacity={0.8}>
        {/* Stripe lateral */}
        <View style={[s.cardStripe, { backgroundColor: cfg.color }]} />

        <View style={[s.iconContainer, { backgroundColor: cfg.bg }]}>
          <Ionicons name={cfg.icon} size={20} color={cfg.color} />
        </View>

        <View style={s.cardContent}>
          {/* Header: número + data */}
          <View style={s.cardHeader}>
            <Text style={s.cardTitle}>{item.numeroPedido}</Text>
            <Text style={s.cardDate}>{formatDate(item.criadoEm)}</Text>
          </View>

          {/* Cliente */}
          <View style={s.cardClientRow}>
            <Ionicons name="person-outline" size={12} color="#6B7280" />
            <Text style={s.cardClientTxt}>{item.clienteNome}</Text>
          </View>

          {/* Rota resumida */}
          <View style={s.cardRoute}>
            <Ionicons name="locate-outline" size={11} color="#3B7BFF" />
            <Text style={s.cardRouteText} numberOfLines={1}>{item.origemEndereco}</Text>
            <Ionicons name="arrow-forward" size={11} color="#566070" />
            <Ionicons name="location-outline" size={11} color="#EF4444" />
            <Text style={s.cardRouteText} numberOfLines={1}>{item.destinoEndereco}</Text>
          </View>

          {/* Footer: badge + métricas + acções */}
          <View style={s.cardFooter}>
            <View style={[s.cardBadge, { backgroundColor: cfg.labelBg }]}>
              <Text style={[s.cardBadgeTxt, { color: cfg.labelColor }]}>{cfg.label}</Text>
            </View>

            <View style={s.cardMetrics}>
              <Text style={s.cardMetricTxt}>{Number(item.distanciaKm).toFixed(1)} km</Text>
              <Text style={s.cardMetricSep}>·</Text>
              <Text style={[s.cardMetricTxt, { color: '#22D07A', fontFamily: themes.fonts.poppinsSemi }]}>
                {fmtKz(item.valorGanho)}
              </Text>
            </View>

            <View style={s.cardActions}>
              <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#ffffff08' }]} onPress={() => setDetailVisible(true)}>
                <Ionicons name="eye-outline" size={15} color="#9CA3AF" />
              </TouchableOpacity>
              <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#EF444415' }]} onPress={() => setDeleteVisible(true)}>
                <Ionicons name="trash-outline" size={15} color="#EF4444" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </>
  );
}

// ── Página principal ───────────────────────────────────────────────────────
export default function DeliverHistory() {
  const [history,    setHistory]    = useState<DeliveryItem[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<any>();

  const carregar = useCallback(async () => {
    try {
      const res = await api.get('/pedidos/meus');
      const mapped = (res.data || []).map((p: any) => ({
        id: p.id,
        numeroPedido: p.numeroPedido,
        clienteNome: p.cliente?.nome || p.clienteNome || 'Cliente',
        origemEndereco: p.origemEndereco,
        destinoEndereco: p.destinoEndereco,
        valorGanho: Math.round(Number(p.valorEntrega || 0) * 0.85),
        valorEntrega: Number(p.valorEntrega || 0),
        distanciaKm: Number(p.distanciaKm || 0),
        duracaoMin: Number(p.duracaoMinutos || p.duracaoMin || 0),
        status: p.status,
        criadoEm: p.criadoEm,
        entregueEm: p.entregueEm,
        canceladoEm: p.canceladoEm,
        motivoCancelamento: p.motivoCancelamento,
      }));
      const filtrados = mapped.filter(
        (p: DeliveryItem) => p.status === 'entregue' || p.status === 'cancelado',
      );
      setHistory(filtrados);
    } catch (err) {
      console.warn('Erro ao carregar histórico:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const entregues  = history.filter(h => h.status === 'entregue').length;
  const cancelados = history.filter(h => h.status === 'cancelado').length;
  const totalGanho = history.filter(h => h.status === 'entregue').reduce((s, h) => s + Number(h.valorGanho || 0), 0);
  const totalKm    = history.reduce((s, h) => s + Number(h.distanciaKm || 0), 0);

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
         <TouchableOpacity
            style={s.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={20} color="#fff" />
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
          <ActivityIndicator size="large" color="#3B7BFF" />
        </View>
      ) : (
        <>
          {/* Resumo — 4 métricas relevantes para o estafeta */}
          {history.length > 0 && (
            <View style={s.summary}>
              <View style={s.summaryItem}>
                <Text style={[s.summaryNum, { color: '#22D07A' }]}>{entregues}</Text>
                <Text style={s.summaryLabel}>Entregues</Text>
              </View>
              <View style={s.summaryDivider} />
              <View style={s.summaryItem}>
                <Text style={[s.summaryNum, { color: '#EF4444' }]}>{cancelados}</Text>
                <Text style={s.summaryLabel}>Cancelados</Text>
              </View>
              <View style={s.summaryDivider} />
              <View style={s.summaryItem}>
                <Text style={[s.summaryNum, { color: '#22D07A', fontSize: 14 }]}>{fmtKz(totalGanho)}</Text>
                <Text style={s.summaryLabel}>Total ganho</Text>
              </View>
              <View style={s.summaryDivider} />
              <View style={s.summaryItem}>
                <Text style={[s.summaryNum, { color: '#3B7BFF' }]}>{totalKm.toFixed(0)} km</Text>
                <Text style={s.summaryLabel}>Percorridos</Text>
              </View>
            </View>
          )}

          {history.length === 0 ? (
            <View style={s.emptyState}>
              <View style={s.emptyIconWrap}>
                <Ionicons name="bicycle-outline" size={40} color="#4B5563" />
              </View>
              <Text style={s.emptyTitle}>Sem histórico</Text>
              <Text style={s.emptySubtitle}>As tuas entregas concluídas vão aparecer aqui.</Text>
            </View>
          ) : (
            <ScrollView
              contentContainerStyle={s.list}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={() => { setRefreshing(true); carregar(); }}
                  tintColor="#3B7BFF"
                />
              }
            >
              {history.map(item => (
                <DeliveryCard
                  key={item.id}
                  item={item}
                  onDelete={id => setHistory(prev => prev.filter(h => h.id !== id))}
                />
              ))}
            </ScrollView>
          )}
        </>
      )}
    </View>
  );
}

// ── Estilos ────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#121921' },
  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#1E2A35' },
  headerTitle: { fontSize: 18, fontFamily: themes.fonts.poppinsSemi, color: '#fff' },
  clearAll:    { fontSize: 13, fontFamily: themes.fonts.poppinsMedium, color: '#EF4444', width: 50, textAlign: 'right' },

  summary:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', marginHorizontal: 16, marginTop: 14, marginBottom: 4, backgroundColor: '#1E2A35', borderRadius: 16, paddingVertical: 14 },
  summaryItem:    { alignItems: 'center', flex: 1 },
  summaryNum:     { fontSize: 18, fontFamily: themes.fonts.poppinsBold, color: '#3B7BFF' },
  summaryLabel:   { fontSize: 10, fontFamily: themes.fonts.poppinsRegular, color: '#6B7280', marginTop: 2 },
  summaryDivider: { width: 1, height: 28, backgroundColor: '#2D3748' },

  list: { padding: 16, gap: 10, paddingBottom: 100 },

  card:          { backgroundColor: '#1E2A35', borderRadius: 16, padding: 14, paddingLeft: 18, flexDirection: 'row', gap: 12, overflow: 'hidden' },
  cardStripe:    { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, borderRadius: 2 },
  iconContainer: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  cardContent:   { flex: 1, gap: 5 },
  cardHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle:     { fontSize: 13, fontFamily: themes.fonts.poppinsSemi, color: '#fff' },
  cardDate:      { fontSize: 11, fontFamily: themes.fonts.poppinsRegular, color: '#6B7280' },
  cardClientRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  cardClientTxt: { fontSize: 12, fontFamily: themes.fonts.poppinsRegular, color: '#9CA3AF' },
  cardRoute:     { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#ffffff08', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5 },
  cardRouteText: { flex: 1, fontSize: 10, fontFamily: themes.fonts.poppinsRegular, color: '#9CA3AF' },
  cardFooter:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  cardBadge:     { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  cardBadgeTxt:  { fontSize: 10, fontFamily: themes.fonts.poppinsMedium },
  cardMetrics:   { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 5 },
  cardMetricTxt: { fontSize: 11, fontFamily: themes.fonts.poppinsRegular, color: '#6B7280' },
  cardMetricSep: { fontSize: 11, color: '#374151' },
  cardActions:   { flexDirection: 'row', gap: 6 },
  actionBtn:     { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },

  modalOverlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  modalBox:          { backgroundColor: '#1E2A35', borderRadius: 24, padding: 24, alignItems: 'center', gap: 10, width: '100%' },
  modalIconWrap:     { width: 66, height: 66, borderRadius: 33, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  modalBadge:        { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 4 },
  modalBadgeTxt:     { fontSize: 11, fontFamily: themes.fonts.poppinsMedium },
  modalTitle:        { fontSize: 17, fontFamily: themes.fonts.poppinsBold, color: '#fff', textAlign: 'center' },
  modalDate:         { fontSize: 12, fontFamily: themes.fonts.poppinsRegular, color: '#6B7280' },
  modalClientRow:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  modalClientTxt:    { fontSize: 13, fontFamily: themes.fonts.poppinsMedium, color: '#9CA3AF' },
  modalDivider:      { width: '100%', height: 1, backgroundColor: '#2D3748', marginVertical: 2 },
  modalRoute:        { width: '100%', gap: 0 },
  modalRouteRow:     { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  modalRouteDot:     { width: 10, height: 10, borderRadius: 5, marginTop: 4, flexShrink: 0 },
  modalRouteLabel:   { fontSize: 10, fontFamily: themes.fonts.poppinsRegular, color: '#6B7280' },
  modalRouteAddr:    { fontSize: 13, fontFamily: themes.fonts.poppinsMedium, color: '#e2e8f0' },
  modalRouteConnector: { width: 2, height: 12, backgroundColor: '#2D3748', marginLeft: 4, marginVertical: 2 },
  modalMetrics:      { flexDirection: 'row', width: '100%', backgroundColor: '#253040', borderRadius: 14, paddingVertical: 12 },
  modalMetricItem:   { flex: 1, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 },
  modalMetricDivider:{ width: 1, backgroundColor: '#2D3748' },
  modalMetricVal:    { fontSize: 13, fontFamily: themes.fonts.poppinsSemi, color: '#fff' },
  modalMessage:      { fontSize: 13, fontFamily: themes.fonts.poppinsRegular, color: '#9CA3AF', textAlign: 'center', lineHeight: 21 },
  modalCloseBtn:     { width: '100%', backgroundColor: '#3B7BFF', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  modalCloseBtnText: { fontSize: 15, fontFamily: themes.fonts.poppinsSemi, color: '#fff' },
  modalActions:      { flexDirection: 'row', gap: 10, width: '100%', marginTop: 4 },
  modalCancelBtn:    { flex: 1, backgroundColor: '#2D3748', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  modalCancelText:   { fontSize: 15, fontFamily: themes.fonts.poppinsSemi, color: '#fff' },
  modalDeleteBtn:    { flex: 1, flexDirection: 'row', gap: 6, backgroundColor: '#EF4444', borderRadius: 14, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  modalDeleteText:   { fontSize: 15, fontFamily: themes.fonts.poppinsSemi, color: '#fff' },

  emptyState:    { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 40 },
  emptyIconWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#1E2A35', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  emptyTitle:    { fontSize: 18, fontFamily: themes.fonts.poppinsSemi, color: '#fff' },
  emptySubtitle: { fontSize: 13, fontFamily: themes.fonts.poppinsRegular, color: '#6B7280', textAlign: 'center', lineHeight: 20 },

   backBtn: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: '#141E2B',
    borderWidth: 1,
    borderColor: '#FFFFFF0D',
    alignItems: 'center',
    justifyContent: 'center',
  },

});