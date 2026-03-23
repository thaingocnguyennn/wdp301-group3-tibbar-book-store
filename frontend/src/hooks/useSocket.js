import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const useSocket = (onConnect, onDisconnect, onError) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      return;
    }

    let user;
    try {
      user = JSON.parse(userStr);
    } catch (e) {
      return;
    }

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const socketUrl = apiUrl.replace(/\/api\/?$/, '');

    const socketInstance = io(
      socketUrl,
      {
        auth: {
          token,
          user,
        },
        withCredentials: true,
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
      }
    );

    setSocket(socketInstance);

    socketInstance.on('connect', () => {
      setIsConnected(true);
      console.log('🔌 Connected to Socket.IO server');
      if (onConnect) {
        onConnect();
      }
    });

    socketInstance.on('disconnect', (reason) => {
      setIsConnected(false);
      console.log('🔌 Disconnected from Socket.IO server:', reason);
      if (onDisconnect) {
        onDisconnect(reason);
      }
    });

    socketInstance.on('error', (error) => {
      console.error('❌ Socket error:', error);
      if (onError) {
        onError(error);
      }
    });

    return () => {
      socketInstance.disconnect();
      setSocket(null);
      setIsConnected(false);
    };
  }, [onConnect, onDisconnect, onError]);

  return { socket, isConnected };
};

export default useSocket;
