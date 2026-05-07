import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { connectWebSocket, disconnectWebSocket } from '../services/websocket';

const Layout = () => {
  const { user } = useAuth();

  useEffect(() => {
    // Conectar WebSocket al montar el layout
    const token = localStorage.getItem('token');
    if (token) connectWebSocket(token);
    return () => disconnectWebSocket();
  }, []);

  return (
    <div className="flex h-screen bg-dark-950 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;