import { themes } from '../../../global/themes'; // Para usares as cores e fontes do BAZA
import { StyleSheet, Dimensions } from 'react-native';


export const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    paddingTop: 30,
    paddingBottom: 30,
    paddingHorizontal: 4,
    alignItems: 'center',
    flexDirection: 'column',
    justifyContent: 'space-between',
    
    
  
  },
  header: {
    width: '100%',
  },
  cardsContainer: {
    width: '100%',
    justifyContent: 'space-evenly',
   // gap: 15, // Espaçamento controlado entre os cards
  },
  footerInfo: {
  //  marginTop: -40,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    opacity: 0.7,
  },
  footerText: {
    width: '90%',
    fontSize: 13,
    textAlign: 'center',
    letterSpacing: 0.5,
    color: themes.colors.text.secondary,  
    fontFamily: themes.fonts.outfitRegular,
    lineHeight: 16,

  },
  // ... teus outros estilos (title, subtitle)
  title: {
    fontFamily: themes.fonts.poppinsMedium,
    fontSize: 34,
    color: '#FFF',
    letterSpacing: 1,
    lineHeight: 40,
  },
  subtitle: {
    fontFamily: themes.fonts.poppinsLight,
    fontSize: 16,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 8,
    letterSpacing: 1,
    lineHeight: 18,
  },
});

  
