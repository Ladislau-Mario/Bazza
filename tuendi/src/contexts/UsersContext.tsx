"use client"

import { api } from "@/services/api";
import { IUser, UserStatus } from "@/services/mirage/types";
import { useMutation, UseMutationResult, useQuery } from "@tanstack/react-query";
import { ReactNode, createContext, useState, useEffect } from "react";

interface UsersContextData {
    page: number;
    total: number;
    clientes: number;
    motoqueiroCount: number;
    pendentes: number;
    suspensos: number;
    eliminados: number;
    users: IUser[];
    updateStatus: UseMutationResult<void, Error, { id: string; status: UserStatus }, unknown>["mutate"];
    deleteUser: UseMutationResult<void, Error, string, unknown>["mutate"];
    setPage: React.Dispatch<React.SetStateAction<number>>;
    isFetching: boolean;
    isLoading: boolean;
}

interface UsersProviderProps {
    children: ReactNode,
}

export const UsersContext = createContext<UsersContextData>({} as UsersContextData);

export function UsersProvider({children}: UsersProviderProps){
    const [page, setPage] = useState(1);
    const [hasToken, setHasToken] = useState(false);

    useEffect(() => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('baza_admin_token') : null;
        setHasToken(!!token);
    }, []);

    const {data, refetch, isFetching, isLoading} = useQuery({ queryKey: ['usersQuery'], queryFn: async () => {
        const res = await api.get("/admin/utilizadores");
        const allUsers: IUser[] = res.data;
        const clientes = allUsers.filter(u => u.role === "client").length;
        const motoqueiroCount = allUsers.filter(u => u.role === "deliver").length;
        const pendentes = allUsers.filter(u => u.status === "pending").length;
        const suspensos = allUsers.filter(u => u.status === "suspended").length;
        const eliminados = allUsers.filter(u => u.status === "eliminado").length;
        return { users: allUsers, total: allUsers.length, clientes, motoqueiroCount, pendentes, suspensos, eliminados };
    }, enabled: hasToken, refetchInterval: 30000 });

    const usersData = data?.users ?? [];
    const usersDataTotal = data?.total ?? 0;

    const usersUpdateStatusMutation = useMutation({ mutationFn: async ({ id, status }: { id: string; status: UserStatus }) => {
        await api.patch(`/admin/utilizadores/${id}/status`, { status });
        refetch();
    }});

    const deleteUserMutation = useMutation({ mutationFn: async (id: string) => {
        await api.delete(`/admin/utilizadores/${id}`);
        refetch();
    }});

    return (
        <UsersContext.Provider value={{
            page,
            total: usersDataTotal,
            clientes: data?.clientes || 0,
            motoqueiroCount: data?.motoqueiroCount || 0,
            pendentes: data?.pendentes || 0,
            suspensos: data?.suspensos || 0,
            eliminados: data?.eliminados || 0,
            users: usersData,
            updateStatus: usersUpdateStatusMutation.mutate,
            deleteUser: deleteUserMutation.mutate,
            setPage,
            isFetching,
            isLoading,
        }}>
          {children}
        </UsersContext.Provider>
      );
}
