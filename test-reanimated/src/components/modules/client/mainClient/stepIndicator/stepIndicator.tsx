import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { themes } from '../.././../../../global/themes'; // Importando o teu objeto themes

interface StepIndicatorProps {
  currentStep: 1 | 2 | 3;
}

const steps = [
  { id: 1, label: 'Localização', icon: 'map-marker-outline' as const },
  { id: 2, label: 'Detalhes', icon: 'clipboard-text-outline' as const },
  { id: 3, label: 'Preço', icon: 'wallet-outline' as const },
];

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  
  const renderStep = (stepId: number, iconName: keyof typeof MaterialCommunityIcons.glyphMap, label: string) => {
    const isActive = stepId === currentStep;
    const isCompleted = stepId < currentStep;

    // Cores baseadas no teu themes.ts
    const activeColor = themes.colors.white;
    const inactiveColor = themes.colors.gray;

    return (
      <View key={stepId} style={styles.stepContainer}>
        {isActive ? (
          // Círculo com o teu gradiente azul quando ativo
          <LinearGradient
            colors={[themes.colors.gradientBlueStart, themes.colors.gradientBlueEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.circle}
          >
            <MaterialCommunityIcons name={iconName} size={24} color={activeColor} />
          </LinearGradient>
        ) : (
          // Círculo inativo ou completado (sem gradiente)
          <View style={[
            styles.circle, 
            styles.circleInactive, 
            isCompleted && { borderColor: themes.colors.gradientBlueStart }
          ]}>
            <MaterialCommunityIcons 
              name={iconName} 
              size={24} 
              color={isCompleted ? themes.colors.gradientBlueStart : inactiveColor} 
            />
          </View>
        )}
        
        <Text style={[
          styles.stepText, 
          isActive && styles.stepTextActive
        ]}>
          {`PASSO ${stepId}`}
        </Text>
        
        <Text style={[
          styles.labelText, 
          isActive && styles.labelTextActive
        ]}>
          {label}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {steps.map((step, index) => {
        const renderLine = index < steps.length - 1;
        // A linha fica azul se o passo atual já passou por ela
        const lineIsActive = currentStep > (index + 1);

        return (
          <React.Fragment key={step.id}>
            {renderStep(step.id, step.icon, step.label)}
            {renderLine && (
              <View style={[
                styles.line, 
                { backgroundColor: themes.colors.gray }, // Cor base da linha
                lineIsActive && { backgroundColor: themes.colors.gradientBlueStart } // Linha ativa
              ]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: themes.spacing.sm,
    width: '100%',
    marginTop: themes.spacing.md,
  },
  stepContainer: {
    alignItems: 'center',
    width: 70,
  },
  circle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5, // Sombra suave no Android
    shadowColor: themes.colors.gradientBlueStart,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  circleInactive: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: themes.colors.gray,
  },
  line: {
    flex: 1,
    height: 2,
    marginHorizontal: -15,
    marginTop: -40, // Alinha a linha com o centro dos círculos
    zIndex: -1,    // Garante que a linha fique atrás das bolinhas
  },
  stepText: {
    fontFamily: themes.fonts.outfitLight,
    fontSize: 10,
    color: themes.colors.gray,
    marginTop: 8,
  },
  stepTextActive: {
    fontFamily: themes.fonts.outfitMedium,
    color: themes.colors.white,
  },
  labelText: {
    fontFamily: themes.fonts.poppinsRegular,
    fontSize: 11,
    color: themes.colors.gray,
    marginTop: 2,
  },
  labelTextActive: {
    fontFamily: themes.fonts.poppinsMedium,
    color: themes.colors.white,
  },
});