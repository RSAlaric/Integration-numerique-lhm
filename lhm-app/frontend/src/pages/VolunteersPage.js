import React, { useEffect, useState, useCallback } from 'react';
import { volunteersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const STATUSES = [
  { value: 'enrolled', label: 'Inscrit', cls: 'badge-gray' },
  { value: 'evaluated', label: 'Évalué', cls: 'badge-blue' },
  { value: 'assigned', label: 'Affecté', cls: 'badge-orange' },
  { value: 'active', label: 'Actif', cls: 'badge-green' },
  { value: 'recognized', label: 'Reconnu', cls: 'badge-gold' },
];
const SKILLS = ['Opérateur de saisie','Correcteur BCC','Gestionnaire de stock','Volontaire BCC','Volontaire technicien Radio'];
const PIPELINE_LABELS = ['Inscrit','Évalué','Affecté','Actif','Reconnu'];

export default function VolunteersPage() {
  const [volunteers, setVolunteers] = useState([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [skillFilter, setSkillFilter] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingVol, setEditingVol] = useState(null);
  const [form, setForm] = useState({});
  const { can } = useAuth();
  const limit = 15;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [vRes, sRes] = await Promise.all([
        volunteersAPI.list({ search, status: statusFilter, skill: skillFilter, page, limit }),
        volunteersAPI.stats(),
      ]);
      setVolunteers(vRes.data.data);
      setTotal(vRes.data.total);
      setStats(sRes.data);
    } finally { setLoading(false); }
  }, [search, statusFilter, skillFilter, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => {
    setEditingVol(null);
    setForm({ firstName: '', lastName: '', phone: '', email: '', motivation: '', skills: [], availability: { days: [], slots: [], frequency: 'Régulier' }, restrictions: '' });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      if (editingVol) { await volunteersAPI.update(editingVol.id, form); toast.success('Volontaire mis à jour'); }
      else { await volunteersAPI.create(form); toast.success('Volontaire créé'); }
      setShowModal(false); fetchData();
    } catch (err) { toast.error(err.response?.data?.error || 'Erreur'); }
  };

  const handleStatusChange = async (vol, newStatus) => {
    try {
      await volunteersAPI.update(vol.id, { ...vol, status: newStatus });
      toast.success('Statut mis à jour'); fetchData();
    } catch { toast.error('Erreur'); }
  };

  const getInitials = (v) => `${v.firstName?.[0] || ''}${v.lastName?.[0] || ''}`.toUpperCase();
  const getPipelineIndex = (status) => STATUSES.findIndex(s => s.value === status);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, color: 'var(--navy)' }}>Gestion des Volontaires</h1>
          <p style={{ color: 'var(--gray-500)', fontSize: 13, marginTop: 2 }}>{total} volontaires au total</p>
        </div>
        {can(['admin', 'coordinateur', 'responsable_volontaires']) && (
          <button className="btn btn-primary" onClick={openCreate}>+ Nouveau Volontaire</button>
        )}
      </div>

      {/* STATS CARDS */}
      {stats && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          {STATUSES.map(s => (
            <div key={s.value} className="card" style={{ padding: '12px 20px', cursor: 'pointer', transition: 'transform 0.2s' }}
              onClick={() => setStatusFilter(statusFilter === s.value ? '' : s.value)}>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--navy)' }}>{stats.byStatus[s.value] || 0}</div>
              <div style={{ fontSize: 11, color: 'var(--gray-500)' }}><span className={`badge ${s.cls}`} style={{ fontSize: 10 }}>{s.label}</span></div>
            </div>
          ))}
        </div>
      )}

      {/* FILTERS */}
      <div className="toolbar">
        <div className="toolbar-left">
          <div className="search-bar">
            <span className="search-icon">🔍</span>
            <input placeholder="Rechercher un volontaire..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <select className="form-control" style={{ width: 'auto', minWidth: 150 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">Tous les statuts</option>
            {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <select className="form-control" style={{ width: 'auto', minWidth: 180 }} value={skillFilter} onChange={e => setSkillFilter(e.target.value)}>
            <option value="">Toutes les compétences</option>
            {SKILLS.map(sk => <option key={sk} value={sk}>{sk}</option>)}
          </select>
        </div>
      </div>

      {/* TABLE */}
      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Volontaire</th>
                <th>Compétences</th>
                <th>Disponibilité</th>
                <th>Pipeline</th>
                <th>Statut</th>
                {can(['admin','coordinateur','responsable_volontaires']) && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }} /></td></tr>
              ) : volunteers.length === 0 ? (
                <tr><td colSpan={6}><div className="empty-state"><div className="empty-icon">🤝</div><div className="empty-text">Aucun volontaire trouvé</div></div></td></tr>
              ) : volunteers.map(v => {
                const pIdx = getPipelineIndex(v.status);
                const stObj = STATUSES.find(s => s.value === v.status);
                return (
                  <tr key={v.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="avatar avatar-sm">{getInitials(v)}</div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{v.firstName} {v.lastName}</div>
                          <div style={{ fontSize: 11, color: 'var(--gray-500)' }}>{v.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', maxWidth: 200 }}>
                        {v.skills?.slice(0, 2).map(sk => <span key={sk} className="badge badge-navy" style={{ fontSize: 10 }}>{sk.split(' ')[0]}</span>)}
                        {v.skills?.length > 2 && <span className="badge badge-gray" style={{ fontSize: 10 }}>+{v.skills.length - 2}</span>}
                      </div>
                    </td>
                    <td style={{ fontSize: 12 }}>
                      <div>{v.availability?.frequency}</div>
                      <div style={{ color: 'var(--gray-400)' }}>{v.availability?.slots?.join(', ')}</div>
                    </td>
                    <td style={{ width: 160 }}>
                      <div className="pipeline">
                        {STATUSES.map((s, i) => (
                          <div key={s.value} className="pipeline-step">
                            <div className={`pipeline-node ${i < pIdx ? 'done' : i === pIdx ? 'current' : ''}`} title={s.label}>
                              {i < pIdx ? '✓' : i + 1}
                            </div>
                            {i < STATUSES.length - 1 && <div className={`pipeline-line ${i < pIdx ? 'done' : ''}`} />}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td><span className={`badge ${stObj?.cls}`}>{stObj?.label}</span></td>
                    {can(['admin','coordinateur','responsable_volontaires']) && (
                      <td>
                        <select className="form-control" style={{ fontSize: 12, padding: '4px 8px', width: 120 }}
                          value={v.status} onChange={e => handleStatusChange(v, e.target.value)}>
                          {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '16px 24px' }}>
          <div className="pagination">
            <span className="pagination-info">{Math.min((page-1)*limit+1, total)}–{Math.min(page*limit, total)} sur {total}</span>
            <div className="pagination-controls">
              <button className="page-btn" onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1}>←</button>
              <button className="page-btn" onClick={() => setPage(p => Math.min(Math.ceil(total/limit), p+1))} disabled={page>=Math.ceil(total/limit)}>→</button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editingVol ? 'Modifier Volontaire' : 'Nouveau Volontaire'}</h2>
              <button className="btn btn-outline btn-sm btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group"><label className="form-label">Prénom *</label><input className="form-control" value={form.firstName||''} onChange={e=>setForm({...form,firstName:e.target.value})}/></div>
                <div className="form-group"><label className="form-label">Nom *</label><input className="form-control" value={form.lastName||''} onChange={e=>setForm({...form,lastName:e.target.value})}/></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Téléphone</label><input className="form-control" value={form.phone||''} onChange={e=>setForm({...form,phone:e.target.value})}/></div>
                <div className="form-group"><label className="form-label">Email</label><input type="email" className="form-control" value={form.email||''} onChange={e=>setForm({...form,email:e.target.value})}/></div>
              </div>
              <div className="form-group"><label className="form-label">Motivation</label><textarea className="form-control" rows={3} value={form.motivation||''} onChange={e=>setForm({...form,motivation:e.target.value})}/></div>
              <div className="form-group">
                <label className="form-label">Compétences</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {SKILLS.map(sk => (
                    <label key={sk} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, cursor: 'pointer' }}>
                      <input type="checkbox" checked={(form.skills||[]).includes(sk)}
                        onChange={e => setForm({ ...form, skills: e.target.checked ? [...(form.skills||[]), sk] : (form.skills||[]).filter(s => s !== sk) })} />
                      {sk}
                    </label>
                  ))}
                </div>
              </div>
              <div className="form-group"><label className="form-label">Restrictions / Notes</label><input className="form-control" value={form.restrictions||''} onChange={e=>setForm({...form,restrictions:e.target.value})}/></div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Annuler</button>
              <button className="btn btn-primary" onClick={handleSave}>{editingVol ? '💾 Enregistrer' : '✅ Créer'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
