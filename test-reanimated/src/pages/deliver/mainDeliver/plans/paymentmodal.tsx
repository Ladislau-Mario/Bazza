import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  ScrollView, Animated, Image, ActivityIndicator,
  Dimensions, Platform, StatusBar, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Plan } from './types';
import { IBAN } from './plansData';
import { PickerService } from '../../../../components/modules/services/pickerService/pickerService';

const { height: SH } = Dimensions.get('window');

type Step = 'info' | 'proof' | 'sending' | 'success';

interface Props {
  plan: Plan | null;
  visible: boolean;
  onClose: () => void;
  onSubmit: (proofUri: string, proofType: 'image' | 'pdf', proofName?: string) => Promise<void>;
}

export default function PaymentModal({ plan, visible, onClose, onSubmit }: Props) {
  const [step, setStep] = useState<Step>('info');
  const [proof, setProof] = useState<{ uri: string; type: 'image' | 'pdf'; name?: string } | null>(null);

  const slideAnim = useRef(new Animated.Value(SH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setStep('info');
      setProof(null);
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          damping: 26,
          stiffness: 280,
        }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 240, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: SH, duration: 300, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const handlePickProof = async () => {
    const result = await PickerService.pickPaymentProof();
    if (result) setProof(result);
  };

  const handleSend = async () => {
    if (!proof || !plan) return;
    setStep('sending');
    try {
      await onSubmit(proof.uri, proof.type, proof.name);
      setStep('success');
    } catch {
      setStep('proof');
      Alert.alert('Erro', 'Não foi possível enviar o comprovativo. Tenta novamente.');
    }
  };

  if (!plan) return null;

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      {/* Overlay */}
      <Animated.View style={[s.overlay, { opacity: fadeAnim }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={step === 'sending' ? undefined : onClose} activeOpacity={1} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View style={[s.sheet, { transform: [{ translateY: slideAnim }] }]}>
        <View style={s.handle} />

        {step === 'info'    && <StepInfo    plan={plan} onContinue={() => setStep('proof')} onClose={onClose} />}
        {step === 'proof'   && <StepProof   plan={plan} proof={proof} onPick={handlePickProof} onSend={handleSend} onBack={() => setStep('info')} />}
        {step === 'sending' && <StepSending />}
        {step === 'success' && <StepSuccess plan={plan} onClose={onClose} />}
      </Animated.View>
    </Modal>
  );
}

// ─── Step 1: Payment info ─────────────────────────────────────────────────────
function StepInfo({ plan, onContinue, onClose }: { plan: Plan; onContinue: () => void; onClose: () => void }) {
  const [copied, setCopied] = useState<'iban' | 'ref' | null>(null);

  const copy = (text: string, type: 'iban' | 'ref') => {
    // Clipboard — expo-clipboard se disponível, senão silent
    try {
      const Clipboard = require('expo-clipboard');
      Clipboard.setStringAsync(text);
    } catch {}
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.stepScroll}>
      {/* Header */}
      <View style={s.stepHeader}>
        <View style={[s.planIcon, { backgroundColor: `${plan.accentColor}20` }]}>
          <Ionicons name="flash" size={24} color={plan.accentColor} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.stepTitle}>Pagar Plano {plan.label}</Text>
          <Text style={s.stepSub}>Transferência via Multicaixa Express</Text>
        </View>
        <TouchableOpacity style={s.closeBtn} onPress={onClose}>
          <Ionicons name="close" size={18} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      {/* Amount card */}
      <View style={[s.amountCard, { borderColor: `${plan.accentColor}30` }]}>
        <Text style={s.amountLabel}>Valor a transferir</Text>
        <Text style={[s.amountValue, { color: plan.accentColor }]}>
          {plan.price.toLocaleString('pt-AO')} Kz
        </Text>
        <Text style={s.amountSub}>{plan.duration} de acesso</Text>
      </View>

      {/* IBAN row */}
      <InfoRow
        icon="card-outline"
        label="IBAN de Destino"
        value={IBAN}
        onCopy={() => copy(IBAN, 'iban')}
        copied={copied === 'iban'}
        accentColor={plan.accentColor}
      />

      {/* Divider */}
      <View style={s.divider} />

      {/* Warning box */}
      <View style={s.warnBox}>
        <Ionicons name="information-circle-outline" size={18} color="#FFB830" />
        <Text style={s.warnText}>
          Após a transferência, guarda o comprovativo (foto ou PDF). Vais precisar dele no passo seguinte.
        </Text>
      </View>

      {/* CTA */}
      <TouchableOpacity
        style={[s.mainBtn, { backgroundColor: plan.accentColor }]}
        onPress={onContinue}
        activeOpacity={0.85}
      >
        <Ionicons name="attach-outline" size={18} color="#fff" />
        <Text style={s.mainBtnText}>Já Paguei — Anexar Comprovativo</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function InfoRow({
  icon, label, value, onCopy, copied, accentColor,
}: {
  icon: string; label: string; value: string;
  onCopy: () => void; copied: boolean; accentColor: string;
}) {
  return (
    <View style={r.row}>
      <View style={[r.iconWrap, { backgroundColor: `${accentColor}12` }]}>
        <Ionicons name={icon as any} size={18} color={accentColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={r.label}>{label}</Text>
        <Text style={r.value} selectable>{value}</Text>
      </View>
      <TouchableOpacity style={r.copyBtn} onPress={onCopy} activeOpacity={0.75}>
        <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={16} color={copied ? '#22D07A' : '#6B7280'} />
      </TouchableOpacity>
    </View>
  );
}

// ─── Step 2: Attach proof ─────────────────────────────────────────────────────
function StepProof({
  plan, proof, onPick, onSend, onBack,
}: {
  plan: Plan;
  proof: { uri: string; type: 'image' | 'pdf'; name?: string } | null;
  onPick: () => void;
  onSend: () => void;
  onBack: () => void;
}) {
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.stepScroll}>
      {/* Header */}
      <View style={s.stepHeader}>
        <TouchableOpacity style={s.backBtn} onPress={onBack}>
          <Ionicons name="arrow-back" size={20} color="#9CA3AF" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.stepTitle}>Comprovativo</Text>
          <Text style={s.stepSub}>Plano {plan.label} · {plan.price.toLocaleString('pt-AO')} Kz</Text>
        </View>
      </View>

      {/* Upload zone */}
      <TouchableOpacity
        style={[s.uploadZone, proof && s.uploadZoneFilled, { borderColor: proof ? plan.accentColor : '#374151' }]}
        onPress={onPick}
        activeOpacity={0.8}
      >
        {proof ? (
          proof.type === 'image' ? (
            <>
              <Image source={{ uri: proof.uri }} style={s.previewImage} resizeMode="cover" />
              <View style={s.previewOverlay}>
                <Ionicons name="checkmark-circle" size={32} color="#22D07A" />
                <Text style={s.previewLabel}>Imagem anexada</Text>
                <Text style={s.previewSub}>Toca para trocar</Text>
              </View>
            </>
          ) : (
            <View style={s.pdfPreview}>
              <Ionicons name="document-text" size={48} color={plan.accentColor} />
              <Text style={s.pdfName}>{proof.name ?? 'documento.pdf'}</Text>
              <Text style={s.previewSub}>Toca para trocar</Text>
            </View>
          )
        ) : (
          <View style={s.uploadPrompt}>
            <View style={[s.uploadIconBg, { backgroundColor: `${plan.accentColor}15` }]}>
              <Ionicons name="camera-outline" size={32} color={plan.accentColor} />
            </View>
            <Text style={s.uploadTitle}>Anexar Comprovativo</Text>
            <Text style={s.uploadSub}>Foto do talão Multicaixa{'\n'}ou PDF do Express</Text>
            <View style={s.uploadOptions}>
              <OptionChip icon="camera-outline" label="Câmara" />
              <OptionChip icon="image-outline" label="Galeria" />
              <OptionChip icon="document-outline" label="PDF" />
            </View>
          </View>
        )}
      </TouchableOpacity>

      {/* Info note */}
      <View style={s.noteBox}>
        <Ionicons name="shield-checkmark-outline" size={15} color="#22D07A" />
        <Text style={s.noteText}>
          O teu comprovativo é verificado manualmente pela equipa Baza. O plano ativa-se em até 2 horas.
        </Text>
      </View>

      {/* Send button */}
      <TouchableOpacity
        style={[
          s.mainBtn,
          { backgroundColor: proof ? plan.accentColor : '#1F2937' },
        ]}
        onPress={proof ? onSend : onPick}
        activeOpacity={0.85}
      >
        <Ionicons
          name={proof ? 'send-outline' : 'attach-outline'}
          size={18}
          color={proof ? '#fff' : '#6B7280'}
        />
        <Text style={[s.mainBtnText, !proof && { color: '#6B7280' }]}>
          {proof ? 'Enviar para Validação' : 'Seleccionar Comprovativo'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function OptionChip({ icon, label }: { icon: string; label: string }) {
  return (
    <View style={oc.chip}>
      <Ionicons name={icon as any} size={14} color="#9CA3AF" />
      <Text style={oc.label}>{label}</Text>
    </View>
  );
}

// ─── Step 3: Sending ──────────────────────────────────────────────────────────
function StepSending() {
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 1200, useNativeDriver: true }),
    ).start();
  }, []);

  return (
    <View style={s.centeredStep}>
      <ActivityIndicator size="large" color="#3B7BFF" />
      <Text style={s.centeredTitle}>A enviar comprovativo…</Text>
      <Text style={s.centeredSub}>Por favor não feches a aplicação</Text>
    </View>
  );
}

// ─── Step 4: Success ──────────────────────────────────────────────────────────
function StepSuccess({ plan, onClose }: { plan: Plan; onClose: () => void }) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, damping: 14 }).start();
  }, []);

  return (
    <View style={s.centeredStep}>
      <Animated.View style={[s.successIcon, { transform: [{ scale: scaleAnim }], backgroundColor: `${plan.accentColor}18` }]}>
        <Ionicons name="checkmark-circle" size={56} color={plan.accentColor} />
      </Animated.View>
      <Text style={s.centeredTitle}>Comprovativo Enviado!</Text>
      <Text style={s.centeredSub}>
        O teu Plano {plan.label} está pendente de aprovação.{'\n'}
        Receberás uma notificação quando for activado.
      </Text>

      {/* Status pill */}
      <View style={s.statusPill}>
        <View style={s.statusDot} />
        <Text style={s.statusText}>Pendente de Aprovação</Text>
      </View>

      <TouchableOpacity style={[s.mainBtn, { backgroundColor: plan.accentColor, marginTop: 24 }]} onPress={onClose} activeOpacity={0.85}>
        <Text style={s.mainBtnText}>Fechar</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const C = {
  bg:     '#080C10',
  card:   '#141E2B',
  card2:  '#1A2535',
  border: '#FFFFFF0D',
  white:  '#FFFFFF',
  muted:  '#9CA3AF',
  muted2: '#6B7280',
  sep:    '#FFFFFF08',
};

const s = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.72)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    maxHeight: SH * 0.93,
    backgroundColor: '#0F1923',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.55,
    shadowRadius: 24,
    elevation: 24,
  },
  handle: {
    width: 40, height: 4,
    backgroundColor: '#FFFFFF20',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 4,
  },
  stepScroll: {
    padding: 24,
    paddingBottom: 44,
    gap: 16,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  planIcon: {
    width: 44, height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepTitle: {
    fontSize: 18,
    color: C.white,
    fontFamily: 'Poppins_700Bold',
  },
  stepSub: {
    fontSize: 12,
    color: C.muted,
    fontFamily: 'Poppins_400Regular',
    marginTop: 1,
  },
  closeBtn: {
    width: 34, height: 34,
    borderRadius: 11,
    backgroundColor: C.card2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtn: {
    width: 34, height: 34,
    borderRadius: 11,
    backgroundColor: C.card2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountCard: {
    backgroundColor: C.card,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    gap: 4,
  },
  amountLabel: {
    fontSize: 12,
    color: C.muted,
    fontFamily: 'Poppins_400Regular',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  amountValue: {
    fontSize: 36,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: -1,
  },
  amountSub: {
    fontSize: 12,
    color: C.muted2,
    fontFamily: 'Poppins_400Regular',
  },
  divider: {
    height: 1,
    backgroundColor: C.sep,
  },
  warnBox: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#FFB83010',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FFB83025',
    alignItems: 'flex-start',
  },
  warnText: {
    flex: 1,
    fontSize: 12,
    color: '#FFB830',
    fontFamily: 'Poppins_400Regular',
    lineHeight: 18,
  },
  mainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 18,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  mainBtnText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Poppins_700Bold',
  },
  // Upload zone
  uploadZone: {
    borderRadius: 20,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    minHeight: 220,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadZoneFilled: {
    borderStyle: 'solid',
    borderWidth: 2,
  },
  uploadPrompt: {
    alignItems: 'center',
    gap: 10,
    padding: 24,
  },
  uploadIconBg: {
    width: 72, height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  uploadTitle: {
    fontSize: 16,
    color: C.white,
    fontFamily: 'Poppins_600SemiBold',
  },
  uploadSub: {
    fontSize: 13,
    color: C.muted,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
    lineHeight: 19,
  },
  uploadOptions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  previewImage: {
    width: '100%',
    height: 220,
  },
  previewOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  previewLabel: {
    fontSize: 15,
    color: '#fff',
    fontFamily: 'Poppins_600SemiBold',
  },
  previewSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.65)',
    fontFamily: 'Poppins_400Regular',
  },
  pdfPreview: {
    alignItems: 'center',
    gap: 8,
    padding: 32,
  },
  pdfName: {
    fontSize: 13,
    color: C.white,
    fontFamily: 'Poppins_500Medium',
    textAlign: 'center',
  },
  noteBox: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#22D07A10',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#22D07A25',
    alignItems: 'flex-start',
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    color: '#22D07A',
    fontFamily: 'Poppins_400Regular',
    lineHeight: 18,
  },
  // Centered steps (sending / success)
  centeredStep: {
    alignItems: 'center',
    padding: 40,
    gap: 12,
    minHeight: 360,
    justifyContent: 'center',
  },
  centeredTitle: {
    fontSize: 20,
    color: C.white,
    fontFamily: 'Poppins_700Bold',
    marginTop: 8,
  },
  centeredSub: {
    fontSize: 13,
    color: C.muted,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
    lineHeight: 20,
  },
  successIcon: {
    width: 100, height: 100,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFB83015',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#FFB83030',
    marginTop: 8,
  },
  statusDot: {
    width: 8, height: 8,
    borderRadius: 4,
    backgroundColor: '#FFB830',
  },
  statusText: {
    fontSize: 13,
    color: '#FFB830',
    fontFamily: 'Poppins_600SemiBold',
  },
});

const r = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#141E2B',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FFFFFF0D',
  },
  iconWrap: {
    width: 38, height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 10,
    color: '#6B7280',
    fontFamily: 'Poppins_400Regular',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  value: {
    fontSize: 13,
    color: '#FFFFFF',
    fontFamily: 'Poppins_600SemiBold',
    letterSpacing: 0.3,
  },
  copyBtn: {
    width: 34, height: 34,
    borderRadius: 10,
    backgroundColor: '#1A2535',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const oc = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1A2535',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  label: {
    fontSize: 11,
    color: '#9CA3AF',
    fontFamily: 'Poppins_400Regular',
  },
});