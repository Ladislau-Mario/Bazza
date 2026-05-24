// src/pages/deliver/deliverRegister/screenFour/four.tsx
import React, { useState } from 'react';
import {
  View, Text, KeyboardAvoidingView, Platform,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import BackgroundWrapper from '../../../../components/layout/background/bgscreen';
import { styles } from './style';
import { Ionicons, Fontisto } from '@expo/vector-icons';
import { CustomInput } from '../../../../components/common/input/input';
import { Button } from '../../../../components/common/button/button';
import { ButtonBack } from '../../../../components/common/backButton/backButton';
import { FilePicker } from '../../../../components/common/filePicker/filePicker';
import { SelectInput } from '../../../../components/common/selectInput/SelectInput';
import { SelectionModal } from '../../../../components/common/selectionModal/selectionModal';
import { PickerService } from '../../../../components/modules/services/pickerService/pickerService';
import { vehicleData } from '../../../../components/modules/services/data/vehicleData';
import api from '../../../../components/modules/services/api/api';
import { enviarDocumentosMotoqueiro } from '../../../../components/modules/services/api/uploadService';
import { authService } from '../../../../components/modules/services/api/authService';

export default function DeliverRegisterFour({ navigation, route }: any) {
  const dataFromStepThree = route.params?.data || {};
  const [loading, setLoading] = useState(false);

  const [fotoVeiculo, setFotoVeiculo] = useState<string | null>(null);
  const [fotoVeiculoMime, setFotoVeiculoMime] = useState<string | null>(null);
  const [certFrente, setCertFrente] = useState<string | null>(null);
  const [certFrenteMime, setCertFrenteMime] = useState<string | null>(null);
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [cor, setCor] = useState('');
  const [placa, setPlaca] = useState('');

  const [modalMarcaVisible, setModalMarcaVisible] = useState(false);
  const [modalModeloVisible, setModalModeloVisible] = useState(false);
  const [modalCorVisible, setModalCorVisible] = useState(false);
  const [errors, setErrors] = useState<any>({});

  const validate = () => {
    let newErrors: any = {};
    if (!fotoVeiculo) newErrors.fotoVeiculo = true;
    if (!certFrente) newErrors.certFrente = true;
    if (!marca) newErrors.marca = 'Escolha a marca.';
    if (!modelo) newErrors.modelo = 'Escolha o modelo.';
    if (!cor) newErrors.cor = 'Escolha a cor.';
    if (!placa) newErrors.placa = 'Informe a placa.';
    else if (placa.length < 8) newErrors.placa = 'Placa inválida.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFinish = async () => {
    if (!validate()) {
      Alert.alert('Baza', 'Por favor, preencha todos os dados do veículo.');
      return;
    }

    setLoading(true);
    try {
      // PASSO 1: Registar motoqueiro + veículo no backend
      await api.post('/motoqueiros/completar-perfil', {
        nome:           dataFromStepThree.nome,
        sobrenome:      dataFromStepThree.sobrenome,
        email:          dataFromStepThree.email,
        dataNascimento: dataFromStepThree.dataNascimento,
        numeroBI:       dataFromStepThree.numIdentificacao,
        numeroCarta:    dataFromStepThree.numLicenca,
        morada:         dataFromStepThree.morada || '',
        marca,
        modelo,
        placa,
        corPrincipal:   cor,
        ano:            new Date().getFullYear(),
      });

      // PASSO 2: Enviar todos os documentos/fotos
      const { sucesso, erros } = await enviarDocumentosMotoqueiro({
        fotoPerfil:     dataFromStepThree.fotoPerfil,
        fotoPerfilMime: dataFromStepThree.fotoPerfilMime,
        fotoFrente:     dataFromStepThree.fotoFrente,
        fotoFrenteMime: dataFromStepThree.fotoFrenteMime,
        fotoVerso:      dataFromStepThree.fotoVerso,
        fotoVersoMime:  dataFromStepThree.fotoVersoMime,
        fotoFrenteBI:     dataFromStepThree.fotoFrenteBI,
        fotoFrenteBIMime: dataFromStepThree.fotoFrenteBIMime,
        fotoVersoBI:      dataFromStepThree.fotoVersoBI,
        fotoVersoBIMime:  dataFromStepThree.fotoVersoBIMime,
        fotoVeiculo,
        fotoVeiculoMime,
        certFrente,
        certFrenteMime,
      });

      if (!sucesso) {
        Alert.alert(
          'Alguns uploads falharam',
          `Os seguintes documentos não foram enviados: ${erros.join(', ')}. Pode tentar novamente mais tarde.`,
        );
      }

      // PASSO 3: Actualizar sessão local com role deliver
      const sessao = await authService.obterSessao();
      await authService.salvarSessao({ ...sessao, role: 'deliver' });

      // PASSO 4: Navegar para o estado de registo
      navigation.reset({
        index: 0,
        routes: [{ name: 'FirstRegistrationStatus' }],
      });
    } catch (error: any) {
      console.warn('Erro no registo final:', error.response?.data || error.message);
      Alert.alert(
        'Erro no registo',
        error.response?.data?.message || 'Não foi possível completar o registo. Tente novamente.',
      );
      setLoading(false);
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
        <View style={{ flex: 1 }}>
          <View style={styles.headerSection}>
            <ButtonBack onPress={() => navigation.goBack()} />
            <View style={styles.main}>
              <Text style={styles.mainTitle}>Cadastro</Text>
              <Text style={styles.mainSubTitle}>Dados do veículo para as tuas entregas.</Text>
            </View>
          </View>

          <View style={styles.whiteContentBlock}>
            <ScrollView
              contentContainerStyle={styles.internalContainer}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.stepSubtitle}>Fotos e Documentos do Veículo</Text>

              <View style={styles.rowInputs}>
                <FilePicker
                  label={'Foto do veículo'}
                  hasFile={!!fotoVeiculo}
                  fileUri={fotoVeiculo}
                  onPress={async () => {
                    const doc = await PickerService.pickDocument();
                    if (doc?.uri) {
                      setFotoVeiculo(doc.uri);
                      setFotoVeiculoMime(doc.mimeType || 'image/jpeg');
                      setErrors((prev: any) => ({ ...prev, fotoVeiculo: false }));
                    }
                  }}
                  error={errors.fotoVeiculo}
                />
                <FilePicker
                  label={'Foto da placa\ndo veículo'}
                  hasFile={!!certFrente}
                  fileUri={certFrente}
                  onPress={async () => {
                    const doc = await PickerService.pickDocument();
                    if (doc?.uri) {
                      setCertFrente(doc.uri);
                      setCertFrenteMime(doc.mimeType || 'image/jpeg');
                      setErrors((prev: any) => ({ ...prev, certFrente: false }));
                    }
                  }}
                  error={errors.certFrente}
                />
              </View>

              <View style={{ marginTop: 20 }}>
                <SelectInput
                  label="Marca do veículo"
                  placeholder="Selecione a marca"
                  value={marca}
                  onPress={() => setModalMarcaVisible(true)}
                  errorMessage={errors.marca}
                  icon={<Fontisto name="motorcycle" size={20} color="#808080" />}
                />

                <SelectInput
                  label="Modelo do veículo"
                  placeholder={marca ? 'Selecione o modelo' : 'Escolha a marca primeiro'}
                  value={modelo}
                  onPress={() =>
                    marca
                      ? setModalModeloVisible(true)
                      : Alert.alert('Baza', 'Escolha primeiro a marca.')
                  }
                  errorMessage={errors.modelo}
                  icon={<Ionicons name="filter" size={20} color="#808080" />}
                />

                <View style={[styles.rowInputs, { gap: 15 }]}>
                  <View style={{ flex: 1 }}>
                    <SelectInput
                      label="Cor"
                      placeholder="Cor"
                      value={cor}
                      onPress={() => setModalCorVisible(true)}
                      icon={<Ionicons name="color-palette-outline" size={20} color="#808080" />}
                      errorMessage={errors.cor}
                    />
                  </View>
                  <View style={{ flex: 1.5 }}>
                    <CustomInput
                      label="Número da placa"
                      placeholder="LD-00-00-XX"
                      value={placa}
                      onChangeText={(t: string) => {
                        if (t.length <= 11) setPlaca(t.toUpperCase());
                        if (errors.placa) setErrors((p: any) => ({ ...p, placa: null }));
                      }}
                      autoCapitalize="characters"
                      errorMessage={errors.placa}
                      maxLength={11}
                    />
                  </View>
                </View>
              </View>

              <View style={styles.footerContent}>
                <View style={styles.pages}>
                  <View style={styles.bottomContent}>
                    {[1, 2, 3, 4].map((i) => (
                      <View key={i} style={styles.blockOne} />
                    ))}
                  </View>
                </View>
                <Button
                  text={loading ? 'Enviando...' : 'Concluir Registro'}
                  onPress={handleFinish}
                  disabled={loading}
                />
                {loading && (
                  <ActivityIndicator
                    size="large"
                    color="#0047FF"
                    style={{ marginTop: 20 }}
                  />
                )}
              </View>
            </ScrollView>
          </View>
        </View>

        <SelectionModal
          visible={modalMarcaVisible}
          title="Selecionar Marca"
          data={vehicleData.marcas.map((m) => m.name)}
          onClose={() => setModalMarcaVisible(false)}
          onSelect={(item) => {
            setMarca(item);
            setModelo('');
            setErrors((p: any) => ({ ...p, marca: null }));
          }}
        />
        <SelectionModal
          visible={modalModeloVisible}
          title={`Modelos ${marca}`}
          data={vehicleData.modelos[marca as keyof typeof vehicleData.modelos] || []}
          onClose={() => setModalModeloVisible(false)}
          onSelect={(item) => {
            setModelo(item);
            setErrors((p: any) => ({ ...p, modelo: null }));
          }}
        />
        <SelectionModal
          visible={modalCorVisible}
          title="Selecionar Cor"
          data={vehicleData.cores.map((c) => c.name)}
          onClose={() => setModalCorVisible(false)}
          onSelect={(item) => {
            setCor(item);
            setErrors((p: any) => ({ ...p, cor: null }));
          }}
        />
      </KeyboardAvoidingView>
    </BackgroundWrapper>
  );
}