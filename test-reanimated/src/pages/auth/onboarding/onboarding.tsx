// src/pages/auth/onboarding/onboarding.tsx
import * as React from 'react';
import { View, Text, Image, TouchableOpacity, Alert, useWindowDimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Octicons, MaterialIcons } from '@expo/vector-icons';

import BackgroundWrapper from '../../../components/layout/background/bgscreen';
import { themes } from '../../../global/themes';
import { styles } from './style';
import { Button } from '../../../components/common/button/button';
import { GradientButton } from '../../../components/common/GradientButton/gradientButton';

import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { auth } from '../../../../firebaseConfig';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { authService } from '../../../components/modules/services/api/authService';

GoogleSignin.configure({
  webClientId: '358855325316-labl2pan8a9qaoq2rbjajfr42d8u0t7s.apps.googleusercontent.com',
  offlineAccess: true,
});

export default function Onboarding() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = React.useState(false);
  const { height, width } = useWindowDimensions();
  const isSmall = height < 700 || width < 380;
  const logoSize = isSmall ? 150 : 200;
  const titleSize = isSmall ? 30 : 42;
  const titleLineHeight = isSmall ? 38 : 54;
  const subtitleSize = isSmall ? 14 : 17;
  const centerMargin = isSmall ? -40 : -80;
  const footerGap = isSmall ? 10 : 15;

  const handleGoogleSignIn = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      await GoogleSignin.signOut();
      const result = await GoogleSignin.signIn();

      if (result.type === 'cancelled') return;

      const idToken = result.data?.idToken;
      if (!idToken) return;

      // 1. Autentica no Firebase
      const credential = GoogleAuthProvider.credential(idToken);
      const userCredential = await signInWithCredential(auth, credential);
      const fbUser = userCredential.user;

      // 2. Sincroniza com o backend - AGORA COM PHOTOURL
      const res = await authService.loginGoogle({
        uid: fbUser.uid,
        email: fbUser.email || undefined,
        displayName: fbUser.displayName || undefined,
        photoURL: fbUser.photoURL || undefined, // ENVIANDO A FOTO AQUI
      });

      console.log(fbUser)

      const { user, isNewUser } = res.data;
      await authService.salvarSessao(user);

      // 3. Lógica de Navegação Blindada
      // Se for novo OU não tiver telefone (essencial para a Baza)
      if (isNewUser || !user.telefone) {
        navigation.navigate('ClientRegisterEmail'); 
        return;
      }

      // Se o papel for entregador, vai para a home de entregas
      if (user.role === 'deliver') {
        navigation.navigate('DeliverHomeTab');
        return;
      }

      // Se for cliente (default) mas o nome ainda for o padrão, completa o perfil
      if (user.role === 'client' && (!user.nome || user.nome === 'Utilizador')) {
        navigation.navigate('ClientRegisterEmail');
        return;
      }

      // Caso contrário, vai para a Home de Cliente
      navigation.navigate('ClientHome');

    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) return;
      console.error(error);
      Alert.alert('Erro', 'Falha no login com Google. Tenta novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <BackgroundWrapper>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.themeContent}>
            <TouchableOpacity style={styles.themeButton}>
              <MaterialIcons name="light" size={20} color={themes.colors.text.primary} />
            </TouchableOpacity>
          </View>
          <View style={styles.logoContent}>
            <Image
              source={require('../../../assets/logo.png')}
              style={[styles.logo, { width: logoSize }]}
              resizeMode="contain"
            />
          </View>
        </View>

        <View style={[styles.centerContent, { marginTop: centerMargin }]}>
          <Text style={[styles.title, { fontSize: titleSize, lineHeight: titleLineHeight }]}>Seu aplicativo de{'\n'}entregas</Text>
          <Text style={[styles.subtitle, { fontSize: subtitleSize }]}>Crie e acompanhe entregas em {'\n'} poucos passos</Text>
          <Octicons name="location" size={isSmall ? 22 : 26} color={themes.colors.text.secondary} />
        </View>

        <View style={[styles.footer, { gap: footerGap }]}>
          <View style={styles.bottomContent}>
            <View style={styles.blockOne} />
            <View style={styles.blockTwo} />
          </View>

          <Button
            text="Continuar com Telefone"
            onPress={() => navigation.navigate('InputPhoneNumber')}
          />

          <GradientButton
            text={loading ? 'A entrar...' : 'Continuar com Google'}
            onPress={handleGoogleSignIn}
            activeOpacity={0.8}
            icon={
              <Image
                source={require('../../../assets/googleLogo.png')}
                style={styles.googleLogo}
                resizeMode="contain"
              />
            }
          />

          <View style={styles.footerTextContent}>
            <Text style={styles.footerText}>
              Utilizar o nosso aplicativo significa que você concorda com nossos{' '}
              <Text style={styles.sublime}>Termos de Uso</Text> e{' '}
              <Text style={styles.sublime}>Política de Privacidade</Text>
            </Text>
          </View>
        </View>
      </View>
    </BackgroundWrapper>
  );
}