# MÓDULO ADMIN (Next.js / Chakra UI) — Explicação Linha por Linha

O painel admin é uma aplicação Next.js com Chakra UI. Usa Server-Side Rendering (SSR) para melhor performance.
Comunica com o backend via Axios + JWT token guardado em localStorage.

---

## 1. Serviço de API — `services/api.ts`

```typescript
import axios from 'axios';

// Cria instância do Axios
// NEXT_PUBLIC_API_URL → variável de ambiente do Next.js (definida em .env.local)
// Se não existir, usa localhost:3000
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
});

// Interceptor de request — injeta o token admin em todos os pedidos
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    // localStorage só existe no browser (não no servidor SSR)
    // typeof window !== 'undefined' → verifica se está no browser
    const token = localStorage.getItem('baza_admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});
```

---

## 2. AuthImage — Componente de Imagem com Autenticação

```typescript
"use client";  // Necessário no Next.js App Router — diz que este componente roda no browser (não no servidor)

import { useState, useEffect } from "react";
import { Image, ImageProps, Spinner, Center } from "@chakra-ui/react";
import { api } from "@/services/api";

// Props estendem ImageProps do Chakra + adicionam 'url'
interface AuthImageProps extends Omit<ImageProps, "src"> {
  url?: string;  // Caminho da API (ex: /admin/documentos/:id/imagem)
}

/**
 * Por que este componente existe?
 * O <img> HTML normal NÃO pode enviar headers de autenticação.
 * O backend /admin/documentos/:id/imagem requer JWT auth.
 * Solução: faz o fetch via Axios (que tem o interceptor com token),
 * converte a resposta em blob URL, e usa como src da imagem.
 */
export function AuthImage({ url, ...props }: AuthImageProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!url) return;     // Sem URL → não faz nada
    setError(false);       // Reset do erro
    setBlobUrl(null);      // Reset da imagem

    let revoked = false;   // Flag para evitar atualizar estado após desmontar
    let objectUrl: string | null = null;

    // Faz o pedido com autenticação
    api
      .get(url, { responseType: "blob" })  // responseType: "blob" → resposta como dados binários
      .then((res) => {
        if (revoked) return;  // Componente já desmontou
        // Cria uma URL a partir do blob
        // Ex: "blob:http://localhost:3000/abc123"
        objectUrl = URL.createObjectURL(res.data);
        setBlobUrl(objectUrl);
      })
      .catch(() => {
        if (!revoked) setError(true);  // Marca erro para mostrar placeholder
      });

    // Cleanup: quando o componente desmonta ou a URL muda
    return () => {
      revoked = true;
      // Liberta a memória do blob URL
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url]);  // Re-executa quando a URL muda

  // Se não tem URL ou deu erro → mostra placeholder
  if (!url || error) {
    return (
      <Image
        src="https://via.placeholder.com/400x180?text=Sem+imagem"
        {...props}
      />
    );
  }

  // Se ainda está a carregar → mostra spinner
  if (!blobUrl) {
    return (
      <Center h={props.h || "180px"} w={props.w || "100%"}>
        <Spinner size="sm" />
      </Center>
    );
  }

  // Imagem carregada com sucesso
  return <Image src={blobUrl} {...props} />;
}
```

---

## 3. LoginContext — Contexto de Autenticação Admin

```typescript
"use client";
import { createContext, ReactNode, useEffect, useState } from "react";
import { api } from "@/services/api";

interface LoginContextData {
  user: IUser | null;
  isAuthenticated: boolean;
  login: (telefone: string) => Promise<void>;
  logout: () => void;
}

export const LoginContext = createContext<LoginContextData>({} as LoginContextData);

export function LoginProvider({ children }: LoginProviderProps) {
  const [user, setUser] = useState<IUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // ═══════════════════════════════════════════════════════════
  // RESTAURAR SESSÃO — quando a página recarrega
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    // Lê o token e o user do localStorage
    const token = localStorage.getItem("baza_admin_token");
    const storedUser = localStorage.getItem("baza_admin_user");

    if (token && storedUser) {
      try {
        // Converte a string JSON de volta para objeto
        setUser(JSON.parse(storedUser));
        setIsAuthenticated(true);
      } catch {
        // Se o JSON estiver corrompido, limpa
        localStorage.removeItem("baza_admin_token");
        localStorage.removeItem("baza_admin_user");
      }
    }
  }, []);

  // ═══════════════════════════════════════════════════════════
  // LOGIN
  // ═══════════════════════════════════════════════════════════
  async function login(telefone: string) {
    // POST /auth/admin-login → retorna { token, user }
    const res = await api.post("/auth/admin-login", { telefone });
    const { token, user: userData } = res.data;

    // Guarda no localStorage para persistir entre sessões
    localStorage.setItem("baza_admin_token", token);
    localStorage.setItem("baza_admin_user", JSON.stringify(userData));

    setUser(userData);
    setIsAuthenticated(true);
  }

  // ═══════════════════════════════════════════════════════════
  // LOGOUT
  // ═══════════════════════════════════════════════════════════
  function logout() {
    localStorage.removeItem("baza_admin_token");
    localStorage.removeItem("baza_admin_user");
    setUser(null);
    setIsAuthenticated(false);
  }

  return (
    <LoginContext.Provider value={{ user, isAuthenticated, login, logout }}>
      {children}
    </LoginContext.Provider>
  );
}
```

---

## 4. Dashboard — `dashboard/index.tsx`

```typescript
export function MainDashboard() {
  // Obtém dados do DashboardContext
  const { pedidos, entregadoresPendentes, ticketsAbertos } = useDashboard();

  // ═══════════════════════════════════════════════════════════
  // CÁLCULOS DERIVADOS (useMemo para performance)
  // ═══════════════════════════════════════════════════════════

  // Total de pedidos entregues
  const totalPedidos = useMemo(() =>
    pedidos.filter(p => p.status === 'entregue').length,
    [pedidos]
  );

  // Fatura total (soma de todos os valores de entrega)
  const fatura = useMemo(() =>
    pedidos.reduce((sum, p) => sum + Number(p.valorEntrega), 0),
    [pedidos]
  );

  // Dados para o gráfico de barras (receita por mês)
  const dadosReceita = useMemo(() => {
    // Cria array de 12 meses (Jan-Dez)
    const meses = Array(12).fill(0);
    pedidos.forEach(p => {
      if (p.status === 'entregue' && p.entregueEm) {
        const mes = new Date(p.entregueEm).getMonth(); // 0-11
        meses[mes] += Number(p.valorEntrega);
      }
    });
    return meses;
  }, [pedidos]);

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════

  return (
    <Grid templateColumns="repeat(3, 1fr)" templateRows="repeat(2, minmax(340px, 440px))" gap={5}>

      {/* Card com gráfico de barras — Fatura Total */}
      <GridItem colSpan={2}>
        <DashboardCard title="Total de Fatura" value={fatura}>
          <Chart
            options={getBarOptions()}
            series={[{ name: "Receita", data: dadosReceita }]}
            type="bar"
            height={320}  // Altura fixa em pixels (ApexCharts não suporta %)
          />
        </DashboardCard>
      </GridItem>

      {/* Card com semicírculo — Estados das Entregas */}
      <GridItem>
        <DashboardCard title="Estados das Entregas">
          <Chart
            options={getRadialBarOptions()}
            series={[
              // Percentagem de pedidos concluídos
              Math.round((pedidos.filter(p => p.status === 'entregue').length / Math.max(pedidos.length, 1)) * 100),
              // Percentagem em andamento
              Math.round((pedidos.filter(p => EM_ANDAMENTO.includes(p.status)).length / Math.max(pedidos.length, 1)) * 100),
              // Percentagem cancelados
              Math.round((pedidos.filter(p => p.status === 'cancelado').length / Math.max(pedidos.length, 1)) * 100),
            ]}
            type="radialBar"
            height="260px"
          />
        </DashboardCard>
      </GridItem>

    </Grid>
  );
}
```

---

## 5. DashboardCard — Card Reutilizável

```typescript
interface DashboardCardProps {
  title: string;        // Título do card
  value?: any;          // Valor principal (ex: "1.500 Kz")
  isBalance?: boolean;  // Se é um valor monetário (formata com "Kz")
  children?: ReactNode; // Conteúdo (gráficos, tabelas, etc.)
}

export function DashboardCard({ title, value, isBalance = true, children }: DashboardCardProps) {
  return (
    <Flex bg="bg.card" border="2px" borderColor="border.default" rounded="lg" p={6}
          direction="column" justifyContent="space-between" h="100%">

      {/* Título + Valor */}
      <Flex justifyContent="space-between" alignItems="flex-start" mb={4}>
        <Text fontWeight="bold" fontSize="md" color="text.secondary">{title}</Text>
        {value !== undefined && (
          // Formata o valor com separador de milhares e "Kz"
          <Text fontSize="2xl" fontWeight="bold" color="text.primary">
            {isBalance
              ? value.toLocaleString("pt-AO").concat(" Kz")  // Ex: "1.500 Kz"
              : value                                           // Ex: "42" (sem moeda)
            }
          </Text>
        )}
      </Flex>

      {/* Conteúdo do card (gráfico, tabela, etc.) */}
      <Box flex={1} minH={0}>
        {children}
      </Box>
    </Flex>
  );
}
```

---

## 6. Notifications List — `notifications/index.tsx`

```typescript
export function MainNotifications() {
  // ═══════════════════════════════════════════════════════════
  // BUSCAR NOTIFICAÇÕES REAIS DO BACKEND
  // ═══════════════════════════════════════════════════════════
  const { data: notificacoes, isLoading } = useQuery({
    queryKey: ['notificacoes'],
    queryFn: async () => {
      // GET /notificacoes → retorna array de Notificacao[]
      const res = await api.get('/notificacoes');
      return res.data;
    },
    refetchInterval: 15_000,  // Atualiza a cada 15 segundos
  });

  // ═══════════════════════════════════════════════════════════
  // MARCAR COMO LIDA
  // ═══════════════════════════════════════════════════════════
  const marcarComoLida = async (id: string) => {
    // PATCH /notificacoes/:id/lida → marca lida=true na BD
    await api.patch(`/notificacoes/${id}/lida`);
    // Atualiza o estado local para feedback imediato
    setLidas(prev => new Set([...prev, id]));
  };

  // ═══════════════════════════════════════════════════════════
  // RENDER — Cada notificação como um card
  // ═══════════════════════════════════════════════════════════
  return visiveis.map(noti => {
    const config = tipoConfig[noti.tipo] || tipoConfig.sistema;
    const estaLida = noti.lida || lidas.has(noti.id);

    return (
      <Flex key={noti.id} bg={estaLida ? "transparent" : "brand.900"} /* ... */>
        {/* Ícone colorido por tipo */}
        <Flex rounded="full" p={3} bg={config.bg}>
          <RiNotification3Line color="white" />
        </Flex>

        {/* Título + Tag do tipo */}
        <Text fontWeight="semibold">{noti.titulo}</Text>
        <Tag colorScheme={config.bg.replace('.500', '')}>{config.label}</Tag>

        {/* Mensagem (não descrição!) */}
        <Text noOfLines={2}>{noti.mensagem}</Text>

        {/* Tempo relativo */}
        <Text>{formatarTempo(noti.criadoEm)}</Text>
      </Flex>
    );
  });
}
```

---

## 7. Send Notification — `notifications/send/index.tsx`

```typescript
export function MainSendNotification() {
  const [destinatario, setDestinatario] = useState('todos'); // todos/clientes/motoqueiros/especifico
  const [titulo, setTitulo] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [tipo, setTipo] = useState('info'); // info/promo/alert

  // ═══════════════════════════════════════════════════════════
  // BUSCAR UTILIZADORES (para seleção específica)
  // ═══════════════════════════════════════════════════════════
  const { data: users } = useQuery({
    queryKey: ['notifUsers'],
    queryFn: async () => {
      const res = await api.get('/admin/utilizadores');
      return res.data;
    },
    enabled: hasToken,  // Só busca se estiver autenticado
  });

  // ═══════════════════════════════════════════════════════════
  // ENVIAR NOTIFICAÇÃO
  // ═══════════════════════════════════════════════════════════
  const handleEnviar = async () => {
    if (!titulo.trim() || !mensagem.trim()) {
      toast({ title: "Preencha o título e a mensagem", status: "warning" });
      return;
    }

    try {
      if (destinatario === 'todos') {
        // POST /notificacoes/enviar-todos → envia para TODOS os utilizadores
        await api.post("/notificacoes/enviar-todos", { titulo, mensagem, tipo });

      } else if (destinatario === 'clientes') {
        // POST /notificacoes/enviar-grupo → envia para utilizadores com role=client
        await api.post("/notificacoes/enviar-grupo", { role: "client", titulo, mensagem, tipo });

      } else if (destinatario === 'motoqueiros') {
        // POST /notificacoes/enviar-grupo → envia para utilizadores com role=deliver
        await api.post("/notificacoes/enviar-grupo", { role: "deliver", titulo, mensagem, tipo });

      } else if (destinatario === 'especifico') {
        // POST /notificacoes/enviar → envia para IDs específicos
        await api.post("/notificacoes/enviar", { userIds: selecionados, titulo, mensagem, tipo });
      }

      toast({ title: "Notificação enviada!", status: "success" });
      // Limpar formulário
      setTitulo(''); setMensagem(''); setTipo('info');
    } catch (err) {
      toast({ title: "Erro ao enviar", description: err.response?.data?.message, status: "error" });
    }
  };
}
```

---

## 8. chartsConfig.ts — Configuração dos Gráficos ApexCharts

```typescript
// Opções base para TODOS os gráficos
function baseChartOptions(cor: string) {
  return {
    chart: {
      toolbar: false,       // Remove a barra de ferramentas (zoom, download, etc.)
      zoom: { enabled: false },
      background: 'transparent',
      width: '100%',
    },
    grid: { show: false },  // Remove a grelha de fundo
    dataLabels: { enabled: false },  // Remove os valores em cima das barras
    stroke: { curve: 'smooth', width: 2 },  // Linhas suaves

    // Eixo X — meses
    xaxis: {
      categories: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
      labels: { style: { colors: '#718096', fontSize: '11px' } },
    },

    // Tema — lê o atributo data-theme do HTML (dark ou light)
    theme: {
      mode: document.documentElement.getAttribute('data-theme') || 'dark',
    },
  };
}

// Gráfico de barras (receita mensal)
function getBarOptions() {
  return {
    ...baseChartOptions('#00B5D8'),
    plotOptions: {
      bar: {
        borderRadius: 6,      // Bordas arredondadas nas barras
        columnWidth: '50%',   // Largura das barras (50% do espaço)
      },
    },
    // Formata o eixo Y com "Kz" (ex: "1.500 Kz")
    yaxis: {
      labels: {
        formatter: (v) => `${Number(v).toLocaleString("pt-PT")} Kz`,
      },
    },
    // Gradiente de preenchimento
    fill: {
      type: 'gradient',
      gradient: { shade: 'dark', type: 'vertical' },
    },
    colors: ['#00B5D8'],  // Cor ciano
  };
}

// Gráfico radial (semicírculo — estados das entregas)
function getRadialBarOptions() {
  return {
    // NOTA: Não usa baseChartOptions — tem as suas próprias opções
    chart: { startAngle: -90 },
    plotOptions: {
      radialBar: {
        hollow: { size: '60%' },  // Espaço vazio no centro
        track: { background: 'transparent' },
        dataLabels: {
          name: { fontSize: '12px', color: '#AEB9E1' },
          value: { fontSize: '14px', fontWeight: 'bold', color: '#E8EAFF' },
        },
      },
    },
    labels: ['Concluídas', 'Em andamento', 'Canceladas'],
    colors: ['#C026D3', '#3B82F6', '#00d5ff'],  // Rosa, Azul, Ciano
  };
}
```

---
