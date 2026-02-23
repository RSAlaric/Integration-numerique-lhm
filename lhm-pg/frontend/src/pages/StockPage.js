import React, { useEffect, useState } from 'react';
import { Card, CardHeader, Table, Btn, Badge, Modal, FormRow, FormField, SearchBar, KPICard, Spinner } from '../components/ui/Card';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

const CATEGORIES = ['Bureautique', 'Alimentaire', 'Médical', 'Technique', 'Nettoyage', 'Autre'];
const UNITES = ['Pièce', 'Rame', 'Boîte', 'Kg', 'Litre', 'Sac', 'Carton', 'Lot'];

const defaultForm = { designation: '', categorie: 'Bureautique', sous_categorie: '', unite: 'Pièce', prix_unitaire: '', fournisseur: '', emplacement: '', quantite: 0, seuil_min: 5, seuil_securite: 10, seuil_optimal: 20, date_peremption: '' };

export default function StockPage() {
  const { hasRole } = useAuth();
  const [stock, setStock] = useState([]);
  const [stats, setStats] = useState(null);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [filterAlerte, setFilterAlerte] = useState('');
  const [tab, setTab] = useState('stock');
  const [modalOpen, setModalOpen] = useState(false);
  const [movementModal, setMovementModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [mvtForm, setMvtForm] = useState({ article_id: '', type: 'entrée', quantite: 1, motif: '', fournisseur: '', destinataire: '', numero_facture: '' });
  const [saving, setSaving] = useState(false);

  const canEdit = hasRole('super_admin', 'responsable_stock');

  useEffect(() => {
    document.getElementById('page-title') && (document.getElementById('page-title').textContent = 'Gestion du Stock');
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [s, st, m] = await Promise.all([api.get('/stock'), api.get('/stock/stats'), api.get('/stock-movements')]);
      setStock(s.data.data); setStats(st.data.data); setMovements(m.data.data);
    } catch { toast.error('Erreur'); }
    finally { setLoading(false); }
  };

  const filtered = stock.filter(a => {
    const s = search.toLowerCase();
    const matchSearch = !s || a.designation?.toLowerCase().includes(s) || a.code?.toLowerCase().includes(s);
    const matchCat = !filterCat || a.categorie === filterCat;
    const matchAlerte = !filterAlerte || (filterAlerte === 'rouge' && a.alerte === 'rouge') || (filterAlerte === 'orange' && a.alerte === 'orange') || (filterAlerte === 'expiration' && a.expiration_proche);
    return matchSearch && matchCat && matchAlerte;
  });

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editing) { await api.put(`/stock/${editing.id}`, form); toast.success('Article mis à jour'); }
      else { await api.post('/stock', form); toast.success('Article créé'); }
      setModalOpen(false); loadData();
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur'); }
    finally { setSaving(false); }
  };

  const handleMovement = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await api.post('/stock-movements', mvtForm);
      toast.success('Mouvement enregistré');
      setMovementModal(false); loadData();
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur'); }
    finally { setSaving(false); }
  };

  const alerteBadge = (a) => {
    if (a.alerte === 'rouge') return <Badge type="error">🔴 Critique</Badge>;
    if (a.alerte === 'orange') return <Badge type="warning">🟠 Sécurité</Badge>;
    return <Badge type="success">✅ OK</Badge>;
  };

  const stockColumns = [
    { key: 'code', header: 'Code', render: v => <code style={{ background: 'var(--gray-100)', padding: '2px 8px', borderRadius: 4, fontSize: '0.82rem', fontWeight: 700 }}>{v}</code> },
    { key: 'designation', header: 'Désignation', render: (v, r) => (
      <div>
        <p style={{ fontWeight: 600 }}>{v}</p>
        <p style={{ fontSize: '0.73rem', color: 'var(--gray-400)' }}>{r.categorie} / {r.sous_categorie}</p>
        {r.expiration_proche && <p style={{ fontSize: '0.7rem', color: 'var(--red)', fontWeight: 600 }}>⚠️ Exp. {new Date(r.date_peremption).toLocaleDateString('fr-FR')}</p>}
      </div>
    )},
    { key: 'quantite', header: 'Quantité', render: (v, r) => <span style={{ fontWeight: 700, color: r.alerte === 'rouge' ? 'var(--red)' : r.alerte === 'orange' ? 'var(--orange)' : 'var(--navy)' }}>{v} {r.unite}</span> },
    { key: 'alerte', header: 'Statut', render: (_, r) => alerteBadge(r) },
    { key: 'valeur_totale', header: 'Valeur', render: v => `${Number(v).toLocaleString('fr-FR')} Ar` },
    { key: 'fournisseur', header: 'Fournisseur', render: v => <span style={{ fontSize: '0.82rem', color: 'var(--gray-500)' }}>{v}</span> },
    { key: 'actions', header: '', render: (_, r) => canEdit && (
      <div style={{ display: 'flex', gap: 5 }}>
        <Btn size="sm" variant="secondary" onClick={() => { setEditing(r); setForm({ ...defaultForm, ...r }); setModalOpen(true); }}>✏️</Btn>
        <Btn size="sm" variant="gold" onClick={() => { setMvtForm({...mvtForm, article_id: r.id}); setMovementModal(true); }}>📦</Btn>
      </div>
    )}
  ];

  const mvtColumns = [
    { key: 'date', header: 'Date', render: v => new Date(v).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) },
    { key: 'type', header: 'Type', render: v => <Badge type={v === 'entrée' ? 'success' : 'error'}>{v === 'entrée' ? '↑ Entrée' : '↓ Sortie'}</Badge> },
    { key: 'article_designation', header: 'Article', render: (v, r) => <div><p style={{fontWeight: 600}}>{v}</p><p style={{fontSize:'0.73rem',color:'var(--gray-400)'}}>{r.article_code}</p></div> },
    { key: 'quantite', header: 'Qté', render: v => <strong>{v}</strong> },
    { key: 'quantite_apres', header: 'Stock après', render: v => v ?? '—' },
    { key: 'motif', header: 'Motif', render: v => <span style={{ fontSize: '0.82rem' }}>{v}</span> },
  ];

  return (
    <div className="animate-fade">
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 20 }}>
          <KPICard icon="📦" label="Total articles" value={stats.total_articles} color="var(--navy)" />
          <KPICard icon="💰" label="Valeur totale" value={`${(stats.valeur_totale/1000000).toFixed(1)}M Ar`} color="var(--emerald)" />
          <KPICard icon="🔴" label="Alertes critiques" value={stats.alertes_rouges} color={stats.alertes_rouges > 0 ? 'var(--red)' : 'var(--emerald)'} />
          <KPICard icon="🟠" label="Stock sécurité" value={stats.alertes_oranges} color={stats.alertes_oranges > 0 ? 'var(--orange)' : 'var(--emerald)'} />
          <KPICard icon="⏰" label="Expiration proche" value={stats.expiration_proche} color={stats.expiration_proche > 0 ? 'var(--orange)' : 'var(--navy)'} />
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'white', borderRadius: 10, padding: 4, boxShadow: 'var(--shadow)', width: 'fit-content' }}>
        {[{ id: 'stock', label: '📦 Catalogue' }, { id: 'movements', label: '🔄 Mouvements' }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '8px 20px', borderRadius: 7, fontWeight: 600, fontSize: '0.88rem', background: tab === t.id ? 'var(--navy)' : 'transparent', color: tab === t.id ? 'white' : 'var(--gray-500)', border: 'none', cursor: 'pointer' }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'stock' && (
        <Card>
          <CardHeader
            title="Catalogue d'Articles"
            subtitle={`${filtered.length} article(s)`}
            action={canEdit && (
              <div style={{ display: 'flex', gap: 10 }}>
                <Btn variant="secondary" onClick={() => { setMovementModal(true); setMvtForm({...mvtForm, article_id: ''}); }}>🔄 Mouvement</Btn>
                <Btn variant="gold" onClick={() => { setEditing(null); setForm(defaultForm); setModalOpen(true); }}>➕ Article</Btn>
              </div>
            )}
          />
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200 }}><SearchBar value={search} onChange={setSearch} placeholder="Rechercher..." /></div>
            <select value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{ width: 'auto' }}>
              <option value="">Toutes catégories</option>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <select value={filterAlerte} onChange={e => setFilterAlerte(e.target.value)} style={{ width: 'auto' }}>
              <option value="">Toutes alertes</option>
              <option value="rouge">🔴 Critique</option>
              <option value="orange">🟠 Sécurité</option>
              <option value="expiration">⏰ Expiration proche</option>
            </select>
          </div>
          {loading ? <Spinner /> : <Table columns={stockColumns} data={filtered} emptyMessage="Aucun article" />}
        </Card>
      )}

      {tab === 'movements' && (
        <Card>
          <CardHeader title="Historique des Mouvements" subtitle={`${movements.length} mouvement(s)`} />
          {loading ? <Spinner /> : <Table columns={mvtColumns} data={movements} emptyMessage="Aucun mouvement" />}
        </Card>
      )}

      {/* Modal Article */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Modifier l\'article' : 'Nouvel article'} width={650}>
        <form onSubmit={handleSave} style={{ padding: 24 }}>
          <FormRow cols={1}><FormField label="Désignation" required><input value={form.designation} onChange={e => setForm({...form, designation: e.target.value})} required /></FormField></FormRow>
          <FormRow>
            <FormField label="Catégorie"><select value={form.categorie} onChange={e => setForm({...form, categorie: e.target.value})}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></FormField>
            <FormField label="Sous-catégorie"><input value={form.sous_categorie} onChange={e => setForm({...form, sous_categorie: e.target.value})} /></FormField>
          </FormRow>
          <FormRow>
            <FormField label="Unité"><select value={form.unite} onChange={e => setForm({...form, unite: e.target.value})}>{UNITES.map(u => <option key={u}>{u}</option>)}</select></FormField>
            <FormField label="Prix unitaire (Ar)"><input type="number" value={form.prix_unitaire} onChange={e => setForm({...form, prix_unitaire: e.target.value})} /></FormField>
          </FormRow>
          <FormRow>
            <FormField label="Fournisseur"><input value={form.fournisseur} onChange={e => setForm({...form, fournisseur: e.target.value})} /></FormField>
            <FormField label="Emplacement"><input value={form.emplacement} onChange={e => setForm({...form, emplacement: e.target.value})} /></FormField>
          </FormRow>
          <FormRow>
            <FormField label="Seuil minimum"><input type="number" value={form.seuil_min} onChange={e => setForm({...form, seuil_min: Number(e.target.value)})} /></FormField>
            <FormField label="Seuil sécurité"><input type="number" value={form.seuil_securite} onChange={e => setForm({...form, seuil_securite: Number(e.target.value)})} /></FormField>
          </FormRow>
          <FormRow>
            <FormField label="Date péremption"><input type="date" value={form.date_peremption} onChange={e => setForm({...form, date_peremption: e.target.value})} /></FormField>
            <FormField label="Quantité initiale"><input type="number" value={form.quantite} onChange={e => setForm({...form, quantite: Number(e.target.value)})} /></FormField>
          </FormRow>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 16, borderTop: '1px solid var(--gray-100)' }}>
            <Btn type="button" variant="secondary" onClick={() => setModalOpen(false)}>Annuler</Btn>
            <Btn type="submit" variant="gold" disabled={saving}>{saving ? 'Enregistrement...' : editing ? '💾 Mettre à jour' : '➕ Créer'}</Btn>
          </div>
        </form>
      </Modal>

      {/* Modal Mouvement */}
      <Modal open={movementModal} onClose={() => setMovementModal(false)} title="Enregistrer un mouvement">
        <form onSubmit={handleMovement} style={{ padding: 24 }}>
          <FormRow cols={1}>
            <FormField label="Article" required>
              <select value={mvtForm.article_id} onChange={e => setMvtForm({...mvtForm, article_id: e.target.value})} required>
                <option value="">— Sélectionner —</option>
                {stock.map(a => <option key={a.id} value={a.id}>{a.code} — {a.designation} (Stock: {a.quantite} {a.unite})</option>)}
              </select>
            </FormField>
          </FormRow>
          <FormRow>
            <FormField label="Type">
              <select value={mvtForm.type} onChange={e => setMvtForm({...mvtForm, type: e.target.value})}>
                <option value="entrée">↑ Entrée</option>
                <option value="sortie">↓ Sortie</option>
              </select>
            </FormField>
            <FormField label="Quantité" required><input type="number" min={1} value={mvtForm.quantite} onChange={e => setMvtForm({...mvtForm, quantite: Number(e.target.value)})} required /></FormField>
          </FormRow>
          {mvtForm.type === 'entrée' && (
            <FormRow>
              <FormField label="Fournisseur"><input value={mvtForm.fournisseur} onChange={e => setMvtForm({...mvtForm, fournisseur: e.target.value})} /></FormField>
              <FormField label="N° Facture"><input value={mvtForm.numero_facture} onChange={e => setMvtForm({...mvtForm, numero_facture: e.target.value})} /></FormField>
            </FormRow>
          )}
          {mvtForm.type === 'sortie' && (
            <FormRow cols={1}><FormField label="Destinataire"><input value={mvtForm.destinataire} onChange={e => setMvtForm({...mvtForm, destinataire: e.target.value})} /></FormField></FormRow>
          )}
          <FormRow cols={1}><FormField label="Motif"><input value={mvtForm.motif} onChange={e => setMvtForm({...mvtForm, motif: e.target.value})} /></FormField></FormRow>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 16, borderTop: '1px solid var(--gray-100)' }}>
            <Btn type="button" variant="secondary" onClick={() => setMovementModal(false)}>Annuler</Btn>
            <Btn type="submit" variant="success" disabled={saving}>{saving ? 'Enregistrement...' : '✅ Valider le mouvement'}</Btn>
          </div>
        </form>
      </Modal>
    </div>
  );
}
