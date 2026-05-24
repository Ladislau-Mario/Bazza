import React, { useState } from 'react';
import { 
  View, Text, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import BackgroundWrapper from '../../../../components/layout/background/bgscreen';
import { styles } from "./style";
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { CustomInput } from '../../../../components/common/input/input';
import { Button } from '../../../../components/common/button/button';
import { ButtonBack } from '../../../../components/common/backButton/backButton';
import { FilePicker } from '../../../../components/common/filePicker/filePicker';
import { PickerService } from '../../../../components/modules/services/pickerService/pickerService';

export default function DeliverRegisterTwo({ navigation, route }: any) {
  // Pegamos o que veio da tela anterior (Nome, Email, etc.)
  const dataFromStepOne = route.params?.data || {};

  const [numLicenca, setNumLicenca] = useState('');
  const [fotoFrente, setFotoFrente] = useState<string | null>(null);
  const [fotoFrenteMime, setFotoFrenteMime] = useState<string | null>(null);
  const [fotoVerso, setFotoVerso] = useState<string | null>(null);
  const [fotoVersoMime, setFotoVersoMime] = useState<string | null>(null);
  const [errors, setErrors] = useState<any>({});

 const validate = () => {
  let newErrors: any = {};
  if (numLicenca.trim().length < 5) newErrors.licenca = "Inválida";
  if (!fotoFrente) newErrors.frente = true;
  if (!fotoVerso) newErrors.verso = true;
  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};

const handleNextStep = () => {
    if (validate()) {
      const updatedData = {
        ...dataFromStepOne,
        numLicenca,
        fotoFrente,
        fotoFrenteMime,
        fotoVerso,
        fotoVersoMime,
      };

      // Passamos tudo junto para a Parte 3
      navigation.navigate('DeliverRegisterThree', { data: updatedData });
    } else {
      Alert.alert("Baza", "Por favor, anexe os documentos da sua carta.");
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
              <Text style={styles.mainSubTitle}>Agora precisamos dos dados da sua carta de condução.</Text>
            </View>
          </View>

          <View style={styles.whiteContentBlock}>
            <ScrollView 
              contentContainerStyle={styles.internalContainer}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View>
                <Text style={styles.stepSubtitle}>Carta de Condução</Text>
                
                {/* GRID DE UPLOADS LADO A LADO */}
                <View style={styles.rowInputs}>
                  <FilePicker 
                  label={"Carteira de\nhabilitação"} 
                  hasFile={!!fotoFrente}
                  fileUri={fotoFrente}
                  onPress={async () => {
                    const doc = await PickerService.pickDocument();
                    if (doc && doc.uri) {
                      setFotoFrente(doc.uri);
                      setFotoFrenteMime(doc.mimeType || 'image/jpeg');
                      setErrors({...errors, frente: false});
                    }
                  }}
                  error={errors.frente}

                />

                <FilePicker
                  label={"Verso da\nACC"}
                  hasFile={!!fotoVerso}
                  fileUri={fotoVerso}
                  onPress={async () => {
                    const doc = await PickerService.pickDocument();
                    if (doc && doc.uri) {
                      setFotoVerso(doc.uri);
                      setFotoVersoMime(doc.mimeType || 'image/jpeg');
                      setErrors({...errors, verso: false});
                    }
                  }}
                  error={errors.verso}
                />
                </View>

                <View style={{ marginTop: 10 }}>
                  <CustomInput 
                    label="Número da Licença"
                    placeholder="Ex: ANG 2025 LL..."
                    value={numLicenca}
                    onChangeText={(t: string) => { 
                        setNumLicenca(t); 
                        if(errors.licenca) setErrors({...errors, licenca: null}); 
                    }}
                    errorMessage={errors.licenca}
                    icon={<FontAwesome5 name="address-card" size={22} color="#808080" />}
                  />
                </View>
              </View>

              <View style={styles.footerContent}>
                {/* INDICADOR DE PROGRESSO (2 de 4 concluídos) */}
                <View style={styles.pages}>
                    <View style={styles.bottomContent}>
                        <View style={styles.blockOne} />
                        <View style={styles.blockOne} />
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