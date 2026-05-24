// src/services/mirage/types.ts

export type Role = "client" | "deliver" | "admin";
export type UserStatus = "active" | "pending" | "suspended" | "eliminado";

export type MotoqueiroStatus = "pendente_aprovacao" | "activo" | "suspenso";
export type DisponibilidadeStatus = "online" | "offline" | "ocupado";

export type PedidoStatus =
  | "a_procurar_motoqueiro"
  | "motoqueiro_atribuido"
  | "a_caminho_recolha"
  | "em_pausa"
  | "recolhido"
  | "entregando"
  | "entregue"
  | "cancelado";

export type UploadTipo =
  | "foto_perfil"
  | "documento_bi_frente"
  | "documento_bi_verso"
  | "documento_carta_frente"
  | "documento_carta_verso"
  | "foto_veiculo"
  | "prova_entrega"
  | "comprovativo_pagamento";

export type UploadStatus = "pendente" | "aprovado" | "rejeitado";
export type TransacaoTipo = "credito" | "debito";
export type MetodoPagamento = "dinheiro" | "stripe";
export type NotificacaoTipo =
  | "pedido_criado"
  | "pedido_aceite"
  | "pedido_entregue"
  | "pagamento"
  | "nova_mensagem"
  | "sistema";

export type SuporteStatus = "aberto" | "em_analise" | "resolvido";

export type PlanoTipo = "diario" | "semanal" | "mensal";

export type SubscricaoStatus = "activa" | "expirada" | "cancelada";

export type ActividadeTipo =
  | "aprovacao_motoqueiro"
  | "rejeicao_motoqueiro"
  | "suspensao_usuario"
  | "reactivacao_usuario"
  | "eliminacao_usuario"
  | "resolucao_ticket"
  | "cancelamento_pedido";


export interface ISubscricao {
  id: string;
  motoqueiroId: string;
  plano: PlanoTipo;
  valor: number;
  status: SubscricaoStatus;
  inicioEm: string;
  expiraEm: string;
  criadoEm: string;
  // montado
  motoqueiro: IMotoqueiro;
  userDataSubscricao: IUser;
}

export interface IUser {
  id: string;
  firebaseUid: string;
  nome: string;
  sobrenome: string;
  email: string;
  telefone: string;
  telefoneVerificado: boolean;
  numeroDocumento: string;
  tipoDocumento: string;
  fotoPerfil: string;
  dataNascimento: string;
  role: Role;
  status: UserStatus;
  criadoEm: string;
  atualizadoEm: string;
}

export interface IVeiculo {
  id: string;
  motoqueiroId: string;
  marca: string;
  modelo: string;
  placa: string;
  corPrincipal: string;
  ano: number;
  ativo: boolean;
  criadoEm: string;
}

export interface IUpload {
  id: string;
  userId: string;
  tipo: UploadTipo;
  nomeOriginal: string;
  mimeType: string;
  tamanho: number;
  status: UploadStatus;
  motivoRejeicao: string | null;
  url: string; // simulado no Mirage com faker.image.url()
  criadoEm: string;
}

export interface IMotoqueiro {
  id: string;
  userId: string;
  classificacaoMedia: number;
  totalAvaliacoes: number;
  statusDisponibilidade: DisponibilidadeStatus;
  status: MotoqueiroStatus;
  morada: string;
  aprovadoEm: string | null;
  motivoRejeicao: string | null;
  criadoEm: string;
  // montado pelo Mirage (opção A)
  user: IUser;
  veiculo: IVeiculo;
  uploads: IUpload[];
}

export interface IPedido {
  id: string;
  numeroPedido: string;
  clienteId: string;
  motoqueiroId: string | null;
  status: PedidoStatus;
  origemEndereco: string;
  destinoEndereco: string;
  descricaoEncomenda: string;
  fragil: boolean;
  valorEntrega: number;
  distanciaKm: number;
  metodoPagamento: MetodoPagamento;
  motivoCancelamento: string | null;
  criadoEm: string;
  entregueEm: string | null;
  canceladoEm: string | null;
  // montado
  cliente: IUser;
  motoqueiro: IMotoqueiro | null;
  userDataMotoqueiro: IUser; // dados do user do motoqueiro para facilitar acesso sem precisar montar toda a relação
}

export interface IAvaliacao {
  id: string;
  pedidoId: string;
  notaCliente: number | null;
  comentarioCliente: string | null;
  notaMotoqueiro: number | null;
  comentarioMotoqueiro: string | null;
  criadoEm: string;
}

export interface ICarteira {
  id: string;
  userId: string;
  saldo: number;
  criadoEm: string;
}

export interface ITransacao {
  id: string;
  carteiraId: string;
  tipo: TransacaoTipo;
  valor: number;
  descricao: string;
  pedidoId: string | null;
  saldoAnterior: number;
  saldoAtual: number;
  criadoEm: string;
}

export interface INotificacao {
  id: string;
  userId: string;
  tipo: NotificacaoTipo;
  titulo: string;
  mensagem: string;
  lida: boolean;
  criadoEm: string;
}

export interface ISuporte {
  id: string;
  userId: string;
  titulo: string;
  descricao: string;
  status: SuporteStatus;
  resposta: string | null;
  respondidoPor: string | null;
  criadoEm: string;
  resolvidoEm: string | null;
}

export interface IActividade {
  id: string;
  adminId: string;
  tipo: ActividadeTipo;
  descricao: string;
  entidadeId: string;
  criadoEm: string;
}