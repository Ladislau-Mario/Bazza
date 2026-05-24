import React from 'react';
import { 
    TouchableOpacity, Text, StyleSheet, ActivityIndicator, TouchableOpacityProps 
} from 'react-native';
import { themes } from '../../../global/themes';
import {Entypo } from '@expo/vector-icons';


// Definimos as propriedades que o botão pode aceitar
type Props = TouchableOpacityProps & {
    
};

export function ButtonBack({onPress, disabled, style, ...rest }: Props) {
    return (
        <TouchableOpacity 
            style={styles.backButton}
            onPress={onPress} // <--- ESTA LINHA É OBRIGATÓRIA
            disabled={disabled}
        >
            <Entypo name="chevron-small-left" size={36} color={themes.colors.text.primary} />
        </TouchableOpacity>
    );
}


import Background from "../../layout/background/bgscreen";

const styles = StyleSheet.create({
    backButton: {
        width: 50,
        height: 50,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2.5,
        borderColor: themes.colors.white,
    },
});