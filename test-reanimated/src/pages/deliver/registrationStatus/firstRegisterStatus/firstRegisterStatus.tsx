import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView } from 'react-native';
import BackgroundWrapper from '../../../../components/layout/background/bgscreen';
import { Ionicons } from '@expo/vector-icons';
import { TimelineStep } from '../../../../components/modules/deliver/StatusCardDeliver/timelineStep/TimelineStep';
import { themes } from '../../../../global/themes';
import { Button } from '../../../../components/common/button/button';
import { useNavigation } from "@react-navigation/native";


export default function FirstRegistrationStatus() { // Remove o { navigation } das props
  const navigation = useNavigation<any>(); // Usa o hook para garantir que o objeto existe

  return (
    <BackgroundWrapper>
      <View style={styles.mainContainer}>
        {/* Cabeçalho com Botão Voltar e Título */}
        <View style={styles.header}>
           {/*
          <TouchableOpacity style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
           */}
          <Text style={styles.headerTitle}>Quase lá! Vamos para próxima etapa</Text>
        </View>

        {/* Conteúdo com Scroll */}
        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          {/* PASSO 1 - CONCLUÍDO */}
          <TimelineStep 
            library="FontAwesome6"
            iconName="check"
            title="Documentos enviados"
            description="Temos todas as informações necessárias para verificar você"
            isFirst={true}
            isCompleted={true}
          />

          {/* PASSO 2 - PENDENTE */}
          <TimelineStep 
            iconName="scan-sharp"
            title="Configurar acesso a solicitações de entregas"
            description="Você estará pronto a aceitar solicitações de entregas logo após a verificação"
            isCompleted={false}
          />

          {/* PASSO 3 - ÚLTIMO */}
          <TimelineStep 
            iconName="hourglass-outline"
            title="Aguarde os resultados da verificação"
            description="Nós o notificaremos em 24 horas"
            isLast={true}
            isCompleted={false}
          />

        </ScrollView>

        {/* Botão de Ação Inferior */}
        <View style={styles.footer}>
            <Button
              text="Vá configurar o acesso"
              onPress={() => navigation.navigate('AccessConfig')} 
              textStyle={{ fontFamily: themes.fonts.poppinsMedium, fontSize: 18 }} 
            />
        </View>
      </View>
    </BackgroundWrapper>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  header: {
   // paddingHorizontal: 25,
    paddingTop: 50, // Espaço para a barra de status
    paddingBottom: 30,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#1A2138', // Fundo escuro do botão
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 25,
  },
  headerTitle: {
    fontFamily: themes.fonts.poppinsMedium,
    fontSize: 36,
    //letterSpacing: .5,
    color: '#FFFFFF',
    lineHeight: 46,
  },
  scrollContent: {
    paddingHorizontal: 10,
    paddingTop: 20,
    paddingBottom: 100, // Espaço para o botão inferior não cobrir o conteúdo
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
   // paddingHorizontal: 25,
    paddingBottom: 30,
    backgroundColor: 'transparent', // Mantém o fundo visível
  },

});