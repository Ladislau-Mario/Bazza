import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Alert, ActionSheetIOS, Platform } from 'react-native';

export const PickerService = {
  // Para a Foto Pessoal
  async pickProfileImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão', 'Precisamos de acesso às fotos.');
      return null;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    return !result.canceled ? result.assets[0].uri : null;
  },

  // Para a Carta de Condução (Aceita PDF e Imagens)
  async pickDocument() {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*'],
      copyToCacheDirectory: true,
    });
    return result.assets ? result.assets[0] : null;
  },

  // ─── NOVO: Para Comprovativo de Pagamento ────────────────────────────────────
  // Retorna { uri, type: 'image'|'pdf', name? } ou null

  async pickPaymentProof(): Promise<{
    uri: string;
    type: 'image' | 'pdf';
    name?: string;
  } | null> {
    return new Promise((resolve) => {
      const options = ['Tirar Foto', 'Escolher da Galeria', 'Carregar PDF', 'Cancelar'];

      // iOS — ActionSheet nativo
      if (Platform.OS === 'ios') {
        ActionSheetIOS.showActionSheetWithOptions(
          { options, cancelButtonIndex: 3, title: 'Comprovativo de Pagamento' },
          async (index) => {
            const result = await handleProofChoice(index);
            resolve(result);
          },
        );
      } else {
        // Android — Alert com botões
        Alert.alert(
          'Comprovativo de Pagamento',
          'Como queres anexar o comprovativo?',
          [
            { text: 'Tirar Foto',         onPress: async () => resolve(await handleProofChoice(0)) },
            { text: 'Escolher da Galeria', onPress: async () => resolve(await handleProofChoice(1)) },
            { text: 'Carregar PDF',        onPress: async () => resolve(await handleProofChoice(2)) },
            { text: 'Cancelar',            style: 'cancel', onPress: () => resolve(null) },
          ],
        );
      }
    });
  },
};

async function handleProofChoice(
  index: number,
): Promise<{ uri: string; type: 'image' | 'pdf'; name?: string } | null> {
  // 0 — Câmara
  if (index === 0) {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão', 'Precisamos de acesso à câmara.');
      return null;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.85,
    });
    if (result.canceled) return null;
    return { uri: result.assets[0].uri, type: 'image' };
  }

  // 1 — Galeria
  if (index === 1) {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão', 'Precisamos de acesso às fotos.');
      return null;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.85,
    });
    if (result.canceled) return null;
    return { uri: result.assets[0].uri, type: 'image' };
  }

  // 2 — PDF / Document
  if (index === 2) {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*'],
      copyToCacheDirectory: true,
    });
    if (!result.assets) return null;
    const asset = result.assets[0];
    const isPdf = asset.mimeType === 'application/pdf';
    return { uri: asset.uri, type: isPdf ? 'pdf' : 'image', name: asset.name };
  }

  return null;
}