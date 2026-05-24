// src/pages/client/clientRegister/clientRegister/clientRegister.tsx
// Para utilizadores que entram com telefone → preenchem dados básicos
import React, { useState } from 'react';
import {
  View, Text, KeyboardAvoidingView, Platform, ScrollView, Alert,
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

export default function ClientRegister() {
  const navigation = useNavigation<any>();

  const [nome, setNome] = useState('');
  const [sobrenome, setSobrenome] = useState('');
  const [email, setEmail] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});

  const primaryColor = themes.colors.primary;
  const errorColor = '#FF4D4D';

  const handleDataChange = (text: string) => {
    let cleaned = text.replace(/\D/g, '');
    let formatted = cleaned;
    if (cleaned.length > 2) formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    if (cleaned.length > 4)
      formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4, 8)}`;
    setDataNascimento(formatted);
    if (errors.data) setErrors({ ...errors, data: '' });
  };

  const validateData = (dateStr: string) => {
    if (dateStr.length !== 10) return 'Data incompleta';
    const [day, month, year] = dateStr.split('/').map(Number);
    const birthDate = new Date(year, month - 1, day);
    const today = new Date();
    if (
      birthDate.getFullYear() !== year ||
      birthDate.getMonth() !== month - 1 ||
      birthDate.getDate() !== day
    )
      return 'Data inválida';
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    if (age < 16) return 'Idade mínima: 16 anos';
    return '';
  };

  const handleConfirmar = async () => {
    const nameRegex = /^[A-Za-zÀ-ÖØ-öø-ÿ\s]+$/;
    let newErrors: any = {};

    if (nome.trim().length < 3) newErrors.nome = 'Nome muito curto';
    else if (!nameRegex.test(nome)) newErrors.nome = 'Apenas letras';

    if (sobrenome.trim().length < 2) newErrors.sobrenome = 'Sobrenome muito curto';
    else if (!nameRegex.test(sobrenome)) newErrors.sobrenome = 'Apenas letras';

    if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'E-mail inválido';

    const dataErr = validateData(dataNascimento);
    if (dataErr) newErrors.data = dataErr;

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      Alert.alert('Baza', 'Por favor, corrija os erros no formulário.');
      return;
    }

    setLoading(true);
    try {
      // Converter DD/MM/AAAA → AAAA-MM-DD
      const [dia, mes, ano] = dataNascimento.split('/');
      const dataISO = `${ano}-${mes}-${dia}`;

      await authService.atualizarPerfil({ nome, sobrenome, email, dataNascimento: dataISO });

      const sessao = await authService.obterSessao();
      await authService.salvarSessao({ ...sessao, nome, sobrenome, email });

      // Cliente com registo completo → home do cliente
      navigation.reset({ index: 0, routes: [{ name: 'ClientHome' }] });
    } catch (error: any) {
      Alert.alert('Baza', error.response?.data?.message || 'Erro ao actualizar perfil.');
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
            <Text style={styles.mainTitle}>Boas Vindas</Text>
            <View style={styles.supportContainer}>
              <Text style={styles.topSupportText}>
                Preencha seus dados para validar o perfil.
              </Text>
            </View>
          </View>

          <View style={styles.groupedInputCard}>
            <InputRegister
              placeholder="Nome"
              value={nome}
              autoCapitalize="words"
              onChangeText={(t: string) => {
                setNome(t);
                setErrors((p: any) => ({ ...p, nome: '' }));
              }}
              errorMessage={errors.nome}
              icon={
                <Ionicons
                  name="person-outline"
                  size={18}
                  color={errors.nome ? errorColor : primaryColor}
                />
              }
            />

            <InputRegister
              placeholder="Sobrenome"
              value={sobrenome}
              autoCapitalize="words"
              onChangeText={(t: string) => {
                setSobrenome(t);
                setErrors((p: any) => ({ ...p, sobrenome: '' }));
              }}
              errorMessage={errors.sobrenome}
              icon={
                <Ionicons
                  name="person-outline"
                  size={18}
                  color={errors.sobrenome ? errorColor : primaryColor}
                />
              }
            />

            <InputRegister
              placeholder="Endereço de e-mail"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={(t: string) => {
                setEmail(t);
                setErrors((p: any) => ({ ...p, email: '' }));
              }}
              errorMessage={errors.email}
              icon={
                <Ionicons
                  name="mail-outline"
                  size={18}
                  color={errors.email ? errorColor : primaryColor}
                />
              }
            />

            <InputRegister
              placeholder="DD/MM/AAAA"
              keyboardType="numeric"
              maxLength={10}
              value={dataNascimento}
              onChangeText={handleDataChange}
              errorMessage={errors.data}
              isLast
              icon={
                <Ionicons
                  name="calendar-outline"
                  size={18}
                  color={errors.data ? errorColor : primaryColor}
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