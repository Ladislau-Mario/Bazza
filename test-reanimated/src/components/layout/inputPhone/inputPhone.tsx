import React, { forwardRef, useState } from 'react';
import { View, TextInput, TextInputProps, Image, TouchableOpacity, Text } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { style } from './style';
import { themes } from '../../../global/themes';

type Props = TextInputProps & { 
    title?: string;
    hasError?: boolean;
    isSuccess?: boolean;
}

export const InputPhone = forwardRef<TextInput, Props>((props, ref) => {
    const { title, hasError, isSuccess, onBlur, onFocus, onChangeText, ...rest } = props;
    const [isFocused, setIsFocused] = useState(false);
    
    // Lógica de cores dinâmica
    let borderColor = themes.colors.buttonGoogle1; // Padrão
    if (isFocused) borderColor = themes.colors.white;
    if (hasError) borderColor = '#FF4B4B'; // Vermelho erro
    if (isSuccess) borderColor = themes.colors.primary; // Azul sucesso

    // Cor do ícone baseada no estado
    let iconColor = themes.colors.lightGray; // Padrão
    if (isFocused) iconColor = themes.colors.white; // Branco ao digitar
    if (hasError) iconColor = '#FF4B4B'; // Vermelho erro
    if (isSuccess) iconColor = themes.colors.primary; // Azul sucesso

    return (
        <View style={style.container}>
            {title && <Text style={style.titleInput}>{title}</Text>}
            
            <View style={[style.boxInputPhone, { borderColor }]}>
                <TouchableOpacity style={style.countryArea} activeOpacity={0.8}>
                    <Image 
                        source={require('../../../assets/bandeira-angola.png')} 
                        style={style.flag} 
                    />
                    <Text style={[style.countryText, (isFocused || isSuccess) && {color: themes.colors.white}]}>+244</Text>
                </TouchableOpacity>

                <View style={[style.verticalDivider, { backgroundColor: borderColor }]} />

                <TextInput
                    ref={ref}
                    style={style.inputPhoneField}
                    placeholderTextColor={themes.colors.lightGray}
                    keyboardType="phone-pad"
                    maxLength={9}
                    onFocus={(e) => {
                        setIsFocused(true);
                        if (onFocus) onFocus(e);
                    }}
                    onBlur={(e) => {
                        setIsFocused(false);
                        if (onBlur) onBlur(e);
                    }}
                    onChangeText={(text) => {
                        const cleaned = text.replace(/[^0-9]/g, '');
                        if (onChangeText) onChangeText(cleaned);
                    }}
                    {...rest}
                />

                <Ionicons 
                    name="phone-portrait-outline" 
                    size={20} 
                    color={iconColor} // Agora o ícone segue a lógica
                    style={{ marginRight: 15 }} 
                />
            </View>
        </View>
    );
});