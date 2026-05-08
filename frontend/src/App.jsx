import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import SummaryPage from './pages/SummaryPage';
import ConversationsPage from './pages/ConversationsPage';
import ChatPage from './pages/ChatPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ConfigPage from './pages/ConfigPage';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-dark-950">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
    </div>
  );
  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1e293b',
            color: '#e2e8f0',
            border: '1px solid #334155',
            borderRadius: '10px',
            fontSize: '14px',
          },
          success: {
            iconTheme: { primary: '#10b981', secondary: '#1e293b' },
            duration: 3000,
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#1e293b' },
            duration: 4000,
          },
        }}
      />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/summary" />} />
            <Route path="summary" element={<SummaryPage />} />
            <Route path="conversations" element={<ConversationsPage />} />
            <Route path="conversations/:id" element={<ChatPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="config" element={<ConfigPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;