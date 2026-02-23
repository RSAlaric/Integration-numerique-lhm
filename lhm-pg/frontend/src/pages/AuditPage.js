import React, { useEffect, useState } from 'react';
import { dashboardAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const ACTION_STYLES = {
  LOGIN: { cls: 'badge-green', icon: '🔑' },
  LOGOUT: { cls: 'badge-gray', icon: '🚪' },
  CREATE: { cls: 'badge-blue', icon: '➕' },
  UPDATE: { cls: 'badge-orange', icon: '✏️' },
  DELETE: { cls: 'badge-red', icon: '🗑️' },
  ACCOUNT_LOCKED: { cls: 'badge-red', icon: '🔒' },
  LOGIN_ODD_HOURS: { cls: 'badge-orange', icon: '⚠️' },
  STOCK_ENTRY: { cls: 'badge-green', icon: '⬆' },
  STOCK_EXIT: { cls: 'badge-red', icon: '⬇' },
  LEAVE_REQUEST: { cls: 'badge-orange', icon: '📅' },
  LEAVE_VALIDATED: { cls: 'badge-blue', icon: '✅' },
  PASSWORD_CHANGE: { cls: 'badge-navy', icon: '🔐' },
};

export default function AuditPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { can } = useAuth();

  useEffect(() => {
    if (!can(['admin'])) return;
    dashboardAPI.audit().then(res => setLogs(res.data)).finally(() => setLoading(false));
  }, []);

  if (!can(['admin'])) return (
    <div className="empty-state" style={{ paddingTop: 80 }}>
      <div className="empty-icon">🔒</div>
      <div className="empty-text">Accès réservé aux administrateurs</div>
    </div>
  );

  const filtered = logs.filter(l =>
    !search || l.action?.toLowerCase().includes(search.toLowerCase()) ||
    l.object?.toLowerCase().includes(search.toLowerCase()) ||
    l.userId?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, color: 'var(--navy)' }}>Journal d'Audit</h1>
        <p style={{ color: 'var(--gray-500)', fontSize: 13, marginTop: 2 }}>Historique des actions — rétention 2 ans • Immuable</p>
      </div>

      {/* NOTICE */}
      <div className="alert alert-green" style={{ marginBottom: 20 }}>
        <span>🛡️</span>
        <span>Ce journal est <strong>immuable</strong> : aucune entrée ne peut être modifiée ou supprimée. Conformité RGPD assurée.</span>
      </div>

      <div className="toolbar">
        <div className="toolbar-left">
          <div className="search-bar">
            <span className="search-icon">🔍</span>
            <input placeholder="Filtrer par action, objet, utilisateur..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <span style={{ fontSize: 13, color: 'var(--gray-500)' }}>{filtered.length} entrées</span>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Date & Heure</th>
                <th>Utilisateur</th>
                <th>Action</th>
                <th>Objet</th>
                <th>Détails</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }}/></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5}><div className="empty-state"><div className="empty-icon">🔍</div><div className="empty-text">Aucun log trouvé</div></div></td></tr>
              ) : filtered.map((log, i) => {
                const style = ACTION_STYLES[log.action] || { cls: 'badge-gray', icon: '•' };
                return (
                  <tr key={log.id || i}>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <div style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--gray-600)' }}>
                        {new Date(log.timestamp).toLocaleString('fr-FR')}
                      </div>
                    </td>
                    <td>
                      <div className="avatar avatar-sm" style={{ display: 'inline-flex', marginRight: 6 }}>{log.userId?.[0]?.toUpperCase()}</div>
                      <span style={{ fontSize: 12, color: 'var(--gray-600)' }}>{log.userId}</span>
                    </td>
                    <td>
                      <span className={`badge ${style.cls}`} style={{ fontFamily: 'monospace', fontSize: 11 }}>
                        {style.icon} {log.action}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, fontSize: 13 }}>{log.object}</td>
                    <td style={{ fontSize: 12, color: 'var(--gray-500)', maxWidth: 240 }}>
                      {log.oldValue && <span style={{ color: 'var(--red)', marginRight: 6 }}>⊖ {String(log.oldValue).substring(0, 40)}</span>}
                      {log.newValue && <span style={{ color: 'var(--green)' }}>⊕ {String(log.newValue).substring(0, 40)}</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
