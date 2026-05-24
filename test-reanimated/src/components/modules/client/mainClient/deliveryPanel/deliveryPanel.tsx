import React, { useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { themes } from '../../../../../global/themes';
import { StepIndicator } from '../stepIndicator/stepIndicator';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export function DeliveryPanel() {
  // Referência para controlar a gaveta programaticamente
  const bottomSheetRef = useRef<BottomSheet>(null);
  
  // Estado para controlar em qual passo o usuário está (1, 2 ou 3)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Definição das paragens da gaveta (Minimizado, Normal, Expandido)
  const snapPoints = useMemo(() => ['25%', '55%', '95%'], []);

  // Função para mudar o passo e ajustar a altura da gaveta se necessário
  const handleNextStep = () => {
    if (currentStep < 3) {
      setCurrentStep((prev) => (prev + 1) as 1 | 2 | 3);
    }
  };

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={1} // Inicia no estado "Normal" (55%)
      snapPoints={snapPoints}
      backgroundStyle={{ backgroundColor: themes.colors.background }}
      handleIndicatorStyle={{ backgroundColor: themes.colors.gray, width: 50 }}
    >
      <BottomSheetView style={styles.contentContainer}>
        
        {/* Título que deve sumir quando o foco estiver no input (ajustaremos no Bloco C) */}
        <View style={styles.header}>
          <Text style={styles.title}>ENVIAR O PACOTE</Text>
        </View>

        {/* O nosso Step Indicator integrado */}
        <StepIndicator currentStep={currentStep} />

        {/* Área de Conteúdo que muda conforme o Passo */}
        <View style={styles.body}>
          {currentStep === 1 && (
            <View style={styles.locationContainer}>
              {/* Exemplo de Input seguindo o teu design (Bloco C vai aprofundar isto) */}
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons name="circle-outline" size={20} color={themes.colors.gradientBlueStart} />
                <TextInput 
                  style={styles.input} 
                  placeholder="Local de recolha" 
                  placeholderTextColor={themes.colors.gray}
                  value="Minha localização" // Provisório
                />
              </View>

              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons name="map-marker" size={20} color={themes.colors.red} />
                <TextInput 
                  style={styles.input} 
                  placeholder="Destino da entrega" 
                  placeholderTextColor={themes.colors.gray}
                />
              </View>
            </View>
          )}

          {/* Rodapé com Botão de Pagamento e Próximo (Imagem 3) */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.paymentButton}>
              <MaterialCommunityIcons name="cash" size={24} color={themes.colors.white} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.nextButton} onPress={handleNextStep}>
              <Text style={styles.nextButtonText}>
                {currentStep === 3 ? 'SOLICITAR BAZA' : 'PRÓXIMO PASSO'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.filterButton}>
              <MaterialCommunityIcons name="tune" size={24} color={themes.colors.white} />
            </TouchableOpacity>
          </View>
        </View>

      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    paddingHorizontal: themes.spacing.md,
  },
  header: {
    alignItems: 'center',
    marginTop: 10,
  },
  title: {
    fontFamily: themes.fonts.outfitSemiBold,
    fontSize: 18,
    color: themes.colors.white,
    letterSpacing: 1,
  },
  body: {
    flex: 1,
    marginTop: 30,
  },
  locationContainer: {
    gap: 15,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C222D', // Um cinza levemente mais claro que o fundo para contraste
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 55,
    borderWidth: 1,
    borderColor: '#2D3545',
  },
  input: {
    flex: 1,
    marginLeft: 10,
    color: themes.colors.white,
    fontFamily: themes.fonts.poppinsRegular,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 30,
    gap: 10,
  },
  paymentButton: {
    width: 55,
    height: 55,
    backgroundColor: '#1C222D',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterButton: {
    width: 55,
    height: 55,
    backgroundColor: '#1C222D',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButton: {
    flex: 1,
    height: 55,
    backgroundColor: themes.colors.primary,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButtonText: {
    fontFamily: themes.fonts.outfitSemiBold,
    color: themes.colors.white,
    fontSize: 16,
  },
});