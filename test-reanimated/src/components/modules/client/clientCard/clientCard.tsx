import React from 'react';
import { 
  Text, 
  StyleSheet, 
  ImageBackground, 
  Image, 
  TouchableOpacity, 
  View 
} from 'react-native';
import { themes } from '../../../../global/themes';
import { Entypo } from '@expo/vector-icons';
import { Dimensions } from 'react-native';
import { styles } from './style';



export const ClientCard = ({ onPress }: { onPress?: () => void }) => {
  // Extrai a altura total do ecrã do dispositivo
const { height: screenHeight } = Dimensions.get('window');
  
  return (
    <TouchableOpacity 
      activeOpacity={0.8} 
      onPress={onPress}
      style={styles.buttonWrapper} 
    >
      <ImageBackground 
        source={require('../../../../assets/card-base-client.png')} 
        style={styles.fullImage}
        imageStyle={{ borderRadius: 24, resizeMode: 'cover' }}
      >
        <View style={styles.mainContainer}>
          
          {/* LADO ESQUERDO: Boneco Inteirado com mais espaço */}
          <View style={styles.imageSection}>
            <Image 
              source={require('../../../../assets/client-user.png')}
              style={styles.clientUser}
              resizeMode="contain"
            />
          </View>

          {/* LADO DIREITO: Textos com espaçamento real */}
          <View style={styles.textSection}>
            
            <View style={styles.topTextGroup}>
              <Text style={styles.title} numberOfLines={2}>
                Pedir{"\n"}entregas
              </Text>
              <Text style={styles.subtitle} numberOfLines={2}>
                Crie e acompanhe suas entregas.
              </Text>
            </View>
            
            <View style={styles.actionRow}>
              <Text style={styles.continueText}>Continuar</Text>
              <Entypo name="chevron-small-right" size={24} color="#ffffff" />
            </View>

          </View>

        </View>
      </ImageBackground>
    </TouchableOpacity>
  );
};




