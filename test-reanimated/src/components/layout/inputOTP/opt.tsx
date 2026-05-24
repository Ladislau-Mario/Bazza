import React, { useState, useRef, useEffect } from 'react';
import { View, TextInput, NativeSyntheticEvent, TextInputKeyPressEventData, ActivityIndicator } from 'react-native';
import { style } from './style';
import { themes } from '../../../global/themes';

type Props = {
    codeLength: 4 | 6;
    onCodeFilled: (code: string) => void;
    hasError?: boolean;
    onClearError?: () => void;
    editable?: boolean; // ADICIONADO: Agora o componente aceita esta prop
};

export const InputOTP = ({ 
    codeLength, 
    onCodeFilled, 
    hasError, 
    onClearError, 
    editable = true // Valor padrão é verdadeiro
}: Props) => {
    const [code, setCode] = useState<string[]>(new Array(codeLength).fill(''));
    const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
    const inputs = useRef<TextInput[]>([]);

    const isComplete = code.every(char => char !== '');

    useEffect(() => {
        if (hasError) {
            const timer = setTimeout(() => {
                setCode(new Array(codeLength).fill(''));
                if (onClearError) onClearError();
                inputs.current[0]?.focus();
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [hasError]);

    const handleChange = (text: string, index: number) => {
        // Bloqueia digitação se não estiver editável
        if (!editable) return; 

        const cleanedText = text.replace(/[^0-9]/g, '');
        if (cleanedText.length > 0) {
            const newCode = [...code];
            newCode[index] = cleanedText.slice(-1);
            setCode(newCode);

            if (index < codeLength - 1) {
                inputs.current[index + 1]?.focus();
            }

            if (newCode.every(char => char !== '')) {
                onCodeFilled(newCode.join(''));
            }
        }
    };

    const handleKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>, index: number) => {
        if (!editable) return;

        if (e.nativeEvent.key === 'Backspace') {
            if (code[index] === '' && index > 0) {
                const newCode = [...code];
                newCode[index - 1] = '';
                setCode(newCode);
                inputs.current[index - 1]?.focus();
            } else {
                const newCode = [...code];
                newCode[index] = '';
                setCode(newCode);
            }
        }
    };

    return (
        <View style={style.container}>
           {code.map((char, index) => {
    // 1. Cor padrão (Cinza/Google)
    let borderColor = themes.colors.buttonGoogle1; 
    
    if (hasError) {
        // 2. Erro tem prioridade máxima (Vermelho)
        borderColor = themes.colors.red; 
    } else if (focusedIndex === index) {
        // 3. Foco do utilizador (Branco)
        borderColor = themes.colors.white; 
    } else if (isComplete && !editable) {
        // 4. ESTA É A CHAVE: Se completou e o campo bloqueou (editable=false), 
        // mantemos uma cor neutra ou de processamento, NÃO a azul ainda.
        borderColor = themes.colors.buttonGoogle1; 
    } else if (isComplete && editable && !hasError) {
        // 5. Só fica azul se estiver completo E o servidor já deu OK (ou não estamos a validar)
        borderColor = themes.colors.primary; 
    }

                return (
                    <TextInput
                        key={index}
                        ref={(el) => { if (el) inputs.current[index] = el; }}
                        style={[
                            style.inputCard, 
                            { borderColor },
                            !editable && { opacity: 0.6 } // Feedback visual de bloqueio
                        ]}
                        keyboardType="number-pad"
                        maxLength={1}
                        value={char}
                        onFocus={() => setFocusedIndex(index)}
                        onBlur={() => setFocusedIndex(null)}
                        onChangeText={(text) => handleChange(text, index)}
                        onKeyPress={(e) => handleKeyPress(e, index)}
                        selectTextOnFocus
                        // O segredo está aqui: o TextInput real recebe o editable
                        editable={editable && !hasError} 
                    
                    />
                    
                );
            })}
    
        </View>
        
    );

};