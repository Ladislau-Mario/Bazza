import { StyleSheet } from "react-native";
import { themes } from "../../../global/themes";

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'space-between',
        paddingTop: 10,
    },
    containerOne: {
        width: '100%',
        alignItems: 'flex-start',
        gap: 25,
    },
    header: {
        width: '100%',
        marginTop: 10,
    },
    title: {
        color: themes.colors.text.primary,
        fontFamily: themes.fonts.poppinsMedium,
        fontSize: 34,
        lineHeight: 42,
        textAlign: 'left',
    },
});