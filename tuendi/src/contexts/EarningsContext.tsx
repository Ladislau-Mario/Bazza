"use client";
import { api } from "@/services/api";
import { useQuery } from "@tanstack/react-query";
import { createContext, ReactNode, useCallback, useState, useEffect } from "react";

export type PlanoStatus = 'pendente' | 'ativo' | 'rejeitado' | 'expirado';
export type PlanoTipo = 'diario' | 'semanal' | 'mensal';

export interface Plano {
  id: string;
  userId: string;
  tipo: string;
  valor: number;
  status: PlanoStatus;
  ativoEm: string | null;
  expiraEm: string | null;
  criadoEm: string;
  motivoRejeicao?: string | null;
  user?: {
    id: string;
    nome: string;
    sobrenome: string;
    email: string;
    telefone: string;
    fotoPerfil: string | null;
    fotoPerfilUrl: string | null;
  };
}

export interface Estatisticas {
  totalSemanal: number;
  totalMensal: number;
  totalDiario: number;
  totalGeral: number;
  activos: number;
  pendentes: number;
}

interface EarningsContextData {
  subscricoes: Plano[];
  estatisticas: Estatisticas | null;
  isFetching: boolean;
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  total: number;
  isLoading: boolean;
  refetch: () => void;
  filtrarPlanos: (filtros: { tipo?: string; status?: string; search?: string }) => void;
}

export const EarningsContext = createContext<EarningsContextData>({} as EarningsContextData);

function mapPlano(raw: any): Plano {
  return {
    id: raw.id,
    userId: raw.user?.id ?? raw.userId ?? '',
    tipo: raw.tipo ?? raw.plano ?? '',
    valor: Number(raw.valor ?? raw.preco ?? 0),
    status: raw.status ?? 'pendente',
    ativoEm: raw.ativoEm ?? null,
    expiraEm: raw.expiraEm ?? null,
    criadoEm: raw.criadoEm ?? new Date().toISOString(),
    motivoRejeicao: raw.motivoRejeicao ?? null,
    user: raw.user ? {
      id: raw.user.id,
      nome: raw.user.nome || '',
      sobrenome: raw.user.sobrenome || '',
      email: raw.user.email || '',
      telefone: raw.user.telefone || '',
      fotoPerfil: raw.user.fotoPerfil ?? null,
      fotoPerfilUrl: raw.user.fotoPerfilUrl ?? null,
    } : undefined,
  };
}

export function EarningsProvider({ children }: { children: ReactNode }) {
  const [page, setPage] = useState(1);
  const [filtros, setFiltros] = useState<{ tipo?: string; status?: string; search?: string }>({});
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('baza_admin_token') : null;
    setHasToken(!!token);
  }, []);

  const { data, refetch, isFetching, isLoading } = useQuery({
    queryKey: ['EarningsQuery', page, filtros],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filtros.tipo) params.append('tipo', filtros.tipo);
      if (filtros.status) params.append('status', filtros.status);
      if (filtros.search) params.append('search', filtros.search);
      const qs = params.toString();
      const url = `/planos/admin/todos${qs ? `?${qs}` : ''}`;
      const res = await api.get(url);
      const planos: Plano[] = (Array.isArray(res.data) ? res.data : []).map(mapPlano);
      return { data: planos, total: planos.length };
    },
    enabled: hasToken,
    refetchInterval: 15000,
    retry: false,
  });

  const { data: statsData } = useQuery({
    queryKey: ['EarningsStats'],
    queryFn: async () => {
      const res = await api.get('/planos/admin/estatisticas');
      return res.data as Estatisticas;
    },
    enabled: hasToken,
    refetchInterval: 15000,
    retry: false,
  });

  const filtrarPlanos = useCallback((novosFiltros: { tipo?: string; status?: string; search?: string }) => {
    setFiltros(novosFiltros);
    setPage(1);
  }, []);

  return (
    <EarningsContext.Provider
      value={{
        subscricoes: data?.data ?? [],
        estatisticas: statsData ?? null,
        isFetching,
        page,
        setPage,
        total: data?.total ?? 0,
        isLoading,
        refetch,
        filtrarPlanos,
      }}
    >
      {children}
    </EarningsContext.Provider>
  );
}
