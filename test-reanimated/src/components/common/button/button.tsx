import React from 'react';
import { 
    TouchableOpacity, Text, StyleSheet, ActivityIndicator, TouchableOpacityProps 
} from 'react-native';
import { themes } from '../../../global/themes';


// Definimos as propriedades que o botão pode aceitar
type Props = TouchableOpacityProps & {
    text: string;
    loading?: boolean;
    color?: string; // Caso queiras um botão de outra cor no futuro
    gradientColors?: string[]; 
    icon?: React.ReactNode;
    textStyle?: object; // ADICIONA ESTA LINHA
};

export function Button({ text, loading,color, style, textStyle, ...rest }: Props) {
    return (
        <TouchableOpacity 
            style={[
                styles.buttonPrimary, 
                color ? { backgroundColor: color } : {}, // Se passares cor, ele usa, senão usa a primária
                style // Permite passar estilos extras de fora
            ]}
            activeOpacity={0.7}
            disabled={loading} // Desativa o botão enquanto carrega
            {...rest}
        >
            {loading ? (
                <ActivityIndicator color={themes.colors.white} />
            ) : (
               <Text style={[styles.buttonText, textStyle]}>{text}</Text>
            )}
        </TouchableOpacity>
    );
}


import Background from "../../layout/background/bgscreen";

const styles = StyleSheet.create({
    buttonPrimary: {
        backgroundColor: themes.colors.primary,
        width: '100%',
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: themes.colors.primary, // Um leve brilho na cor do botão
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8, // Sombra para Android
    },
    buttonText: {
        fontFamily: themes.fonts.poppinsMedium,
        fontSize: 18,
        color: themes.colors.white,
    },
});