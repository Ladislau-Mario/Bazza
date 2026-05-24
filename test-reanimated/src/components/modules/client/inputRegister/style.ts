import { StyleSheet, Platform } from 'react-native';
import { themes } from '../../../../global/themes';

export const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    backgroundColor: '#FFF', // Fundo branco para o item
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 56, // Altura ideal para o design da imagem f6ea41
  },
  iconContainer: {
    marginRight: 16,
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentArea: {
  flex: 1,
  justifyContent: 'center',
  height: '100%', // Garante que ocupa a altura do row
},
  label: {
    fontFamily: themes.fonts.poppinsMedium,
    fontSize: 12,
    color: themes.colors.primary, // Cor de destaque do Baza
    marginBottom: -2,
  },
input: {
  flex: 1,
  fontFamily: themes.fonts.poppinsLight,
  fontSize: 16,
  color: '#1E2530',
  paddingTop: 8, // Empurra o texto digitado um pouco para cima
  paddingBottom: 10, // Abre espaço para o erro em baixo
  textAlignVertical: 'center',
},
  rightIconContainer: {
    marginLeft: 8,
    opacity: 0.3, // Ícones da direita costumam ser mais discretos
  },
  separator: {
    height: 1,
    backgroundColor: '#F0F0F2', // Cinza muito claro para a linha divisória
    marginLeft: 56, // Alinha a linha com o início do texto (pula o ícone)
    marginRight: 0,
  }
});