import { useState, useEffect, useRef, useCallback } from 'react';

export type WebSocketStatus = 'Connecting' | 'Connected' | 'Disconnected' | 'Error';

interface UseWebSocketOptions {
  onOpen?: (event: Event) => void;
  onMessage?: (event: MessageEvent) => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
  shouldReconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export function useWebSocket(url: string, options: UseWebSocketOptions = {}) {
  const {
    onOpen,
    onMessage,
    onClose,
    onError,
    shouldReconnect = true,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
  } = options;

  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [status, setStatus] = useState<WebSocketStatus>('Disconnected');
  const [lastMessage, setLastMessage] = useState<MessageEvent | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimeoutId = useRef<NodeJS.Timeout>();

  const connect = useCallback(() => {
    try {
      setStatus('Connecting');
      const ws = new WebSocket(url);

      ws.onopen = (event) => {
        setStatus('Connected');
        reconnectAttempts.current = 0;
        onOpen?.(event);
      };

      ws.onmessage = (event) => {
        setLastMessage(event);
        onMessage?.(event);
      };

      ws.onclose = (event) => {
        setStatus('Disconnected');
        onClose?.(event);

        // Attempt to reconnect if enabled and not manually closed
        if (
          shouldReconnect &&
          !event.wasClean &&
          reconnectAttempts.current < maxReconnectAttempts
        ) {
          reconnectAttempts.current++;
          reconnectTimeoutId.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        }
      };

      ws.onerror = (event) => {
        setStatus('Error');
        onError?.(event);
      };

      setSocket(ws);
    } catch (error) {
      setStatus('Error');
      console.error('WebSocket connection error:', error);
    }
  }, [url, onOpen, onMessage, onClose, onError, shouldReconnect, reconnectInterval, maxReconnectAttempts]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutId.current) {
      clearTimeout(reconnectTimeoutId.current);
    }
    
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.close(1000, 'Manual disconnect');
    }
    
    setSocket(null);
    setStatus('Disconnected');
  }, [socket]);

  const sendMessage = useCallback((message: string | ArrayBuffer | Blob) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(message);
      return true;
    }
    return false;
  }, [socket]);

  const sendJsonMessage = useCallback((data: any) => {
    return sendMessage(JSON.stringify(data));
  }, [sendMessage]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutId.current) {
        clearTimeout(reconnectTimeoutId.current);
      }
      if (socket) {
        socket.close();
      }
    };
  }, []);

  return {
    socket,
    status,
    lastMessage,
    connect,
    disconnect,
    sendMessage,
    sendJsonMessage,
    isConnected: status === 'Connected',
    isConnecting: status === 'Connecting',
    reconnectAttempts: reconnectAttempts.current,
  };
}