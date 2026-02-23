import React, { useEffect, useState } from 'react';
import { Card, CardHeader, Btn, Badge, Modal, FormRow, FormField, Spinner, KPICard } from '../components/ui/Card';
import api from '../utils/api';
import toast from 'react-hot-toast';

const defaultForm = { nom: '', description: '', date_debut: '', date_fin_prevue: '', budget: '', responsable_id: '' };

const statusLabel = { 'planifié': 'Planifié', 'en_cours': 'En cours', 'terminé': 'Terminé', 'suspendu': 'Suspendu' };

function printProjetsPDF(projects) {
  const now = new Date().toLocaleDateString('fr-FR', {year:'numeric',month:'long',day:'numeric'});
  const w = window.open('','_blank','width=1100,height=750');
  w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"/>
<title>Liste des Projets — LHM Madagascar</title>
<style>
@page{size:A4 landscape;margin:12mm 10mm}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Arial,sans-serif;font-size:9.5px;color:#222}
.hdr{display:flex;align-items:center;gap:14px;margin-bottom:12px;padding-bottom:10px;border-bottom:3px solid #0f2044}
.hdr h1{font-size:14px;color:#0f2044;font-weight:700}.hdr p{font-size:9px;color:#666;margin-top:2px}
.stats{display:flex;gap:12px;margin-bottom:10px}
.stat{background:#f0f4ff;border:1px solid #dbeafe;border-radius:7px;padding:5px 14px}
.sn{font-size:15px;font-weight:700;color:#0f2044}.sl{font-size:8px;color:#6b7280}
table{width:100%;border-collapse:collapse}
thead tr{background:#0f2044;color:white}
th{padding:6px 8px;text-align:left;font-size:8px;font-weight:600}
tbody tr:nth-child(even){background:#f8faff}
td{padding:5px 8px;border-bottom:1px solid #e5e7eb;vertical-align:middle}
.badge{display:inline-block;padding:2px 7px;border-radius:8px;font-size:7.5px;font-weight:600}
.planifie{background:#dbeafe;color:#1e40af}
.en_cours{background:#fef9c3;color:#854d0e}
.termine{background:#dcfce7;color:#166534}
.suspendu{background:#fee2e2;color:#991b1b}
.retard{background:#fee2e2;color:#991b1b;font-size:7px;padding:1px 5px;border-radius:4px;margin-left:4px}
.progress-bg{background:#e5e7eb;border-radius:4px;height:7px;width:80px}
.bold{font-weight:600;color:#0f2044}
.ftr{margin-top:10px;text-align:center;font-size:8px;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:5px}
</style></head><body>
<div class="hdr">
  <div>
    <h1>🎯 Liste des Projets — LHM Madagascar</h1>
    <p>Imprimé le ${now} &nbsp;|&nbsp; ${projects.length} projet(s)</p>
  </div>
</div>
<div class="stats">
  <div class="stat"><div class="sn">${projects.length}</div><div class="sl">Total projets</div></div>
  <div class="stat"><div class="sn">${projects.filter(p=>p.statut==='en_cours').length}</div><div class="sl">En cours ⚡</div></div>
  <div class="stat"><div class="sn">${projects.filter(p=>p.statut==='terminé').length}</div><div class="sl">Terminés ✅</div></div>
  <div class="stat"><div class="sn">${projects.filter(p=>p.en_retard).length}</div><div class="sl">En retard ⚠️</div></div>
  <div class="stat"><div class="sn">${(projects.reduce((a,p)=>a+(p.budget||0),0)/1000000).toFixed(1)}M Ar</div><div class="sl">Budget total</div></div>
</div>
<table><thead><tr>
  <th>N°</th><th>Nom du projet</th><th>Statut</th><th>Responsable</th>
  <th>Date début</th><th>Date fin prévue</th><th>Avancement</th>
  <th>Budget alloué</th><th>Budget consommé</th>
</tr></thead><tbody>
${projects.map((p,i)=>{
  const sc = p.statut?.replace('é','e') || 'planifie';
  const sl = statusLabel[p.statut] || p.statut;
  const deb = p.date_debut ? new Date(p.date_debut).toLocaleDateString('fr-FR') : '—';
  const fin = p.date_fin_prevue ? new Date(p.date_fin_prevue).toLocaleDateString('fr-FR') : '—';
  const pct = Math.min(100, p.avancement || 0);
  return `<tr>
    <td style="color:#9ca3af;font-weight:700">${i+1}</td>
    <td class="bold">${p.nom}${p.en_retard?'<span class="retard">⚠️ RETARD</span>':''}</td>
    <td><span class="badge ${sc}">${sl}</span></td>
    <td>${p.responsable_nom||'—'}</td>
    <td>${deb}</td>
    <td>${fin}</td>
    <td>
      <div style="display:flex;align-items:center;gap:5px">
        <div class="progress-bg"><div style="height:100%;width:${pct}%;background:${pct===100?'#16a34a':'#c9a84c'};border-radius:4px"></div></div>
        <span style="font-weight:700;font-size:8px">${pct}%</span>
      </div>
    </td>
    <td style="font-weight:700">${((p.budget||0)/1000000).toFixed(2)}M Ar</td>
    <td style="font-weight:700;color:${(p.budget_consomme||0)>(p.budget||0)?'#dc2626':'#16a34a'}">${((p.budget_consomme||0)/1000000).toFixed(2)}M Ar</td>
  </tr>`;
}).join('')}
</tbody></table>
<div class="ftr">LHM Madagascar — Feon'ny Filazantsara — ${projects.length} projet(s) — ${now}</div>
</body></html>`);
  w.document.close(); w.onload = () => w.print();
}

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
  const statusLabelUI = { 'planifié': '🗓️ Planifié', 'en_cours': '⚡ En cours', 'terminé': '✅ Terminé', 'suspendu': '⏸️ Suspendu' };

  const [search, setSearch] = React.useState('');
  const filteredProjects = projects.filter(p => !search || p.nom.toLowerCase().includes(search.toLowerCase()) || (p.responsable_nom||'').toLowerCase().includes(search.toLowerCase()));

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

      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un projet…" style={{ paddingLeft: 32, width: 220 }} />
          </div>
          <Btn variant="secondary" onClick={() => printProjetsPDF(filteredProjects)}>🖨️ Imprimer PDF</Btn>
        </div>
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
