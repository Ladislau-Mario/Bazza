// src/pages/auth/UserMode/userMode.tsx
import React, { useState } from 'react';
import { View, Text, ActivityIndicator, Alert } from 'react-native';
import Background from '../../../components/layout/background/bgscreen';
import { ClientCard } from '../../../components/modules/client/clientCard/clientCard';
import { DeliverCard } from '../../../components/modules/deliver/deliverCard/deliverCard';
import { SimpleLineIcons } from '@expo/vector-icons';
import { styles } from './style';
import { authService } from '../../../components/modules/services/api/authService';

export default function ChoiceMode({ navigation }: any) {
  const [loading, setLoading] = useState(false);

  // src/pages/auth/UserMode/userMode.tsx

const handleChoice = async (role: 'cliente' | 'deliver') => {
  if (loading) return;
  setLoading(true);
  try {
    // 1. Guarda o role no backend
    await authService.escolherRole(role === 'deliver' ? 'motoqueiro' : 'cliente');

    // 2. Actualiza sessão local e captura os dados
    const sessao = await authService.obterSessao();
    let userAtualizado = { ...sessao, role: role === 'deliver' ? 'deliver' : 'client' };
    await authService.salvarSessao(userAtualizado);

    // 3. Lógica de Navegação Inteligente
    if (role === 'cliente') {
      // VERIFICAÇÃO CRÍTICA: 
      // Se o utilizador já tem nome (veio do Google + ClientRegisterEmail), vai para a Home.
      // Se não tem nome (veio do Telefone puro), vai para o ClientRegister.
      if (sessao?.nome && sessao?.nome !== 'Utilizador') {
        navigation.reset({ index: 0, routes: [{ name: 'ClientHome' }] });
      } else {
        navigation.navigate('ClientRegister');
      }
    } else {
      // Motoqueiro segue sempre para o registo de 4 etapas
      navigation.navigate('DeliverRegister');
    }
  } catch (error: any) {
    // Fallback de segurança (mesma lógica)
    if (role === 'cliente') {
      const sessao = await authService.obterSessao();
      if (sessao?.nome) {
        navigation.reset({ index: 0, routes: [{ name: 'ClientHome' }] });
      } else {
        navigation.navigate('ClientRegister');
      }
    } else {
      navigation.navigate('DeliverRegister');
    }
  } finally {
    setLoading(false);
  }
};

  return (
    <Background>
      <View style={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Pronto para{'\n'}começar?</Text>
          <Text style={styles.subtitle}>Tu decides o caminho.</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#fff" style={{ marginTop: 60 }} />
        ) : (
          <View style={styles.cardsContainer}>
            <ClientCard onPress={() => handleChoice('cliente')} />
            <DeliverCard onPress={() => handleChoice('deliver')} />
          </View>
        )}

        <View style={styles.footerInfo}>
          <Text style={styles.footerText}>
            <SimpleLineIcons name="lock-open" size={12} color="rgba(255,255,255,0.8)" />
            {'  '}Pode mudar esse modo a qualquer momento nas definições.
          </Text>
        </View>
      </View>
    </Background>
  );
}