import { StyleSheet, Dimensions } from 'react-native';
import { themes } from '../../../../global/themes';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const styles = StyleSheet.create({
  // Cabeçalho (Fundo Escuro/Gradient)
  headerSection: {
    height: screenHeight * 0.24,
    paddingHorizontal: 4,
    paddingTop: 15,
    justifyContent: 'space-between',
  },
  main:{
    justifyContent: 'space-evenly'
  },
  mainSubTitle:{
    fontFamily: themes.fonts.poppinsLight,
    fontSize: 16,
    color: themes.colors.text.secondary,
    marginBottom:  15,
  },
  mainTitle: {
    fontFamily: themes.fonts.poppinsMedium,
    fontSize: 32,
    color: '#FFF',
  },

  // BLOCO BRANCO (Ajustado para ignorar paddings do pai)
  whiteContentBlock: {
    flex: 1,
    backgroundColor: themes.colors.white,
    width: screenWidth, // Ocupa a largura real da tela
    alignSelf: 'center', // Garante centralização
  },

  // CONTAINER INTERNO (Onde o padding deve morar)
  internalContainer: {
    
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 20,
    paddingBottom: 35,
    justifyContent: 'space-between',
  },

  stepSubtitle: {
    fontFamily: themes.fonts.poppinsMedium,
    fontSize: 20,
    color: '#1E2530',
    marginBottom: 30,
  },
  inputGap: {
    gap: 0, // Espaço entre os campos de Input
  },


//  rowInputs: {
//    flexDirection: 'row', 
//   width: '100%', // Mudamos de 90% para 100%
//    gap: 12, // Usa gap em vez de margin manual para um espaçamento mais limpo
  //  marginBottom: 15, 
//  },
  

  //footerContent:{
    //flexDirection: 'column',
    //justifyContent: 'space-evenly',
    //gap: 20,
    //marginTop: 30,
  //},

  textFooter:{
    fontFamily: themes.fonts.poppinsRegular,
    fontSize: 14,
    color: themes.colors.text.dark,
    opacity: 0.6,
    textAlign: 'center',
  },
  filesContent:{
    flexDirection: 'row',
    gap: 30,
  },


  bottomContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  blockOne:{
    backgroundColor: themes.colors.primary,
    width: 30,
    height: 6,
    borderRadius: 10,
  },
  blockTwo:{
    backgroundColor: themes.colors.text.gray,
    width: 30,
    height: 6,
    borderRadius: 10,
  },
   pages: { 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    gap: 15,
  },










  rowInputs: {
    flexDirection: 'row',
    alignItems: 'flex-start', // Garante que os labels fiquem alinhados no topo
    width: '100%',
    gap: 15,
  },
 footerContent:{
    flexDirection: 'column',
    justifyContent: 'space-evenly',
    gap: 20,
    marginTop: 30,
  },
});