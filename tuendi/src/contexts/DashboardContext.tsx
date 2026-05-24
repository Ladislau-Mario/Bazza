"use client";
import { api } from "@/services/api";
import { IPedido, IMotoqueiro, IUser, ISubscricao, ISuporte } from "@/services/mirage/types";
import { useQuery } from "@tanstack/react-query";
import { createContext, ReactNode, useState, useEffect } from "react";

interface DashboardContextData {
  pedidos: IPedido[];
  totalPedidos: number;
  totalReceita: number;
  totalMotoqueiros: number;
  totalUsuarios: number;
  pedidosRecentes: IPedido[];
  isFetching: boolean;
  isLoading: boolean;
  error: Error | null;
  receitaPorMes: (pedidos: IPedido[]) => number[];
  entregasPorMes: (pedidos: IPedido[]) => number[];
  motoqueiros: IMotoqueiro[];
  clientes: IUser[];
  motoqueirosPendentes: IMotoqueiro[];
  ticketsAbertos: ISuporte[];
  suportes: ISuporte[];
}

interface DashboardProviderProps {
  children: ReactNode;
}

export const DashboardContext = createContext<DashboardContextData>({} as DashboardContextData);

export function DashboardProvider({ children }: DashboardProviderProps) {
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('baza_admin_token') : null;
    setHasToken(!!token);
  }, []);

  const pedidosQuery = useQuery<IPedido[]>({
    queryKey: ['pedidosQuery'],
    queryFn: async () => {
      const res = await api.get("/admin/pedidos");
      return res.data;
    },
    enabled: hasToken,
    retry: false,
    refetchInterval: 30000,
  });

  const motoqueirosQuery = useQuery<IMotoqueiro[]>({
    queryKey: ['motoqueirosQuery'],
    queryFn: async () => {
      const res = await api.get("/admin/motoqueiros/todos");
      return res.data;
    },
    enabled: hasToken,
    retry: false,
    refetchInterval: 30000,
  });

  const usuariosQuery = useQuery<IUser[]>({
    queryKey: ['usuariosQuery'],
    queryFn: async () => {
      const res = await api.get("/admin/utilizadores");
      return res.data;
    },
    enabled: hasToken,
    retry: false,
    refetchInterval: 30000,
  });

  const subscricoesQuery = useQuery<ISubscricao[]>({
    queryKey: ['subscricoesQuery'],
    queryFn: async () => {
      const res = await api.get("/planos/admin/todos");
      return res.data;
    },
    enabled: hasToken,
    retry: false,
    refetchInterval: 30000,
  });

  const suportesQuery = useQuery<ISuporte[]>({
    queryKey: ['suportesDashboardQuery'],
    queryFn: async () => {
      const res = await api.get("/admin/suporte");
      return res.data;
    },
    enabled: hasToken,
    retry: false,
    refetchInterval: 30000,
  });

  const pedidosData = pedidosQuery.data ?? [];
  const motoqueirosData = motoqueirosQuery.data ?? [];
  const usuariosData = usuariosQuery.data ?? [];
  const subscricoesData = subscricoesQuery.data ?? [];
  const suportesData = suportesQuery.data ?? [];

  const motoqueirosPendentes = motoqueirosData.filter(
    (m) => m.status === "pendente_aprovacao"
  );

  const ticketsAbertos = suportesData.filter(
    (s) => s.status === "aberto"
  );

  const queryError =
    pedidosQuery.error ?? motoqueirosQuery.error ?? usuariosQuery.error ?? subscricoesQuery.error ?? suportesQuery.error ?? null;

  const totalReceita = subscricoesData.reduce((acc, s) => acc + s.valor, 0);
  const pedidosRecentes = [...pedidosData]
    .sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime())
    .slice(0, 10);

  const isLoading = pedidosQuery.isLoading || motoqueirosQuery.isLoading || usuariosQuery.isLoading || subscricoesQuery.isLoading || suportesQuery.isLoading;
  const isFetching = pedidosQuery.isFetching || motoqueirosQuery.isFetching || usuariosQuery.isFetching || subscricoesQuery.isFetching || suportesQuery.isFetching;

  function receitaPorMes(pedidos: IPedido[]) {
    const totais = Array(12).fill(0);
    pedidos
      .filter((p) => p.status === "entregue")
      .forEach((p) => {
        const mes = new Date(p.criadoEm).getMonth();
        totais[mes] += Number(p.valorEntrega || 0);
      });
    return totais;
  }

  function entregasPorMes(pedidos: IPedido[]) {
    const totais = Array(12).fill(0);
    pedidos
      .filter((p) => p.status === "entregue")
      .forEach((p) => {
        const mes = new Date(p.criadoEm).getMonth();
        totais[mes] += 1;
      });
    return totais;
  }

  return (
    <DashboardContext.Provider
      value={{
        pedidos: pedidosData,
        motoqueiros: motoqueirosData,
        clientes: usuariosData,
        totalPedidos: pedidosData.length,
        totalReceita,
        totalMotoqueiros: motoqueirosData.length,
        totalUsuarios: usuariosData.length,
        pedidosRecentes,
        isFetching,
        isLoading,
        error: queryError as Error | null,
        receitaPorMes: (pedidos) => receitaPorMes(pedidos),
        entregasPorMes: (pedidos) => entregasPorMes(pedidos),
        motoqueirosPendentes,
        ticketsAbertos,
        suportes: suportesData,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}
