import React from 'react';
import { View, TextInput, Text, StyleSheet, Platform } from 'react-native';
import { themes } from '../../../global/themes';
import { MaterialIcons } from '@expo/vector-icons'; // Importado para a bolinha de erro

export function CustomInput({ label, errorMessage, icon, containerStyle, ...rest }: any) {
  const hasError = !!errorMessage;

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={styles.label}>{label}</Text>
      
      <View style={styles.shadowWrapper}>
        <View style={[
          styles.inputArea, 
          hasError ? styles.inputErrorShadow : styles.inputShadowStandard 
        ]}>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          
          <TextInput 
            style={styles.input} 
            placeholderTextColor="#A1A1A1"
            {...rest} 
          />
        </View>
      </View>

      {/* Mensagem de erro com a bolinha (MaterialIcons) */}
      {hasError && (
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={12} color={themes.colors.red} />
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    width: '100%', 
    marginBottom: 10 // Reduzi para 10 para alinhar com o SelectInput
  },
  shadowWrapper: {
    padding: 2, // Garante que a sombra de erro não seja cortada
  },
  label: {
    fontFamily: themes.fonts.poppinsRegular,
    fontSize: 14,
    color: '#808080',
    marginBottom: 4, // Padronizado com SelectInput
    marginLeft: 4,
  },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    height: 52, // Mesma altura do SelectInput
    borderRadius: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputShadowStandard: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    backgroundColor: '#fff',
  },
  inputErrorShadow: {
    backgroundColor: '#fff',
    borderColor: 'rgba(255, 0, 0, 0.1)', 
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: themes.colors.red,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.22,
        shadowRadius: 4,
      },
      android: { elevation: 3 }
    })
  },
  input: {
    flex: 1,
    fontFamily: themes.fonts.poppinsRegular,
    fontSize: 14,
    color: '#1E2530',
    // No Android, o TextInput tem paddings internos por padrão, vamos remover:
    paddingVertical: 0,
    includeFontPadding: false,
  },
  iconContainer: { 
    marginRight: 10, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  errorContainer: { 
    flexDirection: 'row', // Alinha ícone e texto
    alignItems: 'center', 
    gap: 4,
    marginTop: 4, 
    marginLeft: 5 
  },
  errorText: {
    color: themes.colors.red,
    fontSize: 11,
    fontFamily: themes.fonts.poppinsLight,
    lineHeight: 16,
    includeFontPadding: false,
    textAlignVertical: 'center',
  }
});