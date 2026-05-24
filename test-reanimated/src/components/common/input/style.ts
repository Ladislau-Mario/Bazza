import { themes } from '../../../global/themes'; // Para usares as cores e fontes do BAZA
import { StyleSheet, Dimensions } from 'react-native';


export const styles = StyleSheet.create({
 container: {
    width: '100%',
    marginBottom: 20,
  },
  label: {
    fontFamily: themes.fonts.poppinsRegular,
    fontSize: 14,
    color: themes.colors.lightGray,
    marginBottom: 2,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',

      shadowColor: themes.colors.lightGray,
      shadowOffset: {
      width: 0,
      height: 1,
    },
      shadowOpacity: 0.22,
      shadowRadius: 2.22,

      elevation: 3,
    
     // Um cinza bem claro para destacar no fundo branco
    height: 52,
    borderRadius: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.03)',
  },
  input: {
    flex: 1,
    fontFamily: themes.fonts.poppinsRegular,
    fontSize: 16,
    color: '#1E2530',
  },
  iconContainer: {
    marginLeft: 10,
    opacity: 0.6,
  },

  inputArea: {
  flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',

      shadowColor: themes.colors.lightGray,
      shadowOffset: {
      width: 0,
      height: 1,
    },
      shadowOpacity: 0.22,
      shadowRadius: 2.22,

      elevation: 3,
    
     // Um cinza bem claro para destacar no fundo branco
    height: 52,
    borderRadius: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.03)',
},
  icon: {
  marginRight: 10, // Dá espaço entre o ícone e onde o usuário digita
},
 // input: {
 // flex: 1, // Faz o campo de texto ocupar o resto do espaço
 // fontFamily: themes.fonts.poppinsRegular,
 // fontSize: 14,
//}
});