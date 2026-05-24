// src/components/modules/services/api/api.ts
import axios, { AxiosInstance, AxiosError } from 'axios';
import { getIdToken } from '../firebase-token';

// ─── IP do servidor — alterar para o IP da tua máquina na rede local ─────────
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.242.160.144:3000';

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});

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
  // Não definir Content-Type para FormData — o axios define automaticamente multipart/form-data
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
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
