"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

/**
 * Hook que conecta ao socket do backend e regista eventos dinâmicos.
 */
export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  // Store registered event handlers so we can clean them up
  const handlersRef = useRef<Map<string, (data: any) => void>>(new Map());

  useEffect(() => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("baza_admin_token")
        : null;

    if (!token) return;

    const socket = io(`${API_URL}/chat`, {
      transports: ["websocket"],
      auth: { userId: "admin", token },
      autoConnect: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[AdminSocket] Conectado:", socket.id);
      setConnected(true);
      // Entrar na sala de admin
      socket.emit("admin:join", { role: "admin" });
      console.log("[AdminSocket] Emitido admin:join");
    });

    socket.on("disconnect", () => {
      console.log("[AdminSocket] Desconectado");
      setConnected(false);
    });

    socket.on("connect_error", (err) => {
      console.warn("[AdminSocket] Erro de conexão:", err.message);
    });

    return () => {
      // Clean up registered handlers
      handlersRef.current.forEach((handler, event) => {
        socket.off(event, handler);
      });
      handlersRef.current.clear();
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, []);

  // Register event listener
  const on = (event: string, handler: (data: any) => void) => {
    const socket = socketRef.current;
    if (!socket) return;
    // Remove previous handler for this event if exists
    const prev = handlersRef.current.get(event);
    if (prev) socket.off(event, prev);
    handlersRef.current.set(event, handler);
    socket.on(event, handler);
    console.log(`[AdminSocket] Registado evento: ${event}`);
  };

  // Unregister event listener
  const off = (event: string) => {
    const socket = socketRef.current;
    if (!socket) return;
    const handler = handlersRef.current.get(event);
    if (handler) {
      socket.off(event, handler);
      handlersRef.current.delete(event);
      console.log(`[AdminSocket] Removido evento: ${event}`);
    }
  };

  return { socket: socketRef.current, connected, on, off };
}
