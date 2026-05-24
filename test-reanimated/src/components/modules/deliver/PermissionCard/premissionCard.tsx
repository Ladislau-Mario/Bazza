// src/components/modules/deliver/PermissionCard/index.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons, FontAwesome6,Octicons } from '@expo/vector-icons';
import { themes } from '../../../../global/themes';
import { Button } from '../../../common/button/button';

type PermissionCardProps = {
  title: string;
  description: string;
  iconName: any; 
  isExpanded: boolean;
  isCompleted: boolean;
  onPress: () => void;
  onAction: () => void;
  library?: 'Ionicons' | 'FontAwesome6' | 'Octicons';
};

export function PermissionCard({ 
  title, 
  description, 
  iconName, 
  isExpanded, 
  isCompleted, 
  onPress, 
  onAction,
  library = 'Ionicons' // Padrão é Ionicons
}: PermissionCardProps) {

  // Função para renderizar o ícone baseado na biblioteca escolhida
  const renderIcon = () => {
    const size = 20;
    const color = isCompleted || isExpanded ? "#FFF" : "#8E9AAF";

    if (isCompleted) {
      return <FontAwesome6 name="check" size={18} color="#FFF" />;
    }

    switch (library) {
      case 'FontAwesome6':
        return <FontAwesome6 name={iconName} size={18} color={color} />;
      case 'Octicons':
        return <Octicons name={iconName} size={22} color={color} />;
      default:
        return <Ionicons name={iconName} size={22} color={color} />;
    }
  };
  
  return (
    <TouchableOpacity 
      activeOpacity={0.8} 
      onPress={onPress}
      disabled={isCompleted}
      style={styles.cardContainer}
    >
      <View style={styles.contentRow}>
        
        {/* COLUNA DO ÍCONE */}
        <View style={styles.iconColumn}>
          <View style={[styles.iconCircle, isCompleted && styles.completedCircle]}>
            {renderIcon()}
          </View>
        </View>

        {/* COLUNA DO TEXTO */}
        <View style={styles.textColumn}>
          <Text style={[
            styles.title, 
            !isExpanded && !isCompleted && styles.titleInactive
          ]}>
            {title}
          </Text>
          
          {isExpanded && !isCompleted && (
            <Text style={styles.description}>{description}</Text>
          )}
        </View>
      </View>

      {/* CONTAINER DO BOTÃO */}
      {isExpanded && !isCompleted && (
        <View style={styles.buttonWrapper}>
          <Button 
            text="Configurar" 
            onPress={onAction}
            style={styles.actionButton}
            textStyle={styles.buttonText}
          />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#1C243D',
    borderRadius: 24,
    padding: 14,
    marginBottom: 16,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center', 
  },
  iconColumn: {
    marginRight: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedCircle: {
    backgroundColor: '#0077FF',
  },
  textColumn: {
    flex: 1,
    paddingVertical: 5,
  },
  title: {
    color: '#FFFFFF',
    fontFamily: themes.fonts.poppinsMedium,
    fontSize: 18,
  },
  titleInactive: {
    color: '#8E9AAF',
  },
  description: {
    color: '#8E9AAF',
    fontFamily: themes.fonts.poppinsRegular,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  buttonWrapper: {
    marginTop: 20,
    width: '100%',
  },
  actionButton: {
    height: 44,
    borderRadius: 14,
    backgroundColor: '#2D60FF',
    width: '100%', 
  },
  buttonText: {
    fontFamily: themes.fonts.poppinsMedium,
    fontSize: 16,
  }
}); 