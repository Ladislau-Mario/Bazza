// src/components/modules/services/firebase-token.ts
import { auth } from '../../../../firebaseConfig';

/**
 * Retorna o ID Token actual do utilizador Firebase.
 * Retorna null se não estiver autenticado.
 */
export async function getIdToken(): Promise<string | null> {
  try {
    const user = auth.currentUser;
    if (!user) return null;
    return await user.getIdToken();
  } catch {
    return null;
  }
}