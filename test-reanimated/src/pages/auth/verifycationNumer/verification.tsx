// src/pages/auth/verifycationNumer/verification.tsx
import React, { useState } from 'react';
import {
  View, Text, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import BackgroundWrapper from '../../../components/layout/background/bgscreen';
import { themes } from '../../../global/themes';
import { styles } from './style';
import { InputOTP } from '../../../components/layout/inputOTP/opt';
import { ButtonBack } from '../../../components/common/backButton/backButton';
import { ButtonResend } from '../../../components/layout/buttonResent/ButtonResend';
import api from '../../../components/modules/services/api/api';
import { authService } from '../../../components/modules/services/api/authService';

export default function VerifycationNumber({ navigation, route }: any) {
  const phoneNumber: string = route.params?.phoneNumber || '';
  const [otpError, setOtpError] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerifyCode = async (code: string) => {
    setIsVerifying(true);
    setOtpError(false);
    try {
      const res = await api.post('/auth/telefone/verificar-otp', {
        telefone: phoneNumber,
        codigo: code,
      });
      const { user, isNewUser } = res.data;
      await authService.salvarSessao(user);

      if (isNewUser || !user.role) {
        navigation.reset({ index: 0, routes: [{ name: 'ChoiceMode' }] });
      } else if (user.role === 'client') {
        navigation.reset({ index: 0, routes: [{ name: 'ClientHome' }] });
      } else if (user.role === 'deliver') {
        navigation.reset({ index: 0, routes: [{ name: 'DeliverHomeTab' }] });
      } else {
        navigation.reset({ index: 0, routes: [{ name: 'ChoiceMode' }] });
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || '';
      if (msg.includes('expirado')) {
        Alert.alert('Baza', 'Código expirado. Volta atrás e pede um novo.');
      } else {
        setOtpError(true);
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleReenviar = async () => {
    try {
      const res = await api.post('/auth/telefone/enviar-otp', { telefone: phoneNumber });
      const codigoTeste = res.data?.codigoTeste;
      if (codigoTeste) Alert.alert('Baza [DEV]', `Novo código: ${codigoTeste}`);
    } catch (_) {
      Alert.alert('Baza', 'Falha ao reenviar. Tenta novamente.');
    }
  };

  return (
    <BackgroundWrapper>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.container}>
          <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
            <View style={styles.containerOne}>
              <View style={styles.header}>
                <ButtonBack onPress={() => navigation.goBack()} />
              </View>
              <View style={styles.textContent}>
                <Text style={styles.title}>Cód. de verificação</Text>
                <Text style={styles.subtitle}>
                  Um código foi enviado para +244 {phoneNumber}
                </Text>
              </View>
              <View style={{ width: '100%', alignItems: 'center' }}>
                <InputOTP
                  codeLength={4}
                  hasError={otpError}
                  onCodeFilled={handleVerifyCode}
                  onClearError={() => setOtpError(false)}
                  editable={!isVerifying}
                />
                <ButtonResend onResend={handleReenviar} />
                <View style={{ height: 40, justifyContent: 'center', marginTop: 20 }}>
                  {isVerifying && (
                    <ActivityIndicator size="small" color={themes.colors.primary} />
                  )}
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </BackgroundWrapper>
  );
}