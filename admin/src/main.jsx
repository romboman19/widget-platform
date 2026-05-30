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
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
