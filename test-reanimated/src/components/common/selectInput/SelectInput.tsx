// src/components/common/selectInput/index.tsx
import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { themes } from '../../../global/themes';
import { MaterialIcons } from '@expo/vector-icons'; // Importar para o ícone de erro

export function SelectInput({ label, value, placeholder, onPress, icon, errorMessage }: any) {
  const hasError = !!errorMessage;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      
      {/* Container extra para a sombra não ser cortada */}
      <View style={styles.shadowWrapper}>
        <TouchableOpacity 
          style={[
            styles.inputArea, 
            hasError ? styles.inputErrorShadow : styles.inputShadowStandard 
          ]} 
          onPress={onPress}
          activeOpacity={0.7}
        >
          {icon && <View style={styles.icon}>{icon}</View>}
          <Text style={[styles.inputText, !value && { color: '#A1A1A1' }]}>
            {value || placeholder}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#808080" />
        </TouchableOpacity>
      </View>

      {/* Mensagem de erro com ícone de exclamação */}
      {hasError && (
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={10} color={themes.colors.red} />
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', marginBottom: 10 },
  shadowWrapper: {
    padding: 2, // Espaço para a sombra de erro aparecer
  },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    height: 52,
    borderRadius: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'transparent',
    // Segue o shadow que já usas no CustomInput
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  
  },

  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    marginLeft: 5
  },
 
  label: { fontFamily: themes.fonts.poppinsRegular, fontSize: 14, color: '#808080', marginBottom: 4, marginLeft: 4 },
 
  inputText: { flex: 1, fontFamily: themes.fonts.poppinsRegular, fontSize: 14, color: '#1E2530' },
  icon: { marginRight: 10 },
errorText: { 
    color: themes.colors.red, 
    fontSize: 11, 
    fontFamily: themes.fonts.poppinsLight,
    lineHeight: 16, // Define uma altura fixa para o texto não "empurrar" o container
    includeFontPadding: false, // Remove padding extra no Android
    textAlignVertical: 'center',
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

 
});