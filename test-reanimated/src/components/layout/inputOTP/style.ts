import { StyleSheet } from "react-native";
import { themes } from "../../../global/themes";

export const style = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
        marginVertical: 30,
        marginBottom: 50,
       
    },
    inputCard: {
        width: 65,
        height: 66,
       // backgroundColor: 'transparent',
        backgroundColor: themes.colors.background,
        borderRadius: 16,
        borderWidth: 2.5,
        textAlign: 'center',
        fontSize: 28,
        color: themes.colors.white,
        fontFamily: themes.fonts.poppinsMedium,
        includeFontPadding: false,
        textAlignVertical: 'center',
    }
});