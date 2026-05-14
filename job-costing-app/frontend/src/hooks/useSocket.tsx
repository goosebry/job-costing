import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './useAuth';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({ socket: null, isConnected: false });

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    // Only connect when the user is logged in
    if (!isAuthenticated) {
      setSocket(null);
      setIsConnected(false);
      return;
    }

    // Use polling only — Vercel serverless cannot upgrade to WebSocket
    const socketInstance = io(window.location.origin, {
      transports: ['polling'],
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 2000,
    });

    socketInstance.on('connect', () => {
      console.log('[Socket] Connected');
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('[Socket] Disconnected');
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      // Suppress noise — polling will keep retrying silently
      console.debug('[Socket] Connection error:', error.message);
      setIsConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [isAuthenticated]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}

export function useSocketEvent(event: string, callback: (...args: any[]) => void) {
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    socket.on(event, callback);

    return () => {
      socket.off(event, callback);
    };
  }, [socket, event, callback]);
}

// Notification-specific hook
export function useNotifications() {
  const [unreadCount, setUnreadCount] = useState(0);

  useSocketEvent('notification', (data: any) => {
    console.log('[Notification] Received:', data);
    setUnreadCount((prev) => prev + 1);
  });

  const clearCount = useCallback(() => {
    setUnreadCount(0);
  }, []);

  return { unreadCount, clearCount };
}