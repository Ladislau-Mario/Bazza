// src/pages/deliver/mainDeliver/documents/index.tsx
import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  ScrollView, Alert, Platform, StatusBar,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { themes } from '../../../../global/themes';
import api from '../../../../components/modules/services/api/api';
import { PickerService } from '../../../../components/modules/services/pickerService/pickerService';
import { enviarFicheiro } from '../../../../components/modules/services/api/uploadService';
import { useAuthImage } from '../../../../components/common/useAuthImage';
import { DocumentViewer } from '../../../../components/common/DocumentViewer';

// ── Thumbnail autenticado ──────────────────────────────────────────────────
function DocThumbnail({ uploadId, version }: { uploadId: string; version: number }) {
  const { dataUrl, loading, error } = useAuthImage(`/uploads/${uploadId}/download`);

  if (loading) {
    return (
      <View style={s.thumbPlaceholder}>
        <ActivityIndicator size="small" color="#3B7BFF" />
      </View>
    );
  }
  if (error || !dataUrl) {
    return (
      <View style={s.thumbPlaceholder}>
        <Ionicons name="image-outline" size={20} color="#5A6B7B" />
      </View>
    );
  }
  return <Image source={{ uri: dataUrl }} style={s.thumbnail} resizeMode="cover" />;
}

// ── Tipos ──────────────────────────────────────────────────────────────────
interface Documento {
  id: string;
  tipo: string;
  nomeOriginal: string;
  mimeType: string;
  tamanho: number;
  criadoEm: string;
}

// ── Configuracao dos tipos de documento ─────────────────────────────────────
const DOC_CONFIG: Record<string, { label: string; icon: string; uploadTipo: string }> = {
  'documento_bi_frente':    { label: 'BI - Frente',        icon: 'card-outline',      uploadTipo: 'documento-bi-frente' },
  'documento_bi_verso':     { label: 'BI - Verso',         icon: 'card-outline',      uploadTipo: 'documento-bi-verso' },
  'documento_carta_frente': { label: 'Carta - Frente',     icon: 'document-outline',  uploadTipo: 'documento-carta-frente' },
  'documento_carta_verso':  { label: 'Carta - Verso',      icon: 'document-outline',  uploadTipo: 'documento-carta-verso' },
  'foto_veiculo':           { label: 'Foto Veiculo',       icon: 'car-outline',       uploadTipo: 'foto-veiculo' },
  'foto_placa':             { label: 'Foto Placa',         icon: 'license-outline',   uploadTipo: 'foto-placa' },
  'foto_perfil':            { label: 'Foto Perfil',        icon: 'person-outline',    uploadTipo: 'foto-perfil' },
};

const ALL_DOC_TYPES = [
  'documento_bi_frente',
  'documento_bi_verso',
  'documento_carta_frente',
  'documento_carta_verso',
  'foto_veiculo',
  'foto_placa',
  'foto_perfil',
];

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── Pagina principal ───────────────────────────────────────────────────────
export default function DeliverDocuments() {
  const navigation = useNavigation<any>();
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploadingTipo, setUploadingTipo] = useState<string | null>(null);
  const [viewerDoc, setViewerDoc] = useState<{ uploadId: string; label: string; mimeType: string } | null>(null);
  const [docVersion, setDocVersion] = useState(0);

  const carregarDocumentos = useCallback(async () => {
    try {
      const res = await api.get('/motoqueiros/meus-documentos');
      setDocumentos(res.data);
    } catch (err: any) {
      console.warn('[Docs] Erro ao carregar:', err?.response?.data || err?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      carregarDocumentos();
    }, [carregarDocumentos])
  );

  const onRefresh = () => {
    setRefreshing(true);
    carregarDocumentos();
  };

  const findDoc = (tipo: string) => documentos.find(d => d.tipo === tipo);

  // Substituir documento — usa XMLHttpRequest via enviarFicheiro
  const handleReplace = async (tipo: string) => {
    const config = DOC_CONFIG[tipo];
    if (!config) return;

    Alert.alert(
      'Substituir Documento',
      `Queres substituir "${config.label}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Escolher Ficheiro',
          onPress: async () => {
            try {
              const file = await PickerService.pickDocument();
              if (!file) return;

              setUploadingTipo(tipo);
              const mime = file.mimeType || 'image/jpeg';

              console.log(`[Docs] Upload via XHR → ${config.uploadTipo}`);

              await enviarFicheiro(config.uploadTipo as any, file.uri, mime);

              // Recarregar documentos do servidor
              await carregarDocumentos();
              // Forçar re-render dos thumbnails
              setDocVersion(v => v + 1);

              Alert.alert('Sucesso', 'Documento actualizado com sucesso.');
            } catch (err: any) {
              console.warn('[Docs] Erro no upload:', err?.message);
              Alert.alert('Erro', err?.message || 'Nao foi possivel enviar o documento.');
            } finally {
              setUploadingTipo(null);
            }
          },
        },
      ]
    );
  };

  // Renderizar um card de documento
  const renderDocCard = (tipo: string) => {
    const config = DOC_CONFIG[tipo];
    if (!config) return null;

    const doc = findDoc(tipo);
    const isUploading = uploadingTipo === tipo;

    return (
      <View key={tipo} style={s.docCard}>
        <View style={s.docCardHeader}>
          <View style={[s.docIconWrap, { backgroundColor: doc ? '#22D07A18' : '#3B7BFF18' }]}>
            <Ionicons name={config.icon as any} size={20} color={doc ? '#22D07A' : '#3B7BFF'} />
          </View>
          <View style={s.docInfo}>
            <Text style={s.docLabel}>{config.label}</Text>
            {doc ? (
              <View style={s.statusRow}>
                <View style={[s.statusDot, { backgroundColor: '#22D07A' }]} />
                <Text style={[s.statusText, { color: '#22D07A' }]}>Enviado</Text>
                <Text style={s.docDate}>{formatDate(doc.criadoEm)}</Text>
              </View>
            ) : (
              <Text style={s.docNotSent}>Nao enviado</Text>
            )}
          </View>
          <TouchableOpacity
            style={[s.docActionBtn, { borderColor: doc ? '#3B7BFF40' : '#22D07A40' }]}
            onPress={() => handleReplace(tipo)}
            activeOpacity={0.75}
            disabled={isUploading}
          >
            {isUploading ? (
              <ActivityIndicator size="small" color="#3B7BFF" />
            ) : (
              <Ionicons
                name={doc ? 'refresh-outline' : 'cloud-upload-outline'}
                size={18}
                color={doc ? '#3B7BFF' : '#22D07A'}
              />
            )}
          </TouchableOpacity>
        </View>

        {/* Thumbnail — version key forces re-mount after upload */}
        {doc && (
          <TouchableOpacity
            style={s.thumbRow}
            activeOpacity={0.8}
            onPress={() => setViewerDoc({ uploadId: doc.id, label: config.label, mimeType: doc.mimeType })}
          >
            <DocThumbnail key={`${doc.id}-v${docVersion}`} uploadId={doc.id} version={docVersion} />
            <Ionicons name="expand-outline" size={16} color="#5A6B7B" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const enviados = documentos.length;
  const totalDocTipos = ALL_DOC_TYPES.length;

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" />

      <View style={s.header}>
        <LinearGradient
          colors={['#1A2A4A', '#0F1923']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={s.headerRow}>
          <TouchableOpacity
            style={s.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.75}
          >
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Meus Documentos</Text>
          <View style={{ width: 40 }} />
        </View>

        {!loading && (
          <View style={s.summaryRow}>
            <View style={s.summaryItem}>
              <Text style={[s.summaryCount, { color: '#22D07A' }]}>{enviados}</Text>
              <Text style={s.summaryLabel}>Enviados</Text>
            </View>
            <View style={s.summaryDivider} />
            <View style={s.summaryItem}>
              <Text style={[s.summaryCount, { color: '#F59E0B' }]}>{totalDocTipos - enviados}</Text>
              <Text style={s.summaryLabel}>Em falta</Text>
            </View>
          </View>
        )}
      </View>

      {loading ? (
        <View style={s.centerWrap}>
          <ActivityIndicator size="large" color="#3B7BFF" />
          <Text style={s.loadingText}>Carregando documentos...</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.scroll}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B7BFF" />
          }
        >
          {ALL_DOC_TYPES.map(renderDocCard)}

          <View style={s.infoBox}>
            <Ionicons name="information-circle-outline" size={18} color="#3B7BFF" />
            <Text style={s.infoText}>
              Após envio dos documentos, o administrador irá avaliar o teu perfil como um todo.
              A aprovação aplica-se ao motoqueiro, não a cada documento individualmente.
            </Text>
          </View>
        </ScrollView>
      )}

      <DocumentViewer
        visible={!!viewerDoc}
        uploadId={viewerDoc?.uploadId ?? null}
        label={viewerDoc?.label ?? ''}
        mimeType={viewerDoc?.mimeType}
        onClose={() => setViewerDoc(null)}
      />
    </View>
  );
}

// ── Estilos ────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#080C10' },
  header: {
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
    paddingTop: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight ?? 28) + 8,
    paddingBottom: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFFFFF08',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  backBtn: {
    width: 40, height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF12',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    color: '#fff',
    fontFamily: themes.fonts.poppinsSemi,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 16,
  },
  summaryItem: { alignItems: 'center', flex: 1 },
  summaryCount: { fontSize: 22, fontFamily: themes.fonts.poppinsBold },
  summaryLabel: { fontSize: 11, color: '#8899AA', fontFamily: themes.fonts.poppinsRegular, marginTop: 2 },
  summaryDivider: { width: 1, height: 32, backgroundColor: '#FFFFFF10' },
  scroll: { paddingHorizontal: 16, paddingBottom: 120, gap: 12 },
  docCard: {
    backgroundColor: '#0F1923',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FFFFFF08',
  },
  docCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  docIconWrap: {
    width: 44, height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  docInfo: { flex: 1 },
  docLabel: {
    fontSize: 14,
    color: '#E2E8F0',
    fontFamily: themes.fonts.poppinsMedium,
    marginBottom: 4,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 12, fontFamily: themes.fonts.poppinsMedium },
  docDate: { fontSize: 11, color: '#5A6B7B', fontFamily: themes.fonts.poppinsRegular },
  docNotSent: { fontSize: 12, color: '#5A6B7B', fontFamily: themes.fonts.poppinsRegular },
  docActionBtn: {
    width: 40, height: 40,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: '#FFFFFF06',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#FFFFFF08',
  },
  thumbnail: {
    width: '100%',
    height: 120,
    borderRadius: 10,
  },
  thumbPlaceholder: {
    width: '100%',
    height: 120,
    borderRadius: 10,
    backgroundColor: '#1A2535',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#3B7BFF10',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#3B7BFF20',
    marginTop: 4,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#8899AA',
    fontFamily: themes.fonts.poppinsRegular,
    lineHeight: 18,
  },
  centerWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 13, color: '#5A6B7B', fontFamily: themes.fonts.poppinsRegular },
});
