import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, ScrollView, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BackgroundWrapper from '../../../components/layout/background/bgscreen';
import { themes } from '../../../global/themes';
import { Button } from '../../../components/common/button/button';
import { authService } from '../../../components/modules/services/api/authService';
import api from '../../../components/modules/services/api/api';

export default function Suspended({ navigation }: any) {
  const [motivo, setMotivo] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMotivo();
  }, []);

  const fetchMotivo = async () => {
    try {
      const response = await api.get('/motoqueiros/meu-perfil');
      if (response.data?.motivoRejeicao) {
        setMotivo(response.data.motivoRejeicao);
      }
    } catch (error) {
      // Silenciosamente ignora - o motivo é opcional
    } finally {
      setLoading(false);
    }
  };

  const handleCheckStatus = async () => {
    setChecking(true);
    try {
      const perfil = await authService.perfil();
      const status = perfil.data?.status;

      if (status === 'active') {
        // Conta reativada
        navigation.reset({ index: 0, routes: [{ name: 'DeliverHomeTab' }] });
      } else if (status === 'pending') {
        navigation.reset({ index: 0, routes: [{ name: 'PendingApproval' }] });
      } else {
        Alert.alert(
          'Estado da Conta',
          'A sua conta continua suspensa. Entre em contato com o suporte para mais informações.',
        );
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível verificar o estado da conta. Tente novamente.');
    } finally {
      setChecking(false);
    }
  };

  const handleContactSupport = () => {
    Linking.openURL('mailto:suporte@baza.ao?subject=Conta%20Suspensa');
  };

  const handleLogout = async () => {
    await authService.limparSessao();
    navigation.reset({ index: 0, routes: [{ name: 'Onboarding' }] });
  };

  return (
    <BackgroundWrapper>
      <View style={styles.mainContainer}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>A sua conta foi suspensa</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Ícone de aviso */}
          <View style={styles.iconContainer}>
            <Ionicons name="shield-outline" size={80} color={themes.colors.red} />
          </View>

          {/* Mensagem principal */}
          <Text style={styles.mainText}>
            A sua conta foi suspensa
          </Text>

          <Text style={styles.subText}>
            Contacte o suporte para mais informações sobre como reativar a sua conta.
          </Text>

          {/* Motivo da suspensão */}
          {motivo && (
            <View style={styles.reasonCard}>
              <Ionicons name="alert-circle-outline" size={22} color={themes.colors.red} />
              <View style={styles.reasonContent}>
                <Text style={styles.reasonLabel}>Motivo:</Text>
                <Text style={styles.reasonText}>{motivo}</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Botões inferiores */}
        <View style={styles.footer}>
          <Button
            text="Contactar Suporte"
            onPress={handleContactSupport}
            textStyle={{ fontFamily: themes.fonts.poppinsMedium, fontSize: 18 }}
          />
          <Button
            text={checking ? 'A verificar...' : 'Verificar estado'}
            onPress={handleCheckStatus}
            loading={checking}
            color="transparent"
            style={styles.secondaryButton}
            textStyle={{
              fontFamily: themes.fonts.poppinsMedium,
              fontSize: 16,
              color: themes.colors.primary,
            }}
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
    paddingBottom: 200,
    alignItems: 'center',
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(203, 29, 0, 0.1)',
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
  reasonCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(203, 29, 0, 0.08)',
    borderRadius: 16,
    padding: 16,
    width: '100%',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(203, 29, 0, 0.2)',
  },
  reasonContent: {
    flex: 1,
  },
  reasonLabel: {
    fontFamily: themes.fonts.poppinsSemi,
    fontSize: 14,
    color: themes.colors.red,
    marginBottom: 4,
  },
  reasonText: {
    fontFamily: themes.fonts.poppinsRegular,
    fontSize: 14,
    color: '#E2E8F0',
    lineHeight: 22,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 30,
    gap: 10,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    elevation: 0,
    shadowOpacity: 0,
    borderWidth: 1,
    borderColor: 'rgba(52, 97, 253, 0.3)',
  },
  logoutButton: {
    backgroundColor: 'transparent',
    elevation: 0,
    shadowOpacity: 0,
  },
});
