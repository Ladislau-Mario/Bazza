import { StyleSheet, Platform } from 'react-native';
import { themes } from '../../../../global/themes';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  //  paddingTop: 10, // Pequeno ajuste para o ButtonBack
  },
  // ÁREA DO BOTÃO VOLTAR
  headerNav: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40, 
    paddingHorizontal: 20, // Alinhado com as margens laterais
    marginBottom: 10,
    width: '100%',
  },
  
  // SEÇÃO DO TÍTULO (Subimos e centralizamos)
  titleSection: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 30,
  },
  mainTitle: {
    fontFamily: themes.fonts.poppinsMedium,
    fontSize: 34, // Um pouco menor para caber melhor em ecrãs pequenos
    color: '#FFF',
    textAlign: 'center',
  },
  supportContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  topSupportText: {
    fontFamily: themes.fonts.poppinsRegular,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
  },

  // CARD DE INPUTS (Mais leve)
  groupedInputCard: {
    marginHorizontal: 20, // Margem consistente
    backgroundColor: '#FFF',
    borderRadius: 22, // Radius premium sugerido
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    marginBottom: 25,
  },

  actionButtonContainer: {
    width: '100%',
    marginTop: 10, // Dá um leve respiro entre o card e o botão
  }
});