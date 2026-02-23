import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLang } from '../../i18n/LanguageContext';
import './Layout.css';
import logoDark from '../../assets/logo-lhm.png';       // white text (for dark sidebar)
import logoLight from '../../assets/logo-lhm-light.png'; // navy text (for light topbar)

const ROLE_LABELS = {
  fr: {
    super_admin: 'Administrateur Système',
    direction: 'Direction',
    assistant_admin: 'Assistant Administration',
    responsable_stock: 'Responsable Stock',
    responsable_volontaires: 'Responsable Volontaires',
    coordinateur: 'Coordinateur',
    utilisateur: 'Utilisateur',
  },
  en: {
    super_admin: 'System Administrator',
    direction: 'Management',
    assistant_admin: 'Administrative Assistant',
    responsable_stock: 'Stock Manager',
    responsable_volontaires: 'Volunteer Manager',
    coordinateur: 'Coordinator',
    utilisateur: 'User',
  },
};

// Language switcher button with flag
function LangToggle({ lang, setLang, compact = false }) {
  const next = lang === 'fr' ? 'en' : 'fr';
  const flag = lang === 'fr' ? '🇬🇧' : '🇫🇷';
  const label = lang === 'fr' ? 'EN' : 'FR';
  return (
    <button
      onClick={() => setLang(next)}
      title={lang === 'fr' ? 'Switch to English' : 'Passer en Français'}
      style={{
        background: 'rgba(201,168,76,0.15)',
        border: '1px solid rgba(201,168,76,0.35)',
        borderRadius: 8,
        color: '#c9a84c',
        fontWeight: 700,
        fontSize: '0.76rem',
        padding: compact ? '4px 8px' : '5px 11px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        whiteSpace: 'nowrap',
        transition: 'all 0.2s',
      }}
    >
      <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>{flag}</span>
      {!compact && <span>{label}</span>}
    </button>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const { lang, setLang, t } = useLang();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const NAV_ITEMS = [
    { path: '/', label: t('nav.dashboard'), icon: '📊', exact: true },
    { path: '/personnel', label: t('nav.personnel'), icon: '👥', roles: ['super_admin', 'assistant_admin', 'direction'] },
    { path: '/absences', label: t('nav.absences'), icon: '📅', roles: ['super_admin', 'assistant_admin', 'direction'] },
    { path: '/volontaires', label: t('nav.volunteers'), icon: '🤝', roles: ['super_admin', 'responsable_volontaires', 'direction'] },
    { path: '/stock', label: t('nav.stock'), icon: '📦', roles: ['super_admin', 'responsable_stock', 'direction'] },
    { path: '/projets', label: t('nav.projects'), icon: '🎯' },
    { path: '/utilisateurs', label: t('nav.users'), icon: '🔐', roles: ['super_admin'] },
  ];

  const visibleItems = NAV_ITEMS.filter(item =>
    !item.roles || item.roles.some(r => r === user?.role)
  );

  const roleLabel = (ROLE_LABELS[lang] || ROLE_LABELS.fr)[user?.role] || user?.role;

  return (
    <div className={`layout ${collapsed ? 'sidebar-collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
      {mobileOpen && <div className="overlay" onClick={() => setMobileOpen(false)} />}

      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <img
              src={logoDark}
              alt="LHM Madagascar"
              className="logo-img"
              style={collapsed
                ? { width: 38, height: 38, objectFit: 'contain' }
                : { height: 46, maxWidth: 170, objectFit: 'contain' }
              }
            />
          </div>
          <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)} title={collapsed ? 'Expand' : 'Collapse'}>
            {collapsed ? '›' : '‹'}
          </button>
        </div>

        <nav className="sidebar-nav">
          {visibleItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setMobileOpen(false)}
              title={collapsed ? item.label : ''}
            >
              <span className="nav-icon">{item.icon}</span>
              {!collapsed && <span className="nav-label">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          {!collapsed && (
            <>
              <div style={{ padding: '8px 10px', marginBottom: 8 }}>
                <LangToggle lang={lang} setLang={setLang} />
              </div>
              <div className="user-info">
                <div className="user-avatar">{user?.prenom?.[0]}{user?.nom?.[0]}</div>
                <div className="user-details">
                  <span className="user-name">{user?.prenom} {user?.nom}</span>
                  <span className="user-role">{roleLabel}</span>
                </div>
              </div>
            </>
          )}
          <button className="logout-btn" onClick={handleLogout} title={t('nav.logout')}>
            <span>🚪</span>
            {!collapsed && <span>{t('nav.logout')}</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="main-wrapper">
        <header className="topbar">
          <button className="mobile-menu-btn" onClick={() => setMobileOpen(!mobileOpen)}>☰</button>
          <div className="topbar-left">
            <img src={logoLight} alt="LHM" className="topbar-logo" />
            <h1 className="page-title" id="page-title">{t('dashboard.welcome')}</h1>
          </div>
          <div className="topbar-right">
            <LangToggle lang={lang} setLang={setLang} />
            <div className="topbar-user">
              <div className="user-avatar-sm">{user?.prenom?.[0]}{user?.nom?.[0]}</div>
              <span className="topbar-name">{user?.prenom} {user?.nom}</span>
            </div>
          </div>
        </header>

        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
