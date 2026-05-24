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
import { styles } from './style';

export const DeliverCard = ({ onPress }: { onPress?: () => void }) => {
  return (
    <TouchableOpacity 
      activeOpacity={0.8} 
      onPress={onPress}
      style={styles.buttonWrapper} 
    >
      <ImageBackground 
        source={require('../../../../assets/card-base-deliver.png')} 
        style={styles.fullImage}
        imageStyle={{ borderRadius: 24, resizeMode: 'cover' }}
      >
        <View style={styles.mainContainer}>
          
          {/* LADO ESQUERDO: Boneco Inteirado com mais espaço */}
          <View style={styles.imageSection}>
            <Image 
              source={require('../../../../assets/deliver-user.png')}
              style={styles.deliverUser}
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
                Receba pedidos e faça dinheiro.
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

