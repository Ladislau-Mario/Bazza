import { StyleSheet } from "react-native";
import { themes } from "../../../global/themes";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 30,
    paddingTop: 20,
    paddingHorizontal: 4, // Garante que os botões não toquem nas bordas
  },
  header: {
    width: '100%',
    marginTop: 20,
  },
  logoContent:{
    alignItems: 'center',
    marginTop: -30,
  },
  logo: {
    width: 200,
  },
  themeContent:{
    width: '100%',
    alignItems: 'flex-end',
  },
  themeButton: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: themes.colors.buttonGoogle1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: themes.colors.white,
  },
  centerContent: {
    alignItems: 'center',
    width: '100%',
      marginTop: -80,
      gap:15,
  },
  title: {
    fontFamily: themes.fonts.outfitMedium,
    fontSize: 42,
    letterSpacing: 1,
    color: themes.colors.text.primary,
    textAlign: 'center',
    lineHeight: 54,
    includeFontPadding: false,
  },
  subtitle: {
    fontFamily: themes.fonts.outfitRegular,
    fontSize: 17,
    color: themes.colors.text.secondary,
    textAlign: 'center',
  //  marginTop: 15,
    lineHeight: 20,
    letterSpacing: 1,
  },
  bottomContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 10,
  },
  blockOne:{
    backgroundColor: themes.colors.primary,
    width: 40,
    height: 6,
    borderRadius: 10,
  },
  blockTwo:{
    backgroundColor: themes.colors.buttonGoogle1,
    width: 20,
    height: 6,
    borderRadius: 10,
  },
  footer: {
    width: '100%',
    gap: 15,
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
  footerTextContent: {
    marginTop: 10,
   // paddingHorizontal: 4,
  },
  footerText:{
    color: themes.colors.text.secondary,
    fontFamily: themes.fonts.outfitRegular,
    fontSize: 13,
    lineHeight: 16,
    textAlign: 'center',
  },
  sublime:{
    textDecorationLine: 'underline',
    color: themes.colors.text.primary,
  },
});