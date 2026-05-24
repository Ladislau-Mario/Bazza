"use client";

import { useEffect, useRef, useState } from "react";

const USE_MIRAGE = process.env.NEXT_PUBLIC_USE_MIRAGE !== "false";

let mirageServer: any = null;

export function MirageProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (USE_MIRAGE && process.env.NODE_ENV === "development") {
      if (!mirageServer) {
        import("@/services/mirage/server").then(({ makeServer }) => {
          mirageServer = makeServer();
          setReady(true);
        });
      } else {
        setReady(true);
      }
    } else {
      setReady(true);
    }
  }, []);

  // NEXT_PUBLIC_USE_MIRAGE=false — Mirage desactivado, passar children directamente
  if (!USE_MIRAGE || process.env.NODE_ENV !== "development") {
    return <>{children}</>;
  }

  if (!ready) return <>{children}</>;

  return <>{children}</>;
}
