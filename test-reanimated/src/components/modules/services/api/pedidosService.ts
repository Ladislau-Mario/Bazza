// src/components/modules/services/api/pedidosService.ts
import api from './api';

export const pedidosService = {
  // Envia os dados para a rota do teu NestJS (ajusta a rota se necessário)
  criarPedido: async (dados: {
    origemLatitude: number;
    origemLongitude: number;
    destinoLatitude: number;
    destinoLongitude: number;
    tipo?: string;
    peso?: string;
    notas?: string;
    metodoPagamento?: string;
  }) => {
    const response = await api.post('/pedidos', dados);
    return response.data;
  },
};