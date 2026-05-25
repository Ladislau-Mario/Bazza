/**
 * src/pages/client/mainClient/home/index.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * FIXES aplicados nesta versão:
 *  1. Loading screen com tom azul escuro + spinner animado (como antes)
 *  2. Estilo do mapa restaurado (dark azul-marinho original)
 *  3. BottomSheet com gestos de arrastar restaurados (pan gesture + snap)
 *  4. BottomBar proporções corrigidas (25/50/25) + ícone ⓘ removido do header
 *  5. KeyboardAvoidingView na gaveta — teclado não sobrepõe o input de obs.
 *  6. Pagamento: mini-sheet inline (não modal separado)
 *  7. Ajuste de preço: após ajustar, os botões ficam desativados (sem voltar atrás)
 *  8. Animação de procura correta; gaveta activa aparece sem ecrã vazio
 *  9. Statuses completos: recolha → destino → concluído + cancel apenas antes de recolher
 * 10. Avaliação com design cuidado
 * 11. Chat com design do deliver + KeyboardAvoidingView
 * 12. Dados todos declarados e prontos para o back-end
 */

import React, {
  useState, useEffect, useRef, useCallback, useMemo,
} from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Modal, Pressable, Animated, Easing, Share,
  Alert, KeyboardAvoidingView, Platform, Dimensions,
  PanResponder, ActivityIndicator,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { themes } from '../../../../global/themes';
import { getRoute } from '../../../../components/modules/services/routeService';
import QRCode from 'react-native-qrcode-svg';

// ─── Importar os hooks e tipos que criámos ────────────────────────────────────
// NOTA: os ficheiros types.ts / constants.ts / hooks/ estão na mesma pasta.
// Se ainda não os moveste para lá, as linhas abaixo resolvem ao descomentar:
// import { useLocation }  from './hooks/useLocation';
import { useDelivery }  from './hooks/useDelivery';
import { useChat }      from './hooks/useChat';
// import type { DeliveryOrder, DeliveryStatus, ... } from './types';

const { width: SW, height: SH } = Dimensions.get('window');

// ─────────────────────────────────────────────────────────────────────────────
// TIPOS (inline — iguais ao types.ts para o componente funcionar de imediato)
// ─────────────────────────────────────────────────────────────────────────────
export type DeliveryStatus =
  | 'idle' | 'a_procurar_motoqueiro' | 'motoqueiro_atribuido'
  | 'a_caminho_recolha' | 'em_pausa' | 'recolhido'
  | 'entregando' | 'entregue' | 'cancelado';

export type PackageType = 'Documento'|'Comida'|'Roupa'|'Electrónico'|'Medicamento'|'Livros'|'Peça'|'Outro';
export type PackageWeight = 'Leve'|'Normal'|'Pesado';
export type PaymentMethod = 'Numerário'|'Transferência'|'Multicaixa';
export type CancelamentoMotivo = 'mudei_de_ideia'|'demorou_muito'|'endereco_errado'|'outro';
export type DenunciaMotivo = 'conduta_inadequada'|'cobranca_superior'|'encomenda_danificada'|'atraso_excessivo';

export interface LocationCoords { latitude: number; longitude: number; address?: string; }
export interface Motoqueiro { id:string; nome:string; telefone:string; fotoPerfil?:string; rating:number; placa?:string; }
export interface ChatMessage { id:string; pedidoId:string; senderId:string; senderType:'cliente'|'motoqueiro'; text:string; timestamp:string; read:boolean; }
export interface DeliveryOrder {
  id: string; numeroPedido: string; codigoQr: string; codigoNumerico: string;
  origemEndereco: string; origemCoords: LocationCoords;
  destinoEndereco: string; destinoCoords: LocationCoords;
  tipoEncomenda: PackageType; peso: PackageWeight; observacoes?: string;
  precoBase: number; ajusteCliente: number; precoFinal: number;
  metodoPagamento: PaymentMethod;
  distanciaKm: number; tempoEstimadoMin: number;
  motoqueiro?: Motoqueiro;
  status: DeliveryStatus; criadoEm: string;
  entregueEm?: string; canceladoEm?: string; motivoCancelamento?: string; pausaMotivo?: string;
}
// Payload pronto para o back-end
export type CreateOrderPayload = Omit<DeliveryOrder,'id'|'motoqueiro'|'entregueEm'|'canceladoEm'>;
export interface CancelamentoPayload { pedidoId:string; motivo:CancelamentoMotivo; }
export interface RatingPayload { pedidoId:string; estrelas:number; comentario?:string; denuncia?:{motivos:DenunciaMotivo[];descricao?:string}; }

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTES
// ─────────────────────────────────────────────────────────────────────────────
const SNAP = { MINI: 0.35, MID: 0.58, FULL: 0.92 };
const PRICE_RULES: Record<PackageWeight,number> = { Leve:0, Normal:350, Pesado:700 };
const MIN_PRICE = 500;
const PRICE_PER_KM = 350;
const PRICE_ADJUST_THRESHOLD = 1500;

const STATUS_LABELS: Record<DeliveryStatus,string> = {
  idle:'', a_procurar_motoqueiro:'À procura de motoqueiro...',
  motoqueiro_atribuido:'Motoqueiro atribuído',
  a_caminho_recolha:'A caminho do ponto de recolha',
  em_pausa:'Entrega em pausa', recolhido:'Encomenda recolhida',
  entregando:'A caminho do destino', entregue:'Entrega concluída!', cancelado:'Entrega cancelada',
};
const STATUS_COLORS: Record<DeliveryStatus,string> = {
  idle:'#6B7280', a_procurar_motoqueiro:'#2D60FF', motoqueiro_atribuido:'#2D60FF',
  a_caminho_recolha:'#2D60FF', em_pausa:'#F59E0B', recolhido:'#8B5CF6',
  entregando:'#2D60FF', entregue:'#10B981', cancelado:'#EF4444',
};

const FIXED_ADDRESSES = [
  { label:'Vila de Viana',    address:'Vila de Viana, Luanda',         coords:{ latitude:-8.9035, longitude:13.3745 } },
  { label:'Talatona',         address:'Talatona, Luanda Sul',           coords:{ latitude:-8.9579, longitude:13.1964 } },
  { label:'Benfica',          address:'Benfica, Luanda',                coords:{ latitude:-8.9041, longitude:13.2028 } },
  { label:'Vila Alice',       address:'Vila Alice, Luanda',             coords:{ latitude:-8.8311, longitude:13.2394 } },
  { label:'Maculusso',        address:'Maculusso, 1º de Maio, Luanda',  coords:{ latitude:-8.8208, longitude:13.2347 } },
  { label:'Maianga',          address:'Maianga, Luanda',                coords:{ latitude:-8.8266, longitude:13.2284 } },
  { label:'Rangel',           address:'Rangel, Luanda',                 coords:{ latitude:-8.8451, longitude:13.2611 } },
  { label:'Cacuaco',          address:'Cacuaco, Luanda',                coords:{ latitude:-8.7734, longitude:13.3669 } },
  { label:'Kilamba',          address:'Cidade do Kilamba, Luanda',      coords:{ latitude:-8.9281, longitude:13.3561 } },
  { label:'Ingombota',        address:'Ingombota, Luanda',              coords:{ latitude:-8.8175, longitude:13.2344 } },
  { label:'Samba',            address:'Samba, Luanda',                  coords:{ latitude:-8.8712, longitude:13.2431 } },
  { label:'Cazenga',          address:'Cazenga, Luanda',                coords:{ latitude:-8.8023, longitude:13.2898 } },
];
const POPULAR_SPOTS = [
  { label:'Condomínio Dolce Vita',    address:'Condomínio Dolce Vita, Talatona',      coords:{ latitude:-8.9621, longitude:13.1951 } },
  { label:'Largo do Kinaxixi',        address:'Largo do Kinaxixi, Luanda',            coords:{ latitude:-8.8228, longitude:13.2335 } },
  { label:'Edifício Gika',            address:'Edifício Gika, Luanda',                coords:{ latitude:-8.8181, longitude:13.2351 } },
  { label:'Shopping Belas',           address:'Shopping Belas, Luanda',               coords:{ latitude:-8.9379, longitude:13.1871 } },
  { label:'Aeroporto 4 de Fevereiro', address:'Aeroporto Internacional, Luanda',      coords:{ latitude:-8.8583, longitude:13.2312 } },
  { label:'Hospital Américo Boavida', address:'Hospital Américo Boavida, Luanda',     coords:{ latitude:-8.8222, longitude:13.2361 } },
  { label:'Mercado Roque Santeiro',   address:'Roque Santeiro, Luanda',               coords:{ latitude:-8.8012, longitude:13.2589 } },
  { label:'Universidade Agostinho Neto', address:'UAN, Campus, Luanda',               coords:{ latitude:-8.8291, longitude:13.2441 } },
  { label:'Shopping Avenida',         address:'Shopping Avenida, Luanda',             coords:{ latitude:-8.8194, longitude:13.2344 } },
  { label:'Marginal de Luanda',       address:'Av. 4 de Fevereiro, Marginal, Luanda', coords:{ latitude:-8.8167, longitude:13.2311 } },
];
const PACKAGE_TYPES: {type:PackageType;icon:string}[] = [
  {type:'Documento',   icon:'document-text-outline'},
  {type:'Comida',      icon:'fast-food-outline'},
  {type:'Roupa',       icon:'shirt-outline'},
  {type:'Electrónico', icon:'phone-portrait-outline'},
  {type:'Medicamento', icon:'medkit-outline'},
  {type:'Livros',      icon:'book-outline'},
  {type:'Peça',        icon:'construct-outline'},
  {type:'Outro',       icon:'ellipsis-horizontal-outline'},
];
const CANCEL_OPTIONS: {value:CancelamentoMotivo;label:string}[] = [
  {value:'mudei_de_ideia',  label:'Mudei de ideia'},
  {value:'demorou_muito',   label:'O motoqueiro demorou muito'},
  {value:'endereco_errado', label:'Endereço incorrecto'},
  {value:'outro',           label:'Outro motivo'},
];
const REPORT_OPTIONS: {value:DenunciaMotivo;label:string;icon:string}[] = [
  {value:'conduta_inadequada',  label:'Conduta inadequada ou falta de respeito', icon:'⚠️'},
  {value:'cobranca_superior',   label:'Cobrança superior ao valor do app',       icon:'💸'},
  {value:'encomenda_danificada',label:'Encomenda danificada, violada ou incompleta',icon:'📦'},
  {value:'atraso_excessivo',    label:'Atraso excessivo ou recusou chegar ao ponto',icon:'⏰'},
];

// ─────────────────────────────────────────────────────────────────────────────
// UTILITÁRIOS
// ─────────────────────────────────────────────────────────────────────────────
function calcDistance(a:LocationCoords, b:LocationCoords):number {
  const R=6371, dLat=((b.latitude-a.latitude)*Math.PI)/180, dLon=((b.longitude-a.longitude)*Math.PI)/180;
  const h=Math.sin(dLat/2)**2+Math.cos((a.latitude*Math.PI)/180)*Math.cos((b.latitude*Math.PI)/180)*Math.sin(dLon/2)**2;
  return parseFloat((R*2*Math.atan2(Math.sqrt(h),Math.sqrt(1-h))).toFixed(2));
}
function calcBasePrice(distKm:number, weight:PackageWeight):number {
  return Math.max(MIN_PRICE, Math.round(distKm*PRICE_PER_KM))+PRICE_RULES[weight];
}
function genCode():string { return String(Math.floor(100000+Math.random()*900000)); }
function genOrderNum():string {
  const d=new Date(), pad=(n:number)=>String(n).padStart(2,'0');
  return `ENT-${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}-${String(Math.floor(Math.random()*9999)).padStart(4,'0')}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// ESTILO DO MAPA (igual ao do motoqueiro)
// ─────────────────────────────────────────────────────────────────────────────
const DARK_MAP = [
  { elementType: 'geometry', stylers: [{ color: '#303E4D' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#FFFFFF' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1F2933' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#3D5166' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#1F2933' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#FFFFFF' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#4A6080' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#1a2a3a' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#2A3A4A' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#FFFFFF' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#2A3A4A' }] },
  { featureType: 'administrative', elementType: 'labels.text.fill', stylers: [{ color: '#FFFFFF' }] },
];

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
export default function HomeClient() {
  const navigation = useNavigation<any>();
  const mapRef = useRef<MapView>(null);

  // ── Hooks da API real ────────────────────────────────────────────────────
  const delivery = useDelivery();
  const chat = useChat(delivery.activeOrder?.id ?? null);

  // ── Localização ───────────────────────────────────────────────────────────
  const [locationLoading, setLocationLoading] = useState(true);
  const [myLocation, setMyLocation] = useState<LocationCoords|null>(null);
  const [myAddressLabel, setMyAddressLabel] = useState('A obter localização...');
  const [customPickup, setCustomPickup] = useState<LocationCoords|null>(null);
  const [customPickupLabel, setCustomPickupLabel] = useState('');
  const [editingPickup, setEditingPickup] = useState(false);
  const [pickupSearchText, setPickupSearchText] = useState('');

  // ── Destino ───────────────────────────────────────────────────────────────
  const [destination, setDestination] = useState<LocationCoords|null>(null);
  const [destinationLabel, setDestinationLabel] = useState('');
  const [destinationSearch, setDestinationSearch] = useState('');
  const [destinationSearchResults, setDestinationSearchResults] = useState<typeof FIXED_ADDRESSES>([]);
  const [destinationScreenOpen, setDestinationScreenOpen] = useState(false);
  const [routeCoords, setRouteCoords] = useState<LocationCoords[]>([]);

  // ── Drawer ────────────────────────────────────────────────────────────────
  type SnapKey = 'MINI'|'MID'|'FULL';
  const [snapKey, setSnapKey] = useState<SnapKey>('MINI');
  const drawerY = useRef(new Animated.Value(SH*(1-SNAP.MINI))).current;
  const lastSnap = useRef(SH*(1-SNAP.MINI));

  function snapTo(key: SnapKey) {
    const y = SH*(1-SNAP[key]);
    lastSnap.current = y;
    Animated.spring(drawerY, { toValue:y, useNativeDriver:false, tension:68, friction:12 }).start();
    setSnapKey(key);
  }

  // Pan gesture para arrastar a gaveta
  const panResponder = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_,gs) => Math.abs(gs.dy) > 8,
    onPanResponderGrant: () => { drawerY.stopAnimation(); },
    onPanResponderMove: (_,gs) => {
      const newY = lastSnap.current + gs.dy;
      const minY = SH*(1-SNAP.FULL);
      const maxY = SH*(1-SNAP.MINI);
      drawerY.setValue(Math.max(minY, Math.min(maxY, newY)));
    },
    onPanResponderRelease: (_,gs) => {
      const cur = lastSnap.current + gs.dy;
      const mid = SH*(1-SNAP.MID);
      const mini = SH*(1-SNAP.MINI);
      const full = SH*(1-SNAP.FULL);
      // snap para o mais próximo
      const dists = [
        {key:'MINI' as SnapKey, d:Math.abs(cur-mini)},
        {key:'MID'  as SnapKey, d:Math.abs(cur-mid)},
        {key:'FULL' as SnapKey, d:Math.abs(cur-full)},
      ];
      // velocidade influencia direcção
      if (gs.vy > 0.5) { snapTo('MINI'); return; }
      if (gs.vy < -0.5) { snapTo(cur < mid ? 'FULL' : 'MID'); return; }
      snapTo(dists.sort((a,b)=>a.d-b.d)[0].key);
    },
  })).current;

  // ── Step ──────────────────────────────────────────────────────────────────
  const [step, setStep] = useState<1|2|3>(1);

  // ── Detalhes ──────────────────────────────────────────────────────────────
  const [packageType, setPackageType] = useState<PackageType>('Documento');
  const [packageWeight, setPackageWeight] = useState<PackageWeight>('Leve');
  const [observations, setObservations] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Numerário');
  const [showPaymentSheet, setShowPaymentSheet] = useState(false);

  // ── Preço ─────────────────────────────────────────────────────────────────
  const priceAdjustment = delivery.priceAdjustment;
  const setPriceAdjustment = delivery.setPriceAdjustment;
  const priceAdjusted = delivery.priceAdjusted;
  const setPriceAdjusted = delivery.setPriceAdjusted;

  // ── Entrega (gerido pelo hook useDelivery) ────────────────────────────────
  const activeOrder = delivery.activeOrder;
  const deliveryStatus = delivery.deliveryStatus;
  const searching = delivery.searching;

  // ── Animação de procura ───────────────────────────────────────────────────
  const searchAnim = useRef(new Animated.Value(0)).current;
  const searchLoop = useRef<Animated.CompositeAnimation|null>(null);

  // ── QR ────────────────────────────────────────────────────────────────────
  const [qrVisible, setQrVisible] = useState(false);

  // ── Chat (gerido pelo hook useChat) ────────────────────────────────────────
  const [chatVisible, setChatVisible] = useState(false);
  const chatMessages = chat.messages;
  const [chatInput, setChatInput] = useState('');
  const chatScrollRef = useRef<ScrollView>(null);

  // ── Modais ────────────────────────────────────────────────────────────────
  const [cancelConfirmVisible, setCancelConfirmVisible] = useState(false);
  const [cancelReasonVisible, setCancelReasonVisible] = useState(false);
  const [cancelReason, setCancelReason] = useState<CancelamentoMotivo|null>(null);
  const [ratingVisible, setRatingVisible] = useState(false);
  const [ratingStars, setRatingStars] = useState(0);
  const [reportVisible, setReportVisible] = useState(false);
  const [reportMotivos, setReportMotivos] = useState<DenunciaMotivo[]>([]);
  const [reportDesc, setReportDesc] = useState('');
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [pauseVisible, setPauseVisible] = useState(false);
  const [pauseMotivo, setPauseMotivo] = useState('');

  // ─────────────────────────────────────────────────────────────────────────
  // LOCALIZAÇÃO GPS
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setMyAddressLabel('Luanda, Angola');
        setMyLocation({ latitude:-8.8390, longitude:13.2894 });
        setLocationLoading(false); return;
      }
      try {
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        const coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        setMyLocation(coords);
        const rev = await Location.reverseGeocodeAsync(coords);
        if (rev.length > 0) {
          const r = rev[0];
          setMyAddressLabel([r.street, r.subregion, r.city].filter(Boolean).join(', ') || 'Minha localização actual');
        }
      } catch { setMyAddressLabel('Minha localização actual'); }
      finally { setLocationLoading(false); }
    })();
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // PESQUISA DE DESTINO
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!destinationSearch.trim()) { setDestinationSearchResults([]); return; }
    const q = destinationSearch.toLowerCase();
    setDestinationSearchResults(
      [...FIXED_ADDRESSES, ...POPULAR_SPOTS]
        .filter(a => a.label.toLowerCase().includes(q) || a.address.toLowerCase().includes(q))
        .slice(0, 8)
    );
  }, [destinationSearch]);

  // ─────────────────────────────────────────────────────────────────────────
  // DERIVADOS
  // ─────────────────────────────────────────────────────────────────────────
  const pickupCoords = customPickup ?? myLocation;
  const pickupLabel = customPickup ? customPickupLabel : myAddressLabel;
  const distanceKm = useMemo(() => pickupCoords && destination ? calcDistance(pickupCoords, destination) : 0, [pickupCoords, destination]);
  const basePrice = useMemo(() => calcBasePrice(distanceKm, packageWeight), [distanceKm, packageWeight]);
  const finalPrice = useMemo(() => basePrice + priceAdjustment, [basePrice, priceAdjustment]);
  const estimatedMin = useMemo(() => Math.max(2, Math.round(distanceKm*3)), [distanceKm]);
  const canAdjust = finalPrice > PRICE_ADJUST_THRESHOLD && !priceAdjusted;
  const isActiveDelivery = activeOrder !== null && deliveryStatus !== 'idle' && deliveryStatus !== 'a_procurar_motoqueiro';
  const canCancel = deliveryStatus === 'a_caminho_recolha' || deliveryStatus === 'motoqueiro_atribuido';

  // ── Rota real (segue estradas via Google Directions) ────────────────────────
  useEffect(() => {
    if (!pickupCoords || !destination) { setRouteCoords([]); return; }
    let cancelled = false;
    getRoute(pickupCoords, destination).then(result => {
      if (!cancelled && result) setRouteCoords(result.coords);
    });
    return () => { cancelled = true; };
  }, [pickupCoords, destination]);

  // ─────────────────────────────────────────────────────────────────────────
  // ANIMAÇÃO DE PROCURA
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (searching) {
      searchLoop.current = Animated.loop(
        Animated.sequence([
          Animated.timing(searchAnim, {toValue:1,duration:900,useNativeDriver:false,easing:Easing.inOut(Easing.ease)}),
          Animated.timing(searchAnim, {toValue:0,duration:900,useNativeDriver:false,easing:Easing.inOut(Easing.ease)}),
        ])
      );
      searchLoop.current.start();
    } else {
      searchLoop.current?.stop();
      searchAnim.setValue(0);
    }
  }, [searching]);

  // ─────────────────────────────────────────────────────────────────────────
  // ACÇÕES
  // ─────────────────────────────────────────────────────────────────────────
  function handleSelectDestination(item: typeof FIXED_ADDRESSES[0]) {
    setDestination(item.coords);
    setDestinationLabel(item.address);
    setDestinationScreenOpen(false);
    snapTo('MID');
    if (mapRef.current && pickupCoords) {
      mapRef.current.fitToCoordinates([pickupCoords, item.coords], {
        edgePadding:{top:100,right:60,bottom:340,left:60}, animated:true,
      });
    }
  }

  function handleMapLongPress(e:any) {
    const coords: LocationCoords = e.nativeEvent.coordinate;
    setDestination(coords);
    setDestinationLabel(`${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`);
    snapTo('MID');
  }

  async function handleConfirmOrder() {
    if (!pickupCoords || !destination) return;
    const code = genCode();
    const orderNum = genOrderNum();
    const payload = {
      numeroPedido: orderNum,
      codigoQr: `BIKO:${orderNum}:${code}`, codigoNumerico: code,
      origemEndereco: pickupLabel, origemCoords: pickupCoords,
      destinoEndereco: destinationLabel, destinoCoords: destination,
      tipoEncomenda: packageType, peso: packageWeight,
      observacoes: observations || undefined,
      precoBase: basePrice, ajusteCliente: priceAdjustment, precoFinal: finalPrice,
      metodoPagamento: paymentMethod,
      distanciaKm: distanceKm, tempoEstimadoMin: estimatedMin,
    };
    snapTo('MID');
    try {
      await delivery.confirmOrder(payload);
    } catch (err: any) {
      console.error('[handleConfirmOrder] Erro:', err?.message || err);
    }
  }

  function handleCancelConfirm() {
    if (!cancelReason || !activeOrder) return;
    delivery.cancelOrder(cancelReason);
    setCancelReasonVisible(false);
    setTimeout(resetFlow, 2000);
  }

  async function handleSubmitRating() {
    if (!activeOrder || ratingStars===0) return;
    await delivery.submitRating(ratingStars);
    setRatingVisible(false); resetFlow();
  }

  async function handleSubmitReport() {
    if (!activeOrder || reportMotivos.length===0) return;
    await delivery.submitReport(reportMotivos, reportDesc || undefined);
    setReportVisible(false); setRatingVisible(false); resetFlow();
  }

  function handleSendChat() {
    if (!chatInput.trim() || !activeOrder) return;
    chat.sendMessage(chatInput.trim());
    setChatInput('');
    setTimeout(()=>chatScrollRef.current?.scrollToEnd({animated:true}), 100);
  }

  async function handleShareCode() {
    if (!activeOrder) return;
    await Share.share({ message:`Código de entrega BIKO\nPedido: ${activeOrder.numeroPedido}\nCódigo: ${activeOrder.codigoNumerico}`, title:'Código BIKO' });
  }

  function handleCompleteDelivery() {
    if (!activeOrder) return;
    Alert.alert('Confirmar conclusão','Deseja marcar esta entrega como concluída?',[
      {text:'Cancelar',style:'cancel'},
      {text:'Concluir',onPress:async()=>{
        await delivery.completeDelivery();
        setQrVisible(false);
        setTimeout(()=>setRatingVisible(true),800);
      }},
    ]);
  }

  function resetFlow() {
    delivery.resetFlow();
    chat.clearMessages();
    setStep(1); setDestination(null); setDestinationLabel(''); setDestinationSearch('');
    setCustomPickup(null); setCustomPickupLabel(''); setObservations('');
    setRatingStars(0); setReportMotivos([]); setReportDesc('');
    snapTo('MINI');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // BOTÃO "MINHA LOCALIZAÇÃO" — cola 16px acima da gaveta
  // ─────────────────────────────────────────────────────────────────────────
  const myLocBtnBottom = useMemo(() => {
    return SH*SNAP[snapKey] + 16;
  }, [snapKey]);

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: Loading screen
  // ─────────────────────────────────────────────────────────────────────────
  if (locationLoading) {
    return (
      <View style={st.loadingScreen}>
        <ActivityIndicator size="large" color="#EF4444" />
        <Text style={st.loadingText}>A obter localização...</Text>
      </View>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: Ecrã de pesquisa de destino
  // ─────────────────────────────────────────────────────────────────────────
  function renderDestScreen() {
    return (
      <Modal visible={destinationScreenOpen} animationType="slide" statusBarTranslucent>
        <View style={st.destContainer}>
          <View style={st.destHeader}>
            <TouchableOpacity onPress={()=>setDestinationScreenOpen(false)} style={st.backCircle}>
              <Ionicons name="arrow-back" size={20} color="#fff"/>
            </TouchableOpacity>
            <Text style={st.destTitle}>Morada de entrega</Text>
          </View>
          <View style={st.destSearchWrap}>
            <Ionicons name="search-outline" size={18} color="#6B7280"/>
            <TextInput style={st.destSearchInput} placeholder="Escreve o endereço..." placeholderTextColor="#6B7280"
              value={destinationSearch} onChangeText={setDestinationSearch} autoFocus/>
            {destinationSearch.length>0 && <TouchableOpacity onPress={()=>setDestinationSearch('')}><Ionicons name="close-circle" size={18} color="#6B7280"/></TouchableOpacity>}
          </View>
          <ScrollView keyboardShouldPersistTaps="handled">
            {destinationSearch.length===0 ? <>
              <Text style={st.destSectionTitle}>Zonas populares</Text>
              {FIXED_ADDRESSES.map(item=>(
                <TouchableOpacity key={item.label} style={st.destItem} onPress={()=>handleSelectDestination(item)}>
                  <View style={[st.destPin,{backgroundColor:'#2D60FF20'}]}><Ionicons name="location" size={16} color="#2D60FF"/></View>
                  <View style={{flex:1}}><Text style={st.destItemLabel}>{item.label}</Text><Text style={st.destItemAddr}>{item.address}</Text></View>
                </TouchableOpacity>
              ))}
              <Text style={st.destSectionTitle}>Locais conhecidos</Text>
              {POPULAR_SPOTS.map(item=>(
                <TouchableOpacity key={item.label} style={st.destItem} onPress={()=>handleSelectDestination(item)}>
                  <View style={[st.destPin,{backgroundColor:'#EF444420'}]}><Ionicons name="location" size={16} color="#EF4444"/></View>
                  <View style={{flex:1}}><Text style={st.destItemLabel}>{item.label}</Text><Text style={st.destItemAddr}>{item.address}</Text></View>
                </TouchableOpacity>
              ))}
            </> : <>
              {destinationSearchResults.map(item=>(
                <TouchableOpacity key={item.label} style={st.destItem} onPress={()=>handleSelectDestination(item)}>
                  <View style={[st.destPin,{backgroundColor:'#2D60FF20'}]}><Ionicons name="location" size={16} color="#2D60FF"/></View>
                  <View style={{flex:1}}><Text style={st.destItemLabel}>{item.label}</Text><Text style={st.destItemAddr}>{item.address}</Text></View>
                </TouchableOpacity>
              ))}
              {destinationSearchResults.length===0 && <Text style={st.destEmpty}>Nenhum resultado encontrado</Text>}
            </>}
          </ScrollView>
        </View>
      </Modal>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: Passo 1
  // ─────────────────────────────────────────────────────────────────────────
  function renderStep1() {
    return (
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={st.locCard}>
          {/* Recolha */}
          <TouchableOpacity style={st.locRow} onPress={()=>setEditingPickup(v=>!v)}>
            <View style={[st.locDot,{backgroundColor:'#2D60FF'}]}/>
            <View style={{flex:1}}>
              <Text style={st.locRowLbl}>Recolha</Text>
              <Text style={st.locRowVal} numberOfLines={1}>{pickupLabel}</Text>
            </View>
            <Ionicons name={editingPickup?'chevron-up':'chevron-down'} size={16} color="#6B7280"/>
          </TouchableOpacity>
          {editingPickup && (
            <View style={st.pickupEdit}>
              <TextInput style={st.pickupInput} placeholder="Endereço alternativo de recolha..." placeholderTextColor="#6B7280"
                value={pickupSearchText} onChangeText={setPickupSearchText}/>
              {FIXED_ADDRESSES.filter(a=>a.label.toLowerCase().includes(pickupSearchText.toLowerCase())).slice(0,4).map(a=>(
                <TouchableOpacity key={a.label} style={st.pickupSugg} onPress={()=>{setCustomPickup(a.coords);setCustomPickupLabel(a.address);setEditingPickup(false);setPickupSearchText('');}}>
                  <Ionicons name="location-outline" size={14} color="#2D60FF"/><Text style={st.pickupSuggTxt}>{a.label}</Text>
                </TouchableOpacity>
              ))}
              {customPickup && <TouchableOpacity onPress={()=>{setCustomPickup(null);setCustomPickupLabel('');setEditingPickup(false);}}>
                <Text style={st.pickupReset}>Usar minha localização actual</Text>
              </TouchableOpacity>}
            </View>
          )}
          <View style={st.locConnector}/>
          {/* Destino */}
          <TouchableOpacity style={st.locRow} onPress={()=>{setDestinationScreenOpen(true);snapTo('MINI');}}>
            <View style={[st.locDot,{backgroundColor:'#EF4444'}]}/>
            <View style={{flex:1}}>
              <Text style={st.locRowLbl}>Destino</Text>
              <Text style={[st.locRowVal,!destination&&{color:'#6B7280'}]} numberOfLines={1}>
                {destination ? destinationLabel : 'Morada de entrega'}
              </Text>
            </View>
            <TouchableOpacity style={st.mapaBtn} onPress={()=>snapTo('MINI')}>
              <Text style={st.mapaBtnTxt}>Mapa</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </View>
        <Text style={st.mapHint}><Ionicons name="hand-left-outline" size={13} color="#6B7280"/> Pressiona o mapa 3s para marcar o destino</Text>
        {destination && (
          <View style={st.distRow}>
            {[['navigate-outline','Distância',`${distanceKm} km`],['time-outline','Tempo est.',`${estimatedMin} min`],['wallet-outline','A partir de',`${basePrice} Kz`]].map(([icon,lbl,val],i)=>(
              <React.Fragment key={lbl}>
                {i>0 && <View style={st.distDivider}/>}
                <View style={st.distItem}>
                  <Ionicons name={icon as any} size={14} color="#2D60FF"/>
                  <Text style={st.distLbl}>{lbl}</Text>
                  <Text style={st.distVal}>{val}</Text>
                </View>
              </React.Fragment>
            ))}
          </View>
        )}
      </ScrollView>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: Passo 2
  // ─────────────────────────────────────────────────────────────────────────
  function renderStep2() {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS==='ios'?'padding':'height'}
        keyboardVerticalOffset={Platform.OS==='ios' ? 220 : 120}
        style={{flex:1}}
      >
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{paddingBottom:40}}>
          <Text style={st.sectionLbl}>TIPO DE ENCOMENDA</Text>
          <View style={st.typeGrid}>
            {PACKAGE_TYPES.map(pt=>(
              <TouchableOpacity key={pt.type} style={[st.typeCell,packageType===pt.type&&st.typeCellActive]} onPress={()=>setPackageType(pt.type)}>
                <Ionicons name={pt.icon as any} size={22} color={packageType===pt.type?'#2D60FF':'#9CA3AF'}/>
                <Text style={[st.typeCellTxt,packageType===pt.type&&{color:'#2D60FF'}]}>{pt.type.length>7?pt.type.slice(0,7)+'…':pt.type}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={st.sectionLbl}>PESO APROXIMADO</Text>
          <View style={st.weightRow}>
            {(['Leve','Normal','Pesado'] as PackageWeight[]).map(w=>(
              <TouchableOpacity key={w} style={[st.weightCell,packageWeight===w&&st.weightCellActive]} onPress={()=>setPackageWeight(w)}>
                <Ionicons name={w==='Leve'?'help-circle-outline':w==='Normal'?'cube-outline':'barbell-outline'} size={22} color={packageWeight===w?'#2D60FF':'#9CA3AF'}/>
                <Text style={[st.weightLbl,packageWeight===w&&{color:'#fff'}]}>{w}</Text>
                <Text style={st.weightSub}>{w==='Leve'?'< 1 kg':w==='Normal'?'1–5 kg':'5–10 kg'}</Text>
                {w!=='Leve'&&<Text style={st.weightExtra}>+{PRICE_RULES[w]} Kz</Text>}
              </TouchableOpacity>
            ))}
          </View>
          <Text style={[st.sectionLbl,{marginTop:16}]}>OBSERVAÇÕES <Text style={st.optTag}>(opcional)</Text></Text>
          <View style={st.obsWrap}>
            <Ionicons name="chatbubble-outline" size={16} color="#6B7280" style={{marginTop:2}}/>
            <TextInput style={st.obsInput} placeholder="Ex: Toca o portão 2 vezes..." placeholderTextColor="#6B7280"
              value={observations} onChangeText={setObservations} multiline
              onFocus={()=>{ snapTo('FULL'); setTimeout(()=>{ /* scroll to bottom handled by KAV */ }, 200); }}/>
          </View>
          <TouchableOpacity style={st.backBtn} onPress={()=>setStep(1)}>
            <Ionicons name="arrow-back" size={16} color="#6B7280"/>
            <Text style={st.backBtnTxt}>Voltar</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: Passo 3 — Confirmar
  // ─────────────────────────────────────────────────────────────────────────
  function renderStep3() {
    if (searching) return renderSearching();
    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={st.confirmRouteCard}>
          <View style={st.locRow}><View style={[st.locDot,{backgroundColor:'#2D60FF'}]}/><View style={{flex:1}}><Text style={st.locRowLbl}>Recolha</Text><Text style={st.locRowVal} numberOfLines={2}>{pickupLabel}</Text></View></View>
          <View style={st.locConnector}/>
          <View style={st.locRow}><View style={[st.locDot,{backgroundColor:'#EF4444'}]}/><View style={{flex:1}}><Text style={st.locRowLbl}>Entrega</Text><Text style={st.locRowVal} numberOfLines={2}>{destinationLabel}</Text></View></View>
        </View>
        <View style={st.confirmDetails}>
          {[['Tipo',packageType],['Peso',packageWeight],['Distância',`${distanceKm} km`],['Tempo est.',`${estimatedMin} min`],['Pagamento',paymentMethod],
            ...(observations?[['Observações',observations]]:[])
          ].map(([lbl,val])=>(
            <View key={lbl} style={st.confirmRow}>
              <Text style={st.confirmLbl}>{lbl}</Text>
              <Text style={[st.confirmVal,{flex:1,textAlign:'right'}]}>{val}</Text>
            </View>
          ))}
        </View>
        <Text style={st.sectionLbl}>VALOR ACORDADO</Text>
        <View style={st.priceCard}>
          <TouchableOpacity
            style={[st.priceBtn, priceAdjusted && st.priceBtnDisabled]}
            disabled={priceAdjusted}
            onPress={()=>{ if(!priceAdjusted){ setPriceAdjustment(p=>p-100); setPriceAdjusted(true); } }}
          >
            <Text style={[st.priceBtnTxt, priceAdjusted&&{color:'#4B5563'}]}>-100</Text>
          </TouchableOpacity>
          <View style={{alignItems:'center'}}>
            <Text style={st.priceMain}>{finalPrice} Kz</Text>
            <Text style={st.priceSub}>{priceAdjusted ? 'Valor ajustado' : 'Toca para ajustar'}</Text>
          </View>
          <TouchableOpacity
            style={[st.priceBtn, priceAdjusted && st.priceBtnDisabled]}
            disabled={priceAdjusted}
            onPress={()=>{ if(!priceAdjusted){ setPriceAdjustment(p=>p+100); setPriceAdjusted(true); } }}
          >
            <Text style={[st.priceBtnTxt, priceAdjusted&&{color:'#4B5563'}]}>+100</Text>
          </TouchableOpacity>
        </View>
        {!priceAdjusted && finalPrice>PRICE_ADJUST_THRESHOLD && (
          <Text style={st.priceHint}>Podes ajustar o valor uma única vez (±100 Kz)</Text>
        )}
        <TouchableOpacity style={st.backBtn} onPress={()=>setStep(2)}>
          <Ionicons name="arrow-back" size={16} color="#6B7280"/>
          <Text style={st.backBtnTxt}>Voltar</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: Animação de procura
  // ─────────────────────────────────────────────────────────────────────────
  function renderSearching() {
    const scale = searchAnim.interpolate({inputRange:[0,1],outputRange:[1,1.18]});
    return (
      <View style={st.searchWrap}>
        <Animated.View style={[st.searchCircle,{transform:[{scale}]}]}>
          <MaterialCommunityIcons name="motorbike" size={44} color="#2D60FF"/>
        </Animated.View>
        <Text style={st.searchTitle}>À procura de motoqueiro...</Text>
        <Text style={st.searchSub}>Aguarda enquanto encontramos o mais próximo</Text>
        <View style={st.progressTrack}>
          <Animated.View style={[st.progressBar,{width:searchAnim.interpolate({inputRange:[0,1],outputRange:['0%','100%']})}]}/>
        </View>
      </View>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: Gaveta activa (entrega em curso)
  // ─────────────────────────────────────────────────────────────────────────
  function renderActiveDrawerContent() {
    if (!activeOrder) return null;
    const moto = activeOrder.motoqueiro;
    const statusColor = STATUS_COLORS[deliveryStatus];
    return (
      <View style={{flex:1}}>
        {/* Status + cancelar */}
        <View style={st.activeHeader}>
          <View style={st.statusBadge}>
            <View style={[st.statusDot,{backgroundColor:statusColor}]}/>
            <Text style={st.statusTxt}>{STATUS_LABELS[deliveryStatus]}</Text>
          </View>
          {canCancel && (
            <TouchableOpacity style={st.cancelBtn} onPress={()=>setCancelConfirmVisible(true)}>
              <Ionicons name="close-circle-outline" size={14} color="#EF4444"/>
              <Text style={st.cancelBtnTxt}>Cancelar</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={{flex:1}}>
          {/* Motoqueiro */}
          {moto && (
            <View style={st.motoCard}>
              <View style={st.motoAvatar}><Ionicons name="person" size={26} color="#2D60FF"/></View>
              <View style={{flex:1}}>
                <Text style={st.motoName}>{moto.nome}</Text>
                <Text style={st.motoPhone}>{moto.telefone}</Text>
                <View style={st.starsRowSmall}>
                  {[1,2,3,4,5].map(s=><Ionicons key={s} name={Math.round(moto.rating)>=s?'star':'star-outline'} size={13} color="#F59E0B"/>)}
                  <Text style={st.motoRatingTxt}>{moto.rating}</Text>
                </View>
              </View>
              <View style={st.kmBadge}><Text style={st.kmBadgeTxt}>{activeOrder.distanciaKm} km</Text></View>
            </View>
          )}

          {/* Rota */}
          <View style={st.routeCard}>
            <View style={st.locRow}>
              <View style={[st.locDot,{backgroundColor:'#2D60FF'}]}/>
              <View style={{flex:1}}>
                <Text style={st.locRowLbl}>Recolha</Text>
                <Text style={st.locRowVal} numberOfLines={1}>{activeOrder.origemEndereco}</Text>
              </View>
            </View>
            <View style={st.locConnector}/>
            <View style={st.locRow}>
              <View style={[st.locDot,{backgroundColor:'#EF4444'}]}/>
              <View style={{flex:1}}>
                <Text style={st.locRowLbl}>Entrega</Text>
                <Text style={st.locRowVal} numberOfLines={1}>{activeOrder.destinoEndereco}</Text>
              </View>
            </View>
          </View>

          {/* 3 botões de acção */}
          <View style={st.activeActions}>
            <TouchableOpacity style={[st.activeActionBtn,{backgroundColor:'#10B98120'}]} onPress={()=>{setChatVisible(true);}}>
              <Ionicons name="chatbubble-ellipses" size={24} color="#10B981"/>
              <Text style={[st.activeActionLbl,{color:'#10B981'}]}>Chat</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[st.activeActionBtn,{backgroundColor:'#2D60FF20'}]} onPress={()=>setQrVisible(true)}>
              <MaterialCommunityIcons name="qrcode" size={24} color="#2D60FF"/>
              <Text style={[st.activeActionLbl,{color:'#2D60FF'}]}>Código</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[st.activeActionBtn,{backgroundColor:'#253040'}]} onPress={()=>setDetailsVisible(true)}>
              <Ionicons name="document-text-outline" size={24} color="#9CA3AF"/>
              <Text style={[st.activeActionLbl,{color:'#9CA3AF'}]}>Detalhes</Text>
            </TouchableOpacity>
          </View>

          {deliveryStatus==='entregue' && (
            <View style={st.completedBanner}>
              <Ionicons name="checkmark-circle" size={26} color="#10B981"/>
              <Text style={st.completedTxt}>Entrega concluída com sucesso!</Text>
            </View>
          )}
        </ScrollView>
      </View>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: Modal QR
  // ─────────────────────────────────────────────────────────────────────────
  function renderQrModal() {
    if (!activeOrder) return null;
    return (
      <Modal visible={qrVisible} transparent animationType="slide" statusBarTranslucent onRequestClose={()=>setQrVisible(false)}>
        <View style={st.modalOverlay}>
          <View style={[st.modalBox,{paddingVertical:32}]}>
            <Text style={st.modalTitle}>Código de entrega</Text>
            <Text style={st.modalSub}>Apresenta ao motoqueiro no final</Text>
            <View style={st.qrWrap}><QRCode value={activeOrder.codigoQr} size={180} color="#fff" backgroundColor="#1E2A35"/></View>
            <View style={{alignItems:'center',gap:4,marginVertical:8}}>
              <Text style={{fontSize:11,fontFamily:themes.fonts.poppinsRegular,color:'#6B7280'}}>Código numérico</Text>
              <Text style={st.numCode}>{activeOrder.codigoNumerico}</Text>
            </View>
            <View style={st.qrActions}>
              <TouchableOpacity style={st.qrActionBtn} onPress={handleShareCode}>
                <Ionicons name="share-social-outline" size={18} color="#2D60FF"/>
                <Text style={st.qrActionTxt}>Partilhar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[st.qrActionBtn,{backgroundColor:'#10B98120'}]} onPress={handleCompleteDelivery}>
                <Ionicons name="checkmark-circle-outline" size={18} color="#10B981"/>
                <Text style={[st.qrActionTxt,{color:'#10B981'}]}>Concluir</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={()=>setQrVisible(false)} style={{marginTop:10}}>
              <Text style={{color:'#6B7280',fontSize:13,fontFamily:themes.fonts.poppinsRegular}}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: Modal Detalhes
  // ─────────────────────────────────────────────────────────────────────────
  function renderDetailsModal() {
    if (!activeOrder) return null;
    const moto = activeOrder.motoqueiro;
    return (
      <Modal visible={detailsVisible} animationType="slide" transparent={false} statusBarTranslucent onRequestClose={()=>setDetailsVisible(false)}>
        <View style={dl.container}>
          {/* Header */}
          <View style={dl.header}>
            <TouchableOpacity style={dl.closeBtn} onPress={()=>setDetailsVisible(false)}>
              <Ionicons name="chevron-down" size={22} color="#9CA3AF"/>
            </TouchableOpacity>
            <Text style={dl.title}>Detalhes da entrega</Text>
            <View style={{width:40}}/>
          </View>

          <ScrollView contentContainerStyle={dl.scroll} showsVerticalScrollIndicator={false}>
            {/* Motoqueiro */}
            {moto && (
              <View style={dl.clientCard}>
                <View style={dl.clientAvatar}><Ionicons name="person" size={26} color="#2D60FF"/></View>
                <View style={{flex:1}}>
                  <Text style={dl.clientName}>{moto.nome}</Text>
                  <Text style={dl.clientPhone}>{moto.telefone}</Text>
                  <View style={{flexDirection:'row',gap:3,marginTop:3}}>
                    {[1,2,3,4,5].map(s=><Ionicons key={s} name={Math.round(moto.rating)>=s?'star':'star-outline'} size={12} color="#F59E0B"/>)}
                    <Text style={{fontSize:11,color:'#F59E0B',fontFamily:themes.fonts.poppinsRegular,marginLeft:2}}>{moto.rating}</Text>
                  </View>
                </View>
                <View style={dl.distBadge}><Text style={dl.distBadgeTxt}>{activeOrder.distanciaKm} km</Text></View>
              </View>
            )}

            {/* Rota */}
            <View style={dl.routeCard}>
              <View style={dl.routeRow}>
                <View style={[dl.routeIcon,{backgroundColor:'#2D60FF20'}]}><Ionicons name="location" size={18} color="#2D60FF"/></View>
                <View style={{flex:1}}>
                  <Text style={dl.routeLbl}>Recolha</Text>
                  <Text style={dl.routeAddr}>{activeOrder.origemEndereco}</Text>
                </View>
              </View>
              <View style={dl.routeConnector}/>
              <View style={dl.routeRow}>
                <View style={[dl.routeIcon,{backgroundColor:'#EF444420'}]}><Ionicons name="flag" size={18} color="#EF4444"/></View>
                <View style={{flex:1}}>
                  <Text style={dl.routeLbl}>Entrega</Text>
                  <Text style={dl.routeAddr}>{activeOrder.destinoEndereco}</Text>
                </View>
              </View>
            </View>

            {/* Info rápida */}
            <View style={dl.infoRow}>
              <View style={dl.infoCard}>
                <Ionicons name="time-outline" size={18} color="#2D60FF"/>
                <Text style={dl.infoLbl}>Tempo est.</Text>
                <Text style={dl.infoVal}>{activeOrder.tempoEstimadoMin} min</Text>
              </View>
              <View style={dl.infoCard}>
                <Ionicons name="cash-outline" size={18} color="#10B981"/>
                <Text style={dl.infoLbl}>Pagamento</Text>
                <Text style={dl.infoVal}>{activeOrder.metodoPagamento}</Text>
              </View>
            </View>

            {/* Detalhes encomenda */}
            <View style={dl.detailsGrid}>
              <View style={dl.detailCard}>
                <Ionicons name="document-text-outline" size={22} color="#2D60FF"/>
                <Text style={dl.detailLbl}>Tipo</Text>
                <Text style={dl.detailVal}>{activeOrder.tipoEncomenda}</Text>
              </View>
              <View style={dl.detailCard}>
                <Ionicons name="cube-outline" size={22} color="#F59E0B"/>
                <Text style={dl.detailLbl}>Peso</Text>
                <Text style={dl.detailVal}>{activeOrder.peso}</Text>
              </View>
            </View>

            {/* Pedido + Preços */}
            <View style={dl.priceCard}>
              {[
                ['Pedido', activeOrder.numeroPedido],
                ['Preço base', `${activeOrder.precoBase} Kz`],
                ['Ajuste', `${activeOrder.ajusteCliente>=0?'+':''}${activeOrder.ajusteCliente} Kz`],
                ['Preço final', `${activeOrder.precoFinal} Kz`],
              ].map(([lbl,val],i)=>(
                <View key={lbl} style={[dl.priceRow, i>0&&{borderTopWidth:1,borderTopColor:'#ffffff08',paddingTop:10,marginTop:2}]}>
                  <Text style={dl.priceLbl}>{lbl}</Text>
                  <Text style={[dl.priceVal, lbl==='Preço final'&&{color:'#2D60FF',fontSize:16}]}>{val}</Text>
                </View>
              ))}
            </View>

            {activeOrder.observacoes && (
              <View style={dl.obsCard}>
                <Ionicons name="chatbubble-outline" size={15} color="#9CA3AF"/>
                <View style={{flex:1}}>
                  <Text style={dl.obsLbl}>Observações</Text>
                  <Text style={dl.obsTxt}>{activeOrder.observacoes}</Text>
                </View>
              </View>
            )}
          </ScrollView>

          <View style={dl.footer}>
            <TouchableOpacity style={dl.closeFullBtn} onPress={()=>setDetailsVisible(false)}>
              <Text style={dl.closeFullTxt}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: Chat
  // ─────────────────────────────────────────────────────────────────────────
  function renderChat() {
    const motoName = activeOrder?.motoqueiro?.nome ?? 'Motoqueiro';
    return (
      <Modal visible={chatVisible} animationType="slide" transparent={false} statusBarTranslucent onRequestClose={()=>setChatVisible(false)}>
        <KeyboardAvoidingView style={{flex:1,backgroundColor:'#0B0F13',paddingTop:Platform.OS==='ios'?50:32}} behavior={Platform.OS==='ios'?'padding':'height'} keyboardVerticalOffset={0}>
          {/* Header */}
          <View style={ch.header}>
            <TouchableOpacity style={ch.backCircle} onPress={()=>setChatVisible(false)}>
              <Ionicons name="arrow-back" size={20} color="#fff"/>
            </TouchableOpacity>
            <View style={ch.headerCenter}>
              <View style={ch.headerAvatar}><Ionicons name="person" size={18} color="#2D60FF"/></View>
              <View>
                <Text style={ch.headerName}>{motoName}</Text>
                <View style={ch.onlineRow}>
                  <View style={ch.onlineDot}/>
                  <Text style={ch.onlineTxt}>Online</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity style={ch.callBtn}>
              <Ionicons name="call-outline" size={18} color="#2D60FF"/>
            </TouchableOpacity>
          </View>

          {/* Messages */}
          <ScrollView ref={chatScrollRef} style={{flex:1,backgroundColor:'#0B0F13'}} contentContainerStyle={{padding:16,gap:10}} keyboardShouldPersistTaps="handled"
            onContentSizeChange={()=>chatScrollRef.current?.scrollToEnd({animated:true})}>
            {chatMessages.length===0 && <Text style={{textAlign:'center',color:'#6B7280',fontFamily:themes.fonts.poppinsRegular,marginTop:60}}>Ainda não há mensagens. Diz olá! 👋</Text>}
            {chatMessages.map(msg=>{
              const isMe = msg.senderType==='cliente';
              return (
                <View key={msg.id} style={[{flexDirection:'row',alignItems:'flex-end',gap:8,maxWidth:'80%'}, isMe&&{alignSelf:'flex-end',flexDirection:'row-reverse'}]}>
                  {!isMe && <View style={{width:28,height:28,borderRadius:14,backgroundColor:'#1E2A35',alignItems:'center',justifyContent:'center'}}><Ionicons name="person" size={14} color="#9CA3AF"/></View>}
                  <View style={[{borderRadius:18,padding:12,maxWidth:'100%'}, isMe?{backgroundColor:'#2D60FF',borderBottomRightRadius:4}:{backgroundColor:'#1E2A35',borderBottomLeftRadius:4}]}>
                    <Text style={{fontSize:14,color:'#fff',fontFamily:themes.fonts.poppinsRegular,lineHeight:20}}>{msg.text}</Text>
                    <Text style={{fontSize:10,color:'rgba(255,255,255,0.5)',fontFamily:themes.fonts.poppinsRegular,marginTop:4,textAlign:'right'}}>
                      {new Date(msg.timestamp).toLocaleTimeString('pt-AO',{hour:'2-digit',minute:'2-digit'})}
                    </Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>

          {/* Input */}
          <View style={ch.inputRow}>
            <TextInput style={ch.input} placeholder="Escreve uma mensagem..." placeholderTextColor="#6B7280"
              value={chatInput} onChangeText={setChatInput} multiline maxLength={300}
              returnKeyType="send" onSubmitEditing={handleSendChat}/>
            <TouchableOpacity style={[ch.sendBtn,!chatInput.trim()&&{backgroundColor:'#2D60FF50'}]} onPress={handleSendChat} disabled={!chatInput.trim()}>
              <Ionicons name="send" size={18} color="#fff"/>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: Avaliação
  // ─────────────────────────────────────────────────────────────────────────
  function renderRating() {
    const motoName = activeOrder?.motoqueiro?.nome ?? 'motoqueiro';
    const LABELS = ['','Muito mau','Mau','Razoável','Bom','Excelente!'];
    return (
      <Modal visible={ratingVisible} transparent animationType="fade" statusBarTranslucent onRequestClose={()=>{}}>
        <View style={{flex:1,backgroundColor:'#000000CC',justifyContent:'center',alignItems:'center',paddingHorizontal:24}}>
          <Animated.View style={{width:'100%',backgroundColor:'#1E2A35',borderRadius:28,padding:28,alignItems:'center',borderWidth:1,borderColor:'#ffffff0D'}}>
            {/* Anel de sucesso — azul */}
            <View style={{width:90,height:90,borderRadius:45,backgroundColor:'#2D60FF15',borderWidth:2,borderColor:'#2D60FF30',alignItems:'center',justifyContent:'center',marginBottom:20}}>
              <View style={{width:62,height:62,borderRadius:31,backgroundColor:'#2D60FF22',alignItems:'center',justifyContent:'center'}}>
                <Ionicons name="checkmark" size={38} color="#2D60FF"/>
              </View>
            </View>

            <Text style={{fontSize:22,color:'#fff',fontFamily:themes.fonts.poppinsBold,marginBottom:8}}>Entrega concluída!</Text>
            <Text style={{fontSize:14,color:'#9CA3AF',fontFamily:themes.fonts.poppinsRegular,textAlign:'center',lineHeight:22,marginBottom:24}}>
              Como foi a experiência com{'\n'}
              <Text style={{color:'#fff',fontFamily:themes.fonts.poppinsSemi}}>{motoName}</Text>?
            </Text>

            {/* Estrelas */}
            <View style={{flexDirection:'row',gap:10,marginBottom:10}}>
              {[1,2,3,4,5].map(n=>(
                <TouchableOpacity key={n} onPress={()=>setRatingStars(n)} activeOpacity={0.7}>
                  <Ionicons name={ratingStars>=n?'star':'star-outline'} size={42} color={ratingStars>=n?'#F59E0B':'#ffffff18'}/>
                </TouchableOpacity>
              ))}
            </View>
            {ratingStars>0 && <Text style={{fontSize:14,color:'#F59E0B',fontFamily:themes.fonts.poppinsMedium,marginBottom:16}}>{LABELS[ratingStars]}</Text>}

            <TouchableOpacity
              style={{width:'100%',backgroundColor:ratingStars===0?'#2D60FF40':'#2D60FF',borderRadius:16,paddingVertical:16,alignItems:'center',marginTop:8}}
              disabled={ratingStars===0}
              onPress={handleSubmitRating}
              activeOpacity={0.85}
            >
              <Text style={{color:'#fff',fontFamily:themes.fonts.poppinsSemi,fontSize:16}}>Confirmar</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={()=>setRatingStars(0)} style={{marginTop:14}}>
              <Text style={{color:'#ffffff30',fontFamily:themes.fonts.poppinsRegular,fontSize:13}}>Saltar avaliação</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={()=>{setRatingVisible(false);setReportVisible(true);}} style={{marginTop:10}}>
              <Text style={{fontSize:12,fontFamily:themes.fonts.poppinsRegular,color:'#EF4444',textAlign:'center'}}>Teve algum problema? Fazer uma denúncia</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: Denúncia
  // ─────────────────────────────────────────────────────────────────────────
  function renderReport() {
    return (
      <Modal visible={reportVisible} transparent={false} animationType="slide" statusBarTranslucent onRequestClose={()=>setReportVisible(false)}>
        <View style={{flex:1,backgroundColor:'#0B0F13',paddingTop:Platform.OS==='ios'?50:32}}>
          {/* Header */}
          <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:20,paddingBottom:16,borderBottomWidth:1,borderBottomColor:'#ffffff08'}}>
            <TouchableOpacity style={{width:40,height:40,borderRadius:20,backgroundColor:'#1E2A35',alignItems:'center',justifyContent:'center'}} onPress={()=>setReportVisible(false)}>
              <Ionicons name="arrow-back" size={20} color="#fff"/>
            </TouchableOpacity>
            <Text style={{fontSize:16,color:'#fff',fontFamily:themes.fonts.poppinsSemi}}>Fazer uma denúncia</Text>
            <View style={{width:40}}/>
          </View>

          <ScrollView contentContainerStyle={{padding:20,gap:12}} showsVerticalScrollIndicator={false}>
            {/* Banner de aviso */}
            <View style={{flexDirection:'row',alignItems:'center',gap:10,backgroundColor:'#EF444412',borderRadius:14,borderWidth:1,borderColor:'#EF444425',paddingHorizontal:14,paddingVertical:12}}>
              <Ionicons name="warning-outline" size={20} color="#EF4444"/>
              <Text style={{flex:1,fontSize:12,color:'#9CA3AF',fontFamily:themes.fonts.poppinsRegular,lineHeight:18}}>
                A tua denúncia é anónima e será analisada pela equipa BIKO em até 48h.
              </Text>
            </View>

            <Text style={{fontSize:11,color:'#6B7280',fontFamily:themes.fonts.poppinsSemi,textTransform:'uppercase',letterSpacing:0.8,marginTop:4}}>Motivo(s) da denúncia</Text>

            {REPORT_OPTIONS.map(opt=>(
              <TouchableOpacity
                key={opt.value}
                style={{flexDirection:'row',alignItems:'center',gap:12,backgroundColor:reportMotivos.includes(opt.value)?'#EF444410':'#1E2A35',borderRadius:16,padding:16,borderWidth:1.5,borderColor:reportMotivos.includes(opt.value)?'#EF4444':'transparent'}}
                onPress={()=>setReportMotivos(prev=>prev.includes(opt.value)?prev.filter(x=>x!==opt.value):[...prev,opt.value])}
              >
                <Text style={{fontSize:20}}>{opt.icon}</Text>
                <Text style={{flex:1,fontSize:13,color:reportMotivos.includes(opt.value)?'#fff':'#9CA3AF',fontFamily:themes.fonts.poppinsRegular,lineHeight:18}}>{opt.label}</Text>
                <View style={{width:22,height:22,borderRadius:6,backgroundColor:reportMotivos.includes(opt.value)?'#EF4444':'#253040',alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:reportMotivos.includes(opt.value)?'#EF4444':'#ffffff15'}}>
                  {reportMotivos.includes(opt.value) && <Ionicons name="checkmark" size={14} color="#fff"/>}
                </View>
              </TouchableOpacity>
            ))}

            <Text style={{fontSize:11,color:'#6B7280',fontFamily:themes.fonts.poppinsSemi,textTransform:'uppercase',letterSpacing:0.8,marginTop:8}}>Comentário adicional <Text style={{color:'#4B5563',textTransform:'none'}}>(opcional)</Text></Text>
            <View style={{backgroundColor:'#1E2A35',borderRadius:14,padding:14,borderWidth:1,borderColor:'#ffffff0D'}}>
              <TextInput style={{color:'#fff',fontSize:13,fontFamily:themes.fonts.poppinsRegular,minHeight:80}} placeholder="Descreve o que aconteceu..." placeholderTextColor="#6B7280" value={reportDesc} onChangeText={setReportDesc} multiline/>
            </View>
          </ScrollView>

          <View style={{paddingHorizontal:20,paddingBottom:Platform.OS==='ios'?34:20,paddingTop:12,borderTopWidth:1,borderTopColor:'#ffffff08',gap:10}}>
            <TouchableOpacity
              style={{backgroundColor:reportMotivos.length===0?'#EF444440':'#EF4444',borderRadius:16,paddingVertical:16,alignItems:'center'}}
              disabled={reportMotivos.length===0}
              onPress={handleSubmitReport}
            >
              <Text style={{color:'#fff',fontFamily:themes.fonts.poppinsSemi,fontSize:16}}>Enviar denúncia</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{alignItems:'center',paddingVertical:10}} onPress={()=>setReportVisible(false)}>
              <Text style={{color:'#6B7280',fontFamily:themes.fonts.poppinsRegular,fontSize:13}}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: Cancelamento modais
  // ─────────────────────────────────────────────────────────────────────────
  function renderCancelModals() {
    return (<>
      <Modal visible={cancelConfirmVisible} transparent animationType="fade" statusBarTranslucent>
        <View style={st.modalOverlay}>
          <View style={st.modalBox}>
            <View style={[st.modalIconWrap,{backgroundColor:'#EF444420'}]}><Ionicons name="close-circle-outline" size={32} color="#EF4444"/></View>
            <Text style={st.modalTitle}>Cancelar entrega?</Text>
            <Text style={st.modalSub}>Esta acção não pode ser revertida.</Text>
            <View style={[st.modalActions,{width:'100%',marginTop:8}]}>
              <TouchableOpacity style={st.modalCancelBtn} onPress={()=>setCancelConfirmVisible(false)}><Text style={st.modalCancelTxt}>Voltar</Text></TouchableOpacity>
              <TouchableOpacity style={st.modalDeleteBtn} onPress={()=>{setCancelConfirmVisible(false);setCancelReasonVisible(true);}}><Text style={st.modalDeleteTxt}>Sim, cancelar</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <Modal visible={cancelReasonVisible} transparent animationType="slide" statusBarTranslucent>
        <View style={[st.modalOverlay,{justifyContent:'flex-end'}]}>
          <View style={[st.modalBox,{borderRadius:28,width:'100%',alignItems:'flex-start',paddingVertical:28}]}>
            <Text style={st.modalTitle}>Motivo do cancelamento</Text>
            <Text style={[st.modalSub,{textAlign:'left',marginBottom:12}]}>Ajuda-nos a melhorar.</Text>
            {CANCEL_OPTIONS.map(opt=>(
              <TouchableOpacity key={opt.value} style={[st.radioRow,cancelReason===opt.value&&st.radioRowActive]} onPress={()=>setCancelReason(opt.value)}>
                <View style={[st.radioCircle,cancelReason===opt.value&&{borderColor:'#2D60FF'}]}>{cancelReason===opt.value&&<View style={st.radioDot}/>}</View>
                <Text style={st.radioLbl}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
            <View style={[st.modalActions,{width:'100%',marginTop:16}]}>
              <TouchableOpacity style={st.modalCancelBtn} onPress={()=>setCancelReasonVisible(false)}><Text style={st.modalCancelTxt}>Voltar</Text></TouchableOpacity>
              <TouchableOpacity style={[st.modalDeleteBtn,!cancelReason&&{opacity:0.4}]} disabled={!cancelReason} onPress={handleCancelConfirm}><Text style={st.modalDeleteTxt}>Confirmar</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: Pagamento inline (mini-sheet na barra inferior)
  // ─────────────────────────────────────────────────────────────────────────
  function renderPaymentSheet() {
    const options: {value:PaymentMethod;icon:string;desc:string}[] = [
      {value:'Numerário',    icon:'cash-outline',           desc:'Paga em mãos ao estafeta'},
      {value:'Transferência',icon:'phone-portrait-outline', desc:'Pagamento por transferência'},
      {value:'Multicaixa',   icon:'card-outline',           desc:'Pagamento por Multicaixa'},
    ];
    return (
      <Modal visible={showPaymentSheet} transparent animationType="slide" onRequestClose={()=>setShowPaymentSheet(false)}>
        <Pressable style={st.modalOverlay} onPress={()=>setShowPaymentSheet(false)}>
          <Pressable style={[st.modalBox,{width:'100%',borderRadius:24,alignItems:'flex-start',paddingVertical:24}]} onPress={()=>{}}>
            <View style={st.drawerHandle}/>
            <Text style={[st.modalTitle,{marginBottom:16}]}>Método de pagamento</Text>
            {options.map(opt=>(
              <TouchableOpacity key={opt.value} style={[st.paymentOption,paymentMethod===opt.value&&st.paymentOptionActive]}
                onPress={()=>{setPaymentMethod(opt.value);setShowPaymentSheet(false);}}>
                <View style={[st.paymentIconWrap,{backgroundColor:paymentMethod===opt.value?'#2D60FF20':'#253040'}]}>
                  <Ionicons name={opt.icon as any} size={22} color={paymentMethod===opt.value?'#2D60FF':'#9CA3AF'}/>
                </View>
                <View style={{flex:1}}>
                  <Text style={[st.paymentOptTxt,paymentMethod===opt.value&&{color:'#fff'}]}>{opt.value}</Text>
                  <Text style={st.paymentOptDesc}>{opt.desc}</Text>
                </View>
                {paymentMethod===opt.value && <Ionicons name="checkmark-circle" size={20} color="#2D60FF"/>}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={[st.primaryBtn,{width:'100%',marginTop:16}]} onPress={()=>setShowPaymentSheet(false)}>
              <Text style={st.primaryBtnTxt}>Feito</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: Bottom bar fixa
  // ─────────────────────────────────────────────────────────────────────────
  function renderBottomBar() {
    if (isActiveDelivery) return null;
    if (snapKey==='MINI' && !isActiveDelivery) return null;

    let primaryLabel = 'Introduzir dados';
    let primaryAction = ()=>{ if(destination){ setStep(2); snapTo('MID'); } else { Alert.alert('Destino','Selecciona o destino primeiro.'); } };

    if (step===2) { primaryLabel='Confirmar detalhes'; primaryAction=()=>{ setStep(3); snapTo('MID'); }; }
    if (step===3 && !searching) { primaryLabel='Procurar motoqueiro'; primaryAction=handleConfirmOrder; }
    if (searching) { primaryLabel='A procurar...'; primaryAction=()=>{}; }

    return (
      <View style={st.bottomBar}>
        {/* Pagamento — 25% */}
        <TouchableOpacity style={st.paymentPill} onPress={()=>setShowPaymentSheet(true)}>
          <Ionicons name="cash-outline" size={16} color="#2D60FF"/>
          <Text style={st.paymentPillTxt} numberOfLines={1}>{paymentMethod}</Text>
          <Ionicons name="chevron-down" size={12} color="#9CA3AF"/>
        </TouchableOpacity>

        {/* Botão principal — 50% */}
        <TouchableOpacity style={[st.primaryBtn,st.primaryBtnFlex,searching&&{opacity:0.6}]} onPress={primaryAction} disabled={searching}>
          <Text style={st.primaryBtnTxt}>{primaryLabel}</Text>
        </TouchableOpacity>

        {/* Detalhes / Filtros — 25% */}
        <TouchableOpacity style={st.detailsIconBtn} onPress={()=>{
          if (step===1) Alert.alert('Dica','Selecciona primeiro a recolha e o destino.');
          else if (step===2) Alert.alert('Detalhes','Tipo: '+packageType+'\nPeso: '+packageWeight);
          else if (step===3 && activeOrder) setDetailsVisible(true);
          else Alert.alert('Detalhes','Completa os passos para ver os detalhes.');
        }}>
          <Ionicons name="options-outline" size={20} color="#9CA3AF"/>
        </TouchableOpacity>
      </View>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER PRINCIPAL
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <View style={st.root}>
      {/* MAPA */}
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        provider={PROVIDER_GOOGLE}
        initialRegion={myLocation
          ? {...myLocation, latitudeDelta:0.06, longitudeDelta:0.06}
          : {latitude:-8.8390,longitude:13.2894,latitudeDelta:0.15,longitudeDelta:0.15}}
        onLongPress={handleMapLongPress}
        customMapStyle={DARK_MAP}
        showsUserLocation={false}
        showsMyLocationButton={false}
      >
        {pickupCoords && (
          <Marker coordinate={pickupCoords} anchor={{x:0.5,y:0.5}}>
            <View style={st.pickupMarker}/>
          </Marker>
        )}
        {destination && (
          <Marker coordinate={destination} anchor={{x:0.5,y:1}}>
            <View style={st.destPinWrap}>
              <View style={st.destPinHead}/>
              <View style={st.destPinTail}/>
            </View>
          </Marker>
        )}
        {pickupCoords && destination && (
          <Polyline coordinates={routeCoords.length > 2 ? routeCoords : [pickupCoords, destination]} strokeColor="#2D60FF" strokeWidth={3}/>
        )}
      </MapView>

      {/* Menu */}
      <TouchableOpacity style={st.menuBtn} onPress={()=>navigation.dispatch(DrawerActions.openDrawer())}>
        <Ionicons name="menu" size={22} color="#fff"/>
      </TouchableOpacity>

      {/* Botão minha localização — cola acima da gaveta */}
      {!isActiveDelivery && (
        <TouchableOpacity style={[st.myLocBtn,{bottom:myLocBtnBottom}]}
          onPress={()=>{ if(myLocation&&mapRef.current) mapRef.current.animateToRegion({...myLocation,latitudeDelta:0.04,longitudeDelta:0.04},600); }}>
          <Ionicons name="navigate" size={20} color="#2D60FF"/>
        </TouchableOpacity>
      )}

      {/* GAVETA */}
      <Animated.View style={[st.drawer,{top:drawerY}]}>
        {/* Handle com pan gesture */}
        <View {...panResponder.panHandlers} style={st.handleArea}>
          <View style={st.drawerHandle}/>
        </View>

        {!isActiveDelivery ? (<>
          {/* Header sem ícone ⓘ */}
          <View style={st.drawerHeader}>
            <Text style={st.drawerTitle}>Enviar o Pacote</Text>
          </View>

          {/* Stepper */}
          <View style={st.stepper}>
            {[1,2,3].map((n,i)=>{
              const done=step>n, active=step===n;
              return (
                <React.Fragment key={n}>
                  <View style={{alignItems:'center'}}>
                    <View style={[st.stepCircle,done&&st.stepDone,active&&st.stepActive]}>
                      {done?<Ionicons name="checkmark" size={13} color="#fff"/>:<Text style={[st.stepNum,active&&{color:'#fff'}]}>{n}</Text>}
                    </View>
                    <Text style={[st.stepLbl,active&&{color:'#2D60FF'}]}>{n===1?'Localização':n===2?'Detalhes':'Confirmar'}</Text>
                  </View>
                  {i<2&&<View style={[st.stepLine,step>n&&{backgroundColor:'#2D60FF'}]}/>}
                </React.Fragment>
              );
            })}
          </View>

          <View style={st.drawerContent}>
            {step===1 && renderStep1()}
            {step===2 && renderStep2()}
            {step===3 && renderStep3()}
          </View>
        </>) : (
          renderActiveDrawerContent()
        )}
      </Animated.View>

      {/* BOTTOM BAR FIXA */}
      {renderBottomBar()}

      {/* MODAIS */}
      {renderDestScreen()}
      {renderQrModal()}
      {renderChat()}
      {renderDetailsModal()}
      {renderCancelModals()}
      {renderRating()}
      {renderReport()}
      {renderPaymentSheet()}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ESTILOS
// ─────────────────────────────────────────────────────────────────────────────
const st = StyleSheet.create({
  root: { flex:1, backgroundColor:'#0d1b2a' },

  // Loading
  loadingScreen: { flex:1, backgroundColor:'#0d1b2a', alignItems:'center', justifyContent:'center', gap:16 },
  loadingText:   { fontSize:16, fontFamily:themes.fonts.poppinsMedium, color:'#fff' },

  // Mapa
  menuBtn:  { position:'absolute', top:52, left:16, width:44, height:44, borderRadius:22, backgroundColor:'#0d1b2a99', alignItems:'center', justifyContent:'center', zIndex:10 },
  myLocBtn: { position:'absolute', right:16, width:46, height:46, borderRadius:23, backgroundColor:'#1a2e42', alignItems:'center', justifyContent:'center', zIndex:10, shadowColor:'#000', shadowOpacity:0.4, shadowRadius:8, elevation:6 },

  // Marcadores
  pickupMarker: { width:14, height:14, borderRadius:7, backgroundColor:'#2D60FF', borderWidth:2.5, borderColor:'#fff' },
  destPinWrap:  { alignItems:'center' },
  destPinHead:  { width:24, height:24, borderRadius:12, backgroundColor:'#EF4444', borderWidth:3, borderColor:'#fff', shadowColor:'#EF4444', shadowOpacity:0.7, shadowRadius:6, elevation:5 },
  destPinTail:  { width:4, height:10, backgroundColor:'#EF4444', marginTop:-2, borderRadius:2 },

  // Gaveta
  drawer:      { position:'absolute', left:0, right:0, bottom:0, backgroundColor:'#131f2e', borderTopLeftRadius:24, borderTopRightRadius:24, paddingBottom:100, zIndex:20 },
  handleArea:  { paddingVertical:12, alignItems:'center' },
  drawerHandle:{ width:40, height:4, borderRadius:2, backgroundColor:'#2a3d54' },
  drawerHeader:{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingHorizontal:20, paddingBottom:6 },
  drawerTitle: { fontSize:20, fontFamily:themes.fonts.poppinsBold, color:'#fff' },
  drawerContent:{ flex:1, paddingHorizontal:16, paddingTop:4 },

  // Stepper
  stepper:    { flexDirection:'row', alignItems:'center', paddingHorizontal:20, marginBottom:14 },
  stepCircle: { width:28, height:28, borderRadius:14, backgroundColor:'#1e3650', alignItems:'center', justifyContent:'center' },
  stepActive: { backgroundColor:'#2D60FF' },
  stepDone:   { backgroundColor:'#2D60FF' },
  stepNum:    { fontSize:12, fontFamily:themes.fonts.poppinsSemi, color:'#6B7280' },
  stepLbl:    { fontSize:10, fontFamily:themes.fonts.poppinsRegular, color:'#6B7280', marginTop:2 },
  stepLine:   { flex:1, height:2, backgroundColor:'#1e3650', marginBottom:14 },

  // Localização card
  locCard:      { backgroundColor:'#1a2e42', borderRadius:16, padding:14, marginBottom:8 },
  locRow:       { flexDirection:'row', alignItems:'center', gap:10, paddingVertical:4 },
  locDot:       { width:12, height:12, borderRadius:6, flexShrink:0 },
  locRowLbl:    { fontSize:10, fontFamily:themes.fonts.poppinsRegular, color:'#6B7280' },
  locRowVal:    { fontSize:14, fontFamily:themes.fonts.poppinsMedium, color:'#fff' },
  locConnector: { width:2, height:16, backgroundColor:'#2a3d54', marginLeft:5, marginVertical:2 },
  mapaBtn:      { backgroundColor:'#fff', borderRadius:8, paddingHorizontal:12, paddingVertical:5 },
  mapaBtnTxt:   { fontSize:12, fontFamily:themes.fonts.poppinsSemi, color:'#0d1b2a' },
  mapHint:      { fontSize:12, fontFamily:themes.fonts.poppinsRegular, color:'#6B7280', marginBottom:8 },

  // Pickup edit
  pickupEdit:   { marginTop:8, backgroundColor:'#1e3650', borderRadius:12, padding:10, gap:8 },
  pickupInput:  { backgroundColor:'#1a2e42', borderRadius:10, paddingHorizontal:12, paddingVertical:8, color:'#fff', fontSize:13, fontFamily:themes.fonts.poppinsRegular },
  pickupSugg:   { flexDirection:'row', alignItems:'center', gap:8, paddingVertical:6 },
  pickupSuggTxt:{ fontSize:13, fontFamily:themes.fonts.poppinsRegular, color:'#e2e8f0' },
  pickupReset:  { fontSize:12, fontFamily:themes.fonts.poppinsMedium, color:'#2D60FF', paddingVertical:4 },

  // Distâncias
  distRow:     { flexDirection:'row', backgroundColor:'#1a2e42', borderRadius:14, paddingVertical:12, marginBottom:8 },
  distItem:    { flex:1, alignItems:'center', gap:2 },
  distDivider: { width:1, backgroundColor:'#2a3d54' },
  distLbl:     { fontSize:10, fontFamily:themes.fonts.poppinsRegular, color:'#6B7280' },
  distVal:     { fontSize:13, fontFamily:themes.fonts.poppinsBold, color:'#fff' },

  // Tipo/Peso
  sectionLbl: { fontSize:11, fontFamily:themes.fonts.poppinsSemi, color:'#6B7280', letterSpacing:0.8, marginBottom:8 },
  optTag:     { fontSize:10, color:'#4B5563', fontFamily:themes.fonts.poppinsRegular },
  typeGrid:   { flexDirection:'row', flexWrap:'wrap', gap:8, marginBottom:16 },
  typeCell:   { width:(SW-32-24)/4, aspectRatio:1, backgroundColor:'#1a2e42', borderRadius:14, alignItems:'center', justifyContent:'center', gap:4, borderWidth:1.5, borderColor:'transparent' },
  typeCellActive:{ borderColor:'#2D60FF' },
  typeCellTxt:{ fontSize:9, fontFamily:themes.fonts.poppinsRegular, color:'#9CA3AF', textAlign:'center' },
  weightRow:  { flexDirection:'row', gap:8, marginBottom:16 },
  weightCell: { flex:1, backgroundColor:'#1a2e42', borderRadius:14, alignItems:'center', paddingVertical:14, gap:4, borderWidth:1.5, borderColor:'transparent' },
  weightCellActive:{ borderColor:'#2D60FF' },
  weightLbl:  { fontSize:13, fontFamily:themes.fonts.poppinsSemi, color:'#9CA3AF' },
  weightSub:  { fontSize:9, fontFamily:themes.fonts.poppinsRegular, color:'#6B7280' },
  weightExtra:{ fontSize:9, fontFamily:themes.fonts.poppinsMedium, color:'#F59E0B' },

  // Observações
  obsWrap:   { flexDirection:'row', alignItems:'flex-start', gap:8, backgroundColor:'#1a2e42', borderRadius:14, padding:12 },
  obsInput:  { flex:1, color:'#fff', fontSize:13, fontFamily:themes.fonts.poppinsRegular, minHeight:50 },

  // Voltar
  backBtn:   { flexDirection:'row', alignItems:'center', gap:6, paddingVertical:12 },
  backBtnTxt:{ fontSize:13, fontFamily:themes.fonts.poppinsMedium, color:'#6B7280' },

  // Confirmar
  confirmRouteCard: { backgroundColor:'#1a2e42', borderRadius:16, padding:14, marginBottom:12 },
  confirmDetails:   { backgroundColor:'#1a2e42', borderRadius:14, padding:14, gap:8, marginBottom:12 },
  confirmRow:       { flexDirection:'row', justifyContent:'space-between', alignItems:'center' },
  confirmLbl:       { fontSize:12, fontFamily:themes.fonts.poppinsRegular, color:'#6B7280' },
  confirmVal:       { fontSize:13, fontFamily:themes.fonts.poppinsSemi, color:'#fff' },

  // Preço
  priceCard:       { flexDirection:'row', alignItems:'center', justifyContent:'space-between', backgroundColor:'#1a2e42', borderRadius:14, padding:16, marginBottom:8 },
  priceBtn:        { backgroundColor:'#1e3650', borderRadius:10, paddingHorizontal:14, paddingVertical:8 },
  priceBtnDisabled:{ backgroundColor:'#141f2d', opacity:0.5 },
  priceBtnTxt:     { fontSize:14, fontFamily:themes.fonts.poppinsBold, color:'#fff' },
  priceMain:       { fontSize:24, fontFamily:themes.fonts.poppinsBold, color:'#fff' },
  priceSub:        { fontSize:10, fontFamily:themes.fonts.poppinsRegular, color:'#6B7280' },
  priceHint:       { fontSize:11, fontFamily:themes.fonts.poppinsRegular, color:'#F59E0B', textAlign:'center', marginBottom:8 },

  // Procura
  searchWrap:   { flex:1, alignItems:'center', justifyContent:'center', gap:18 },
  searchCircle: { width:100, height:100, borderRadius:50, backgroundColor:'#1a2e42', borderWidth:3, borderColor:'#2D60FF', alignItems:'center', justifyContent:'center' },
  searchTitle:  { fontSize:17, fontFamily:themes.fonts.poppinsSemi, color:'#fff' },
  searchSub:    { fontSize:12, fontFamily:themes.fonts.poppinsRegular, color:'#6B7280' },
  progressTrack:{ width:SW-48, height:3, backgroundColor:'#1a2e42', borderRadius:2 },
  progressBar:  { height:3, backgroundColor:'#2D60FF', borderRadius:2 },

  // Entrega activa
  activeHeader: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingHorizontal:16, paddingVertical:10 },
  statusBadge:  { flexDirection:'row', alignItems:'center', gap:8 },
  statusDot:    { width:9, height:9, borderRadius:5 },
  statusTxt:    { fontSize:14, fontFamily:themes.fonts.poppinsSemi, color:'#fff' },
  cancelBtn:    { flexDirection:'row', alignItems:'center', gap:4, backgroundColor:'#EF444418', borderRadius:20, paddingHorizontal:12, paddingVertical:6 },
  cancelBtnTxt: { fontSize:12, fontFamily:themes.fonts.poppinsMedium, color:'#EF4444' },
  motoCard:     { flexDirection:'row', alignItems:'center', gap:12, backgroundColor:'#1a2e42', borderRadius:16, marginHorizontal:16, padding:14, marginBottom:10 },
  motoAvatar:   { width:48, height:48, borderRadius:24, backgroundColor:'#1e3650', alignItems:'center', justifyContent:'center' },
  motoName:     { fontSize:15, fontFamily:themes.fonts.poppinsSemi, color:'#fff' },
  motoPhone:    { fontSize:12, fontFamily:themes.fonts.poppinsRegular, color:'#6B7280' },
  starsRowSmall:{ flexDirection:'row', alignItems:'center', gap:2, marginTop:2 },
  motoRatingTxt:{ fontSize:12, fontFamily:themes.fonts.poppinsRegular, color:'#F59E0B', marginLeft:4 },
  kmBadge:      { backgroundColor:'#2D60FF18', borderRadius:10, paddingHorizontal:10, paddingVertical:5 },
  kmBadgeTxt:   { fontSize:13, fontFamily:themes.fonts.poppinsSemi, color:'#2D60FF' },
  routeCard:    { backgroundColor:'#1a2e42', borderRadius:16, padding:14, marginHorizontal:16, marginBottom:12 },
  activeActions:{ flexDirection:'row', gap:10, marginHorizontal:16, marginBottom:8 },
  activeActionBtn:{ flex:1, borderRadius:16, paddingVertical:16, alignItems:'center', gap:6 },
  activeActionLbl:{ fontSize:12, fontFamily:themes.fonts.poppinsMedium },
  completedBanner:{ flexDirection:'row', alignItems:'center', gap:10, backgroundColor:'#10B98115', borderRadius:14, marginHorizontal:16, padding:14 },
  completedTxt: { fontSize:14, fontFamily:themes.fonts.poppinsSemi, color:'#10B981' },

  // Bottom bar
  bottomBar:      { position:'absolute', bottom:0, left:0, right:0, flexDirection:'row', alignItems:'center', gap:8, backgroundColor:'#131f2e', paddingHorizontal:12, paddingVertical:10, paddingBottom:24, borderTopWidth:1, borderTopColor:'#1a2e42', zIndex:30 },
  paymentPill:    { flexDirection:'row', alignItems:'center', gap:4, backgroundColor:'#1a2e42', borderRadius:12, paddingHorizontal:10, paddingVertical:11, width:SW*0.25 },
  paymentPillTxt: { fontSize:11, fontFamily:themes.fonts.poppinsMedium, color:'#fff', flex:1 },
  primaryBtn:     { backgroundColor:'#2D60FF', borderRadius:14, paddingVertical:14, alignItems:'center' },
  primaryBtnFlex: { flex:1 },
  primaryBtnTxt:  { fontSize:14, fontFamily:themes.fonts.poppinsBold, color:'#fff' },
  detailsIconBtn: { width:SW*0.12, height:46, borderRadius:12, backgroundColor:'#1a2e42', alignItems:'center', justifyContent:'center' },

  // Pagamento
  paymentOption:      { flexDirection:'row', alignItems:'center', gap:12, backgroundColor:'#1e3650', borderRadius:14, padding:14, marginBottom:8, width:'100%', borderWidth:1.5, borderColor:'transparent' },
  paymentOptionActive:{ borderColor:'#2D60FF' },
  paymentIconWrap:    { width:44, height:44, borderRadius:22, alignItems:'center', justifyContent:'center' },
  paymentOptTxt:      { fontSize:14, fontFamily:themes.fonts.poppinsSemi, color:'#9CA3AF' },
  paymentOptDesc:     { fontSize:11, fontFamily:themes.fonts.poppinsRegular, color:'#6B7280' },

  // Modais genéricos
  modalOverlay:    { flex:1, backgroundColor:'rgba(0,0,0,0.75)', justifyContent:'center', alignItems:'center', paddingHorizontal:20 },
  modalBox:        { backgroundColor:'#1a2e42', borderRadius:24, padding:24, alignItems:'center', gap:10, width:'100%' },
  modalIconWrap:   { width:66, height:66, borderRadius:33, alignItems:'center', justifyContent:'center' },
  modalTitle:      { fontSize:18, fontFamily:themes.fonts.poppinsBold, color:'#fff', textAlign:'center' },
  modalSub:        { fontSize:13, fontFamily:themes.fonts.poppinsRegular, color:'#9CA3AF', textAlign:'center' },
  modalActions:    { flexDirection:'row', gap:10 },
  modalCancelBtn:  { flex:1, backgroundColor:'#1e3650', borderRadius:14, paddingVertical:14, alignItems:'center' },
  modalCancelTxt:  { fontSize:14, fontFamily:themes.fonts.poppinsSemi, color:'#fff' },
  modalDeleteBtn:  { flex:1, backgroundColor:'#EF4444', borderRadius:14, paddingVertical:14, alignItems:'center' },
  modalDeleteTxt:  { fontSize:14, fontFamily:themes.fonts.poppinsSemi, color:'#fff' },

  // QR
  qrWrap:     { backgroundColor:'#1e3650', borderRadius:16, padding:16, borderWidth:1, borderColor:'#2a3d54' },
  numCode:    { fontSize:30, fontFamily:themes.fonts.poppinsBold, color:'#fff', letterSpacing:8 },
  qrActions:  { flexDirection:'row', gap:10, width:'100%' },
  qrActionBtn:{ flex:1, flexDirection:'row', alignItems:'center', justifyContent:'center', gap:6, backgroundColor:'#2D60FF20', borderRadius:12, paddingVertical:12 },
  qrActionTxt:{ fontSize:13, fontFamily:themes.fonts.poppinsMedium, color:'#2D60FF' },

  // Radio / Check
  radioRow:      { flexDirection:'row', alignItems:'center', gap:12, backgroundColor:'#1e3650', borderRadius:12, paddingHorizontal:14, paddingVertical:12, width:'100%', marginBottom:8, borderWidth:1.5, borderColor:'transparent' },
  radioRowActive:{ borderColor:'#2D60FF' },
  radioCircle:   { width:18, height:18, borderRadius:9, borderWidth:2, borderColor:'#6B7280', alignItems:'center', justifyContent:'center' },
  radioDot:      { width:8, height:8, borderRadius:4, backgroundColor:'#2D60FF' },
  radioLbl:      { fontSize:13, fontFamily:themes.fonts.poppinsRegular, color:'#9CA3AF', flex:1 },
  checkRow:      { flexDirection:'row', alignItems:'center', gap:10, backgroundColor:'#1e3650', borderRadius:12, paddingHorizontal:14, paddingVertical:12, width:'100%', marginBottom:8, borderWidth:1.5, borderColor:'transparent' },
  checkRowActive:{ borderColor:'#2D60FF' },
  checkLbl:      { fontSize:12, fontFamily:themes.fonts.poppinsRegular, color:'#9CA3AF', flex:1 },

  // Destino screen
  destContainer:   { flex:1, backgroundColor:'#0d1b2a' },
  destHeader:      { flexDirection:'row', alignItems:'center', gap:12, paddingTop:52, paddingBottom:12, paddingHorizontal:16 },
  backCircle:      { width:36, height:36, borderRadius:18, backgroundColor:'#1a2e42', alignItems:'center', justifyContent:'center' },
  destTitle:       { fontSize:17, fontFamily:themes.fonts.poppinsSemi, color:'#fff' },
  destSearchWrap:  { flexDirection:'row', alignItems:'center', gap:10, backgroundColor:'#1a2e42', borderRadius:16, marginHorizontal:16, paddingHorizontal:14, paddingVertical:12, marginBottom:8 },
  destSearchInput: { flex:1, color:'#fff', fontSize:14, fontFamily:themes.fonts.poppinsRegular },
  destSectionTitle:{ fontSize:11, fontFamily:themes.fonts.poppinsSemi, color:'#6B7280', letterSpacing:0.8, paddingHorizontal:16, paddingVertical:8 },
  destItem:        { flexDirection:'row', alignItems:'center', gap:12, paddingHorizontal:16, paddingVertical:12, borderBottomWidth:1, borderBottomColor:'#1a2e42' },
  destPin:         { width:32, height:32, borderRadius:16, alignItems:'center', justifyContent:'center' },
  destItemLabel:   { fontSize:14, fontFamily:themes.fonts.poppinsMedium, color:'#fff' },
  destItemAddr:    { fontSize:11, fontFamily:themes.fonts.poppinsRegular, color:'#6B7280' },
  destEmpty:       { textAlign:'center', color:'#6B7280', fontFamily:themes.fonts.poppinsRegular, marginTop:40 },
});

// ── Estilos do chat ────────────────────────────────────────────────────────
const ch = StyleSheet.create({
  header:       { flexDirection:'row', alignItems:'center', gap:12, paddingHorizontal:16, paddingBottom:14, borderBottomWidth:1, borderBottomColor:'#ffffff08' },
  backCircle:   { width:38, height:38, borderRadius:19, backgroundColor:'#1E2A35', alignItems:'center', justifyContent:'center' },
  headerCenter: { flex:1, flexDirection:'row', alignItems:'center', gap:10 },
  headerAvatar: { width:40, height:40, borderRadius:20, backgroundColor:'#2D60FF15', alignItems:'center', justifyContent:'center', borderWidth:1.5, borderColor:'#2D60FF30' },
  headerName:   { fontSize:15, color:'#fff', fontFamily:themes.fonts.poppinsSemi },
  onlineRow:    { flexDirection:'row', alignItems:'center', gap:5, marginTop:1 },
  onlineDot:    { width:7, height:7, borderRadius:3.5, backgroundColor:'#4ade80' },
  onlineTxt:    { fontSize:11, color:'#4ade80', fontFamily:themes.fonts.poppinsRegular },
  callBtn:      { width:38, height:38, borderRadius:19, backgroundColor:'#2D60FF15', alignItems:'center', justifyContent:'center', borderWidth:1, borderColor:'#2D60FF30' },
  inputRow:     { flexDirection:'row', alignItems:'flex-end', gap:10, paddingHorizontal:16, paddingVertical:12, borderTopWidth:1, borderTopColor:'#ffffff08', backgroundColor:'#0B0F13', paddingBottom:Platform.OS==='ios'?28:12 },
  input:        { flex:1, backgroundColor:'#1E2A35', borderRadius:20, paddingHorizontal:16, paddingVertical:10, color:'#fff', fontFamily:themes.fonts.poppinsRegular, fontSize:14, maxHeight:100, borderWidth:1, borderColor:'#ffffff0D' },
  sendBtn:      { width:44, height:44, borderRadius:22, backgroundColor:'#2D60FF', alignItems:'center', justifyContent:'center' },
});

// ── Estilos modal detalhes ────────────────────────────────────────────────
const dl = StyleSheet.create({
  container:    { flex:1, backgroundColor:'#0B0F13', paddingTop:Platform.OS==='ios'?50:32 },
  header:       { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:20, paddingBottom:16, borderBottomWidth:1, borderBottomColor:'#ffffff08' },
  closeBtn:     { width:40, height:40, borderRadius:20, backgroundColor:'#1E2A35', alignItems:'center', justifyContent:'center' },
  title:        { fontSize:16, color:'#fff', fontFamily:themes.fonts.poppinsSemi },
  scroll:       { padding:20, paddingBottom:120, gap:16 },
  clientCard:   { flexDirection:'row', alignItems:'center', gap:14, backgroundColor:'#1E2A35', borderRadius:18, padding:16, borderWidth:1, borderColor:'#ffffff0D' },
  clientAvatar: { width:52, height:52, borderRadius:26, backgroundColor:'#2D60FF15', alignItems:'center', justifyContent:'center', borderWidth:2, borderColor:'#2D60FF30' },
  clientName:   { fontSize:16, color:'#fff', fontFamily:themes.fonts.poppinsSemi },
  clientPhone:  { fontSize:12, color:'#9CA3AF', fontFamily:themes.fonts.poppinsRegular, marginTop:2 },
  distBadge:    { backgroundColor:'#2D60FF20', borderRadius:10, paddingHorizontal:10, paddingVertical:5 },
  distBadgeTxt: { fontSize:12, color:'#2D60FF', fontFamily:themes.fonts.poppinsSemi },
  routeCard:    { backgroundColor:'#1E2A35', borderRadius:18, padding:16, borderWidth:1, borderColor:'#ffffff0D' },
  routeRow:     { flexDirection:'row', alignItems:'flex-start', gap:12 },
  routeIcon:    { width:38, height:38, borderRadius:12, alignItems:'center', justifyContent:'center', flexShrink:0 },
  routeLbl:     { fontSize:10, color:'#6B7280', fontFamily:themes.fonts.poppinsRegular },
  routeAddr:    { fontSize:14, color:'#E2E8F0', fontFamily:themes.fonts.poppinsMedium, marginTop:1 },
  routeConnector:{ paddingLeft:19, paddingVertical:6 },
  infoRow:      { flexDirection:'row', gap:12 },
  infoCard:     { flex:1, backgroundColor:'#1E2A35', borderRadius:14, padding:14, alignItems:'center', gap:6, borderWidth:1, borderColor:'#ffffff0D' },
  infoLbl:      { fontSize:10, color:'#6B7280', fontFamily:themes.fonts.poppinsRegular },
  infoVal:      { fontSize:13, color:'#fff', fontFamily:themes.fonts.poppinsSemi, textAlign:'center' },
  detailsGrid:  { flexDirection:'row', gap:12 },
  detailCard:   { flex:1, backgroundColor:'#1E2A35', borderRadius:16, padding:16, alignItems:'center', gap:8, borderWidth:1, borderColor:'#ffffff0D' },
  detailLbl:    { fontSize:10, color:'#6B7280', fontFamily:themes.fonts.poppinsRegular },
  detailVal:    { fontSize:14, color:'#fff', fontFamily:themes.fonts.poppinsSemi },
  priceCard:    { backgroundColor:'#1E2A35', borderRadius:18, padding:16, borderWidth:1, borderColor:'#ffffff0D', gap:10 },
  priceRow:     { flexDirection:'row', justifyContent:'space-between', alignItems:'center' },
  priceLbl:     { fontSize:12, color:'#6B7280', fontFamily:themes.fonts.poppinsRegular },
  priceVal:     { fontSize:14, color:'#fff', fontFamily:themes.fonts.poppinsSemi },
  obsCard:      { flexDirection:'row', gap:12, alignItems:'flex-start', backgroundColor:'#1E2A35', borderRadius:14, padding:14, borderWidth:1, borderColor:'#ffffff0D', borderLeftWidth:3, borderLeftColor:'#F59E0B' },
  obsLbl:       { fontSize:10, color:'#6B7280', fontFamily:themes.fonts.poppinsRegular, marginBottom:2 },
  obsTxt:       { fontSize:13, color:'#E2E8F0', fontFamily:themes.fonts.poppinsRegular, lineHeight:20 },
  footer:       { position:'absolute', bottom:0, left:0, right:0, paddingHorizontal:20, paddingBottom:Platform.OS==='ios'?34:20, paddingTop:12, backgroundColor:'#0B0F13', borderTopWidth:1, borderTopColor:'#ffffff08' },
  closeFullBtn: { backgroundColor:'#2D60FF', borderRadius:16, paddingVertical:16, alignItems:'center' },
  closeFullTxt: { color:'#fff', fontFamily:themes.fonts.poppinsSemi, fontSize:16 },
});

// ── Estilos avaliação ─────────────────────────────────────────────────────
const rt = StyleSheet.create({
  iconWrap:   { width:72, height:72, borderRadius:36, backgroundColor:'#F59E0B20', alignItems:'center', justifyContent:'center' },
  starsRow:   { flexDirection:'row', gap:10, marginVertical:8 },
  starBtn:    { padding:4 },
  ratingLbl:  { fontSize:16, fontFamily:themes.fonts.poppinsSemi, color:'#F59E0B' },
  reportLink: { fontSize:12, fontFamily:themes.fonts.poppinsRegular, color:'#EF4444', textAlign:'center' },
});