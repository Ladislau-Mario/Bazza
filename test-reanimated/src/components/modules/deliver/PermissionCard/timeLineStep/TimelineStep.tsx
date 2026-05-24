// src/components/modules/deliver/TimelineStep/TimelineStep.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons, FontAwesome6 } from '@expo/vector-icons';
import { themes } from '../../../../../global/themes';

type TimelineStepProps = {
  iconName: any;
  title: string;
  description: string;
  isFirst?: boolean;
  isLast?: boolean;
  isCompleted?: boolean;
  isActive?: boolean; // Novo: para saber se é o passo atual
  onPress?: () => void;
  children?: React.ReactNode; // Para o botão "Configurar"
};

export function TimelineStep({
  iconName, title, description,
  isFirst = false, isLast = false,
  isCompleted = false, isActive = false,
  onPress, children
}: TimelineStepProps) {
  
  const activeColor = '#0077FF';
  const inactiveColor = '#1A2138';
  const connectorColor = isCompleted ? '#0077FF' : '#1A2138';

  return (
    <View style={styles.container}>
      <View style={styles.leftColumn}>
        <View style={[styles.circle, { backgroundColor: isCompleted || isActive ? activeColor : inactiveColor }]}>
           {isCompleted ? 
            <Ionicons name="checkmark" size={22} color="#FFF" /> : 
            <Ionicons name={iconName as any} size={22} color={isActive ? "#FFF" : "#4E5B7E"} />
           }
        </View>
        {!isLast && <View style={[styles.connector, { backgroundColor: connectorColor }]} />}
      </View>

      <TouchableOpacity 
        activeOpacity={0.8} 
        onPress={onPress} 
        disabled={!isActive && !isCompleted} // Só clica se for o atual ou já feito
        style={styles.rightColumn}
      >
        <Text style={[styles.title, !isActive && !isCompleted && { color: '#4E5B7E' }]}>{title}</Text>
        {(isActive || isCompleted) && (
          <Text style={styles.description}>{description}</Text>
        )}
        {isActive && !isCompleted && (
          <View style={styles.actionArea}>
            {children}
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', minHeight: 90 },
  leftColumn: { alignItems: 'center', width: 50, marginRight: 15 },
  circle: { width: 45, height: 45, borderRadius: 23, justifyContent: 'center', alignItems: 'center', zIndex: 1 },
  connector: { width: 3, flex: 1, marginVertical: -5 },
  rightColumn: { flex: 1, paddingTop: 8, paddingBottom: 25 },
  title: { fontFamily: themes.fonts.poppinsMedium, fontSize: 17, color: '#FFFFFF' },
  description: { fontFamily: themes.fonts.poppinsRegular, fontSize: 13, color: '#8E9AAF', marginTop: 4 },
  actionArea: { marginTop: 15 }
});