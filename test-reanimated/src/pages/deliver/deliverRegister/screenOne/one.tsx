import React, { useState } from 'react';
import { 
  View, Text, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import BackgroundWrapper from '../../../../components/layout/background/bgscreen';
import { styles } from "./style";
import { Ionicons } from '@expo/vector-icons';
import { CustomInput } from '../../../../components/common/input/input';
import { Button } from '../../../../components/common/button/button';
import { ButtonBack } from '../../../../components/common/backButton/backButton';
import { FilePicker } from '../../../../components/common/filePicker/filePicker';
import { PickerService } from '../../../../components/modules/services/pickerService/pickerService'; 

//API do Axios para pegarmos os dados para o Back-End
import axios from 'axios';
import api from '../../../../components/modules/services/api/api';

export default function DeliverRegister({ navigation }: any) {
  const [nome, setNome] = useState('');
  const [sobrenome, setSobrenome] = useState('');
  const [email, setEmail] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [fotoPerfil, setFotoPerfil] = useState<string | null>(null);

  const [errors, setErrors] = useState<any>({});

  const handleDataChange = (text: string) => {
    let cleaned = text.replace(/\D/g, '');
    let formatted = cleaned;
    /*
    if (cleaned.length > 2) formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    if (cleaned.length > 4) formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4, 8)}`;
    */
    if (cleaned.length > 2 && cleaned.length <= 4) {
    formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
  } else if (cleaned.length > 4) {
    formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4, 8)}`;
  }

    setDataNascimento(formatted);
    if (errors.data) setErrors({ ...errors, data: null });
  };

  const validateAge = (dateStr: string) => {
    if (dateStr.length !== 10) return "Data incompleta.";
    const [day, month, year] = dateStr.split('/').map(Number);
    const birthDate = new Date(year, month - 1, day);
    const today = new Date();
    
    if (birthDate.getFullYear() !== year || birthDate.getMonth() !== month - 1 || birthDate.getDate() !== day) {
      return "Data inválida.";
    }

    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;

    if (age < 18) return "Mínimo 18 anos.";
    return "";
  };

  const validate = () => {
    let newErrors: any = {};
    const nameRegex = /^[A-Za-zÀ-ÖØ-öø-ÿ\s]+$/;
    const emailRegex = /\S+@\S+\.\S+/;

    if (nome.trim().length < 3 || !nameRegex.test(nome)) newErrors.nome = "Nome inválido.";
    if (sobrenome.trim().length < 2 || !nameRegex.test(sobrenome)) newErrors.sobrenome = "Sobrenome inválido.";
    if (!emailRegex.test(email)) newErrors.email = "E-mail inválido.";
    
    const ageError = validateAge(dataNascimento);
    if (ageError) newErrors.data = ageError;

    if (!fotoPerfil) newErrors.foto = true;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validate()) {
      // Criamos um objeto com o que já temos
      const personalData = {
        nome,
        sobrenome,
        email,
        dataNascimento,
        fotoPerfil, // A URI da imagem
        role: 'driver' // Lembras-te que o Back-end pediu a string?
      };

      // Passamos para a próxima tela do cadastro
      navigation.navigate('DeliverRegisterTwo', { data: personalData });
    } else {
      Alert.alert("Baza", "Por favor, preencha os dados e selecione sua foto.");
    }
  };

  return (
    <BackgroundWrapper>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={{ flex: 1 }}>
          <View style={styles.headerSection}>
            <ButtonBack onPress={() => navigation.goBack()} />
            <View style={styles.main}>
              <Text style={styles.mainTitle}>Cadastro</Text>
              <Text style={styles.mainSubTitle}>Preencha seus dados para validar o seu perfil.</Text>
            </View>
          </View>

          <View style={styles.whiteContentBlock}>
            <ScrollView 
              contentContainerStyle={styles.internalContainer}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View>
                <Text style={styles.stepSubtitle}>Informações Pessoais</Text>
                
                <View style={styles.filesContent}>
                  {/* Agora apenas a Foto de Perfil é solicitada */}
                  <FilePicker 
                    label="Foto de Perfil" 
                    onPress={async () => {
                      const uri = await PickerService.pickProfileImage();
                      if (uri) { 
                        setFotoPerfil(uri); 
                        setErrors({...errors, foto: false}); 
                      }
                    }} 
                    hasFile={!!fotoPerfil}
                    fileUri={fotoPerfil}
                    error={errors.foto}
                  />
                </View>

                <View style={styles.inputGap}>
                  <View style={styles.rowInputs}>
                    <CustomInput 
                      label="Nome"
                      placeholder="Ex: Osmar"
                      value={nome}
                      onChangeText={(t: string) => { setNome(t); if(errors.nome) setErrors({...errors, nome: null}); }}
                      errorMessage={errors.nome}
                      containerStyle={{ flex: 1 }}
                    />
                    <CustomInput 
                      label="Sobrenome"
                      placeholder="Costa"
                      value={sobrenome}
                      onChangeText={(t: string) => { setSobrenome(t); if(errors.sobrenome) setErrors({...errors, sobrenome: null}); }}
                      errorMessage={errors.sobrenome}
                      containerStyle={{ flex: 1 }}
                    />
                  </View>

                  <CustomInput 
                    label="E-mail"
                    placeholder="exemplo@gmail.com"
                    value={email}
                    onChangeText={(t: string) => { setEmail(t); if(errors.email) setErrors({...errors, email: null}); }}
                    errorMessage={errors.email}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />

                  <CustomInput 
                    label="Data de nascimento"
                    placeholder="DD/MM/AAAA"
                    value={dataNascimento}
                    onChangeText={handleDataChange}
                    errorMessage={errors.data}
                    keyboardType="numeric"
                    maxLength={10}
                    icon={<Ionicons name="calendar-outline" size={22} color="#808080" />}
                  />
                </View>
              </View>

              <View style={styles.footerContent}>
                <View style={styles.pages}>
                    <View style={styles.bottomContent}>
                        <View style={styles.blockOne} />
                        <View style={[styles.blockTwo, {backgroundColor: '#E0E0E0'}]} />
                        <View style={[styles.blockTwo, {backgroundColor: '#E0E0E0'}]} />
                        <View style={[styles.blockTwo, {backgroundColor: '#E0E0E0'}]} />
                    </View>
                </View>
                
                <Button text='Próximo' onPress={handleNextStep} />
              </View>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </BackgroundWrapper>
  );
}