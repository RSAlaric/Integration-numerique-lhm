import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../i18n/LanguageContext';
import toast from 'react-hot-toast';
import logoDark from '../assets/logo-lhm.png';
import logoLight from '../assets/logo-lhm-light.png';

// ── Demo accounts: hidden by default, revealed one at a time on click ──
function DemoAccounts({ demoLogins, onSelect, t }) {
  const [revealed, setRevealed] = useState(null);

  return (
    <div style={{ marginTop: 24, padding: '14px', background: 'var(--gray-50)', borderRadius: 10, border: '1px solid var(--gray-200)' }}>
      <p style={{ fontSize: '0.72rem', color: 'var(--gray-500)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
        {t('login.demoAccounts')}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {demoLogins.map((d, i) => {
          const isRevealed = revealed === i;
          return (
            <div key={d.label} style={{ borderRadius: 8, border: `1px solid ${isRevealed ? 'var(--gold)' : 'var(--gray-200)'}`, overflow: 'hidden', transition: 'border-color 0.2s' }}>
              {/* Header row — always visible, just role name */}
              <button
                type="button"
                onClick={() => setRevealed(isRevealed ? null : i)}
                style={{ width: '100%', background: isRevealed ? 'rgba(201,168,76,0.07)' : 'white', border: 'none', padding: '8px 12px', fontSize: '0.8rem', cursor: 'pointer', textAlign: 'left', color: 'var(--navy)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span style={{ fontWeight: 700 }}>{d.icon} {d.label}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--gray-400)' }}>{isRevealed ? '▲' : '▼'}</span>
              </button>

              {/* Revealed credentials */}
              {isRevealed && (
                <div style={{ background: 'white', padding: '8px 12px', borderTop: '1px solid var(--gray-100)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 8 }}>
                    <div>
                      <p style={{ fontSize: '0.67rem', color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>Email</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--navy)', fontFamily: 'monospace', fontWeight: 600 }}>{d.email}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '0.67rem', color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>Mot de passe</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--navy)', fontFamily: 'monospace', fontWeight: 600 }}>{d.pwd}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { onSelect(d); setRevealed(null); }}
                    style={{ width: '100%', background: 'linear-gradient(135deg, var(--navy), #1a3a6e)', color: 'white', border: 'none', borderRadius: 7, padding: '7px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
                  >
                    ↩ Utiliser ce compte
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function LoginPage() {
  const { login } = useAuth();
  const { lang, setLang, t } = useLang();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await login(form.email, form.password);
      toast.success(t('login.welcome'));
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || t('login.error'));
    } finally {
      setLoading(false);
    }
  };

  const demoLogins = [
    { icon: '🔐', label: lang === 'fr' ? 'Administrateur' : 'Administrator', email: 'admin@lhm-madagascar.org', pwd: 'Admin@1234' },
    { icon: '👔', label: 'Direction', email: 'direction@lhm-madagascar.org', pwd: 'Direction@1234' },
    { icon: '👥', label: lang === 'fr' ? 'Assistant RH' : 'HR Assistant', email: 'rh@lhm-madagascar.org', pwd: 'RH@1234' },
    { icon: '📦', label: lang === 'fr' ? 'Responsable Stock' : 'Stock Manager', email: 'stock@lhm-madagascar.org', pwd: 'Stock@1234' },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'linear-gradient(135deg, #091628 0%, #0f2044 50%, #1a3560 100%)' }}>

      {/* Lang toggle top-right */}
      <div style={{ position: 'absolute', top: 16, right: 20, zIndex: 10 }}>
        <button
          onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')}
          title={lang === 'fr' ? 'Switch to English' : 'Passer en Français'}
          style={{ background: 'rgba(201,168,76,0.2)', border: '1px solid rgba(201,168,76,0.4)', borderRadius: 10, color: '#c9a84c', fontWeight: 700, fontSize: '0.88rem', padding: '8px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <span style={{ fontSize: '1.3rem', lineHeight: 1 }}>{lang === 'fr' ? '🇬🇧' : '🇫🇷'}</span>
          <span style={{ fontSize: '0.8rem' }}>{lang === 'fr' ? 'English' : 'Français'}</span>
        </button>
      </div>

      <div style={{ display: 'flex', flex: 1, flexWrap: 'wrap' }}>

        {/* Left panel */}
        <div style={{ flex: 1, minWidth: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', padding: '60px 40px', color: 'white' }}>
          <div style={{ maxWidth: 440, width: '100%' }}>

            {/* LOGO transparent (white text visible on dark bg) */}
            <div style={{ marginBottom: 44 }}>
              <img
                src={logoDark}
                alt="LHM Madagascar"
                style={{ maxWidth: 300, width: '100%', objectFit: 'contain' }}
              />
            </div>

            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.6rem, 4vw, 2.5rem)', fontWeight: 700, lineHeight: 1.2, marginBottom: 14 }}>
              {t('login.hero1')}<br />
              <span style={{ color: '#c9a84c' }}>{t('login.hero2')}</span>
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, fontSize: '0.95rem', marginBottom: 40 }}>
              {t('login.heroDesc')}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { icon: '👥', fr: 'Personnel', en: 'Staff' },
                { icon: '🤝', fr: 'Volontaires', en: 'Volunteers' },
                { icon: '📦', fr: 'Stock', en: 'Inventory' },
                { icon: '🎯', fr: 'Projets', en: 'Projects' },
              ].map(item => (
                <div key={item.fr} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '11px 14px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.85)' }}>
                  {item.icon} {lang === 'fr' ? item.fr : item.en}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div style={{ width: '100%', maxWidth: 460, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 32px', minHeight: 500 }}>
          <div style={{ width: '100%', maxWidth: 380 }}>

            {/* Logo (navy version) for white panel */}
            <div style={{ marginBottom: 24, textAlign: 'center' }}>
              <img src={logoLight} alt="LHM Madagascar" style={{ height: 44, objectFit: 'contain' }} />
            </div>

            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.6rem', color: 'var(--navy)', marginBottom: 6 }}>
              {t('login.title')}
            </h3>
            <p style={{ color: 'var(--gray-500)', fontSize: '0.88rem', marginBottom: 28 }}>
              {t('login.subtitle')}
            </p>

            {error && (
              <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 9, padding: '12px 16px', color: '#991b1b', fontSize: '0.85rem', marginBottom: 20 }}>
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 16 }}>
                <label>{t('login.email')}</label>
                <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="votre@email.com" required />
              </div>
              <div style={{ marginBottom: 22 }}>
                <label>{t('login.password')}</label>
                <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="••••••••" required />
              </div>
              <button type="submit" disabled={loading}
                style={{ width: '100%', background: 'linear-gradient(135deg, var(--navy), #1a3a6e)', color: 'white', border: 'none', borderRadius: 10, padding: '13px', fontSize: '0.95rem', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.8 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {loading
                  ? <><div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> {t('login.loading')}</>
                  : t('login.submit')}
              </button>
            </form>

            <DemoAccounts demoLogins={demoLogins} onSelect={d => setForm({ email: d.email, password: d.pwd })} t={t} />
          </div>
        </div>
      </div>
    </div>
  );
}
