// src/components/modules/services/api/uploadService.ts
import api from './api';

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
 * Envia um único ficheiro para o backend.
 * @param tipo   endpoint do upload (ex: 'foto-perfil')
 * @param uri    URI local do ficheiro (do ImagePicker / DocumentPicker)
 * @param mime   mime type (default: image/jpeg)
 */
export const enviarFicheiro = async (
  tipo: TipoUpload,
  uri: string,
  mime = 'image/jpeg',
) => {
  const formData = new FormData();
  const ext = uri.split('.').pop()?.toLowerCase() || 'jpg';
  const filename = uri.split('/').pop() || `${tipo}.${ext}`;

  formData.append('file', {
    uri,
    type: mime,
    name: filename,
  } as any);

  const res = await api.post(`/uploads/${tipo}`, formData);

  return res.data;
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
      console.log(`[Upload] Enviando ${tipo} uri=${uri.substring(0, 50)}... mime=${mime}`);
      const result = await enviarFicheiro(tipo, uri, mime);
      console.log(`[Upload] OK ${tipo}:`, JSON.stringify(result).substring(0, 100));
    } catch (e: any) {
      const errMsg = e?.response?.data?.message || e?.response?.data || e?.message || String(e);
      console.warn(`[Upload] Falha em ${tipo}:`, errMsg);
      if (e?.response?.status) console.warn(`[Upload] Status: ${e.response.status}`);
      erros.push(tipo);
    }
  }

  console.log(`[Upload] Resultado: ${erros.length === 0 ? 'TODOS OK' : `${erros.length} falhas: ${erros.join(', ')}`}`);
  return { sucesso: erros.length === 0, erros };
};