import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { themes } from '../../../../global/themes';

export default function Wallet() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Minha Carteira</Text>
      <Text style={styles.subText}>Baza - Luanda</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5' },
  text: { fontFamily: themes.fonts.poppinsMedium, fontSize: 20, color: '#1E2530' },
  subText: { fontFamily: themes.fonts.poppinsLight, fontSize: 14, color: '#808080', marginTop: 8 },
});