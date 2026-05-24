import React, { useState } from 'react';
import { View, StyleSheet, Text, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BackgroundWrapper from '../../../components/layout/background/bgscreen';
import { themes } from '../../../global/themes';
import { Button } from '../../../components/common/button/button';
import { authService } from '../../../components/modules/services/api/authService';

export default function PendingApproval({ navigation }: any) {
  const [checking, setChecking] = useState(false);

  const handleCheckStatus = async () => {
    setChecking(true);
    try {
      const perfil = await authService.perfil();
      const status = perfil.data?.status;

      if (status === 'active') {
        // Conta aprovada - navegar para o painel
        navigation.reset({ index: 0, routes: [{ name: 'DeliverHomeTab' }] });
      } else if (status === 'suspended') {
        // Conta suspensa/rejeitada
        navigation.reset({ index: 0, routes: [{ name: 'Suspended' }] });
      } else {
        // Ainda pendente
        Alert.alert(
          'Estado da Conta',
          'A sua conta ainda está a ser verificada. Aguarde a aprovação do administrador.',
        );
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível verificar o estado da conta. Tente novamente.');
    } finally {
      setChecking(false);
    }
  };

  const handleLogout = async () => {
    await authService.limparSessao();
    navigation.reset({ index: 0, routes: [{ name: 'Onboarding' }] });
  };

  return (
    <BackgroundWrapper>
      <View style={styles.mainContainer}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>A sua conta está a ser verificada</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Ícone de espera */}
          <View style={styles.iconContainer}>
            <Ionicons name="hourglass-outline" size={80} color={themes.colors.primary} />
          </View>

          {/* Mensagem principal */}
          <Text style={styles.mainText}>
            Aguarde a aprovação do administrador
          </Text>

          <Text style={styles.subText}>
            Enviámos os seus documentos para verificação. Assim que a sua conta for aprovada,
            receberá uma notificação e poderá começar a receber pedidos de entrega.
          </Text>

          {/* Card informativo */}
          <View style={styles.infoCard}>
            <Ionicons name="information-circle-outline" size={24} color={themes.colors.primary} />
            <Text style={styles.infoText}>
              Este processo pode levar até 24 horas. Agradecemos a sua paciência.
            </Text>
          </View>
        </ScrollView>

        {/* Botões inferiores */}
        <View style={styles.footer}>
          <Button
            text={checking ? 'A verificar...' : 'Verificar estado'}
            onPress={handleCheckStatus}
            loading={checking}
            textStyle={{ fontFamily: themes.fonts.poppinsMedium, fontSize: 18 }}
          />
          <Button
            text="Terminar sessão"
            onPress={handleLogout}
            color="transparent"
            style={styles.logoutButton}
            textStyle={{
              fontFamily: themes.fonts.poppinsMedium,
              fontSize: 16,
              color: themes.colors.gray,
            }}
          />
        </View>
      </View>
    </BackgroundWrapper>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
  },
  headerTitle: {
    fontFamily: themes.fonts.poppinsMedium,
    fontSize: 32,
    color: '#FFFFFF',
    lineHeight: 42,
  },
  scrollContent: {
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 160,
    alignItems: 'center',
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(52, 97, 253, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  mainText: {
    fontFamily: themes.fonts.poppinsSemi,
    fontSize: 22,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  subText: {
    fontFamily: themes.fonts.poppinsRegular,
    fontSize: 15,
    color: '#8B949E',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(52, 97, 253, 0.08)',
    borderRadius: 16,
    padding: 16,
    width: '100%',
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontFamily: themes.fonts.poppinsRegular,
    fontSize: 14,
    color: '#A1A1A1',
    lineHeight: 22,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 30,
    gap: 12,
  },
  logoutButton: {
    backgroundColor: 'transparent',
    elevation: 0,
    shadowOpacity: 0,
  },
});
