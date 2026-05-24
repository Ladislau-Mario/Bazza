// src/pages/auth/withNumber/withNumber.tsx
// OTP gerido pelo backend — código 1234 para testes na defesa
import React, { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import BackgroundWrapper from '../../../components/layout/background/bgscreen';
import { styles } from './style';
import { InputPhone } from '../../../components/layout/inputPhone/inputPhone';
import { Button } from '../../../components/common/button/button';
import { ButtonBack } from '../../../components/common/backButton/backButton';
import api from '../../../components/modules/services/api/api';

export default function InputPhoneNumber({ navigation }: any) {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const isDone = phone.length === 9 && phone.startsWith('9');
  const hasError =
    phone.length > 0 &&
    ((phone.length === 9 && !phone.startsWith('9')) ||
      (phone.length > 0 && phone[0] !== '9'));

  const handleConfirm = async () => {
    if (!isDone) return;
    setLoading(true);
    try {
      const res = await api.post('/auth/telefone/enviar-otp', { telefone: phone });
      // Em dev, o backend devolve o código no response para facilitar testes
      const codigoTeste = res.data?.codigoTeste;
      if (codigoTeste) {
        Alert.alert('Baza [DEV]', `Código de teste: ${codigoTeste}`);
      }
      navigation.navigate('VerifycationNumber', { phoneNumber: phone });
    } catch (error: any) {
      Alert.alert('Baza', error.response?.data?.message || 'Falha ao enviar código.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <BackgroundWrapper>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.container}>
          <View style={styles.containerOne}>
            <View style={styles.header}>
              <ButtonBack
                onPress={() => navigation.reset({ routes: [{ name: 'Onboarding' }] })}
              />
            </View>
            <View style={{ width: '100%' }}>
              <Text style={styles.title}>Digite o seu número{'\n'}de telefone</Text>
            </View>
            <InputPhone
              placeholder="000 000 000"
              value={phone}
              onChangeText={setPhone}
              hasError={hasError}
              isSuccess={isDone}
            />
          </View>
          <View style={{ marginBottom: 30 }}>
            <Button
              text={loading ? 'A enviar...' : 'Confirmar'}
              loading={loading}
              onPress={handleConfirm}
              disabled={!isDone || loading}
              style={{ opacity: isDone ? 1 : 0.5 }}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </BackgroundWrapper>
  );
}