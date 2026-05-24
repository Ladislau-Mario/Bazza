"use client";

import { ChakraProvider, ColorModeScript } from "@chakra-ui/react";
import { theme } from "@/styles/theme";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { MirageProvider } from "@/contexts/MirageContext";
import { LoginProvider } from "@/contexts/LoginContext";
import { I18nProvider, useI18n } from "@/contexts/I18nContext";
import { PreferencesProvider, usePreferences } from "@/contexts/PreferencesContext";
import { ReactNode, useEffect, useState } from "react";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <MirageProvider>
      <QueryClientProvider client={queryClient}>
        <LoginProvider>
          <ColorModeScript initialColorMode={theme.config.initialColorMode} />
          <ChakraProvider theme={theme}>
            <PreferencesProvider>
              <I18nProvider>
                <I18nSync>
                  {children}
                </I18nSync>
              </I18nProvider>
            </PreferencesProvider>
          </ChakraProvider>
        </LoginProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </MirageProvider>
  );
}

// Sincroniza o idioma das preferências com o I18nProvider
function I18nSync({ children }: { children: ReactNode }) {
  const { preferencias, loaded } = usePreferences();
  const { setLocale } = useI18n();

  useEffect(() => {
    if (loaded && preferencias.idioma) {
      setLocale(preferencias.idioma);
    }
  }, [loaded, preferencias.idioma, setLocale]);

  return <>{children}</>;
}
