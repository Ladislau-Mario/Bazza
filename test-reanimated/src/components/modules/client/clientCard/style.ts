import { themes } from '../../../../global/themes'; // Para usares as cores e fontes do BAZA
import { StyleSheet, Dimensions } from 'react-native';


export const styles = StyleSheet.create({

  
  buttonWrapper: {
  width: '100%',
  // O card ocupará sempre 35% a 40% do ecrã, independentemente do telemóvel
  height: '40%', 
  borderRadius: 24,
  overflow: 'hidden',
},
  fullImage: {
    flex: 1,
  },
  mainContainer: {
    flex: 1,
    flexDirection: 'row',
    padding: 20, // Padding equilibrado
  },
  imageSection: {
    flex: 0.9, // Diminuí um pouco para dar mais largura ao texto
    justifyContent: 'center',
    alignItems: 'center',
    
  },
  clientUser: {
  // Ocupa 90% da altura do card para não bater nas bordas
  height: '100%', 
  aspectRatio: 1, // Mantém a proporção original do design do Baz
  alignSelf: 'center',
},
  textSection: {
    flex: 1.3, // Aumentado para evitar a quebra da letra "s" em entregas
    justifyContent: 'space-between', 
    paddingVertical: 4,
    paddingTop: 10,
    paddingLeft: 10,
  },
  topTextGroup: {
    gap: 10, 
    marginBottom: '20%',
  },
  title: {
    fontFamily: themes.fonts.poppinsMedium,
    fontSize: 28, // Reduzi levemente para caber melhor lateralmente
    color: '#FFF',
    lineHeight: 36,
  },
  subtitle: {
    fontFamily: themes.fonts.poppinsLight,
    fontSize: 14,
    color: themes.colors.text.secondary,
    lineHeight: 18,
    letterSpacing: 1,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 10, // Sobe um pouco o botão da borda inferior
  },
  continueText: {
    fontFamily: themes.fonts.poppinsRegular,
    color: '#FFF',
    fontSize: 16,
    marginRight: 2,
  },
});