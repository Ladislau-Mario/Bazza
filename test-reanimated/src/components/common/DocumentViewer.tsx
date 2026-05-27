// src/components/common/DocumentViewer.tsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  ActivityIndicator, Dimensions, Modal, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getIdToken } from '../modules/services/firebase-token';

interface DocumentViewerProps {
  visible: boolean;
  uploadId: string | null;
  label: string;
  mimeType?: string;
  onClose: () => void;
}

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.43.220:3000';

/**
 * Carrega imagem via XMLHttpRequest — mais fiável que axios/fetch no React Native.
 */
function loadImageViaXHR(url: string, token: string | null): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    xhr.responseType = 'arraybuffer';

    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const bytes = new Uint8Array(xhr.response as ArrayBuffer);
          let binary = '';
          // Processar em chunks para evitar stack overflow com imagens grandes
          const chunkSize = 8192;
          for (let i = 0; i < bytes.length; i += chunkSize) {
            const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
            binary += String.fromCharCode.apply(null, chunk as any);
          }
          const base64 = btoa(binary);
          resolve(base64);
        } catch (e) {
          reject(new Error('Falha ao processar imagem'));
        }
      } else {
        reject(new Error(`HTTP ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error('Network request failed'));
    xhr.send();
  });
}

export function DocumentViewer({ visible, uploadId, label, mimeType, onClose }: DocumentViewerProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!visible || !uploadId) {
      setDataUrl(null);
      setError(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(false);
    setDataUrl(null);

    const load = async () => {
      try {
        const token = await getIdToken();
        const base64 = await loadImageViaXHR(`${BASE_URL}/uploads/${uploadId}/download`, token);
        if (cancelled) return;
        const mime = mimeType || 'image/jpeg';
        setDataUrl(`data:${mime};base64,${base64}`);
      } catch (e) {
        if (!cancelled) {
          console.warn('[Viewer] Erro ao carregar imagem:', e);
          setError(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [visible, uploadId]);

  if (!visible || !uploadId) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent={false}>
      <View style={s.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />

        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity style={s.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={s.title} numberOfLines={1}>{label}</Text>
          <View style={{ width: 44 }} />
        </View>

        {/* Content */}
        <View style={s.content}>
          {loading && (
            <View style={s.centerWrap}>
              <ActivityIndicator size="large" color="#3B7BFF" />
              <Text style={s.loadingText}>A carregar...</Text>
            </View>
          )}

          {error && !loading && (
            <View style={s.centerWrap}>
              <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
              <Text style={s.errorText}>Nao foi possivel carregar a imagem</Text>
            </View>
          )}

          {dataUrl && !loading && (
            <Image
              source={{ uri: dataUrl }}
              style={s.image}
              resizeMode="contain"
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: StatusBar.currentHeight || 44,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#111827',
  },
  closeBtn: {
    width: 44, height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF10',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 15,
    color: '#fff',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerWrap: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#8899AA',
    fontSize: 14,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginTop: 8,
  },
  image: {
    width: SCREEN_W,
    height: SCREEN_H - 100,
  },
});
