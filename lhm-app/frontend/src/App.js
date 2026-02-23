import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './i18n/LanguageContext';
import Layout from './components/layout/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import PersonnelPage from './pages/PersonnelPage';
import VolontairesPage from './pages/VolontairesPage';
import StockPage from './pages/StockPage';
import ProjectsPage from './pages/ProjectsPage';
import UsersPage from './pages/UsersPage';
import AbsencesPage from './pages/AbsencesPage';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#0f2044' }}>
      <div style={{ textAlign:'center', color:'white' }}>
        <div style={{ width:48, height:48, border:'3px solid rgba(201,168,76,0.3)', borderTop:'3px solid #c9a84c', borderRadius:'50%', animation:'spin 1s linear infinite', margin:'0 auto 16px' }} />
        <p style={{ fontFamily:'DM Sans, sans-serif', opacity:0.8 }}>Chargement…</p>
      </div>
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
};

const AppRoutes = () => {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="personnel" element={<PersonnelPage />} />
        <Route path="absences" element={<AbsencesPage />} />
        <Route path="volontaires" element={<VolontairesPage />} />
        <Route path="stock" element={<StockPage />} />
        <Route path="projets" element={<ProjectsPage />} />
        <Route path="utilisateurs" element={<UsersPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <Toaster position="top-right" toastOptions={{ duration:3000, style:{ background:'#0f2044', color:'#fff', fontFamily:'DM Sans, sans-serif', borderRadius:'10px', border:'1px solid rgba(201,168,76,0.3)' } }} />
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
}
