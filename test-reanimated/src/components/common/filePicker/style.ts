import { StyleSheet } from 'react-native';
import { themes } from '../../../global/themes';

export const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: 12,
  },
  dashedBox: {
  // width: 100,
  //  height: 100,
 //   borderRadius: 20, // Teu rádio original
    borderWidth: 1.5,
    borderColor: themes.colors.gray,
    borderStyle: 'dashed',
    backgroundColor: themes.colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    width: 95,
    height: 95,
    borderRadius: 20,
 // borderWidth: 1.5,
  overflow: 'hidden', // Corta qualquer coisa que saia das bordas arredondadas
  // ... resto do seu código (shadows, etc)


    // Tuas sombras originais
  //  shadowColor: "#000",
  //  shadowOffset: { width: 0, height: 1 },
  //  shadowOpacity: 0.22,
  //  shadowRadius: 2.22,
   // elevation: 3,
   // overflow: 'hidden',
}, 
  filledBox: {
    backgroundColor: '#007BFF', // Azul Baza quando selecionado
    borderColor: '#007BFF',
    borderStyle: 'solid',
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  placeholderText: {
    fontFamily: themes.fonts.poppinsRegular,
    fontSize: 11,
    color: 'rgba(30, 37, 48, 0.6)',
    marginTop: 6,
    textAlign: 'center',
  },
  filledText: {
    fontFamily: themes.fonts.poppinsLight,
    fontSize: 12,
    color: themes.colors.white,
    marginTop: 4,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  label: {
    textAlign: 'center',
    fontSize: 13,
    color: 'rgba(30, 37, 48, 0.8)',
    fontFamily: themes.fonts.poppinsRegular,
    marginTop: 2,
  }
});