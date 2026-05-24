import { StyleSheet } from 'react-native';
import { themes } from '../../../global/themes'; // Ajusta o caminho se necessário

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'transparent', // Fundamental para o Wallpaper aparecer
       // paddingHorizontal: 25,
    },
    gradientBorder: {
    height: 56,
    borderRadius: 16,
    padding: 1.5,
  },
  buttonGoogleInner: {
    flex: 1,
    backgroundColor: themes.colors.buttonGoogle3,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  buttonTextGoogle: {
    fontFamily: themes.fonts.poppinsMedium,
    fontSize: 18,
    color: themes.colors.white,
  },
  googleLogo:{
    width: 20,
    height: 20,
  },
    content: {
        flex: 1,
        //alignItems: 'center',
        justifyContent: 'center',
       // marginTop: 100, // Espaço para o botão de voltar e título
    },
    imageContent: {
        marginBottom: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    image: {
        width: 250,
        height: 250,
    },
    title: {
        fontFamily: 'Outfit_600SemiBold',
        fontSize: 30,
        color: themes.colors.white, // Podes usar themes.colors.text.primary
        textAlign: 'center',
        lineHeight: 34,
        marginBottom: 15,
    },
    description: {
        fontFamily: 'Poppins_400Regular',
        fontSize: 14,
        color: themes.colors.lightGray, // Podes usar themes.colors.text.secondary
        textAlign: 'center',
        lineHeight: 22,
        paddingHorizontal: 10,
        marginBottom: 80,
    },
    buttonGroup: {
        width: '100%',
        gap: 15, // Espaçamento moderno entre os botões
    },
    buttonActive: {
        width: '100%',
        height: 55,
        backgroundColor: themes.colors.primary, // O azul do Baza
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        // Sombra suave para dar destaque
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
    },
    buttonTextActive: {
        fontFamily: 'Outfit_600SemiBold',
        fontSize: 16,
        color: '#FFFFFF',
    },
    buttonManual: {
        width: '100%',
        height: 55,
        backgroundColor: 'transparent', // Fundo transparente
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5, // Borda um pouco mais grossa para destacar
        borderColor: '#D0D0D0', // Cor da borda suave
    },
    buttonTextManual: {
        fontFamily: 'Outfit_500Medium',
        fontSize: 16,
        color: '#333333',
    }
});