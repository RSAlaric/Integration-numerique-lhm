import React, { useEffect, useState } from 'react';
import { Card, CardHeader, Table, Btn, Badge, Modal, FormRow, FormField, Spinner } from '../components/ui/Card';
import api from '../utils/api';
import toast from 'react-hot-toast';

const ROLES = [
  { value: 'super_admin', label: 'Administrateur Système' },
  { value: 'direction', label: 'Direction' },
  { value: 'assistant_admin', label: 'Assistant Administration' },
  { value: 'responsable_stock', label: 'Responsable Stock' },
  { value: 'responsable_volontaires', label: 'Responsable Volontaires' },
  { value: 'coordinateur', label: 'Coordinateur' },
  { value: 'utilisateur', label: 'Utilisateur Standard' },
];

const defaultForm = { prenom: '', nom: '', email: '', role: 'utilisateur', service: '', poste: '', password: 'Password@123' };

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    document.getElementById('page-title') && (document.getElementById('page-title').textContent = 'Gestion des Utilisateurs');
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const r = await api.get('/users');
      setUsers(r.data.data);
    } catch { toast.error('Accès refusé ou erreur'); }
    finally { setLoading(false); }
  };

  const handleCreate = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await api.post('/users', form);
      toast.success('Utilisateur créé');
      setModalOpen(false); loadUsers();
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur'); }
    finally { setSaving(false); }
  };

  const handleToggleBlock = async (id, bloque) => {
    try {
      await api.put(`/users/${id}/toggle-block`);
      toast.success(bloque ? 'Utilisateur débloqué' : 'Utilisateur bloqué');
      loadUsers();
    } catch { toast.error('Erreur'); }
  };

  const getRoleBadge = (role) => {
    const colors = { super_admin: 'error', direction: 'gold', assistant_admin: 'info', responsable_stock: 'success', responsable_volontaires: 'warning' };
    const label = ROLES.find(r => r.value === role)?.label || role;
    return <Badge type={colors[role] || 'default'}>{label}</Badge>;
  };

  const columns = [
    { key: 'matricule', header: 'Matricule', render: v => <code style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.82rem', background: 'var(--gray-100)', padding: '2px 8px', borderRadius: 4 }}>{v}</code> },
    { key: 'prenom', header: 'Utilisateur', render: (_, r) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, var(--navy), var(--navy-light))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '0.75rem' }}>
          {r.prenom?.[0]}{r.nom?.[0]}
        </div>
        <div>
          <p style={{ fontWeight: 600 }}>{r.prenom} {r.nom}</p>
          <p style={{ fontSize: '0.73rem', color: 'var(--gray-400)' }}>{r.email}</p>
        </div>
      </div>
    )},
    { key: 'role', header: 'Rôle', render: v => getRoleBadge(v) },
    { key: 'service', header: 'Service', render: v => v || '—' },
    { key: 'actif', header: 'Statut', render: (_, r) => (
      <div style={{ display: 'flex', gap: 5, flexDirection: 'column' }}>
        <Badge type={r.actif ? 'success' : 'error'}>{r.actif ? 'Actif' : 'Inactif'}</Badge>
        {r.bloque && <Badge type="error">🔒 Bloqué</Badge>}
      </div>
    )},
    { key: 'derniere_connexion', header: 'Dernière connexion', render: v => v ? new Date(v).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Jamais' },
    { key: 'actions', header: '', render: (_, r) => (
      <div style={{ display: 'flex', gap: 6 }}>
        <Btn size="sm" variant={r.bloque ? 'success' : 'danger'} onClick={() => handleToggleBlock(r.id, r.bloque)}>
          {r.bloque ? '🔓 Débloquer' : '🔒 Bloquer'}
        </Btn>
      </div>
    )}
  ];

  return (
    <div className="animate-fade">
      <Card style={{ marginBottom: 16 }}>
        <div style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 9, padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ fontSize: '1.2rem' }}>🔐</span>
          <div>
            <p style={{ fontWeight: 700, color: 'var(--navy)', fontSize: '0.88rem' }}>Module Administration — Accès réservé aux Super Administrateurs</p>
            <p style={{ fontSize: '0.78rem', color: 'var(--gray-500)' }}>Gérez les comptes, rôles et accès des utilisateurs du système.</p>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Gestion des Utilisateurs"
          subtitle={`${users.length} compte(s) dans le système`}
          action={<Btn variant="gold" onClick={() => { setForm(defaultForm); setModalOpen(true); }}>➕ Nouveau compte</Btn>}
        />
        {loading ? <Spinner /> : <Table columns={columns} data={users} emptyMessage="Aucun utilisateur" />}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nouveau compte utilisateur">
        <form onSubmit={handleCreate} style={{ padding: 24 }}>
          <FormRow>
            <FormField label="Prénom" required><input value={form.prenom} onChange={e => setForm({...form, prenom: e.target.value})} required /></FormField>
            <FormField label="Nom" required><input value={form.nom} onChange={e => setForm({...form, nom: e.target.value})} required /></FormField>
          </FormRow>
          <FormRow cols={1}><FormField label="Email" required><input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required /></FormField></FormRow>
          <FormRow cols={1}>
            <FormField label="Rôle">
              <select value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </FormField>
          </FormRow>
          <FormRow>
            <FormField label="Service"><input value={form.service} onChange={e => setForm({...form, service: e.target.value})} /></FormField>
            <FormField label="Poste"><input value={form.poste} onChange={e => setForm({...form, poste: e.target.value})} /></FormField>
          </FormRow>
          <FormRow cols={1}>
            <FormField label="Mot de passe initial">
              <input type="text" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
              <p style={{ fontSize: '0.72rem', color: 'var(--gray-400)', marginTop: 4 }}>L'utilisateur devra le changer à la première connexion.</p>
            </FormField>
          </FormRow>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 16, borderTop: '1px solid var(--gray-100)' }}>
            <Btn type="button" variant="secondary" onClick={() => setModalOpen(false)}>Annuler</Btn>
            <Btn type="submit" variant="gold" disabled={saving}>{saving ? '...' : '👤 Créer le compte'}</Btn>
          </div>
        </form>
      </Modal>
    </div>
  );
}
