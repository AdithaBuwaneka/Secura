'use client';

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import toast from 'react-hot-toast';

interface MessagingContextType {
  isConnected: boolean;
  unreadCount: number;
  sendMessage: (message: Record<string, unknown>) => void;
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
}

const MessagingContext = createContext<MessagingContextType | null>(null);

export const useMessaging = () => {
  const context = useContext(MessagingContext);
  if (!context) {
    throw new Error('useMessaging must be used within a MessagingProvider');
  }
  return context;
};

interface MessagingProviderProps {
  children: React.ReactNode;
}

export default function MessagingProvider({ children }: MessagingProviderProps) {
  const { userProfile, idToken, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
  const WS_URL = API_URL.replace('http', 'ws');

  const handleWebSocketMessage = useCallback((data: Record<string, unknown>) => {
    switch (data.type) {
      case 'notification':
        // Show toast notification for new messages
        if (data.sender_id !== userProfile?.uid) {
          toast.success(`New message from ${data.sender_name}`, {
            duration: 4000,
            position: 'top-right',
          });
          setUnreadCount(prev => prev + 1);
        }
        break;
        
      case 'incident_update':
        toast.success(`Incident ${data.incident_id} status updated: ${data.status}`, {
          duration: 5000,
        });
        break;
        
      case 'security_alert':
        toast.error(`Security Alert: ${data.message}`, {
          duration: 7000,
        });
        break;
        
      case 'system_message':
        toast.success(data.message as string, {
          duration: 4000,
        });
        break;
        
      case 'unread_count':
        setUnreadCount(data.count as number);
        break;
        
      default:
        console.log('Unhandled message type:', data.type);
    }
  }, [userProfile?.uid]);

  const initializeWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    try {
      const wsUrl = `${WS_URL}/api/messaging/ws/global?token=${idToken}&user_id=${userProfile?.uid}`;
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        setIsConnected(true);
        console.log('Global messaging WebSocket connected');
        
        // Clear any existing reconnect timeout
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      wsRef.current.onclose = () => {
        setIsConnected(false);
        console.log('Global messaging WebSocket disconnected');
        
        // Attempt to reconnect after 3 seconds if authenticated
        if (isAuthenticated && !reconnectTimeoutRef.current) {
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectTimeoutRef.current = null;
            initializeWebSocket();
          }, 3000);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('Global messaging WebSocket error:', error);
        setIsConnected(false);
      };
    } catch (error) {
      console.error('Failed to initialize global messaging WebSocket:', error);
    }
  }, [idToken, userProfile?.uid, WS_URL, isAuthenticated, handleWebSocketMessage]);

  useEffect(() => {
    if (isAuthenticated && idToken && userProfile) {
      initializeWebSocket();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [isAuthenticated, idToken, userProfile, initializeWebSocket]);

  const sendMessage = (message: Record<string, unknown>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      toast.error('Connection lost. Please try again.');
    }
  };

  const joinRoom = (roomId: string) => {
    sendMessage({
      type: 'join_room',
      room_id: roomId,
      user_id: userProfile?.uid
    });
  };

  const leaveRoom = (roomId: string) => {
    sendMessage({
      type: 'leave_room',
      room_id: roomId,
      user_id: userProfile?.uid
    });
  };

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setIsConnected(false);
    setUnreadCount(0);
  };

  const contextValue: MessagingContextType = {
    isConnected,
    unreadCount,
    sendMessage,
    joinRoom,
    leaveRoom
  };

  return (
    <MessagingContext.Provider value={contextValue}>
      {children}
    </MessagingContext.Provider>
  );
}