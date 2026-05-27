// src/components/modules/services/api/uploadService.ts
import { getIdToken } from '../firebase-token';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.43.220:3000';

type TipoUpload =
  | 'foto-perfil'
  | 'documento-bi-frente'
  | 'documento-bi-verso'
  | 'documento-carta-frente'
  | 'documento-carta-verso'
  | 'foto-veiculo'
  | 'foto-placa'
  | 'prova-entrega';

/**
 * Envia um ficheiro via XMLHttpRequest (fetch + FormData falha no React Native).
 */
export const enviarFicheiro = (
  tipo: TipoUpload,
  uri: string,
  mime = 'image/jpeg',
): Promise<any> => {
  return new Promise(async (resolve, reject) => {
    const ext = uri.split('.').pop()?.toLowerCase() || 'jpg';
    const filename = uri.split('/').pop() || `${tipo}.${ext}`;
    const token = await getIdToken();
    const url = `${BASE_URL}/uploads/${tipo}`;

    console.log(`[Upload] xhr → ${url} file=${filename} mime=${mime}`);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }

    xhr.onload = () => {
      console.log(`[Upload] status=${xhr.status}`);
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          console.log(`[Upload] OK`, JSON.stringify(data).substring(0, 100));
          resolve(data);
        } catch {
          resolve(xhr.responseText);
        }
      } else {
        reject(new Error(`Upload falhou (${xhr.status}): ${xhr.responseText}`));
      }
    };

    xhr.onerror = () => {
      console.warn(`[Upload] xhr.onerror — network error`);
      reject(new Error('Network request failed'));
    };

    const formData = new FormData();
    formData.append('file', {
      uri,
      type: mime,
      name: filename,
    } as any);

    xhr.send(formData);
  });
};

/**
 * Envia todos os documentos do registo de motoqueiro.
 */
export const enviarDocumentosMotoqueiro = async (docs: {
  fotoPerfil?: string | null;
  fotoPerfilMime?: string | null;
  fotoFrente?: string | null;
  fotoFrenteMime?: string | null;
  fotoVerso?: string | null;
  fotoVersoMime?: string | null;
  fotoFrenteBI?: string | null;
  fotoFrenteBIMime?: string | null;
  fotoVersoBI?: string | null;
  fotoVersoBIMime?: string | null;
  fotoVeiculo?: string | null;
  fotoVeiculoMime?: string | null;
  certFrente?: string | null;
  certFrenteMime?: string | null;
}) => {
  const mapa: Array<{ uri: string | null | undefined; tipo: TipoUpload; mime: string }> = [
    { uri: docs.fotoPerfil,    tipo: 'foto-perfil',             mime: docs.fotoPerfilMime || 'image/jpeg' },
    { uri: docs.fotoFrente,    tipo: 'documento-carta-frente',  mime: docs.fotoFrenteMime || 'image/jpeg' },
    { uri: docs.fotoVerso,     tipo: 'documento-carta-verso',   mime: docs.fotoVersoMime || 'image/jpeg' },
    { uri: docs.fotoFrenteBI,  tipo: 'documento-bi-frente',     mime: docs.fotoFrenteBIMime || 'image/jpeg' },
    { uri: docs.fotoVersoBI,   tipo: 'documento-bi-verso',      mime: docs.fotoVersoBIMime || 'image/jpeg' },
    { uri: docs.fotoVeiculo,   tipo: 'foto-veiculo',            mime: docs.fotoVeiculoMime || 'image/jpeg' },
    { uri: docs.certFrente,    tipo: 'foto-placa',              mime: docs.certFrenteMime || 'image/jpeg' },
  ];

  const erros: string[] = [];

  for (const { uri, tipo, mime } of mapa) {
    if (!uri) {
      console.log(`[Upload] Ignorado ${tipo} — sem URI`);
      continue;
    }
    try {
      const result = await enviarFicheiro(tipo, uri, mime);
      console.log(`[Upload] OK ${tipo}:`, JSON.stringify(result).substring(0, 100));
    } catch (e: any) {
      const errMsg = e?.message || String(e);
      console.warn(`[Upload] Falha em ${tipo}:`, errMsg);
      erros.push(tipo);
    }
  }

  console.log(`[Upload] Resultado: ${erros.length === 0 ? 'TODOS OK' : `${erros.length} falhas: ${erros.join(', ')}`}`);
  return { sucesso: erros.length === 0, erros };
};
