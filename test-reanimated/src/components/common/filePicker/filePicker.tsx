import React from 'react';
import { TouchableOpacity, Text, View, Image, StyleProp, ViewStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons'; // Mantendo o ícone que já usavas
import { themes } from '../../../global/themes';
import { styles } from './style'; 

interface FilePickerProps {
  label: string;
  onPress?: () => void;
  hasFile?: boolean;
  fileUri?: string | null;
  containerStyle?: StyleProp<ViewStyle>;
  error?: boolean; // Adicionada a prop de erro
}

export function FilePicker({ label, onPress, hasFile, fileUri, containerStyle, error }: FilePickerProps) {
  // Cores do Baza
  const activeColor = themes.colors.primary;
  const errorColor = themes.colors.red;

  return (
    <View style={[styles.container, containerStyle]}>
      <TouchableOpacity 
        style={[
          styles.dashedBox, 
          hasFile && { borderColor: activeColor, borderStyle: 'solid' },
          error && { borderColor: errorColor, backgroundColor: '#FFF5F5', borderStyle: 'dashed' } 
        ]} 
        onPress={onPress}
        activeOpacity={0.7}
      >
        {hasFile && fileUri ? (
          <Image 
            source={{ uri: fileUri }} 
            style={{ width: '100%', height: '100%', borderRadius: 18 }} 
            resizeMode="cover"
          />
        ) : (
          <View style={styles.centerContent}>
            <MaterialIcons 
              name="attach-file" 
              size={20} 
              color={error ? errorColor : (hasFile ? activeColor : themes.colors.gray)} 
            />
            <Text style={[
              styles.placeholderText, 
              hasFile && { color: activeColor },
              error && { color: errorColor }
            ]}>
              {hasFile ? "Pronto" : "Anexar"}
            </Text>
          </View>
        )}
      </TouchableOpacity>
      
      <Text style={[
        styles.label, 
        hasFile && { color: activeColor },
        error && { color: errorColor }
      ]}>
        {label}
      </Text>
    </View>
  );
}