"use client";
import { createContext, ReactNode, useEffect, useState } from "react";
import { IUser } from "@/services/mirage/types";
import { api } from "@/services/api";

interface LoginContextData {
  user: IUser | null;
  isAuthenticated: boolean;
  login: (telefone: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: IUser) => void;
}

interface LoginProviderProps {
  children: ReactNode;
}

export const LoginContext = createContext<LoginContextData>({} as LoginContextData);

export function LoginProvider({ children }: LoginProviderProps) {
  const [user, setUser] = useState<IUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Restaurar sessão ao carregar
  useEffect(() => {
    const token = localStorage.getItem("baza_admin_token");
    const storedUser = localStorage.getItem("baza_admin_user");
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        setIsAuthenticated(true);
      } catch {
        localStorage.removeItem("baza_admin_token");
        localStorage.removeItem("baza_admin_user");
      }
    }
  }, []);

  async function login(telefone: string) {
    const res = await api.post("/auth/admin-login", { telefone });
    const { token, user: userData } = res.data;

    localStorage.setItem("baza_admin_token", token);
    localStorage.setItem("baza_admin_user", JSON.stringify(userData));

    setUser(userData);
    setIsAuthenticated(true);
  }

  function logout() {
    localStorage.removeItem("baza_admin_token");
    localStorage.removeItem("baza_admin_user");
    setUser(null);
    setIsAuthenticated(false);
  }

  function updateUser(userData: IUser) {
    setUser(userData);
    localStorage.setItem("baza_admin_user", JSON.stringify(userData));
  }

  return (
    <LoginContext.Provider
      value={{
        user,
        isAuthenticated,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </LoginContext.Provider>
  );
}
