// src/pages/client/clientRegister/clientRegisterEmail/clientRegisterEmail.tsx
// Ecrã para utilizadores que entram com Google
// → nome e email vêm pré-preenchidos e desabilitados
// → único campo editável é o telefone
import React, { useState, useEffect } from 'react';
import {
  View, Text, KeyboardAvoidingView, Platform,
  ScrollView, Image, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import BackgroundWrapper from '../../../../components/layout/background/bgscreen';
import { themes } from '../../../../global/themes';
import { styles } from './style';
import { InputRegister } from '../../../../components/modules/client/inputRegister/inputRegister';
import { Button } from '../../../../components/common/button/button';
import { ButtonBack } from '../../../../components/common/backButton/backButton';
import { authService } from '../../../../components/modules/services/api/authService';
import { auth } from '../../../../../firebaseConfig';

export default function ClientRegisterEmail() {
  const navigation = useNavigation<any>();

  // Valores que vêm do Firebase / sessão — desabilitados
  const [nomeDisplay, setNomeDisplay] = useState('');
  const [emailDisplay, setEmailDisplay] = useState('');

  // Único campo editável
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState({ phone: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const carregar = async () => {
      // Tenta carregar da sessão local primeiro
      const sessao = await authService.obterSessao();
      if (sessao) {
        const nome = [sessao.nome, sessao.sobrenome].filter(Boolean).join(' ');
        setNomeDisplay(nome || sessao.displayName || '');
        setEmailDisplay(sessao.email || '');
        return;
      }
      // Fallback: Firebase currentUser
      const fbUser = auth.currentUser;
      if (fbUser) {
        setNomeDisplay(fbUser.displayName || '');
        setEmailDisplay(fbUser.email || '');
      }
    };
    carregar();
  }, []);

  const validatePhone = (num: string) => {
    if (!num) return 'Telefone obrigatório';
    if (!num.startsWith('9')) return 'Deve começar com 9';
    if (num.length < 9) return 'Deve ter 9 dígitos';
    return '';
  };

  // src/pages/client/clientRegister/clientRegisterEmail/clientRegisterEmail.tsx

const handleConfirmar = async () => {
  const phoneError = validatePhone(phone);
  if (phoneError) {
    setErrors({ phone: phoneError });
    return;
  }

  setLoading(true);
  try {
    await authService.atualizarPerfil({ telefone: phone });

    const sessao = await authService.obterSessao();
    const fbUser = auth.currentUser;

    await authService.salvarSessao({
      ...sessao,
      telefone: phone,
      nome: sessao?.nome || fbUser?.displayName?.split(' ')[0] || '',
      sobrenome: sessao?.sobrenome || fbUser?.displayName?.split(' ').slice(1).join(' ') || ''
    });

    navigation.reset({ index: 0, routes: [{ name: 'ChoiceMode' }] });
  } catch (error: any) {
    const msg = error?.response?.data?.message || error?.message || 'Erro ao atualizar perfil. Tenta novamente.';
    Alert.alert('Erro', msg);
  } finally {
    setLoading(false);
  }
};

  return (
    <BackgroundWrapper>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerNav}>
            <ButtonBack onPress={() => navigation.goBack()} />
          </View>

          <View style={styles.titleSection}>
            <Text style={styles.mainTitle}>Finalizar Perfil</Text>
            <View style={styles.supportContainer}>
              <Text style={styles.topSupportText}>
                Verifique os dados para continuar no Baza.
              </Text>
            </View>
          </View>

          <View style={styles.groupedInputCard}>
            {/* NOME — vem do Google, não editável */}
            <InputRegister
              placeholder="Nome completo"
              value={nomeDisplay}
              editable={false}
              style={{ color: 'rgba(30, 37, 48, 0.4)' }}
              icon={
                <Ionicons
                  name="person-outline"
                  size={18}
                  color="rgba(30, 37, 48, 0.3)"
                />
              }
            />

            {/* EMAIL — vem do Google, não editável */}
            <InputRegister
              placeholder="Endereço de e-mail"
              value={emailDisplay}
              editable={false}
              style={{ color: 'rgba(30, 37, 48, 0.4)' }}
              icon={
                <Ionicons
                  name="mail-outline"
                  size={18}
                  color="rgba(30, 37, 48, 0.3)"
                />
              }
            />

            {/* TELEFONE — único campo editável */}
            <InputRegister
              placeholder="9xx xxx xxx"
              keyboardType="numeric"
              maxLength={9}
              value={phone}
              onChangeText={(t: string) => {
                setPhone(t);
                setErrors({ phone: '' });
              }}
              errorMessage={errors.phone}
              isLast
              icon={
                <Image
                  source={require('../../../../assets/bandeira-angola.png')}
                  style={{ width: 22, height: 22, borderRadius: 2 }}
                />
              }
            />
          </View>

          <View style={styles.actionButtonContainer}>
            <Button
              text="Confirmar"
              loading={loading}
              onPress={handleConfirmar}
              disabled={loading}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </BackgroundWrapper>
  );
}