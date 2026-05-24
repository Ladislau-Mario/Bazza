"use client";
import { api } from "@/services/api";
import { IPedido, PedidoStatus } from "@/services/mirage/types";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createContext, ReactNode, useState, useEffect } from "react";

interface DeliveriesContextData {
  pedidos: IPedido[];
  total: number;
  emTransito: number;
  entregues: number;
  cancelados: number;
  updateStatus: (id: string, status: PedidoStatus) => void;
  getDeliveriesByStatus: (status: PedidoStatus) => IPedido[];
  isFetching: boolean;
  isLoading: boolean;
  cancelarPedido: (id: string) => void;
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
}

interface DeliveriesProviderProps {
  children: ReactNode;
}

export const DeliveriesContext = createContext<DeliveriesContextData>({} as DeliveriesContextData);

export function DeliveriesProvider({ children }: DeliveriesProviderProps) {

  const [page, setPage] = useState(1);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('baza_admin_token') : null;
    setHasToken(!!token);
  }, []);

  const { data, isFetching, refetch, isLoading } = useQuery({ queryKey: ['deliveriesQuery'], queryFn: async () => {
    const res = await api.get("/admin/pedidos");
    const allPedidos: IPedido[] = res.data;
    const EM_ANDAMENTO = ["a_procurar_motoqueiro", "motoqueiro_atribuido", "a_caminho_recolha", "em_pausa", "recolhido", "entregando"];
    const emTransito = allPedidos.filter(p => EM_ANDAMENTO.includes(p.status)).length;
    const entregues = allPedidos.filter(p => p.status === "entregue").length;
    const cancelados = allPedidos.filter(p => p.status === "cancelado").length;
    return { pedidos: allPedidos, total: allPedidos.length, emTransito, entregues, cancelados };
  }, enabled: hasToken, refetchInterval: 30000 });

  const deliveryData = data?.pedidos ?? [];
  const deliveryDataTotal = data?.total ?? 0;

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: PedidoStatus }) => {
      await api.patch(`/admin/pedidos/${id}`, { status });
      refetch();
    },
  });

  const cancelarPedidoMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/admin/pedidos/${id}`, { status: "cancelado" });
      refetch();
    },
  });

  function getDeliveriesByStatus(status: PedidoStatus) {
    return (deliveryData || []).filter((d) => d.status === status);
  }

  return (
    <DeliveriesContext.Provider
      value={{
        page,
        setPage,
        pedidos: deliveryData,
        total: deliveryDataTotal,
        emTransito: data?.emTransito || 0,
        entregues: data?.entregues || 0,
        cancelados: data?.cancelados || 0,
        updateStatus: (id, status) => updateStatusMutation.mutate({ id, status }),
        cancelarPedido: (id) => cancelarPedidoMutation.mutate(id),
        getDeliveriesByStatus,
        isFetching,
        isLoading,
      }}
    >
      {children}
    </DeliveriesContext.Provider>
  );
}
