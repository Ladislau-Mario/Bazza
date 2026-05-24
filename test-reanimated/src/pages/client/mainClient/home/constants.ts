/**
 * src/pages/client/mainClient/home/constants.ts
 *
 * Todas as constantes do módulo home do cliente:
 *   - Snaps da gaveta
 *   - Regras de preço
 *   - Endereços fixos / locais populares
 *   - Tipos de encomenda
 *   - Labels de status
 *   - Opções de cancelamento, denúncia, pausa
 *   - Estilo do mapa
 */

import { Dimensions } from 'react-native';
import type {
  PackageWeight,
  PackageType,
  DeliveryStatus,
  CancelamentoMotivo,
  DenunciaMotivo,
  PausaMotivo,
  AddressSuggestion,
} from './types';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

export { SCREEN_W, SCREEN_H };

// ─────────────────────────────────────────────────────────────────────────────
// GAVETA  (percentagem do ecrã ocupada pela gaveta em cada snap)
// ─────────────────────────────────────────────────────────────────────────────

export const DRAWER_SNAP = {
  /** Estado mínimo — só mostra o título e o stepper. */
  MINI: 0.22,
  /** Estado médio — mostra o conteúdo principal sem scroll. */
  MID: 0.52,
  /** Estado máximo — gaveta quase em ecrã inteiro. */
  FULL: 0.92,
} as const;

export type DrawerSnapKey = keyof typeof DRAWER_SNAP;

// ─────────────────────────────────────────────────────────────────────────────
// PREÇOS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Acréscimo ao preço base conforme o peso da encomenda.
 * BACK-END: usar a mesma lógica ao calcular precoBase.
 */
export const PRICE_RULES: Record<PackageWeight, number> = {
  Leve: 0,
  Normal: 350,
  Pesado: 700,
};

/** Preço mínimo por entrega (em Kz), independente da distância. */
export const MIN_PRICE = 500;

/** Taxa por km (em Kz). */
export const PRICE_PER_KM = 350;

/**
 * Limite acima do qual o cliente pode ajustar o valor (±100 Kz, uma vez).
 * BACK-END: validar esta regra antes de aceitar ajusteCliente != 0.
 */
export const PRICE_ADJUST_THRESHOLD = 1500;

/** Valor máximo de ajuste permitido (para cima ou para baixo). */
export const PRICE_ADJUST_AMOUNT = 100;

// ─────────────────────────────────────────────────────────────────────────────
// PAUSA
// ─────────────────────────────────────────────────────────────────────────────

/** Duração máxima de pausa permitida ao motoqueiro (ms). */
export const PAUSE_MAX_DURATION_MS = 5 * 60 * 1000; // 5 minutos

// ─────────────────────────────────────────────────────────────────────────────
// ENDEREÇOS FIXOS  (zonas de Luanda — para sugestão imediata)
// ─────────────────────────────────────────────────────────────────────────────

export const FIXED_ADDRESSES: AddressSuggestion[] = [
  {
    label: 'Vila de Viana',
    address: 'Vila de Viana, Luanda',
    coords: { latitude: -8.9035, longitude: 13.3745 },
    source: 'fixed',
  },
  {
    label: 'Talatona',
    address: 'Talatona, Luanda Sul',
    coords: { latitude: -8.9579, longitude: 13.1964 },
    source: 'fixed',
  },
  {
    label: 'Benfica',
    address: 'Benfica, Luanda',
    coords: { latitude: -8.9041, longitude: 13.2028 },
    source: 'fixed',
  },
  {
    label: 'Vila Alice',
    address: 'Vila Alice, Luanda',
    coords: { latitude: -8.8311, longitude: 13.2394 },
    source: 'fixed',
  },
  {
    label: 'Maculusso (1º de Maio)',
    address: 'Maculusso, 1º de Maio, Luanda',
    coords: { latitude: -8.8208, longitude: 13.2347 },
    source: 'fixed',
  },
  {
    label: 'Maianga',
    address: 'Maianga, Luanda',
    coords: { latitude: -8.8266, longitude: 13.2284 },
    source: 'fixed',
  },
  {
    label: 'Rangel',
    address: 'Rangel, Luanda',
    coords: { latitude: -8.8451, longitude: 13.2611 },
    source: 'fixed',
  },
  {
    label: 'Cacuaco',
    address: 'Cacuaco, Luanda',
    coords: { latitude: -8.7734, longitude: 13.3669 },
    source: 'fixed',
  },
  {
    label: 'Kilamba',
    address: 'Cidade do Kilamba, Luanda',
    coords: { latitude: -8.9281, longitude: 13.3561 },
    source: 'fixed',
  },
  {
    label: 'Ingombota',
    address: 'Ingombota, Luanda',
    coords: { latitude: -8.8175, longitude: 13.2344 },
    source: 'fixed',
  },
  {
    label: 'Samba',
    address: 'Samba, Luanda',
    coords: { latitude: -8.8712, longitude: 13.2431 },
    source: 'fixed',
  },
  {
    label: 'Cazenga',
    address: 'Cazenga, Luanda',
    coords: { latitude: -8.8023, longitude: 13.2898 },
    source: 'fixed',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// LOCAIS POPULARES  (pontos de referência conhecidos)
// ─────────────────────────────────────────────────────────────────────────────

export const POPULAR_SPOTS: AddressSuggestion[] = [
  {
    label: 'Condomínio Dolce Vita',
    address: 'Condomínio Dolce Vita, Talatona',
    coords: { latitude: -8.9621, longitude: 13.1951 },
    source: 'fixed',
  },
  {
    label: 'Largo do Kinaxixi',
    address: 'Largo do Kinaxixi, Luanda',
    coords: { latitude: -8.8228, longitude: 13.2335 },
    source: 'fixed',
  },
  {
    label: 'Edifício Gika',
    address: 'Edifício Gika, Luanda',
    coords: { latitude: -8.8181, longitude: 13.2351 },
    source: 'fixed',
  },
  {
    label: 'Shopping Belas',
    address: 'Shopping Belas, Belas, Luanda',
    coords: { latitude: -8.9379, longitude: 13.1871 },
    source: 'fixed',
  },
  {
    label: 'Aeroporto 4 de Fevereiro',
    address: 'Aeroporto Internacional 4 de Fevereiro, Luanda',
    coords: { latitude: -8.8583, longitude: 13.2312 },
    source: 'fixed',
  },
  {
    label: 'Hospital Américo Boavida',
    address: 'Hospital Américo Boavida, Luanda',
    coords: { latitude: -8.8222, longitude: 13.2361 },
    source: 'fixed',
  },
  {
    label: 'Mercado do Roque Santeiro',
    address: 'Roque Santeiro, Luanda',
    coords: { latitude: -8.8012, longitude: 13.2589 },
    source: 'fixed',
  },
  {
    label: 'Universidade Agostinho Neto',
    address: 'UAN, Campus Universitário, Luanda',
    coords: { latitude: -8.8291, longitude: 13.2441 },
    source: 'fixed',
  },
  {
    label: 'Escola Portuguesa de Luanda',
    address: 'Escola Portuguesa de Luanda, Luanda',
    coords: { latitude: -8.8365, longitude: 13.2272 },
    source: 'fixed',
  },
  {
    label: 'Marginal de Luanda',
    address: 'Avenida 4 de Fevereiro, Marginal, Luanda',
    coords: { latitude: -8.8167, longitude: 13.2311 },
    source: 'fixed',
  },
  {
    label: 'Shopping Avenida',
    address: 'Shopping Avenida, Luanda',
    coords: { latitude: -8.8194, longitude: 13.2344 },
    source: 'fixed',
  },
  {
    label: 'Hotel Presidente',
    address: 'Hotel Presidente, Luanda',
    coords: { latitude: -8.8161, longitude: 13.2298 },
    source: 'fixed',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// TIPOS DE ENCOMENDA  (ícones Ionicons)
// ─────────────────────────────────────────────────────────────────────────────

export const PACKAGE_TYPES: {
  type: PackageType;
  icon: string;
  label: string;
}[] = [
  { type: 'Documento',   icon: 'document-text-outline', label: 'Documen.' },
  { type: 'Comida',      icon: 'fast-food-outline',     label: 'Comida'   },
  { type: 'Roupa',       icon: 'shirt-outline',         label: 'Roupa'    },
  { type: 'Electrónico', icon: 'phone-portrait-outline',label: 'Electrón.'},
  { type: 'Medicamento', icon: 'medkit-outline',        label: 'Medicam.' },
  { type: 'Livros',      icon: 'book-outline',          label: 'Livros'   },
  { type: 'Peça',        icon: 'construct-outline',     label: 'Peça'     },
  { type: 'Outro',       icon: 'ellipsis-horizontal-outline', label: 'Outro' },
];

// ─────────────────────────────────────────────────────────────────────────────
// PESOS — descrições e ícones
// ─────────────────────────────────────────────────────────────────────────────

export const WEIGHT_OPTIONS: {
  weight: PackageWeight;
  icon: string;
  sub: string;
  extra: number;
}[] = [
  { weight: 'Leve',   icon: 'help-circle-outline', sub: 'Menos de 1 kg', extra: 0   },
  { weight: 'Normal', icon: 'cube-outline',         sub: '1 kg – 5 kg',   extra: 350 },
  { weight: 'Pesado', icon: 'barbell-outline',      sub: '5 kg – 10 kg',  extra: 700 },
];

// ─────────────────────────────────────────────────────────────────────────────
// STATUS — labels legíveis para o cliente
// ─────────────────────────────────────────────────────────────────────────────

export const STATUS_LABELS: Record<DeliveryStatus, string> = {
  idle:                    '',
  a_procurar_motoqueiro:   'À procura de motoqueiro...',
  motoqueiro_atribuido:    'Motoqueiro atribuído',
  a_caminho_recolha:       'A caminho do ponto de recolha',
  em_pausa:                'Entrega em pausa',
  recolhido:               'Encomenda recolhida',
  entregando:              'A caminho do destino',
  entregue:                'Entrega concluída!',
  cancelado:               'Entrega cancelada',
};

/** Cor do indicador de status. */
export const STATUS_COLORS: Record<DeliveryStatus, string> = {
  idle:                    '#6B7280',
  a_procurar_motoqueiro:   '#2D60FF',
  motoqueiro_atribuido:    '#2D60FF',
  a_caminho_recolha:       '#2D60FF',
  em_pausa:                '#F59E0B',
  recolhido:               '#8B5CF6',
  entregando:              '#2D60FF',
  entregue:                '#10B981',
  cancelado:               '#EF4444',
};

// ─────────────────────────────────────────────────────────────────────────────
// OPÇÕES DE CANCELAMENTO
// ─────────────────────────────────────────────────────────────────────────────

export const CANCEL_OPTIONS: { value: CancelamentoMotivo; label: string }[] = [
  { value: 'mudei_de_ideia',  label: 'Mudei de ideia' },
  { value: 'demorou_muito',   label: 'O motoqueiro demorou muito' },
  { value: 'endereco_errado', label: 'Endereço incorrecto' },
  { value: 'outro',           label: 'Outro motivo' },
];

// ─────────────────────────────────────────────────────────────────────────────
// OPÇÕES DE DENÚNCIA
// ─────────────────────────────────────────────────────────────────────────────

export const REPORT_OPTIONS: {
  value: DenunciaMotivo;
  label: string;
  icon: string;
}[] = [
  {
    value: 'conduta_inadequada',
    label: 'Conduta inadequada ou falta de respeito do motoqueiro',
    icon: '⚠️',
  },
  {
    value: 'cobranca_superior',
    label: 'Cobrança de valor superior ao que estava no app',
    icon: '💸',
  },
  {
    value: 'encomenda_danificada',
    label: 'Encomenda danificada, violada ou incompleta',
    icon: '📦',
  },
  {
    value: 'atraso_excessivo',
    label: 'Atraso excessivo ou recusou-se a chegar ao ponto exacto',
    icon: '⏰',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// OPÇÕES DE PAUSA DO MOTOQUEIRO
// ─────────────────────────────────────────────────────────────────────────────

export const PAUSE_OPTIONS: { value: PausaMotivo; label: string }[] = [
  { value: 'avaria_temporaria',    label: 'Avaria temporária da mota' },
  { value: 'transito_intenso',     label: 'Trânsito intenso / bloqueio' },
  { value: 'necessidade_pessoal',  label: 'Necessidade pessoal breve' },
  { value: 'aguardar_instrucoes',  label: 'A aguardar instruções do cliente' },
  { value: 'outro',                label: 'Outro motivo' },
];

// ─────────────────────────────────────────────────────────────────────────────
// MÉTODOS DE PAGAMENTO
// ─────────────────────────────────────────────────────────────────────────────

export const PAYMENT_OPTIONS: {
  value: import('./types').PaymentMethod;
  label: string;
  icon: string;
}[] = [
  { value: 'Numerário',    label: 'Numerário',    icon: 'cash-outline'           },
  { value: 'Transferência',label: 'Transferência',icon: 'phone-portrait-outline' },
  { value: 'Multicaixa',   label: 'Multicaixa',   icon: 'card-outline'           },
];

// ─────────────────────────────────────────────────────────────────────────────
// REGIÃO INICIAL DO MAPA  (Luanda)
// ─────────────────────────────────────────────────────────────────────────────

export const DEFAULT_MAP_REGION = {
  latitude: -8.8390,
  longitude: 13.2894,
  latitudeDelta: 0.15,
  longitudeDelta: 0.15,
};

// ─────────────────────────────────────────────────────────────────────────────
// ESTILO ESCURO DO MAPA  (Google Maps)
// ─────────────────────────────────────────────────────────────────────────────

export const DARK_MAP_STYLE = [
  { elementType: 'geometry',            stylers: [{ color: '#1a2332' }] },
  { elementType: 'labels.text.fill',    stylers: [{ color: '#8ec3b9' }] },
  { elementType: 'labels.text.stroke',  stylers: [{ color: '#1a2332' }] },
  { featureType: 'administrative',      elementType: 'geometry',   stylers: [{ visibility: 'off' }] },
  { featureType: 'road',                elementType: 'geometry',   stylers: [{ color: '#253040' }] },
  { featureType: 'road.arterial',       elementType: 'geometry',   stylers: [{ color: '#2d3d4f' }] },
  { featureType: 'road.highway',        elementType: 'geometry',   stylers: [{ color: '#3a5068' }] },
  { featureType: 'water',               elementType: 'geometry',   stylers: [{ color: '#0d1b2a' }] },
  { featureType: 'poi',                 stylers: [{ visibility: 'off' }] },
  { featureType: 'transit',             stylers: [{ visibility: 'off' }] },
];

// ─────────────────────────────────────────────────────────────────────────────
// CORES  (para reutilização fora dos StyleSheet)
// ─────────────────────────────────────────────────────────────────────────────

export const COLORS = {
  primary:    '#2D60FF',
  danger:     '#EF4444',
  warning:    '#F59E0B',
  success:    '#10B981',
  purple:     '#8B5CF6',
  bg:         '#0F1923',
  surface:    '#141E28',
  card:       '#1E2A35',
  cardAlt:    '#253040',
  border:     '#2D3748',
  textPrimary:'#FFFFFF',
  textSecond: '#9CA3AF',
  textMuted:  '#6B7280',
} as const;
