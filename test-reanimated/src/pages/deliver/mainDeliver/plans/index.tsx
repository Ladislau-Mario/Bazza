import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  StatusBar,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { BlurCarousel } from '../../../../components/molecules/index';
import PlanCard from './planCard';
import PaymentModal from './paymentmodal';
import { PLANS } from './plansData';
import { Plan } from './types';
import api from '../../../../components/modules/services/api/api';

const { width: SW } = Dimensions.get('window');

export default function Plans() {
  const navigation = useNavigation<any>();
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const handleChoose = (plan: Plan) => {
    setSelectedPlan(plan);
    setModalVisible(true);
  };

  const handleSubmit = async (
    proofUri: string,
    proofType: 'image' | 'pdf',
    proofName?: string,
  ) => {
    if (!selectedPlan) return;
    try {
      const tierMap: Record<string, string> = { daily: 'diario', weekly: 'semanal', monthly: 'mensal' };
      const tipo = tierMap[selectedPlan.id] || selectedPlan.id;
      const formData = new FormData();
      formData.append('tipo', tipo);
      formData.append('comprovativo', {
        uri: proofUri,
        type: proofType === 'pdf' ? 'application/pdf' : 'image/jpeg',
        name: proofName || `comprovativo_${tipo}.jpg`,
      } as any);
      await api.post('/planos/submeter', formData);
      console.log('Comprovativo enviado com sucesso');
    } catch (error: any) {
      console.warn('Erro ao enviar comprovativo:', error?.response?.data || error);
    }
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#080C10" />

      {/* Fundo com gradiente suave */}
      <LinearGradient
        colors={['#0D1521', '#080C10']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* ── Header ── */}
      <View style={s.header}>
        <TouchableOpacity
          style={s.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>

        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>Planos</Text>
          <Text style={s.headerSub}>Escolhe o teu plano</Text>
        </View>

        {/* espaço para alinhar */}
        <View style={{ width: 40 }} />
      </View>

      {/* ── Intro text ── */}
      <View style={s.intro}>
        <Text style={s.introTitle}>Desbloqueia o teu potencial</Text>
        <Text style={s.introSub}>
          Com um plano activo tens acesso a taxas prioritárias,{'\n'}
          mais entregas e estatísticas avançadas.
        </Text>
      </View>

      {/* ── Carousel de planos ── */}
      <BlurCarousel
        data={PLANS}
        renderItem={({ item }) => (
          <PlanCard plan={item} onChoose={handleChoose} />
        )}
      />

      {/* ── Rodapé ── */}
      <View style={s.footer}>
        <Ionicons name="shield-checkmark-outline" size={14} color="#566070" />
        <Text style={s.footerText}>
          Pagamento verificado manualmente · Activação em até 2h
        </Text>
      </View>

      {/* ── Modal de pagamento ── */}
      <PaymentModal
        plan={selectedPlan}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={handleSubmit}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#080C10',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 54 : (StatusBar.currentHeight ?? 28) + 12,
    paddingBottom: 16,
  },
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
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    color: '#fff',
    fontFamily: 'Poppins_700Bold',
  },
  headerSub: {
    fontSize: 11,
    color: '#566070',
    fontFamily: 'Poppins_400Regular',
    marginTop: 1,
  },
  intro: {
    paddingHorizontal: 24,
    paddingBottom: 28,
    alignItems: 'center',
  },
  introTitle: {
    fontSize: 22,
    color: '#fff',
    fontFamily: 'Poppins_700Bold',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  introSub: {
    fontSize: 13,
    color: '#8899AA',
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
  },
  footerText: {
    fontSize: 11,
    color: '#566070',
    fontFamily: 'Poppins_400Regular',
  },
});
