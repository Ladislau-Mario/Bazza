"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { useColorMode } from "@chakra-ui/react";
import { api } from "@/services/api";

export interface Preferencias {
  notificacoesPush: boolean;
  som: boolean;
  idioma: string;
  tema: string;
  autoAprovacao: boolean;
}

const defaults: Preferencias = {
  notificacoesPush: true,
  som: true,
  idioma: "pt",
  tema: "dark",
  autoAprovacao: false,
};

interface PreferencesContextType {
  preferencias: Preferencias;
  loaded: boolean;
  updatePreferencias: (updates: Partial<Preferencias>) => Promise<void>;
  setField: <K extends keyof Preferencias>(key: K, value: Preferencias[K]) => void;
}

const PreferencesContext = createContext<PreferencesContextType>({
  preferencias: defaults,
  loaded: false,
  updatePreferencias: async () => {},
  setField: () => {},
});

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferencias, setPreferencias] = useState<Preferencias>(defaults);
  const [loaded, setLoaded] = useState(false);
  const { setColorMode, colorMode } = useColorMode();

  // Carregar preferências da API no mount
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('baza_admin_token') : null;
    if (!token) { setLoaded(true); return; }
    api.get('/preferencias')
      .then(res => {
        if (res.data) {
          const p = { ...defaults, ...res.data };
          setPreferencias(p);
          // Aplicar tema
          if (p.tema && p.tema !== colorMode) {
            setColorMode(p.tema as "light" | "dark");
          }
        }
        setLoaded(true);
      })
      .catch(() => {
        setLoaded(true);
      });
  }, []);

  // Atualizar campo individual (para uso em tempo real nos toggles)
  const setField = useCallback(<K extends keyof Preferencias>(key: K, value: Preferencias[K]) => {
    setPreferencias(prev => ({ ...prev, [key]: value }));
    // Aplicar tema imediatamente
    if (key === 'tema') {
      setColorMode(value as "light" | "dark");
    }
  }, [setColorMode]);

  // Guardar todas as preferências na API
  const updatePreferencias = useCallback(async (updates: Partial<Preferencias>) => {
    const merged = { ...preferencias, ...updates };
    setPreferencias(merged);
    // Aplicar tema
    if (updates.tema) {
      setColorMode(updates.tema as "light" | "dark");
    }
    try {
      await api.patch('/preferencias', merged);
    } catch {
      // Silenciar erro - as preferências locais mantêm-se
    }
  }, [preferencias, setColorMode]);

  return (
    <PreferencesContext.Provider value={{ preferencias, loaded, updatePreferencias, setField }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  return useContext(PreferencesContext);
}
