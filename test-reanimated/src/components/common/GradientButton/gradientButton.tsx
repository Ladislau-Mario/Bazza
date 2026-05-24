// src/components/common/GradientButton/gradientButton.tsx
import React from 'react';
import { 
    TouchableOpacity, Text, StyleSheet, ActivityIndicator, TouchableOpacityProps, View 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { themes } from '../../../global/themes'; // Ajusta o caminho se necessário

type Props = TouchableOpacityProps & {
    text: string;
    loading?: boolean;
    gradientColors?: string[]; 
    // NOVA PROP: aceita qualquer componente (como <Image />)
    icon?: React.ReactNode; 
    textStyle?: object; // ADICIONA ESTA LINHA
};

export function GradientButton ({ text, loading, gradientColors, icon, style, textStyle, ...rest }: Props) {
    
    const colors = gradientColors ? gradientColors : ['#00BBFF', '#0077FF'];

    return (
        <LinearGradient
            colors={['#00BBFF', '#0077FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.gradientBorder, style]}
        >
            <TouchableOpacity 
                style={styles.buttonInner}
                activeOpacity={0.8}
                disabled={loading}
                {...rest}
            >
                {loading ? (
                    <ActivityIndicator color={themes.colors.primary} />
                ) : (
                    // NOVA LÓGICA: Se houver ícone, mostra-o à esquerda do texto
                    <>
                        {icon && icon}
                        <Text style={[styles.buttonText, textStyle]}>{text}</Text>
                    </>
                )}
            </TouchableOpacity>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
  gradientBorder: {
    height: 56,
    borderRadius: 16,
    padding: 1.5, // Espessura da borda
    width: '100%',
    marginBottom: 15, // Espaço inferior para o onboarding
    
    // --- ADICIONANDO A SOMBRA AQUI ---
   // shadowColor: themes.colors.primary, // O brilho na cor principal do Baza
 //   shadowOffset: { width: 0, height: 4 },
 //   shadowOpacity: 0.3,
 //   shadowRadius: 4.65,
  //  elevation: 8, // Essencial para aparecer no teu Samsung A16 (Android)
  },
  buttonInner: {
    flex: 1,
    backgroundColor: themes.colors.buttonGoogle3, // Fundo configurado no teu tema
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row', 
    gap: 12, 
    paddingHorizontal: 20,
  },
  buttonText: {
    fontFamily: themes.fonts.poppinsMedium, 
    fontSize: 18,
    color: '#ffff', // Cor branca para contraste
  },
});



