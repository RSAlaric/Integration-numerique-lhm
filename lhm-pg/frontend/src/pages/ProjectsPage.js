import React, { useEffect, useState } from 'react';
import { Card, CardHeader, Btn, Badge, Modal, FormRow, FormField, Spinner, KPICard } from '../components/ui/Card';
import api from '../utils/api';
import toast from 'react-hot-toast';

const defaultForm = { nom: '', description: '', date_debut: '', date_fin_prevue: '', budget: '', responsable_id: '' };

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    document.getElementById('page-title') && (document.getElementById('page-title').textContent = 'Projets');
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [p, s, u] = await Promise.all([api.get('/projects'), api.get('/projects/stats'), api.get('/users').catch(() => ({ data: { data: [] } }))]);
      setProjects(p.data.data); setStats(s.data.data); setUsers(u.data.data || []);
    } catch { toast.error('Erreur'); }
    finally { setLoading(false); }
  };

  const handleCreate = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await api.post('/projects', form);
      toast.success('Projet créé');
      setModalOpen(false); loadData();
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur'); }
    finally { setSaving(false); }
  };

  const handleUpdate = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await api.put(`/projects/${editModal.id}`, editForm);
      toast.success('Projet mis à jour');
      setEditModal(null); loadData();
    } catch (err) { toast.error('Erreur'); }
    finally { setSaving(false); }
  };

  const statusColor = { 'planifié': 'info', 'en_cours': 'gold', 'terminé': 'success', 'suspendu': 'error' };
  const statusLabel = { 'planifié': '🗓️ Planifié', 'en_cours': '⚡ En cours', 'terminé': '✅ Terminé', 'suspendu': '⏸️ Suspendu' };

  return (
    <div className="animate-fade">
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 20 }}>
          <KPICard icon="🎯" label="Total projets" value={stats.total} color="var(--navy)" />
          <KPICard icon="⚡" label="En cours" value={stats.enCours} color="var(--gold-dark)" />
          <KPICard icon="✅" label="Terminés" value={stats.termines} color="var(--emerald)" />
          <KPICard icon="⚠️" label="En retard" value={stats.enRetard} color={stats.enRetard > 0 ? 'var(--red)' : 'var(--emerald)'} />
          <KPICard icon="💸" label="Budget consommé" value={`${(stats.budgetConsomme/1000000).toFixed(1)}M Ar`} color="var(--blue-accent)" />
        </div>
      )}

      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <Btn variant="gold" onClick={() => { setForm(defaultForm); setModalOpen(true); }}>➕ Nouveau projet</Btn>
      </div>

      {loading ? <Spinner /> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 18 }}>
          {projects.map(p => (
            <div key={p.id} style={{ background: 'white', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', overflow: 'hidden', borderTop: `4px solid ${p.en_retard ? 'var(--red)' : p.statut === 'terminé' ? 'var(--emerald)' : 'var(--gold)'}` }}>
              <div style={{ padding: '20px 22px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.05rem', color: 'var(--navy)', flex: 1, paddingRight: 10 }}>{p.nom}</h3>
                  <Badge type={statusColor[p.statut]}>{statusLabel[p.statut]}</Badge>
                </div>
                {p.en_retard && <div style={{ background: '#fee2e2', borderRadius: 6, padding: '6px 10px', fontSize: '0.75rem', color: '#991b1b', marginBottom: 10, fontWeight: 600 }}>⚠️ Projet en retard</div>}
                <p style={{ fontSize: '0.83rem', color: 'var(--gray-500)', marginBottom: 14, lineHeight: 1.5 }}>{p.description}</p>

                {/* Avancement */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)', fontWeight: 600 }}>Avancement</span>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--navy)' }}>{p.avancement}%</span>
                  </div>
                  <div style={{ height: 8, borderRadius: 4, background: 'var(--gray-100)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${p.avancement}%`, background: p.avancement === 100 ? 'var(--emerald)' : 'linear-gradient(90deg, var(--navy), var(--gold))', borderRadius: 4, transition: 'width 0.5s ease' }} />
                  </div>
                </div>

                {/* Budget */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                  <div style={{ background: 'var(--gray-50)', borderRadius: 7, padding: '10px 12px' }}>
                    <p style={{ fontSize: '0.7rem', color: 'var(--gray-400)', marginBottom: 2 }}>Budget alloué</p>
                    <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--navy)' }}>{(p.budget/1000000).toFixed(1)}M Ar</p>
                  </div>
                  <div style={{ background: 'var(--gray-50)', borderRadius: 7, padding: '10px 12px' }}>
                    <p style={{ fontSize: '0.7rem', color: 'var(--gray-400)', marginBottom: 2 }}>Consommé</p>
                    <p style={{ fontSize: '0.9rem', fontWeight: 700, color: p.budget_consomme > p.budget ? 'var(--red)' : 'var(--emerald)' }}>{(p.budget_consomme/1000000).toFixed(1)}M Ar</p>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontSize: '0.73rem', color: 'var(--gray-400)' }}>👤 {p.responsable_nom}</p>
                    <p style={{ fontSize: '0.73rem', color: 'var(--gray-400)' }}>📅 Fin prévue: {new Date(p.date_fin_prevue).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <Btn size="sm" variant="secondary" onClick={() => { setEditModal(p); setEditForm({ avancement: p.avancement, budget_consomme: p.budget_consomme, statut: p.statut, risques: p.risques?.join(', ') || '' }); }}>✏️ Mettre à jour</Btn>
                </div>
              </div>
            </div>
          ))}

          {projects.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 60, color: 'var(--gray-400)' }}>
              <p style={{ fontSize: '2rem', marginBottom: 12 }}>🎯</p>
              <p>Aucun projet enregistré. Créez votre premier projet !</p>
            </div>
          )}
        </div>
      )}

      {/* Modal création */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nouveau projet">
        <form onSubmit={handleCreate} style={{ padding: 24 }}>
          <FormRow cols={1}><FormField label="Nom du projet" required><input value={form.nom} onChange={e => setForm({...form, nom: e.target.value})} required /></FormField></FormRow>
          <FormRow cols={1}><FormField label="Description"><textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3} style={{ resize: 'vertical' }} /></FormField></FormRow>
          <FormRow>
            <FormField label="Date de début"><input type="date" value={form.date_debut} onChange={e => setForm({...form, date_debut: e.target.value})} /></FormField>
            <FormField label="Date de fin prévue"><input type="date" value={form.date_fin_prevue} onChange={e => setForm({...form, date_fin_prevue: e.target.value})} /></FormField>
          </FormRow>
          <FormRow>
            <FormField label="Budget (Ar)"><input type="number" value={form.budget} onChange={e => setForm({...form, budget: e.target.value})} /></FormField>
            <FormField label="Responsable">
              <select value={form.responsable_id} onChange={e => setForm({...form, responsable_id: e.target.value})}>
                <option value="">— Sélectionner —</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.prenom} {u.nom}</option>)}
              </select>
            </FormField>
          </FormRow>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 16, borderTop: '1px solid var(--gray-100)' }}>
            <Btn type="button" variant="secondary" onClick={() => setModalOpen(false)}>Annuler</Btn>
            <Btn type="submit" variant="gold" disabled={saving}>{saving ? '...' : '🎯 Créer le projet'}</Btn>
          </div>
        </form>
      </Modal>

      {/* Modal update */}
      {editModal && (
        <Modal open={!!editModal} onClose={() => setEditModal(null)} title={`Mise à jour — ${editModal.nom}`}>
          <form onSubmit={handleUpdate} style={{ padding: 24 }}>
            <FormRow>
              <FormField label="Avancement (%)">
                <input type="number" min={0} max={100} value={editForm.avancement} onChange={e => setEditForm({...editForm, avancement: Number(e.target.value)})} />
              </FormField>
              <FormField label="Budget consommé (Ar)">
                <input type="number" value={editForm.budget_consomme} onChange={e => setEditForm({...editForm, budget_consomme: Number(e.target.value)})} />
              </FormField>
            </FormRow>
            <FormRow cols={1}>
              <FormField label="Statut">
                <select value={editForm.statut} onChange={e => setEditForm({...editForm, statut: e.target.value})}>
                  <option value="planifié">Planifié</option>
                  <option value="en_cours">En cours</option>
                  <option value="terminé">Terminé</option>
                  <option value="suspendu">Suspendu</option>
                </select>
              </FormField>
            </FormRow>
            <FormRow cols={1}><FormField label="Risques identifiés (séparés par virgule)"><input value={editForm.risques} onChange={e => setEditForm({...editForm, risques: e.target.value})} placeholder="Risque 1, Risque 2..." /></FormField></FormRow>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 16, borderTop: '1px solid var(--gray-100)' }}>
              <Btn type="button" variant="secondary" onClick={() => setEditModal(null)}>Annuler</Btn>
              <Btn type="submit" variant="gold" disabled={saving}>{saving ? '...' : '💾 Sauvegarder'}</Btn>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
