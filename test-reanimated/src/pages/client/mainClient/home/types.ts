/**
 * src/pages/client/mainClient/home/types.ts
 *
 * Todas as interfaces, tipos e enums do módulo home do cliente.
 * O back-end deve respeitar exactamente estes contratos para
 * conectar sem alterações adicionais no front.
 */

// ─────────────────────────────────────────────────────────────────────────────
// STATUS DA ENTREGA
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Ciclo de vida completo de uma entrega.
 *
 * idle                  → sem pedido activo (estado inicial)
 * a_procurar_motoqueiro → cliente confirmou, à espera de motoqueiro aceitar
 * motoqueiro_atribuido  → motoqueiro aceitou, ainda não saiu
 * a_caminho_recolha     → motoqueiro a caminho do ponto de recolha
 * em_pausa              → motoqueiro pausou (máx. 5 min)
 * recolhido             → motoqueiro pegou na encomenda
 * entregando            → a caminho do destino
 * entregue              → entrega concluída com sucesso
 * cancelado             → cancelado pelo cliente ou pelo sistema
 *
 * BACK-END: enviar via socket evento "order:status_update" → { status: DeliveryStatus }
 */
export type DeliveryStatus =
  | 'idle'
  | 'a_procurar_motoqueiro'
  | 'motoqueiro_atribuido'
  | 'a_caminho_recolha'
  | 'em_pausa'
  | 'recolhido'
  | 'entregando'
  | 'entregue'
  | 'cancelado';

// ─────────────────────────────────────────────────────────────────────────────
// ENCOMENDA
// ─────────────────────────────────────────────────────────────────────────────

/** Tipo de produto a ser entregue. */
export type PackageType =
  | 'Documento'
  | 'Comida'
  | 'Roupa'
  | 'Electrónico'
  | 'Medicamento'
  | 'Livros'
  | 'Peça'
  | 'Outro';

/**
 * Peso aproximado da encomenda.
 * Influencia o preço final conforme PRICE_RULES em constants.ts.
 */
export type PackageWeight = 'Leve' | 'Normal' | 'Pesado';

// ─────────────────────────────────────────────────────────────────────────────
// PAGAMENTO
// ─────────────────────────────────────────────────────────────────────────────

export type PaymentMethod = 'Numerário' | 'Transferência' | 'Multicaixa';

// ─────────────────────────────────────────────────────────────────────────────
// LOCALIZAÇÃO
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Coordenadas geográficas com endereço legível opcional.
 * BACK-END: guardar origemCoords e destinoCoords como { lat, lng } no modelo Pedido.
 */
export interface LocationCoords {
  latitude: number;
  longitude: number;
  /** Endereço legível obtido por reverse-geocoding. */
  address?: string;
}

/**
 * Item de sugestão de endereço (locais fixos ou resultados de geocoding).
 */
export interface AddressSuggestion {
  label: string;         // Nome curto (ex: "Talatona")
  address: string;       // Endereço completo (ex: "Talatona, Luanda Sul")
  coords: LocationCoords;
  /** 'fixed' = definido localmente | 'api' = resultado de geocoding externo */
  source?: 'fixed' | 'api';
}

// ─────────────────────────────────────────────────────────────────────────────
// MOTOQUEIRO
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Dados do motoqueiro atribuído ao pedido.
 * BACK-END: retornar dentro do evento "order:status_update" quando status = motoqueiro_atribuido.
 */
export interface Motoqueiro {
  id: string;
  nome: string;
  telefone: string;
  /** URL pública da foto de perfil (S3, Cloudinary, etc.) */
  fotoPerfil?: string;
  /** Avaliação média de 0 a 5. */
  rating: number;
  /** Matrícula da mota (opcional, para referência). */
  placa?: string;
  /** Coordenadas actuais do motoqueiro (actualizar via socket). */
  coordenadasActuais?: LocationCoords;
}

// ─────────────────────────────────────────────────────────────────────────────
// PEDIDO / ENTREGA
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Modelo completo de uma entrega.
 * Criado no front e enviado para POST /api/orders.
 * Actualizado pelo back via socket "order:status_update".
 *
 * CAMPOS GERADOS NO FRONT:
 *   - codigoNumerico  (6 dígitos aleatórios)
 *   - codigoQr        (string composta: "BIKO:{numeroPedido}:{codigoNumerico}")
 *   - numeroPedido    (gerado localmente, confirmado pelo back)
 *
 * CAMPOS PREENCHIDOS PELO BACK:
 *   - id              (UUID gerado pelo back após persistência)
 *   - motoqueiro      (após aceitação)
 *   - entregueEm / canceladoEm (timestamps finais)
 */
export interface DeliveryOrder {
  // ── Identificação ──────────────────────────────────────────────────────
  id: string;
  numeroPedido: string;         // ex: "ENT-20250516-0042"
  codigoQr: string;             // usado para gerar o QR Code
  codigoNumerico: string;       // código de 6 dígitos para confirmação manual

  // ── Localização ────────────────────────────────────────────────────────
  origemEndereco: string;
  origemCoords: LocationCoords;
  destinoEndereco: string;
  destinoCoords: LocationCoords;

  // ── Encomenda ──────────────────────────────────────────────────────────
  tipoEncomenda: PackageType;
  peso: PackageWeight;
  observacoes?: string;

  // ── Preço ──────────────────────────────────────────────────────────────
  /** Preço calculado automaticamente com base na distância + peso. */
  precoBase: number;
  /** Ajuste feito pelo cliente: -100, 0 ou +100 Kz (apenas uma vez, se precoFinal > 1500). */
  ajusteCliente: number;
  /** precoBase + ajusteCliente */
  precoFinal: number;

  // ── Pagamento ──────────────────────────────────────────────────────────
  metodoPagamento: PaymentMethod;

  // ── Logística ──────────────────────────────────────────────────────────
  distanciaKm: number;
  tempoEstimadoMin: number;

  // ── Motoqueiro ─────────────────────────────────────────────────────────
  motoqueiro?: Motoqueiro;

  // ── Status e timestamps ────────────────────────────────────────────────
  status: DeliveryStatus;
  criadoEm: string;             // ISO 8601
  entregueEm?: string;          // ISO 8601 — preenchido pelo back ao concluir
  canceladoEm?: string;         // ISO 8601 — preenchido ao cancelar
  motivoCancelamento?: string;
  pausaMotivo?: string;
}

/**
 * Payload enviado para POST /api/orders ao criar um novo pedido.
 * O id é omitido porque ainda não existe — o back devolve-o na resposta.
 */
export type CreateOrderPayload = Omit<DeliveryOrder, 'id' | 'motoqueiro' | 'status' | 'criadoEm' | 'entregueEm' | 'canceladoEm'>;

/**
 * Resposta do back após criar o pedido.
 */
export interface CreateOrderResponse {
  success: boolean;
  pedido: DeliveryOrder;
  message?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// CHAT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Mensagem de chat entre cliente e motoqueiro.
 * BACK-END (socket):
 *   Enviar:   socket.emit('chat:send',    ChatMessage)
 *   Receber:  socket.on('chat:received', (msg: ChatMessage) => ...)
 */
export interface ChatMessage {
  id: string;
  pedidoId: string;
  senderId: string;               // clienteId ou motoqueiroId
  senderType: 'cliente' | 'motoqueiro';
  text: string;
  timestamp: string;              // ISO 8601
  read: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// AVALIAÇÃO E DENÚNCIA
// ─────────────────────────────────────────────────────────────────────────────

export type DenunciaMotivo =
  | 'conduta_inadequada'
  | 'cobranca_superior'
  | 'encomenda_danificada'
  | 'atraso_excessivo';

export interface DenunciaPayload {
  motivos: DenunciaMotivo[];
  descricao?: string;
}

/**
 * Payload enviado para POST /api/ratings após conclusão da entrega.
 */
export interface RatingPayload {
  pedidoId: string;
  estrelas: number;               // 1–5
  comentario?: string;
  denuncia?: DenunciaPayload;
}

// ─────────────────────────────────────────────────────────────────────────────
// CANCELAMENTO
// ─────────────────────────────────────────────────────────────────────────────

export type CancelamentoMotivo =
  | 'mudei_de_ideia'
  | 'demorou_muito'
  | 'endereco_errado'
  | 'outro';

/**
 * Payload enviado para POST /api/orders/cancel.
 */
export interface CancelamentoPayload {
  pedidoId: string;
  motivo: CancelamentoMotivo;
}

// ─────────────────────────────────────────────────────────────────────────────
// PAUSA DO MOTOQUEIRO
// ─────────────────────────────────────────────────────────────────────────────

export type PausaMotivo =
  | 'avaria_temporaria'
  | 'transito_intenso'
  | 'necessidade_pessoal'
  | 'aguardar_instrucoes'
  | 'outro';

/**
 * Evento recebido via socket quando o motoqueiro pausa a entrega.
 * BACK-END: socket.on('order:paused', (data: PausaEvent) => ...)
 */
export interface PausaEvent {
  pedidoId: string;
  motivo: PausaMotivo;
  motivoLabel: string;           // texto legível para mostrar ao cliente
  timestamp: string;
  duracaoMaximaSegundos: number; // tipicamente 300 (5 min)
}

// ─────────────────────────────────────────────────────────────────────────────
// HISTÓRICO
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Item no histórico de entregas do cliente.
 * BACK-END: GET /api/orders/history → HistoryItem[]
 * Os campos reflectem exactamente o modelo Pedido persistido.
 */
export interface HistoryItem {
  id: string;
  numeroPedido: string;
  origemEndereco: string;
  destinoEndereco: string;
  valorEntrega: number;           // precoFinal
  distanciaKm: number;
  status: 'entregue' | 'cancelado';
  criadoEm: string;
  entregueEm?: string;
  canceladoEm?: string;
  motivoCancelamento?: string;
  motoqueiro?: {
    user?: { nome?: string };
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// SOCKET EVENTS  (documentação para o back-end)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Eventos de socket que o CLIENTE emite:
 *
 *   'chat:send'        → ChatMessage
 *   'order:join'       → { pedidoId: string }   (subscrevê-se à sala do pedido)
 *
 * Eventos de socket que o CLIENTE recebe:
 *
 *   'order:status_update' → { pedidoId: string, status: DeliveryStatus, motoqueiro?: Motoqueiro }
 *   'order:paused'        → PausaEvent
 *   'order:resumed'       → { pedidoId: string }
 *   'chat:received'       → ChatMessage
 *   'order:location'      → { pedidoId: string, coords: LocationCoords }  (posição do motoqueiro)
 */
export type SocketEventMap = {
  // Emitir
  'chat:send': ChatMessage;
  'order:join': { pedidoId: string };
  // Receber
  'order:status_update': { pedidoId: string; status: DeliveryStatus; motoqueiro?: Motoqueiro };
  'order:paused': PausaEvent;
  'order:resumed': { pedidoId: string };
  'chat:received': ChatMessage;
  'order:location': { pedidoId: string; coords: LocationCoords };
};
