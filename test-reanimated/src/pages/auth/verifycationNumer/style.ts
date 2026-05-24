import { StyleSheet } from "react-native";
import { themes } from "../../../global/themes";

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'space-between',
        paddingTop: 20,
    },
    containerOne: {
        width: '100%',
        alignItems: 'flex-start',
        gap: 20,
    },
    header: {
        width: '100%',
        marginTop: 10,
    },
    textContent:{
        width: '100%',
        gap: 10,
    },
    title: {
        color: themes.colors.text.primary,
        fontFamily: themes.fonts.poppinsMedium,
        fontSize: 32,
        lineHeight: 42,
     //   letterSpacing: 1,
        textAlign: 'left',
        
    },
    subtitle:{
        color: themes.colors.text.primary,
        fontFamily: themes.fonts.poppinsRegular,
        fontSize: 16,
        lineHeight: 22,
        textAlign: 'left',
    },
});