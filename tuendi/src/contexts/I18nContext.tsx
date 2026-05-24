"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";

import ptMessages from "@/messages/pt.json";
import enMessages from "@/messages/en.json";
import frMessages from "@/messages/fr.json";

type Messages = typeof ptMessages;

const allMessages: Record<string, Messages> = {
  pt: ptMessages,
  en: enMessages,
  fr: frMessages,
};

interface I18nContextType {
  locale: string;
  t: (key: string) => string;
  setLocale: (locale: string) => void;
}

const I18nContext = createContext<I18nContextType>({
  locale: "pt",
  t: (key: string) => key,
  setLocale: () => {},
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState("pt");
  const [messages, setMessages] = useState<Messages>(ptMessages);

  const setLocale = useCallback((newLocale: string) => {
    setLocaleState(newLocale);
    setMessages(allMessages[newLocale] || ptMessages);
  }, []);

  const t = useCallback((key: string): string => {
    const keys = key.split(".");
    let result: any = messages;
    for (const k of keys) {
      result = result?.[k];
      if (result === undefined) return key;
    }
    return typeof result === "string" ? result : key;
  }, [messages]);

  return (
    <I18nContext.Provider value={{ locale, t, setLocale }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
