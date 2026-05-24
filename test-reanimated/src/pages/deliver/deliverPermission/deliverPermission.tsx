import React, { useState } from 'react';
import { View, StyleSheet, Text, ScrollView, Alert } from 'react-native';
import * as Location from 'expo-location'; 
import BackgroundWrapper from '../../../components/layout/background/bgscreen';
import { PermissionCard } from '../../../components/modules/deliver/PermissionCard/premissionCard';
import { themes } from '../../../global/themes';
import { Button } from '../../../components/common/button/button';
import { registerForPushNotificationsAsync } from '../../../components/modules/services/notification/notification';
import { useNavigation } from "@react-navigation/native";

export default function AccessConfig() {
  const navigation = useNavigation<any>();
  
  // Agora o fluxo é: 1-Notificações, 2-Localização, 3-Concluído
  const [step, setStep] = useState(1);

  // Lógica para o Passo 1: Notificações
  async function handleNotificationAction() {
    try {
      const token = await registerForPushNotificationsAsync();
      
      if (token) {
        setStep(2);
      } else {
        Alert.alert(
          "Notificações Necessárias", 
          "Ativa as notificações para receberes alertas de novas entregas em tempo real."
        );
      }
    } catch (error) {
      console.log(error);
      Alert.alert("Erro", "Falha ao configurar notificações.");
    }
  }

  // Lógica para o Passo 2: Localização
  async function handleRequestLocation() {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permissão Necessária',
          'O Baza precisa da sua localização para mostrar as motos próximas. Por favor, ative nas definições.',
          [{ text: 'OK' }]
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High 
      });
      
      console.log("Localização aceita:", location);

      // Avança para o estado final onde o botão de conclusão aparece
      setStep(3);

    } catch (error) {
      console.log(error);
      Alert.alert('Erro', 'Ocorreu um erro ao tentar acessar a localização.');
    }
  }

  return (
    <BackgroundWrapper>
      <View style={styles.mainContainer}>
        
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Configurar acesso{'\n'}a solicitações</Text>
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          
          {/* Passo 1 */}
          <PermissionCard 
            title="Notificações"
            iconName="notifications-outline"
            description="Saiba imediatamente quando houver uma nova viagem disponível perto de você."
            isExpanded={step === 1}
            isCompleted={step > 1}
            onPress={() => step >= 1 && setStep(1)}
            onAction={handleNotificationAction} 
          />

          {/* Passo 2 */}
          <PermissionCard 
            title="Localização Total"
            library="Octicons"
            iconName="location"
            description="Você verá solicitações de entregas nas proximidades, mesmo com a aplicação fechada."
            isExpanded={step === 2}
            isCompleted={step > 2}
            onPress={() => step >= 2 && setStep(2)}
            onAction={handleRequestLocation} 
          />

          {/* Passo 3 - Removido/Comentado para o MVP 
          <PermissionCard 
            title="Desempenho e Bateria"
            iconName="battery-half-outline"
            description="Garante que o Baza não seja interrompido."
            isExpanded={step === 3}
            isCompleted={step > 3}
            onPress={() => step >= 3 && setStep(3)}
            onAction={() => setStep(4)}
          /> 
          */}

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* O botão aparece quando o step chega a 3 (após localização) */}
        {step >= 3 && (
          <View style={styles.footer}>
            <Button 
              text="Concluir e Ver Status" 
              textStyle={{ fontFamily: themes.fonts.poppinsMedium, fontSize: 17 }}
              onPress={() => {
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'SecundRegistrationStatus' }],
                });
              }}
            />
          </View>
        )}
      </View>
    </BackgroundWrapper>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1 },
  header: { paddingTop: 60, marginBottom: 30 },
  headerTitle: { 
    fontFamily: themes.fonts.poppinsMedium, 
    fontSize: 36, 
    color: '#FFF', 
    lineHeight: 46 
  },
  scrollContent: { paddingTop: 20 },
  footer: { 
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 5, 
    paddingBottom: 30,
    backgroundColor: 'transparent' 
  }
});