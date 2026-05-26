// src/components/modules/services/api/uploadService.ts
import { Platform } from 'react-native';
import { getIdToken } from '../firebase-token';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.242.160.144:3000';

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
 * Envia um único ficheiro para o backend usando fetch nativo.
 * Usa fetch em vez de axios para compatibilidade com React Native FormData.
 */
export const enviarFicheiro = async (
  tipo: TipoUpload,
  uri: string,
  mime = 'image/jpeg',
) => {
  const formData = new FormData();
  const ext = uri.split('.').pop()?.toLowerCase() || 'jpg';
  const filename = uri.split('/').pop() || `${tipo}.${ext}`;

  // Normalizar URI para Android (content:// precisa de file://)
  let fileUri = uri;
  if (Platform.OS === 'android' && uri.startsWith('content://')) {
    fileUri = uri;
  }

  formData.append('file', {
    uri: fileUri,
    type: mime,
    name: filename,
  } as any);

  // Obter token de autenticação
  let token: string | null = null;
  try {
    token = await getIdToken();
  } catch {
    console.warn('[Upload] Não foi possível obter token Firebase');
  }

  const url = `${BASE_URL}/uploads/${tipo}`;
  console.log(`[Upload] POST ${url} file=${filename} mime=${mime}`);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
      // NÃO definir Content-Type — o fetch define automaticamente com boundary
    },
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    const errMsg = data?.message || `HTTP ${response.status}`;
    throw new Error(errMsg);
  }

  console.log(`[Upload] OK ${tipo}:`, JSON.stringify(data).substring(0, 100));
  return data;
};

/**
 * Envia o comprovativo de pagamento de plano usando fetch nativo.
 */
export const enviarComprovativoPlano = async (
  tipo: string,
  uri: string,
  mime = 'image/jpeg',
  filename?: string,
) => {
  const formData = new FormData();
  const name = filename || uri.split('/').pop() || `comprovativo_${tipo}.jpg`;

  formData.append('tipo', tipo);
  formData.append('comprovativo', {
    uri,
    type: mime,
    name,
  } as any);

  let token: string | null = null;
  try {
    token = await getIdToken();
  } catch {}

  const url = `${BASE_URL}/planos/submeter`;
  console.log(`[PlanUpload] POST ${url} tipo=${tipo} file=${name}`);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
    },
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || `HTTP ${response.status}`);
  }

  console.log(`[PlanUpload] OK:`, JSON.stringify(data).substring(0, 100));
  return data;
};

/**
 * Envia todos os documentos do registo de motoqueiro.
 * Chamado no final do DeliverRegisterFour.
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
      await enviarFicheiro(tipo, uri, mime);
    } catch (e: any) {
      const errMsg = e?.message || String(e);
      console.warn(`[Upload] Falha em ${tipo}:`, errMsg);
      erros.push(tipo);
    }
  }

  console.log(`[Upload] Resultado: ${erros.length === 0 ? 'TODOS OK' : `${erros.length} falhas: ${erros.join(', ')}`}`);
  return { sucesso: erros.length === 0, erros };
};
