// src/components/modules/services/socket.ts
import { io, Socket } from 'socket.io-client';
import { getIdToken } from './firebase-token';
import { auth } from '../../../../firebaseConfig';

const SOCKET_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://10.242.160.144:3000') + '/chat';

let socket: Socket | null = null;
let refCount = 0;

export async function getSocket(): Promise<Socket> {
  refCount++;

  if (socket) return socket;

  const token = await getIdToken();
  const userId = auth.currentUser?.uid;

  socket = io(SOCKET_URL, {
    auth: { token, userId },
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
  });

  if (!socket) {
    throw new Error('[Socket] io() returned null');
  }

  socket.on('connect', () => {
    console.log('[Socket] Connected:', socket?.id);
    // Registar o utilizador na sua sala pessoal
    if (userId) {
      socket?.emit('user:join', { userId });
    }
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason);
  });

  socket.on('connect_error', (err) => {
    console.warn('[Socket] Connection error:', err?.message || err);
  });

  if (!socket) {
    throw new Error('[Socket] Failed to create socket instance');
  }

  return socket;
}

export function releaseSocket() {
  refCount = Math.max(0, refCount - 1);
  if (refCount === 0 && socket) {
    console.log('[Socket] No more references, disconnecting');
    socket.disconnect();
    socket = null;
  }
}

export function disconnectSocket() {
  refCount = 0;
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function getSocketSync(): Socket | null {
  return socket;
}
