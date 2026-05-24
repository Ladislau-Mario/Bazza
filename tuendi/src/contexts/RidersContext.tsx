"use client";
import { api } from "@/services/api";
import { IMotoqueiro, MotoqueiroStatus } from "@/services/mirage/types";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createContext, ReactNode, useState, useEffect } from "react";
import { useToast } from "@chakra-ui/react";

interface RidersProviderProps {
  children: ReactNode;
}

interface RidersContextData {
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  riders: IMotoqueiro[];
  total: number;
  pendentes: number;
  ativos: number;
  suspensos: number;
  eliminados: number;
  updateStatus: (id: string, action: "aprovar" | "rejeitar" | "suspender" | "ativar" | "eliminar", motivo?: string) => void;
  isFetching: boolean;
  isLoading: boolean;
}

export const RidersContext = createContext<RidersContextData>({} as RidersContextData);

export function RidersProvider({ children }: RidersProviderProps) {
  const [page, setPage] = useState(1);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('baza_admin_token') : null;
    setHasToken(!!token);
  }, []);

  const { data, refetch, isFetching, isLoading } = useQuery({
    queryKey: ['ridersQuery'],
    queryFn: async () => {
      // Buscar todos os delivers (não só pendentes)
      const res = await api.get("/admin/motoqueiros/todos");
      const allDelivers: IMotoqueiro[] = res.data;

      // Estatísticas
      const pendentes = allDelivers.filter((d: any) => d.status === "pendente_aprovacao").length;
      const ativos = allDelivers.filter((d: any) => d.status === "activo").length;
      const suspensos = allDelivers.filter((d: any) => d.status === "suspenso").length;
      const eliminados = allDelivers.filter((d: any) => d.user?.status === "eliminado").length;

      return { riders: allDelivers, total: allDelivers.length, pendentes, ativos, suspensos, eliminados };
    },
    enabled: hasToken,
  });

  const toast = useToast();

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, action, motivo }: { id: string; action: string; motivo?: string }) => {
      if (action === "aprovar") {
        await api.patch(`/admin/motoqueiros/${id}/aprovar`);
      } else if (action === "rejeitar") {
        await api.patch(`/admin/motoqueiros/${id}/rejeitar`, { motivo: motivo || "Documentos insuficientes" });
      } else if (action === "suspender") {
        await api.patch(`/admin/motoqueiros/${id}/suspender`, { motivo: motivo || "Suspenso pelo admin" });
      } else if (action === "ativar") {
        await api.patch(`/admin/motoqueiros/${id}/ativar`);
      } else if (action === "eliminar") {
        // First get the motoqueiro to find the userId
        const motoRes = await api.get(`/admin/motoqueiros/${id}`);
        const userId = motoRes.data.user?.id;
        if (userId) {
          await api.delete(`/admin/utilizadores/${userId}`);
        }
      }
    },
    onSuccess: (_data, variables) => {
      refetch();
      const labels: Record<string, string> = {
        aprovar: "aprovado",
        suspender: "suspenso",
        rejeitado: "rejeitado",
        ativar: "activado",
        eliminar: "eliminado",
      };
      const label = labels[variables.action] || "actualizado";
      toast({ title: `Motoqueiro ${label} com sucesso!`, status: "success", duration: 3000 });
    },
    onError: (err: any) => {
      toast({ title: "Erro ao actualizar status", description: err.response?.data?.message || err.message, status: "error", duration: 5000 });
    },
  });

  return (
    <RidersContext.Provider value={{
      setPage,
      page,
      riders: data?.riders ?? [],
      total: data?.total ?? 0,
      pendentes: data?.pendentes ?? 0,
      ativos: data?.ativos ?? 0,
      suspensos: data?.suspensos ?? 0,
      eliminados: data?.eliminados ?? 0,
      updateStatus: (id, action, motivo) => updateStatusMutation.mutate({ id, action, motivo }),
      isFetching,
      isLoading,
    }}>
      {children}
    </RidersContext.Provider>
  );
}
