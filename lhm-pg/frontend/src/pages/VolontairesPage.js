import React, { useEffect, useState } from 'react';
import { Card, CardHeader, Table, Btn, Badge, Modal, FormRow, FormField, SearchBar, Spinner } from '../components/ui/Card';
import api from '../utils/api';
import toast from 'react-hot-toast';

const COMPETENCES = ['Opérateur de saisie', 'Correcteur BCC', 'Gestionnaire de stock', 'Volontaire BCC', 'Volontaire Technicien Radio'];
const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const WORKFLOW = [
  { key: 'enregistré', label: 'Enregistré', icon: '📝', color: '#6b7280' },
  { key: 'validé', label: 'Profil validé', icon: '✅', color: '#1a7a4a' },
  { key: 'affecté', label: 'Affecté', icon: '📋', color: '#2980b9' },
  { key: 'participé', label: 'A participé', icon: '🙌', color: '#c9a84c' },
  { key: 'évalué', label: 'Évalué', icon: '⭐', color: '#7c3aed' },
  { key: 'reconnu', label: 'Reconnu', icon: '🏆', color: '#c0392b' },
];

const defaultForm = { nom: '', prenom: '', email: '', telephone: '', date_naissance: '', motivation: '', competences: [], disponibilites: { jours: [], periodes: [], type: 'régulier' } };

export default function VolontairesPage() {
  const [volunteers, setVolunteers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterComp, setFilterComp] = useState('');
  const [filterWorkflow, setFilterWorkflow] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [detailModal, setDetailModal] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    document.getElementById('page-title') && (document.getElementById('page-title').textContent = 'Gestion des Volontaires');
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [v, s] = await Promise.all([api.get('/volunteers'), api.get('/volunteers/stats')]);
      setVolunteers(v.data.data); setStats(s.data.data);
    } catch { toast.error('Erreur'); }
    finally { setLoading(false); }
  };

  const filtered = volunteers.filter(v => {
    const s = search.toLowerCase();
    const matchSearch = !s || v.nom?.toLowerCase().includes(s) || v.prenom?.toLowerCase().includes(s);
    const matchComp = !filterComp || (v.competences && v.competences.includes(filterComp));
    const matchWf = !filterWorkflow || v.statut_workflow === filterWorkflow;
    return matchSearch && matchComp && matchWf;
  });

  const handleCreate = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await api.post('/volunteers', form);
      toast.success('Volontaire enregistré');
      setModalOpen(false); loadData();
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur'); }
    finally { setSaving(false); }
  };

  const handleAdvanceWorkflow = async (id) => {
    try {
      const r = await api.put(`/volunteers/${id}/workflow`);
      toast.success(r.data.message);
      loadData();
      if (detailModal) setDetailModal({ ...detailModal, statut_workflow: r.data.data.statut_workflow });
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur'); }
  };

  const toggleComp = (c) => {
    const arr = form.competences.includes(c) ? form.competences.filter(x => x !== c) : [...form.competences, c];
    setForm({ ...form, competences: arr });
  };

  const toggleJour = (j) => {
    const arr = form.disponibilites.jours.includes(j) ? form.disponibilites.jours.filter(x => x !== j) : [...form.disponibilites.jours, j];
    setForm({ ...form, disponibilites: { ...form.disponibilites, jours: arr } });
  };

  const wfInfo = (key) => WORKFLOW.find(w => w.key === key) || WORKFLOW[0];

  const columns = [
    { key: 'nom', header: 'Volontaire', render: (_, r) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, var(--navy), var(--navy-light))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '0.8rem', flexShrink: 0 }}>
          {r.prenom?.[0]}{r.nom?.[0]}
        </div>
        <div>
          <p style={{ fontWeight: 600, color: 'var(--navy)' }}>{r.prenom} {r.nom}</p>
          <p style={{ fontSize: '0.73rem', color: 'var(--gray-400)' }}>{r.email}</p>
        </div>
      </div>
    )},
    { key: 'competences', header: 'Compétences', render: v => (
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {(v || []).slice(0, 2).map(c => <Badge key={c} type="info">{c}</Badge>)}
        {(v || []).length > 2 && <Badge>+{v.length - 2}</Badge>}
      </div>
    )},
    { key: 'statut_workflow', header: 'Workflow', render: v => {
      const w = wfInfo(v);
      return <Badge style={{ background: `${w.color}20`, color: w.color }}>{w.icon} {w.label}</Badge>;
    }},
    { key: 'disponibilites', header: 'Disponibilité', render: v => <span style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>{v?.type || '—'}</span> },
    { key: 'created_at', header: 'Inscrit le', render: v => new Date(v).toLocaleDateString('fr-FR') },
    { key: 'actions', header: '', render: (_, r) => (
      <div style={{ display: 'flex', gap: 6 }}>
        <Btn size="sm" variant="secondary" onClick={() => setDetailModal(r)}>👁️ Détail</Btn>
        <Btn size="sm" variant="gold" onClick={() => handleAdvanceWorkflow(r.id)}>→ Avancer</Btn>
      </div>
    )}
  ];

  return (
    <div className="animate-fade">
      {/* Stats workflow */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, marginBottom: 20 }}>
          {WORKFLOW.map(w => (
            <div key={w.key} style={{ background: 'white', borderRadius: 10, boxShadow: 'var(--shadow)', padding: '14px 16px', borderLeft: `4px solid ${w.color}`, cursor: 'pointer' }} onClick={() => setFilterWorkflow(filterWorkflow === w.key ? '' : w.key)}>
              <p style={{ fontSize: '1.3rem', marginBottom: 4 }}>{w.icon}</p>
              <p style={{ fontSize: '1.4rem', fontWeight: 700, color: w.color, lineHeight: 1 }}>{stats.parWorkflow?.[w.key] || 0}</p>
              <p style={{ fontSize: '0.7rem', color: 'var(--gray-500)', marginTop: 3 }}>{w.label}</p>
            </div>
          ))}
        </div>
      )}

      <Card>
        <CardHeader
          title="Gestion des Volontaires"
          subtitle={`${filtered.length} volontaire(s)`}
          action={<Btn variant="gold" onClick={() => { setForm(defaultForm); setModalOpen(true); }}>➕ Nouveau volontaire</Btn>}
        />
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}><SearchBar value={search} onChange={setSearch} placeholder="Rechercher..." /></div>
          <select value={filterComp} onChange={e => setFilterComp(e.target.value)} style={{ width: 'auto' }}>
            <option value="">Toutes compétences</option>
            {COMPETENCES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        {loading ? <Spinner /> : <Table columns={columns} data={filtered} emptyMessage="Aucun volontaire enregistré" />}
      </Card>

      {/* Modal création */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nouveau volontaire" width={600}>
        <form onSubmit={handleCreate} style={{ padding: 24 }}>
          <FormRow>
            <FormField label="Prénom" required><input value={form.prenom} onChange={e => setForm({...form, prenom: e.target.value})} required /></FormField>
            <FormField label="Nom" required><input value={form.nom} onChange={e => setForm({...form, nom: e.target.value})} required /></FormField>
          </FormRow>
          <FormRow>
            <FormField label="Email"><input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></FormField>
            <FormField label="Téléphone"><input value={form.telephone} onChange={e => setForm({...form, telephone: e.target.value})} /></FormField>
          </FormRow>
          <FormRow>
            <FormField label="Date de naissance"><input type="date" value={form.date_naissance} onChange={e => setForm({...form, date_naissance: e.target.value})} /></FormField>
            <FormField label="Type de disponibilité">
              <select value={form.disponibilites.type} onChange={e => setForm({...form, disponibilites: {...form.disponibilites, type: e.target.value}})}>
                <option value="régulier">Régulier</option>
                <option value="occasionnel">Occasionnel</option>
              </select>
            </FormField>
          </FormRow>
          <div style={{ marginBottom: 16 }}>
            <label>Compétences</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
              {COMPETENCES.map(c => (
                <button key={c} type="button" onClick={() => toggleComp(c)} style={{ padding: '6px 14px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 600, border: `2px solid ${form.competences.includes(c) ? 'var(--navy)' : 'var(--gray-200)'}`, background: form.competences.includes(c) ? 'var(--navy)' : 'white', color: form.competences.includes(c) ? 'white' : 'var(--gray-500)', cursor: 'pointer' }}>
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label>Jours de disponibilité</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
              {JOURS.map(j => (
                <button key={j} type="button" onClick={() => toggleJour(j)} style={{ padding: '5px 12px', borderRadius: 6, fontSize: '0.78rem', fontWeight: 600, border: `2px solid ${form.disponibilites.jours.includes(j) ? 'var(--gold)' : 'var(--gray-200)'}`, background: form.disponibilites.jours.includes(j) ? 'var(--gold)' : 'white', color: form.disponibilites.jours.includes(j) ? 'white' : 'var(--gray-500)', cursor: 'pointer' }}>
                  {j.substring(0, 3)}
                </button>
              ))}
            </div>
          </div>
          <FormRow cols={1}>
            <FormField label="Motivation"><textarea value={form.motivation} onChange={e => setForm({...form, motivation: e.target.value})} rows={3} style={{ resize: 'vertical' }} /></FormField>
          </FormRow>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 16, borderTop: '1px solid var(--gray-100)' }}>
            <Btn type="button" variant="secondary" onClick={() => setModalOpen(false)}>Annuler</Btn>
            <Btn type="submit" variant="gold" disabled={saving}>{saving ? 'Enregistrement...' : '🤝 Enregistrer le volontaire'}</Btn>
          </div>
        </form>
      </Modal>

      {/* Detail modal */}
      {detailModal && (
        <Modal open={!!detailModal} onClose={() => setDetailModal(null)} title={`${detailModal.prenom} ${detailModal.nom}`} width={560}>
          <div style={{ padding: 24 }}>
            <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, var(--navy), var(--navy-light))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '1.2rem' }}>
                {detailModal.prenom?.[0]}{detailModal.nom?.[0]}
              </div>
              <div>
                <h3 style={{ fontFamily: "'Playfair Display', serif", color: 'var(--navy)' }}>{detailModal.prenom} {detailModal.nom}</h3>
                <p style={{ color: 'var(--gray-500)', fontSize: '0.85rem' }}>{detailModal.email}</p>
                <p style={{ color: 'var(--gray-500)', fontSize: '0.85rem' }}>{detailModal.telephone}</p>
              </div>
            </div>

            {/* Workflow visuel */}
            <div style={{ background: 'var(--gray-50)', borderRadius: 10, padding: '16px 20px', marginBottom: 16 }}>
              <p style={{ fontSize: '0.78rem', color: 'var(--gray-500)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Progression du workflow</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 0, overflowX: 'auto' }}>
                {WORKFLOW.map((w, i) => {
                  const isActive = detailModal.statut_workflow === w.key;
                  const isDone = WORKFLOW.findIndex(x => x.key === detailModal.statut_workflow) > i;
                  return (
                    <React.Fragment key={w.key}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minWidth: 60 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: isDone ? 'var(--emerald)' : isActive ? w.color : 'var(--gray-200)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', color: isDone || isActive ? 'white' : 'var(--gray-400)' }}>
                          {isDone ? '✓' : w.icon}
                        </div>
                        <p style={{ fontSize: '0.62rem', textAlign: 'center', color: isActive ? w.color : 'var(--gray-400)', fontWeight: isActive ? 700 : 400, lineHeight: 1.2 }}>{w.label}</p>
                      </div>
                      {i < WORKFLOW.length - 1 && <div style={{ flex: 1, height: 2, background: isDone ? 'var(--emerald)' : 'var(--gray-200)', minWidth: 12, marginBottom: 20 }} />}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div style={{ background: 'var(--gray-50)', borderRadius: 8, padding: '12px 14px' }}>
                <p style={{ fontSize: '0.73rem', color: 'var(--gray-400)', marginBottom: 4 }}>Compétences</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {(detailModal.competences || []).map(c => <span key={c} style={{ fontSize: '0.8rem', color: 'var(--navy)', fontWeight: 500 }}>• {c}</span>)}
                </div>
              </div>
              <div style={{ background: 'var(--gray-50)', borderRadius: 8, padding: '12px 14px' }}>
                <p style={{ fontSize: '0.73rem', color: 'var(--gray-400)', marginBottom: 4 }}>Disponibilités</p>
                <p style={{ fontSize: '0.82rem', color: 'var(--navy)' }}>{detailModal.disponibilites?.type}</p>
                <p style={{ fontSize: '0.78rem', color: 'var(--gray-500)' }}>{(detailModal.disponibilites?.jours || []).join(', ')}</p>
              </div>
            </div>

            {detailModal.motivation && (
              <div style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 8, padding: '12px 14px', marginBottom: 16 }}>
                <p style={{ fontSize: '0.73rem', color: 'var(--gold-dark)', fontWeight: 700, marginBottom: 4 }}>MOTIVATION</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--navy)', fontStyle: 'italic' }}>{detailModal.motivation}</p>
              </div>
            )}

            <Btn variant="gold" onClick={() => handleAdvanceWorkflow(detailModal.id)} style={{ width: '100%', justifyContent: 'center' }}>
              → Avancer au prochain statut
            </Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
