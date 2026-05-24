// src/components/modules/services/firebasePhone.ts
// Abstracção do Firebase Phone Authentication para React Native
//
// REQUISITO: instalar expo-firebase-recaptcha
//   npx expo install expo-firebase-recaptcha
//
// Se usar @react-native-firebase/auth (bare workflow):
//   import auth from '@react-native-firebase/auth';
//   export const sendSMSFirebase = (phone: string) =>
//     auth().signInWithPhoneNumber(phone);
//
// Esta versão usa o SDK modular do Firebase com expo-firebase-recaptcha

import { auth } from '../../../../../firebaseConfig';

// Para Expo Managed Workflow com Firebase Web SDK:
// O RecaptchaVerifier precisa de uma View nativa.
// Passamos o verifier criado na screen para cá.
let _verifier: any = null;

export function setRecaptchaVerifier(verifier: any) {
  _verifier = verifier;
}

export async function sendSMSFirebase(phoneNumber: string): Promise<any> {
  // Importação dinâmica para evitar erros em plataformas sem expo-firebase-recaptcha
  try {
    const { PhoneAuthProvider } = await import('firebase/auth');
    const provider = new PhoneAuthProvider(auth);
    // verificationId para usar no confirm
    const verificationId = await provider.verifyPhoneNumber(
      phoneNumber,
      _verifier,
    );
    return { verificationId };
  } catch (error: any) {
    throw new Error(error.message || 'Falha ao enviar SMS.');
  }
}

export async function confirmSMSCode(
  verificationId: string,
  code: string,
): Promise<any> {
  const { PhoneAuthProvider, signInWithCredential } = await import('firebase/auth');
  const credential = PhoneAuthProvider.credential(verificationId, code);
  return signInWithCredential(auth, credential);
}