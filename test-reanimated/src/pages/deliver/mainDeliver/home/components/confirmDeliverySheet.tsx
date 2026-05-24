// src/pages/deliver/mainDeliver/home/components/ConfirmDeliverySheet.tsx

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  TextInput, Platform, Animated, Dimensions,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';

const { width: SW } = Dimensions.get('window');

interface Props {
  visible: boolean;
  correctCode: string;
  onConfirmed: (metodo: 'qr' | 'codigo', codigoUsado: string) => void;
  onClose: () => void;
}

type Tab = 'qr' | 'codigo';

export function ConfirmDeliverySheet({ visible, correctCode, onConfirmed, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('qr');
  const [inputCode, setInputCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  const successAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      setInputCode('');
      setError('');
      setSuccess(false);
      setScanned(false);
      setTab('qr');
    }
  }, [visible]);

  useEffect(() => {
    if (tab === 'qr' && !permission?.granted) {
      requestPermission();
    }
  }, [tab]);

  const triggerSuccess = (metodo: Tab, codigo: string) => {
    setSuccess(true);
    setError('');
    Animated.spring(successAnim, { toValue: 1, useNativeDriver: true, bounciness: 12 }).start(() => {
      setTimeout(() => onConfirmed(metodo, codigo), 800);
    });
  };

  const triggerShake = (msg: string) => {
    setError(msg);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  // ── QR: aceita QUALQUER scan (dev mode) ─────────────────────────────────
  // TODO produção: validar no servidor → if (data !== correctCode) triggerShake(...)
  const handleQRScanned = ({ data }: { data: string }) => {
    if (scanned || !data.trim()) return;
    setScanned(true);
    triggerSuccess('qr', data);
  };

  // ── Código: aceita QUALQUER valor com ≥ 4 dígitos (dev mode) ────────────
  // TODO produção: validar no servidor → if (inputCode !== correctCode) triggerShake(...)
  const handleCodeSubmit = () => {
    if (inputCode.trim().length < 4) {
      triggerShake('Insere pelo menos 4 dígitos.');
      return;
    }
    triggerSuccess('codigo', inputCode.trim());
  };

  const successScale = successAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={s.container}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={onClose}>
            <Ionicons name="chevron-down" size={22} color="#9CA3AF" />
          </TouchableOpacity>
          <Text style={s.title}>Confirmar Entrega</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Tabs */}
        <View style={s.tabs}>
          <TouchableOpacity
            style={[s.tab, tab === 'qr' && s.tabActive]}
            onPress={() => { setTab('qr'); setError(''); }}
          >
            <Ionicons name="qr-code-outline" size={18} color={tab === 'qr' ? '#fff' : '#6B7280'} />
            <Text style={[s.tabTxt, tab === 'qr' && s.tabTxtActive]}>Scan QR</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.tab, tab === 'codigo' && s.tabActive]}
            onPress={() => { setTab('codigo'); setError(''); }}
          >
            <Ionicons name="keypad-outline" size={18} color={tab === 'codigo' ? '#fff' : '#6B7280'} />
            <Text style={[s.tabTxt, tab === 'codigo' && s.tabTxtActive]}>Código</Text>
          </TouchableOpacity>
        </View>

        {/* Dev notice */}
        <View style={s.devBanner}>
          <Ionicons name="construct-outline" size={13} color="#6B7280" />
          <Text style={s.devTxt}>Modo de desenvolvimento — qualquer valor é aceite</Text>
        </View>

        {/* Success overlay */}
        {success && (
          <View style={s.successOverlay}>
            <Animated.View style={[s.successIcon, { transform: [{ scale: successScale }], opacity: successAnim }]}>
              <Ionicons name="checkmark-circle" size={80} color="#4ade80" />
            </Animated.View>
            <Text style={s.successText}>Entrega confirmada!</Text>
          </View>
        )}

        {/* QR Tab */}
        {tab === 'qr' && !success && (
          <View style={s.qrContainer}>
            <Text style={s.hint}>Pede ao cliente para mostrar o código QR</Text>
            {permission?.granted ? (
              <View style={s.cameraWrap}>
                <CameraView
                  style={s.camera}
                  facing="back"
                  barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                  onBarcodeScanned={scanned ? undefined : handleQRScanned}
                />
                <View style={s.qrFrame}>
                  <View style={[s.corner, s.cornerTL]} />
                  <View style={[s.corner, s.cornerTR]} />
                  <View style={[s.corner, s.cornerBL]} />
                  <View style={[s.corner, s.cornerBR]} />
                </View>
                {scanned && !success && (
                  <View style={s.scanningOverlay}>
                    <Text style={s.scanningText}>A verificar...</Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={s.noCameraWrap}>
                <Feather name="camera-off" size={48} color="#6B7280" />
                <Text style={s.noCameraText}>Permissão de câmara necessária</Text>
                <TouchableOpacity style={s.permBtn} onPress={requestPermission}>
                  <Text style={s.permBtnTxt}>Permitir câmara</Text>
                </TouchableOpacity>
              </View>
            )}
            {error ? <Text style={s.error}>{error}</Text> : null}
            <TouchableOpacity onPress={() => { setTab('codigo'); setError(''); }} style={s.switchBtn}>
              <Text style={s.switchBtnTxt}>Prefiro inserir o código manualmente</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Código Tab */}
        {tab === 'codigo' && !success && (
          <View style={s.codeContainer}>
            <Text style={s.hint}>Insere o código de confirmação do cliente</Text>

            <Animated.View style={[{ width: '100%' }, { transform: [{ translateX: shakeAnim }] }]}>
              <View style={s.codeInputWrap}>
                <TextInput
                  style={s.codeInput}
                  value={inputCode}
                  onChangeText={v => { setInputCode(v.replace(/\D/g, '').slice(0, 6)); setError(''); }}
                  keyboardType="number-pad"
                  placeholder="0000"
                  placeholderTextColor="#ffffff20"
                  maxLength={6}
                  textAlign="center"
                  autoFocus
                />
              </View>
            </Animated.View>

            {error ? <Text style={s.error}>{error}</Text> : null}

            <TouchableOpacity
              style={[s.confirmBtn, inputCode.length < 4 && s.confirmBtnOff]}
              disabled={inputCode.length < 4}
              onPress={handleCodeSubmit}
            >
              <Text style={s.confirmBtnTxt}>Confirmar código</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => { setTab('qr'); setError(''); }} style={s.switchBtn}>
              <Ionicons name="qr-code-outline" size={16} color="#2D60FF" />
              <Text style={[s.switchBtnTxt, { color: '#2D60FF' }]}>Usar scanner QR</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
}

const CORNER = 24;

const s = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: '#0B0F13',
    paddingTop: Platform.OS === 'ios' ? 50 : 32,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: '#ffffff08',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#1E2A35', alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 16, color: '#fff', fontFamily: 'Poppins_600SemiBold' },

  tabs: {
    flexDirection: 'row', marginHorizontal: 20, marginTop: 16, marginBottom: 4,
    backgroundColor: '#1E2A35', borderRadius: 16, padding: 4, gap: 4,
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 7, paddingVertical: 12, borderRadius: 12,
  },
  tabActive: { backgroundColor: '#2D60FF' },
  tabTxt: { fontSize: 14, color: '#6B7280', fontFamily: 'Poppins_500Medium' },
  tabTxtActive: { color: '#fff' },

  devBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginHorizontal: 20, marginVertical: 8,
    backgroundColor: '#ffffff08', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 7,
  },
  devTxt: { fontSize: 11, color: '#6B7280', fontFamily: 'Poppins_400Regular' },

  qrContainer: { flex: 1, paddingHorizontal: 20, paddingTop: 12, alignItems: 'center', gap: 16 },
  hint: { fontSize: 13, color: '#9CA3AF', fontFamily: 'Poppins_400Regular', textAlign: 'center' },
  cameraWrap: { width: SW - 40, height: SW - 40, borderRadius: 24, overflow: 'hidden', position: 'relative' },
  camera: { flex: 1 },
  qrFrame: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center',
  },
  corner: { position: 'absolute', width: CORNER, height: CORNER, borderColor: '#2D60FF', borderWidth: 3 },
  cornerTL: { top: 20, left: 20, borderBottomWidth: 0, borderRightWidth: 0, borderTopLeftRadius: 6 },
  cornerTR: { top: 20, right: 20, borderBottomWidth: 0, borderLeftWidth: 0, borderTopRightRadius: 6 },
  cornerBL: { bottom: 20, left: 20, borderTopWidth: 0, borderRightWidth: 0, borderBottomLeftRadius: 6 },
  cornerBR: { bottom: 20, right: 20, borderTopWidth: 0, borderLeftWidth: 0, borderBottomRightRadius: 6 },
  scanningOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: '#000000AA', alignItems: 'center', justifyContent: 'center',
  },
  scanningText: { color: '#fff', fontFamily: 'Poppins_600SemiBold', fontSize: 16 },
  noCameraWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  noCameraText: { color: '#9CA3AF', fontFamily: 'Poppins_400Regular', fontSize: 14, textAlign: 'center' },
  permBtn: { backgroundColor: '#2D60FF', borderRadius: 14, paddingHorizontal: 24, paddingVertical: 12 },
  permBtnTxt: { color: '#fff', fontFamily: 'Poppins_600SemiBold', fontSize: 14 },
  switchBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8 },
  switchBtnTxt: { color: '#9CA3AF', fontFamily: 'Poppins_400Regular', fontSize: 13 },

  codeContainer: { flex: 1, paddingHorizontal: 20, paddingTop: 24, alignItems: 'center', gap: 20 },
  codeInputWrap: {
    width: '100%', backgroundColor: '#1E2A35',
    borderRadius: 20, borderWidth: 2, borderColor: '#2D60FF40', paddingVertical: 20,
  },
  codeInput: {
    fontSize: 44, color: '#fff', fontFamily: 'Poppins_700Bold', letterSpacing: 12,
  },
  confirmBtn: {
    width: '100%', backgroundColor: '#2D60FF',
    borderRadius: 16, paddingVertical: 16, alignItems: 'center',
  },
  confirmBtnOff: { backgroundColor: '#2D60FF50' },
  confirmBtnTxt: { color: '#fff', fontFamily: 'Poppins_600SemiBold', fontSize: 16 },

  error: { color: '#EF4444', fontFamily: 'Poppins_500Medium', fontSize: 13, textAlign: 'center' },

  successOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: '#0B0F13', alignItems: 'center', justifyContent: 'center', gap: 16, zIndex: 100,
  },
  successIcon: { alignItems: 'center', justifyContent: 'center' },
  successText: { fontSize: 22, color: '#fff', fontFamily: 'Poppins_700Bold' },
});