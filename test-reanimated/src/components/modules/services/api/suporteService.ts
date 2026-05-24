import api from './api';

export interface Ticket {
  id: string;
  userId: string;
  assunto: string;
  mensagem: string;
  status: string;
  criadoEm: string;
}

export interface MensagemSuporte {
  id: string;
  ticketId: string;
  remetenteId: string;
  remetenteTipo: string;
  texto: string;
  lida: boolean;
  criadoEm: string;
  remetente?: { id: string; nome: string; sobrenome: string };
}

export const suporteService = {
  criarTicket: (dados: { assunto: string; mensagem: string }) =>
    api.post('/suporte', dados).then((res: any) => res.data),

  meusTickets: () =>
    api.get('/suporte/meus').then((res: any) => res.data),

  listarMensagens: (ticketId: string) =>
    api.get(`/suporte/${ticketId}/mensagens`).then((res: any) => res.data),

  enviarMensagem: (ticketId: string, texto: string) =>
    api.post(`/suporte/${ticketId}/mensagens`, { texto }).then((res: any) => res.data),

  marcarLidas: (ticketId: string) =>
    api.patch(`/suporte/${ticketId}/mensagens/lidas`).then((res: any) => res.data),
};
