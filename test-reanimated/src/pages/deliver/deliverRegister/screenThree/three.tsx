import React, { useState } from 'react';
import { 
  View, Text, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import BackgroundWrapper from '../../../../components/layout/background/bgscreen';
import { styles } from "./style";
import { Ionicons, FontAwesome5,  } from '@expo/vector-icons';
import { CustomInput } from '../../../../components/common/input/input';
import { Button } from '../../../../components/common/button/button';
import { ButtonBack } from '../../../../components/common/backButton/backButton';
import { FilePicker } from '../../../../components/common/filePicker/filePicker';
import { PickerService } from '../../../../components/modules/services/pickerService/pickerService';

export default function DeliverRegisterThree({ navigation, route }: any) {
  const [numIdentificacao, setNumIdentificacao] = useState('');
  const [fotoFrenteBI, setFotoFrenteBI] = useState<string | null>(null);
  const [fotoFrenteBIMime, setFotoFrenteBIMime] = useState<string | null>(null);
  const [fotoVersoBI, setFotoVersoBI] = useState<string | null>(null);
  const [fotoVersoBIMime, setFotoVersoBIMime] = useState<string | null>(null);

  const [errors, setErrors] = useState<any>({});

  const validate = () => {
    let newErrors: any = {};

    // 1. Validação do Número do BI
    // O BI angolano tem 14 caracteres. Se quiseres ser menos rígido na PT, 
    // podes manter o mínimo de 9, mas o ideal para o Baza é 14.
    if (numIdentificacao.trim().length < 9) { 
      newErrors.identificacao = "Número de identificação inválido.";
    }

    // 2. Validação das Fotos do BI
    if (!fotoFrenteBI) newErrors.frente = true;
    if (!fotoVersoBI) newErrors.verso = true;

    setErrors(newErrors);

    // Retorna true se o objeto de erros estiver vazio
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    // Só avança se a validação acima retornar 'true'
    if (validate()) {
      const previousData = route.params?.data || {};

      const updatedData = {
        ...previousData,
        numIdentificacao,
        fotoFrenteBI,
        fotoFrenteBIMime,
        fotoVersoBI,
        fotoVersoBIMime,
      };

      navigation.navigate('DeliverRegisterFour', { data: updatedData });
    } else {
      // Feedback sonoro/visual caso falte algo
      Alert.alert("Baza", "Por favor, preencha todos os campos do BI.");
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
              <Text style={styles.mainSubTitle}>Agora valide a sua identidade anexando o seu BI.</Text>
            </View>
          </View>

          <View style={styles.whiteContentBlock}>
            <ScrollView 
              contentContainerStyle={styles.internalContainer}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View>
                <Text style={styles.stepSubtitle}>Documento de Identidade</Text>
                
                {/* GRID DE UPLOADS (Alinhado à esquerda conforme o Figma) */}
                <View style={styles.rowInputs}>
                  <FilePicker 
                    label={"Documento de\nidentidade"} 
                    hasFile={!!fotoFrenteBI}
                    fileUri={fotoFrenteBI}
                    onPress={async () => {
                      const doc = await PickerService.pickDocument();
                      if (doc && doc.uri) {
                        setFotoFrenteBI(doc.uri);
                        setFotoFrenteBIMime(doc.mimeType || 'image/jpeg');
                        setErrors({...errors, frente: false});
                      }
                    }}
                    error={errors.frente}
                  />
                  <FilePicker
                    label={"Verso do\nBI"}
                    hasFile={!!fotoVersoBI}
                    fileUri={fotoVersoBI}
                    onPress={async () => {
                      const doc = await PickerService.pickDocument();
                      if (doc && doc.uri) {
                        setFotoVersoBI(doc.uri);
                        setFotoVersoBIMime(doc.mimeType || 'image/jpeg');
                        setErrors({...errors, verso: false});
                      }
                    }}
                    error={errors.verso}
                  />
                </View>

                <View style={{ marginTop: 10 }}>
                  <CustomInput 
                    label="Número de Identificação"
                    placeholder="Ex: 0002505BA012"
                    value={numIdentificacao}
                    autoCapitalize="characters"
                    onChangeText={(t: string) => { 
                        setNumIdentificacao(t); 
                        if(errors.identificacao) setErrors({...errors, identificacao: null}); 
                    }}
                    errorMessage={errors.identificacao}
                    icon={<Ionicons name="card-outline" size={22} color="#808080" />}
                  />
                </View>
              </View>

              <View style={styles.footerContent}>
                {/* INDICADOR DE PROGRESSO (3 de 4 concluídos) */}
                <View style={styles.pages}>
                    <View style={styles.bottomContent}>
                        <View style={styles.blockOne} />
                        <View style={styles.blockOne} />
                        <View style={styles.blockOne} />
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