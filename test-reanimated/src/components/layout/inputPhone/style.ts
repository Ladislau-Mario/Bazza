import { StyleSheet } from "react-native";
import { themes } from "../../../global/themes";

export const style = StyleSheet.create({
    container: {
        width: '100%',
        marginVertical: 10,
    },
    titleInput: {
        fontFamily: themes.fonts.poppinsMedium,
        fontSize: 14,
        color: themes.colors.text.secondary,
        marginBottom: 8,
        marginLeft: 5,
    },
    boxInputPhone: {
        width: '100%',
        height: 66,
        backgroundColor: themes.colors.background,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 2, // A borda agora reage ao estado
    },
    countryArea: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        gap: 8,
    },
    countryText:{
        color: themes.colors.lightGray,
        fontFamily: themes.fonts.poppinsRegular,
        fontSize: 18,
    },
    flag: {
        width: 22,
        height: 22, // Proporção real da bandeira
        borderRadius: 4,
        includeFontPadding: false,
        textAlignVertical: 'center',
    },
    verticalDivider: {
        width: 1.5,
        height: '40%',
    },
    inputPhoneField: {
        flex: 1,
        height: '100%',
        paddingHorizontal: 15,
        color: themes.colors.white,
        fontFamily: themes.fonts.poppinsRegular,
        fontSize: 18,
        includeFontPadding: false,
        textAlignVertical: 'center',
    },
});