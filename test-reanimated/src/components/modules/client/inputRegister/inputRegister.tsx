import React from 'react';
import { View, Text, TextInput, TextInputProps } from 'react-native';
import { styles } from './style';

interface Props extends TextInputProps {
  icon?: React.ReactNode; 
  rightIcon?: React.ReactNode;
  isLast?: boolean;
  errorMessage?: string; 
}

export function InputRegister({ icon, rightIcon, isLast, errorMessage, ...rest }: Props) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.inputRow}>
        {icon && <View style={styles.iconContainer}>{icon}</View>}

        <View style={styles.contentArea}>
          <TextInput 
            style={styles.input}
            placeholderTextColor="rgba(30, 37, 48, 0.4)"
            {...rest} 
          />
          
          {errorMessage ? (
            <Text style={{ 
                color: '#FF4D4D', 
                fontSize: 10, 
                position: 'absolute',
                bottom: 6, // Aumentamos aqui para o erro subir e não colar na borda/linha
                left: 0,
                paddingHorizontal: 2, // Pequeno respiro lateral para não colar no ícone
            }}>
                {errorMessage}
            </Text>
            ) : null}
        </View>

        {rightIcon && <View style={styles.rightIconContainer}>{rightIcon}</View>}
      </View>

      {!isLast && <View style={styles.separator} />}
    </View>
  );
}