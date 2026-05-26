// src/components/modules/services/api/api.ts
import axios, { AxiosInstance, AxiosError } from 'axios';
import { getIdToken } from '../firebase-token';
import { Platform } from 'react-native';

// ─── IP do servidor — alterar para o IP da tua máquina na rede local ─────────
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.242.160.144:3000';

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});

// Detectar FormData de forma robusta (React Native polyfill vs native)
function isFormData(data: any): boolean {
  if (!data) return false;
  // Standard check
  if (data instanceof FormData) return true;
  // React Native polyfill: has _parts array
  if (Array.isArray(data._parts)) return true;
  // Duck typing: has append and getParts methods
  if (typeof data.append === 'function' && typeof data.getParts === 'function') return true;
  return false;
}

// Injeta o Firebase Bearer token em todos os pedidos
api.interceptors.request.use(async (config) => {
  try {
    const token = await getIdToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (_) {
    // rotas @Public() não precisam de token
  }
  // Para FormData: NÃO definir Content-Type — o axios/fetch define automaticamente com boundary
  if (isFormData(config.data)) {
    delete config.headers['Content-Type'];
    delete config.headers['content-type'];
    // Android: axios 1.x com fetch adapter precisa de headers explícitos
    if (Platform.OS === 'android') {
      config.headers['Content-Type'] = 'multipart/form-data';
    }
  } else {
    config.headers['Content-Type'] = 'application/json';
  }
  return config;
});

// Log de erros
api.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    const msg = (error.response?.data as any)?.message || error.message;
    console.warn(`[API] ${error.config?.method?.toUpperCase()} ${error.config?.url} → ${msg}`);
    return Promise.reject(error);
  },
);

export default api;
