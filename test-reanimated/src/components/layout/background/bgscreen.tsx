import React from 'react';
import { ImageBackground, StyleSheet, View, Dimensions, ImageSourcePropType } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { themes } from '../../../global/themes';

const { width } = Dimensions.get('window');

// Definimos que o componente pode receber children e uma imagem (source) opcional
interface BackgroundProps {
  children: React.ReactNode;
  source?: ImageSourcePropType; 
}

export default function Background({ children, source }: BackgroundProps) {
  return (
    <View style={styles.container}>
      {/* 1. O degradê de luz suave (Glow) */}
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.11)', 'rgba(255, 255, 255, 0.02)', 'transparent']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0.4, y: 0.6 }}
        style={styles.glowSpot}
      />

      <ImageBackground 
        // Se passares uma source na página, ele usa. Se não, usa o 'bg-main.png' por padrão.
        source={source || require('../../../assets/bg-main.png')} 
        style={styles.imageBg}
        resizeMode="cover"
      >
        <SafeAreaView style={styles.content}>
          {children}
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themes.colors.background,
  },
  imageBg: {
    flex: 1,
  },
  glowSpot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: width,
    height: width * 0.8,
  },
  content: {
    flex: 1,
    paddingHorizontal: themes.spacing.lg,
  }
});
  

{/*
import React from 'react';
import { ImageBackground, StyleSheet, View, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient'; // Alterado para expo
import { themes } from '../../global/themes';

const { width } = Dimensions.get('window');

export default function Background({ children }: any) {
  return (
    <View style={styles.container}>
      // 1. O degradê de luz suave (Glow) 
      <LinearGradient
        // Começa no topo direito
        colors={['rgba(255, 255, 255, 0.11)', 'rgba(255, 255, 255, 0.02)', 'transparent']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0.4, y: 0.6 }}
        style={styles.glowSpot}
      />

      <ImageBackground 
        source={require('../../assets/bg-main.png')} 
        style={styles.imageBg}
        resizeMode="cover"
      >
        <SafeAreaView style={styles.content}>
          {children}
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themes.colors.background,
  },
  imageBg: {
    flex: 1,
  },
  glowSpot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: width,      // Cobrimos o topo todo para o degradê ser longo
    height: width * 0.8,
  },
  content: {
    flex: 1,
    paddingHorizontal: themes.spacing.lg,
  }
});    
  */}