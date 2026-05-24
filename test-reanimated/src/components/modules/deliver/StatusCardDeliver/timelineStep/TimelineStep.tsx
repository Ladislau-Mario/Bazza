// src/components/modules/deliver/TimelineStep/TimelineStep.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons, FontAwesome6, } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { themes } from '../../../../../global/themes'; // Ajusta o caminho

type TimelineStepProps = {
  iconName: any; // MUDANÇA AQUI: any para aceitar qualquer nome de biblioteca
  title: string;
  description: string;
  isFirst?: boolean;
  isLast?: boolean;
  isCompleted?: boolean;
  library?: 'Ionicons' | 'FontAwesome6' | 'Material';
};

export function TimelineStep({
  iconName,
  title,
  description,
  isFirst = false,
  isLast = false,
  isCompleted = false,
  library = 'Ionicons', // Padrão é Ionicons
}: TimelineStepProps) {
  
  const activeColor = '#0077FF';
  const inactiveColor = '#1A2138';
  const connectorColor = isCompleted ? '#0077FF' : '#1A2138';

  // Função para renderizar o ícone com peso visual maior
  const renderIcon = () => {
    const size = 20; // Tamanho ligeiramente menor para compensar o peso "bold"
    const color = isCompleted ? '#FFFFFF' : '#4E5B7E';

    switch (library) {
      case 'FontAwesome6':
        return <FontAwesome6 name={iconName} size={size} color={color} />;

      default:
        return <Ionicons name={iconName} size={22} color={color} />;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.leftColumn}>
        <View style={[styles.circle, { backgroundColor: isCompleted ? activeColor : inactiveColor }]}>
          {renderIcon()}
        </View>
        {!isLast && <View style={[styles.connector, { backgroundColor: connectorColor }]} />}
      </View>

      <View style={styles.rightColumn}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: 0, // O espaçamento é controlado pela altura da linha conectora
  },
  leftColumn: {
    alignItems: 'center',
    width: 60, // Largura fixa para alinhar os círculos
  },
  circle: {
    width: 50,
    height: 50,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
    zIndex: 1, // Garante que o círculo fique por cima da linha
  },
  circleCompleted: {
    // Sombra opcional para o círculo ativo
    shadowColor: '#0077FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  connector: {
    width: 3,
    flex: 1, // Preenche o espaço até o próximo círculo
    height: 70, // Altura padrão da linha conectora
    marginTop: 5, // -5 // Puxa a linha um pouco para dentro do círculo
    marginBottom: 5, // -5
    borderRadius: 10,
  },
  rightColumn: {
    flex: 1,
    paddingLeft: 10,
    paddingTop: 5, // Alinha o texto com o topo do círculo
    paddingBottom: 30, // Espaço entre os textos
  },
  title: {
    fontFamily: themes.fonts.poppinsMedium,
    fontSize: 18,
    letterSpacing:.5,
    color: '#FFFFFF', // Texto branco
    lineHeight: 28,
  },
  description: {
    fontFamily: themes.fonts.poppinsRegular,
    fontSize: 13,
    color: '#8E9AAF', // Cor cinza azulada da descrição
    marginTop: 4,
    lineHeight: 18,
  },
});