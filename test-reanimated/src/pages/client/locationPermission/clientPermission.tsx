// src/pages/client/locationPermission/index.tsx
import React from 'react';
import { View, Text, Image, Alert } from 'react-native';
import * as Location from 'expo-location'; // Importamos para usar a função de pedir permissão
import { useNavigation } from '@react-navigation/native'; // Para navegar após aceitar

import { styles } from './style';
import { themes } from "../../../global/themes";
import BackgroundWrapper from '../../../components/layout/background/bgscreen'; 
import { GradientButton } from '../../../components/common/GradientButton/gradientButton';
import { Button } from '../../../components/common/button/button';

export default function LocationPermission() {
  const navigation = useNavigation();

  // Função disparada ao clicar no botão "Ativar localização"
  async function handleRequestLocation() {
    try {
      // 1. Pede a permissão (Foreground)
      let { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permissão Necessária',
          'O Baza precisa da sua localização para mostrar as motos próximas. Por favor, ative nas definições.',
          [{ text: 'OK' }]
        );
        return;
      }

      // 2. Se aceitou, pegamos a localização apenas para confirmar
      const location = await Location.getCurrentPositionAsync({});
      console.log("Localização aceita:", location);

      // 3. Navega para a próxima tela (ex: Home do Cliente)
      // navigation.navigate('ClientHome'); 
      Alert.alert("Sucesso", "Localização ativada com sucesso!");

    } catch (error) {
      Alert.alert('Erro', 'Ocorreu um erro ao tentar acessar a localização.');
    }
  }

  return (
    <BackgroundWrapper>
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.imageContent}>
            <Image 
               source={require('../../../assets/ClientLocation.png')} 
               style={styles.image} 
               resizeMode="contain"
            />
          </View>

          <Text style={styles.title}>Permitir que o aplicativo{"\n"}acesse sua localização</Text>

          <Text style={styles.description}>
            Precisamos da sua localização para conectar você aos melhores produtos e serviços próximos, 
            calcular prazos de entrega em tempo real e garantir a segurança de suas transações.
          </Text>

          <View style={styles.buttonGroup}>
            {/* AGORA O BOTÃO CHAMA A FUNÇÃO */}
            <Button 
              text='Ativar localização'
              onPress={handleRequestLocation} 
              textStyle={{ fontFamily: themes.fonts.poppinsRegular, fontSize: 17 }} 
            />

            <GradientButton
              text='Escolher localização manualmente'
              onPress={() => Alert.alert("Baza", "Seleção manual em desenvolvimento.")}
              textStyle={{ fontFamily: themes.fonts.poppinsRegular, fontSize: 17 }}
            />     
          </View>
        </View>
      </View>
    </BackgroundWrapper>
  );
}