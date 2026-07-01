import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import { AuthProvider, useAuth } from './hooks/useAuth.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import SiteEditor from './pages/SiteEditor.jsx';
import WidgetEditor from './pages/WidgetEditor.jsx';
import Analytics from './pages/Analytics.jsx';
import MediaLibrary from './pages/MediaLibrary.jsx';
import Users from './pages/Users.jsx';
import Layout from './components/Layout.jsx';

function ProtectedRoute({ children }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="sites/:siteId" element={<SiteEditor />} />
            <Route path="sites/:siteId/widgets/:widgetId" element={<WidgetEditor />} />
            <Route path="sites/:siteId/analytics" element={<Analytics />} />
            <Route path="media" element={<MediaLibrary />} />
            <Route path="settings/users" element={<Users />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
