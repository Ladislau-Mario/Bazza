# MÓDULO MÓVEL (React Native / Expo) — Explicação Linha por Linha

A aplicação móvel é construída com React Native + Expo. Tem duas "faces":
- **Cliente**: Drawer navigation (Home, Perfil, Histórico, Notificações)
- **Entregador**: Bottom Tabs navigation (Home, Documentos, Planos, Perfil)

---

## 1. Serviço de API — `api/api.ts`

Configura o Axios (cliente HTTP) para comunicar com o backend.

```typescript
// Axios → biblioteca HTTP para React Native (similar ao fetch, mas com mais funcionalidades)
import axios, { AxiosInstance, AxiosError } from 'axios';
// Função para obter o token Firebase do utilizador autenticado
import { getIdToken } from '../firebase-token';

// URL base do backend
// EXPO_PUBLIC_API_URL → variável de ambiente do Expo (definida em .env)
// Se não existir, usa o IP local da máquina de desenvolvimento
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.43.220:3000';

// Cria uma instância do Axios com configurações padrão
const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,  // Todas as URLs serão relativas a este base
  timeout: 30000,     // Timeout de 30 segundos
});

// ═══════════════════════════════════════════════════════════
// INTERCEPTOR DE REQUEST — Executa ANTES de cada pedido
// ═══════════════════════════════════════════════════════════
api.interceptors.request.use(async (config) => {
  // Obtém o token Firebase do utilizador autenticado
  const token = await getIdToken();
  if (token) {
    // Adiciona o token ao header Authorization
    // Formato: "Bearer <token_jwt>"
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Se os dados são FormData (upload de ficheiro):
  // NÃO define Content-Type manualmente — o axios define automaticamente
  // como multipart/form-data com o boundary correto
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  } else {
    // Para pedidos normais JSON
    config.headers['Content-Type'] = 'application/json';
  }

  return config;
});

// ═══════════════════════════════════════════════════════════
// INTERCEPTOR DE RESPONSE — Executa DEPOIS de cada resposta
// ═══════════════════════════════════════════════════════════
api.interceptors.response.use(
  (res) => res,  // Se sucesso, retorna normalmente
  (error: AxiosError) => {
    // Extrai a mensagem de erro da resposta ou da exceção
    const msg = (error.response?.data as any)?.message || error.message;
    // Log no console para debug
    console.warn(`[API] ${error.config?.method?.toUpperCase()} ${error.config?.url} → ${msg}`);
    // Rejeita a promise para que o chamador possa tratar o erro
    return Promise.reject(error);
  },
);

export default api;
```

---

## 2. Token Firebase — `firebase-token.ts`

```typescript
// auth → instância do Firebase Auth inicializada em firebaseConfig.ts
import { auth } from '../../../../firebaseConfig';

/**
 * Retorna o ID Token Firebase do utilizador autenticado.
 * O ID Token é um JWT que o backend pode verificar.
 * Retorna null se o utilizador não estiver autenticado.
 */
export async function getIdToken(): Promise<string | null> {
  try {
    // auth.currentUser → O utilizador Firebase atualmente autenticado
    // Pode ser null se o utilizador ainda não fez login
    // OU se o Firebase ainda não restaurou a sessão (por isso usamos onAuthStateChanged noutros sítios)
    const user = auth.currentUser;
    if (!user) return null;

    // user.getIdToken() → Gera um JWT assinado pelo Firebase
    // O token expira em ~1 hora, mas o Firebase renova automaticamente
    return await user.getIdToken();
  } catch {
    return null;
  }
}
```

---

## 3. Serviço Socket — `socket.ts`

Gere a conexão Socket.io com o backend para comunicação em tempo real.

```typescript
import { io, Socket } from 'socket.io-client';  // Cliente Socket.io
import { getIdToken } from './firebase-token';
import { auth } from '../../../../firebaseConfig';

// URL do socket: base URL + namespace /chat
const SOCKET_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://192.168.43.220:3000') + '/chat';

// Socket singleton — só existe uma instância
let socket: Socket | null = null;

// Contador de referências — controla quando desconectar
// Vários hooks podem precisar do socket simultaneamente
// Só desconecta quando o refCount chega a 0
let refCount = 0;

// ═══════════════════════════════════════════════════════════
// waitForAuth — Espera o Firebase estar pronto
// ═══════════════════════════════════════════════════════════
// O Firebase restaura a sessão ASSINCRONAMENTE no arranque da app
// auth.currentUser pode ser null mesmo que o utilizador já tenha feito login antes
function waitForAuth(): Promise<string> {
  return new Promise((resolve, reject) => {
    const user = auth.currentUser;
    if (user) {
      resolve(user.uid);
      return;
    }
    // Timeout de 10 segundos — se não autenticar em 10s, rejeita
    const timeout = setTimeout(() => {
      unsubscribe();
      reject(new Error('[Socket] Auth timeout'));
    }, 10000);

    // onAuthStateChanged → callback chamado quando o estado de auth muda
    const unsubscribe = auth.onAuthStateChanged((u) => {
      if (u) {
        clearTimeout(timeout);
        unsubscribe();  // Remove o listener para não chamar de novo
        resolve(u.uid);
      }
    });
  });
}

// ═══════════════════════════════════════════════════════════
// getSocket — Obtém (ou cria) a conexão socket
// ═══════════════════════════════════════════════════════════
export async function getSocket(): Promise<Socket> {
  // Se já existe socket, incrementa o refCount e retorna
  if (socket) {
    refCount++;
    return socket;
  }

  // Espera o Firebase estar pronto
  const userId = await waitForAuth();
  const token = await getIdToken();

  // Cria a conexão Socket.io
  socket = io(SOCKET_URL, {
    auth: { token, userId },      // Envia token + userId na handshake
    transports: ['websocket'],    // Usa WebSocket puro (não polling)
    reconnection: true,            // Reconecta automaticamente se perder conexão
    reconnectionAttempts: 10,      // Máximo 10 tentativas
    reconnectionDelay: 2000,       // 2 segundos entre tentativas
  });

  if (!socket) throw new Error('[Socket] io() returned null');

  // Evento: quando conecta com sucesso
  socket.on('connect', () => {
    console.log('[Socket] Connected:', socket?.id);
    if (userId) {
      // Emite 'user:join' para entrar na sala pessoal no backend
      socket?.emit('user:join', { userId });
    }
  });

  // Evento: quando desconecta
  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason);
  });

  // Evento: erro de conexão
  socket.on('connect_error', (err) => {
    console.warn('[Socket] Connection error:', err?.message || err);
  });

  refCount++;  // Primeira referência
  return socket;
}

// ═══════════════════════════════════════════════════════════
// releaseSocket — Liberta uma referência
// ═══════════════════════════════════════════════════════════
// Cada hook que chama getSocket() deve chamar releaseSocket() no cleanup
export function releaseSocket() {
  refCount = Math.max(0, refCount - 1);
  // Se não há mais referências → desconecta
  if (refCount === 0 && socket) {
    socket.disconnect();
    socket = null;
  }
}

// Desconexão forçada (ex: logout)
export function disconnectSocket() {
  refCount = 0;
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

// Versão síncrona — retorna null se não existe socket
export function getSocketSync(): Socket | null {
  return socket;
}
```

---

## 4. Splash Screen — `splash.tsx`

Primeira tela que o utilizador vê. Verifica se já está autenticado.

```typescript
export default function SplashScreen() {
  const navigation = useNavigation();

  useEffect(() => {
    // onAuthStateChanged → O Firebase restaura a sessão ASSINCRONAMENTE
    // NUNCA usar auth.currentUser diretamente (pode ser null mesmo com sessão ativa)
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        // Não autenticado → vai para Onboarding
        navigation.reset({ index: 0, routes: [{ name: 'Onboarding' }] });
        return;
      }

      try {
        // Busca o perfil do backend para saber o role
        const res = await api.get('/auth/perfil');
        const userData = res.data;

        // Se é admin → não pode usar a app móvel
        if (userData.role === 'admin') {
          await auth.signOut();
          Alert.alert('Erro', 'Administradores devem usar o painel web');
          navigation.reset({ index: 0, routes: [{ name: 'Onboarding' }] });
          return;
        }

        // Se é entregador → verificar status
        if (userData.role === 'deliver') {
          const deliverRes = await api.get('/motoqueiros/meu-perfil');
          const deliver = deliverRes.data;

          if (deliver.status === 'pendente_aprovacao') {
            navigation.reset({ index: 0, routes: [{ name: 'PendingApproval' }] });
            return;
          }
          if (deliver.status === 'suspenso') {
            navigation.reset({ index: 0, routes: [{ name: 'Suspended' }] });
            return;
          }

          navigation.reset({ index: 0, routes: [{ name: 'DeliverHomeTab' }] });
          return;
        }

        // Se é cliente
        navigation.reset({ index: 0, routes: [{ name: 'ClientHome' }] });
      } catch (err) {
        // Erro na API → vai para Onboarding
        navigation.reset({ index: 0, routes: [{ name: 'Onboarding' }] });
      }
    });

    // Cleanup: remove o listener quando o componente desmonta
    return () => unsubscribe();
  }, []);

  return <LoadingSpinner />;
}
```

---

## 5. Login com Telefone — `withNumber.tsx`

```typescript
export default function WithNumber() {
  const [telefone, setTelefone] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  const enviarCodigo = async () => {
    // Valida formato: 9 dígitos começando com 9
    if (!/^9\d{8}$/.test(telefone)) {
      Alert.alert('Erro', 'Número inválido. Formato: 9XXXXXXXX');
      return;
    }

    setLoading(true);
    try {
      // POST /auth/telefone/enviar-otp
      const res = await api.post('/auth/telefone/enviar-otp', { telefone });

      // Em DEV, mostra o código num alert (para facilitar testes)
      if (res.data.codigoTeste) {
        Alert.alert('DEV', `Código: ${res.data.codigoTeste}`);
      }

      // Navega para a tela de verificação
      navigation.navigate('VerificationNumber', { phoneNumber: telefone });
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível enviar o código');
    } finally {
      setLoading(false);
    }
  };

  return (
    <TextInput
      value={telefone}
      onChangeText={setTelefone}
      placeholder="9XXXXXXXX"
      keyboardType="phone-pad"
      maxLength={9}
    />
  );
}
```

---

## 6. Verificação OTP — `verification.tsx`

```typescript
export default function Verification({ route }) {
  const { phoneNumber } = route.params;
  const [codigo, setCodigo] = useState('');

  const verificar = async () => {
    try {
      // POST /auth/telefone/verificar-otp
      const res = await api.post('/auth/telefone/verificar-otp', {
        telefone: phoneNumber,
        codigo,
      });

      const { firebaseCustomToken, isNewUser, user } = res.data;

      // Faz login no Firebase com o custom token
      // Isto é necessário para obter um Firebase ID Token
      // que o backend usa para autenticar os pedidos seguintes
      await firebase.auth().signInWithCustomToken(firebaseCustomToken);

      // Navega conforme o estado do utilizador
      if (isNewUser || !user.role) {
        // Novo utilizador → escolher se é cliente ou entregador
        navigation.navigate('UserMode');
      } else if (user.role === 'deliver') {
        navigation.reset({ index: 0, routes: [{ name: 'DeliverHomeTab' }] });
      } else {
        navigation.reset({ index: 0, routes: [{ name: 'ClientHome' }] });
      }
    } catch (err) {
      Alert.alert('Erro', 'Código incorreto ou expirado');
    }
  };
}
```

---

## 7. Hook useDelivery — `useDelivery.ts`

Gere toda a experiência do cliente durante uma entrega.

```typescript
export function useDelivery() {
  const [pedido, setPedido] = useState(null);
  const [motoqueiro, setMotoqueiro] = useState(null);

  // ═══════════════════════════════════════════════════════════
  // CONFIRMAR PEDIDO
  // ═══════════════════════════════════════════════════════════
  const confirmOrder = async (dados) => {
    // POST /pedidos com coordenadas, tipo, peso, distância
    const res = await api.post('/pedidos', dados);
    setPedido(res.data);

    // Iniciar polling (verificar estado a cada 4 segundos)
    startPolling(res.data.id);
  };

  // ═══════════════════════════════════════════════════════════
  // POLLING — Verifica o estado do pedido periodicamente
  // ═══════════════════════════════════════════════════════════
  const startPolling = (pedidoId) => {
    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/pedidos/${pedidoId}`);
        setPedido(res.data);

        // Se o pedido foi entregue ou cancelado, para o polling
        if (['entregue', 'cancelado'].includes(res.data.status)) {
          clearInterval(interval);
        }
      } catch {}
    }, 4000); // A cada 4 segundos

    // Guarda o interval para poder limpar no cleanup
    return () => clearInterval(interval);
  };

  // ═══════════════════════════════════════════════════════════
  // SOCKET — Ouve atualizações em tempo real
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    let mounted = true;

    const setup = async () => {
      const s = await getSocket();

      // Junta-se à sala do pedido para receber atualizações
      s.emit('order:join', { pedidoId: pedido?.id });

      // Ouve atualizações de status
      s.on('order:status_update', (data) => {
        if (mounted) {
          setPedido(prev => ({ ...prev, ...data }));
        }
      });
    };

    setup();

    // Cleanup: liberta o socket quando o componente desmonta
    return () => {
      mounted = false;
      releaseSocket();
    };
  }, [pedido?.id]);

  // ═══════════════════════════════════════════════════════════
  // CONFIRMAR ENTREGA COM CÓDIGO
  // ═══════════════════════════════════════════════════════════
  const completeDelivery = async (codigo) => {
    await api.patch(`/pedidos/${pedido.id}/confirmar-entrega`, { codigo });
  };

  // ═══════════════════════════════════════════════════════════
  // AVALIAR ENTREGADOR
  // ═══════════════════════════════════════════════════════════
  const submitRating = async (nota, comentario) => {
    await api.post(`/pedidos/${pedido.id}/avaliar`, { nota, comentario });
  };

  // ═══════════════════════════════════════════════════════════
  // CANCELAR PEDIDO
  // ═══════════════════════════════════════════════════════════
  const cancelOrder = async (motivo) => {
    await api.patch(`/pedidos/${pedido.id}/cancelar`, { motivo });
  };

  return { pedido, confirmOrder, completeDelivery, submitRating, cancelOrder };
}
```

---

## 8. Hook useDeliverFlow — `useDeliverFlow.ts`

Gere toda a experiência do entregador: receber pedidos, aceitar, entregar.

```typescript
export function useDeliverFlow() {
  const [phase, setPhase] = useState('idle');  // idle/orders/pickup/delivery
  const [pedidosDisponiveis, setPedidosDisponiveis] = useState([]);
  const [pedidoAtivo, setPedidoAtivo] = useState(null);

  // ═══════════════════════════════════════════════════════════
  // SOCKET — Ouve novos pedidos e atualizações
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    let mounted = true;

    const setup = async () => {
      const s = await getSocket();

      // Novo pedido disponível
      s.on('order:new', (novoPedido) => {
        if (mounted) {
          setPedidosDisponiveis(prev => [...prev, novoPedido]);
          Vibration.vibrate(500);  // Vibra o telemóvel
        }
      });

      // Atualização de status do pedido ativo
      s.on('order:status_update', (data) => {
        if (mounted && pedidoAtivo?.id === data.id) {
          setPedidoAtivo(data);
        }
      });

      // Mensagem de chat recebida
      s.on('chat:received', (msg) => {
        if (mounted) {
          // Adiciona mensagem ao estado do chat
          setMensagensChat(prev => [...prev, msg]);
        }
      });
    };

    setup();

    return () => {
      mounted = false;
      releaseSocket();
    };
  }, []);

  // ═══════════════════════════════════════════════════════════
  // TOGGLE ONLINE/OFFLINE
  // ═══════════════════════════════════════════════════════════
  const handleToggleOnline = async () => {
    const novoStatus = statusDisponibilidade === 'online' ? 'offline' : 'online';

    // PATCH /motoqueiros/status — altera disponibilidade
    await api.patch('/motoqueiros/status', { status: novoStatus });

    // Se ficou online, atualiza a localização GPS
    if (novoStatus === 'online') {
      const location = await Location.getCurrentPositionAsync({});
      await api.patch('/motoqueiros/localizacao', {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    }

    setStatusDisponibilidade(novoStatus);
  };

  // ═══════════════════════════════════════════════════════════
  // ACEITAR PEDIDO
  // ═══════════════════════════════════════════════════════════
  const handleAcceptOrder = async (pedidoId) => {
    // PATCH /pedidos/:id/aceitar
    await api.patch(`/pedidos/${pedidoId}/aceitar`);

    // Move o pedido de "disponíveis" para "ativo"
    const pedido = pedidosDisponiveis.find(p => p.id === pedidoId);
    setPedidoAtivo(pedido);
    setPedidosDisponiveis(prev => prev.filter(p => p.id !== pedidoId));
    setPhase('pickup');  // Muda para fase de recolha
  };

  // ═══════════════════════════════════════════════════════════
  // RECOLHER ENCOMENDA
  // ═══════════════════════════════════════════════════════════
  const handlePickupComplete = async () => {
    // PATCH /pedidos/:id/status com status: recolhido
    await api.patch(`/pedidos/${pedidoAtivo.id}/status`, { status: 'recolhido' });
    setPhase('delivery');  // Muda para fase de entrega
  };

  // ═══════════════════════════════════════════════════════════
  // CONFIRMAR ENTREGA
  // ═══════════════════════════════════════════════════════════
  const handleConfirmDelivery = async (codigo) => {
    // PATCH /pedidos/:id/confirmar-entrega
    await api.patch(`/pedidos/${pedidoAtivo.id}/confirmar-entrega`, { codigo });
    setPedidoAtivo(null);
    setPhase('idle');
  };

  return {
    phase, pedidosDisponiveis, pedidoAtivo,
    handleToggleOnline, handleAcceptOrder, handlePickupComplete, handleConfirmDelivery,
  };
}
```

---
