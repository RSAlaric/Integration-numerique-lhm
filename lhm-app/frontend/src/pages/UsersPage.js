import React, { useEffect, useState } from 'react';
import { Card, CardHeader, Table, Btn, Badge, Modal, FormRow, FormField, Spinner } from '../components/ui/Card';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

const ROLES = [
  { value: 'super_admin',             label: '🔐 Administrateur Système', color: 'error'   },
  { value: 'direction',               label: '👔 Direction',              color: 'gold'    },
  { value: 'assistant_admin',         label: '📋 Assistant Administration',color: 'info'    },
  { value: 'responsable_stock',       label: '📦 Responsable Stock',      color: 'success' },
  { value: 'responsable_volontaires', label: '🤝 Responsable Volontaires',color: 'warning' },
  { value: 'coordinateur',            label: '🎯 Coordinateur',           color: 'default' },
  { value: 'utilisateur',             label: '👤 Utilisateur Standard',   color: 'default' },
];

const SERVICES = ['Direction','Administration','Logistique','Communication','Mobilisation','Technique','Comptabilité','Autre'];
const defaultForm = { prenom:'', nom:'', email:'', role:'utilisateur', service:'Administration', poste:'', password:'Password@123' };

function printUsersPDF(users) {
  const now = new Date().toLocaleDateString('fr-FR',{year:'numeric',month:'long',day:'numeric'});
  const roleLabel = r => ROLES.find(x=>x.value===r)?.label.replace(/^\S+\s/,'') || r;
  const w = window.open('','_blank','width=1100,height=750');
  w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"/>
<title>Utilisateurs — LHM Madagascar</title>
<style>
@page{size:A4 landscape;margin:12mm 10mm}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Arial,sans-serif;font-size:9.5px;color:#222}
.hdr{display:flex;align-items:center;gap:14px;margin-bottom:12px;padding-bottom:10px;border-bottom:3px solid #0f2044}
.hdr h1{font-size:14px;color:#0f2044;font-weight:700}.hdr p{font-size:9px;color:#666;margin-top:2px}
.stats{display:flex;gap:12px;margin-bottom:10px}
.stat{background:#f0f4ff;border:1px solid #dbeafe;border-radius:7px;padding:5px 14px}
.sn{font-size:15px;font-weight:700;color:#0f2044}.sl{font-size:8px;color:#6b7280}
table{width:100%;border-collapse:collapse}thead tr{background:#0f2044;color:white}
th{padding:6px 8px;text-align:left;font-size:8px;font-weight:600}
tbody tr:nth-child(even){background:#f8faff}td{padding:5px 8px;border-bottom:1px solid #e5e7eb;vertical-align:middle}
.badge{display:inline-block;padding:2px 7px;border-radius:8px;font-size:7.5px;font-weight:600}
.b-admin{background:#fee2e2;color:#991b1b}.b-dir{background:#fef9c3;color:#854d0e}.b-other{background:#dbeafe;color:#1e40af}
.b-actif{background:#dcfce7;color:#166534}.b-bloque{background:#fee2e2;color:#991b1b}
.bold{font-weight:600;color:#0f2044}
.ftr{margin-top:10px;text-align:center;font-size:8px;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:5px}
</style></head><body>
<div class="hdr"><div>
  <h1>🔐 Gestion des Utilisateurs — LHM Madagascar</h1>
  <p>Imprimé le ${now} — Document confidentiel — Accès restreint Administrateur Système</p>
</div></div>
<div class="stats">
  <div class="stat"><div class="sn">${users.length}</div><div class="sl">Total comptes</div></div>
  <div class="stat"><div class="sn">${users.filter(u=>u.actif&&!u.bloque).length}</div><div class="sl">Actifs ✅</div></div>
  <div class="stat"><div class="sn">${users.filter(u=>u.bloque).length}</div><div class="sl">Bloqués 🔒</div></div>
  <div class="stat"><div class="sn">${users.filter(u=>u.role==='super_admin').length}</div><div class="sl">Administrateurs 🔐</div></div>
</div>
<table><thead><tr>
  <th>N°</th><th>Matricule</th><th>Nom complet</th><th>Email</th>
  <th>Rôle</th><th>Service</th><th>Poste</th><th>Statut</th><th>Dernière connexion</th>
</tr></thead><tbody>
${users.map((u,i)=>{
  const rc=u.role==='super_admin'?'b-admin':u.role==='direction'?'b-dir':'b-other';
  const lc=u.derniere_connexion?new Date(u.derniere_connexion).toLocaleString('fr-FR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}):'Jamais';
  return `<tr>
    <td style="color:#9ca3af;font-weight:700">${i+1}</td>
    <td><code style="font-family:monospace;font-weight:700;font-size:8px">${u.matricule||'—'}</code></td>
    <td class="bold">${u.prenom||''} ${u.nom||''}</td>
    <td style="color:#6b7280">${u.email}</td>
    <td><span class="badge ${rc}">${roleLabel(u.role)}</span></td>
    <td>${u.service||'—'}</td><td>${u.poste||'—'}</td>
    <td><span class="badge ${u.bloque?'b-bloque':'b-actif'}">${u.bloque?'🔒 Bloqué':u.actif?'✅ Actif':'Inactif'}</span></td>
    <td style="color:#6b7280;font-size:8px">${lc}</td>
  </tr>`;
}).join('')}
</tbody></table>
<div class="ftr">LHM Madagascar — Feon'ny Filazantsara — CONFIDENTIEL — ${users.length} compte(s) — ${now}</div>
</body></html>`);
  w.document.close(); w.onload=()=>w.print();
}

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'super_admin';

  const [users,      setUsers]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [modalOpen,  setModalOpen]  = useState(false);
  const [editModal,  setEditModal]  = useState(null);
  const [form,       setForm]       = useState(defaultForm);
  const [editForm,   setEditForm]   = useState({});
  const [saving,     setSaving]     = useState(false);
  const [delConfirm, setDelConfirm] = useState(null);
  const [search,     setSearch]     = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [showPwd,    setShowPwd]    = useState(false);

  useEffect(() => {
    const el = document.getElementById('page-title');
    if (el) el.textContent = 'Gestion des Utilisateurs';
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try { const r = await api.get('/users'); setUsers(r.data.data); }
    catch { toast.error('Accès refusé ou erreur de chargement'); }
    finally { setLoading(false); }
  };

  const handleCreate = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await api.post('/users', form);
      toast.success('✅ Compte créé avec succès');
      setModalOpen(false); loadUsers();
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur création'); }
    finally { setSaving(false); }
  };

  const openEdit = (u) => {
    setEditForm({ prenom:u.prenom||'', nom:u.nom||'', email:u.email||'', role:u.role||'utilisateur', service:u.service||'', poste:u.poste||'', actif:u.actif!==false, newPassword:'' });
    setEditModal(u);
  };

  const handleUpdate = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const payload = { ...editForm };
      if (!payload.newPassword?.trim()) delete payload.newPassword;
      else { payload.password = payload.newPassword; delete payload.newPassword; }
      await api.put(`/users/${editModal.id}`, payload);
      toast.success('✅ Profil mis à jour');
      setEditModal(null); loadUsers();
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur modification'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/users/${id}`);
      toast.success('🗑️ Compte supprimé');
      setDelConfirm(null); loadUsers();
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur suppression'); }
  };

  const handleToggleBlock = async (id, bloque) => {
    try {
      await api.put(`/users/${id}/toggle-block`);
      toast.success(bloque ? '🔓 Compte débloqué' : '🔒 Compte bloqué');
      loadUsers();
    } catch { toast.error('Erreur'); }
  };

  const getRoleBadge = (role) => {
    const found = ROLES.find(r=>r.value===role);
    return <Badge type={found?.color||'default'}>{found?.label||role}</Badge>;
  };

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !search || (u.prenom+' '+u.nom+' '+u.email+' '+(u.service||'')+' '+(u.poste||'')).toLowerCase().includes(q);
    const matchRole   = !filterRole || u.role === filterRole;
    return matchSearch && matchRole;
  });

  const columns = [
    { key:'matricule', header:'Matricule', render: v => <code style={{fontFamily:'monospace',fontWeight:700,fontSize:'0.8rem',background:'var(--gray-100)',padding:'2px 8px',borderRadius:4}}>{v||'—'}</code> },
    { key:'prenom', header:'Utilisateur', render:(_,r)=>(
      <div style={{display:'flex',alignItems:'center',gap:10}}>
        <div style={{width:38,height:38,borderRadius:'50%',background:'linear-gradient(135deg,var(--navy),var(--navy-light))',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontWeight:700,fontSize:'0.8rem',flexShrink:0}}>
          {(r.prenom?.[0]||'')+(r.nom?.[0]||'')}
        </div>
        <div>
          <p style={{fontWeight:700,color:'var(--navy)'}}>{r.prenom} {r.nom}</p>
          <p style={{fontSize:'0.72rem',color:'var(--gray-400)'}}>{r.email}</p>
        </div>
      </div>
    )},
    { key:'role',    header:'Rôle',    render: v => getRoleBadge(v) },
    { key:'service', header:'Service', render: v => v||'—' },
    { key:'poste',   header:'Poste',   render: v => v||'—' },
    { key:'actif', header:'Statut', render:(_,r)=>(
      <div style={{display:'flex',gap:4,flexDirection:'column'}}>
        <Badge type={r.actif?'success':'error'}>{r.actif?'✅ Actif':'❌ Inactif'}</Badge>
        {r.bloque && <Badge type="error">🔒 Bloqué</Badge>}
      </div>
    )},
    { key:'derniere_connexion', header:'Dernière connexion', render: v => v
      ? new Date(v).toLocaleString('fr-FR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'})
      : <span style={{color:'var(--gray-300)',fontStyle:'italic'}}>Jamais</span>
    },
    { key:'actions', header:'Actions', render:(_,r)=>{
      const isSelf = r.id === currentUser?.id;
      if (!isAdmin) return <span style={{fontSize:'0.72rem',color:'var(--gray-400)',fontStyle:'italic'}}>👁️ Lecture seule</span>;
      return (
        <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
          {!isSelf && (
            <Btn size="sm" variant={r.bloque?'success':'secondary'} onClick={()=>handleToggleBlock(r.id,r.bloque)} title={r.bloque?'Débloquer':'Bloquer'}>
              {r.bloque?'🔓':'🔒'}
            </Btn>
          )}
          <Btn size="sm" variant="secondary" onClick={()=>openEdit(r)}>✏️ Modifier</Btn>
          {!isSelf && (
            <Btn size="sm" variant="danger" onClick={()=>setDelConfirm(r)} title="Supprimer">🗑️</Btn>
          )}
        </div>
      );
    }},
  ];

  const stats = {
    total:   users.length,
    actifs:  users.filter(u=>u.actif&&!u.bloque).length,
    bloques: users.filter(u=>u.bloque).length,
    admins:  users.filter(u=>u.role==='super_admin').length,
  };

  return (
    <div className="animate-fade">

      {/* ── Bandeau statut admin ── */}
      <Card style={{marginBottom:16}}>
        <div style={{background:isAdmin?'rgba(15,32,68,0.05)':'rgba(245,158,11,0.08)',border:`1px solid ${isAdmin?'rgba(15,32,68,0.15)':'rgba(245,158,11,0.3)'}`,borderRadius:10,padding:'14px 18px',display:'flex',gap:14,alignItems:'center'}}>
          <span style={{fontSize:'1.8rem'}}>{isAdmin?'🔐':'👁️'}</span>
          <div style={{flex:1}}>
            <p style={{fontWeight:700,color:'var(--navy)',fontSize:'0.92rem',marginBottom:3}}>
              {isAdmin?'Vous êtes Administrateur Système — accès complet activé':'Accès en lecture seule — modifications non autorisées pour votre rôle'}
            </p>
            <p style={{fontSize:'0.78rem',color:'var(--gray-500)'}}>
              {isAdmin?'Vous pouvez créer, modifier, bloquer et supprimer des comptes utilisateurs.':'Seul un Administrateur Système peut créer, modifier ou supprimer des comptes.'}
            </p>
          </div>
          <Badge type={isAdmin?'success':'warning'}>{isAdmin?'✅ Admin Système':'🔒 Accès restreint'}</Badge>
        </div>

        {/* KPI */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginTop:14}}>
          {[
            {label:'Total comptes',  value:stats.total,   icon:'👥', color:'var(--navy)'},
            {label:'Comptes actifs', value:stats.actifs,  icon:'✅', color:'var(--emerald)'},
            {label:'Bloqués',        value:stats.bloques, icon:'🔒', color:'#dc2626'},
            {label:'Administrateurs',value:stats.admins,  icon:'🔐', color:'var(--gold-dark)'},
          ].map(k=>(
            <div key={k.label} style={{background:'var(--gray-50)',borderRadius:9,padding:'12px 14px',borderLeft:`3px solid ${k.color}`}}>
              <p style={{fontSize:'1.5rem',fontWeight:700,color:k.color}}>{k.icon} {k.value}</p>
              <p style={{fontSize:'0.72rem',color:'var(--gray-500)',marginTop:2}}>{k.label}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* ── Tableau ── */}
      <Card>
        <CardHeader
          title="Liste des Utilisateurs"
          subtitle={`${filtered.length} sur ${users.length} compte(s)`}
          action={
            <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
              <div style={{position:'relative'}}>
                <span style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:'var(--gray-400)'}}>🔍</span>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher…" style={{paddingLeft:32,width:180}} />
              </div>
              <select value={filterRole} onChange={e=>setFilterRole(e.target.value)} style={{width:'auto',minWidth:160}}>
                <option value="">Tous les rôles</option>
                {ROLES.map(r=><option key={r.value} value={r.value}>{r.label.replace(/^\S+\s/,'')}</option>)}
              </select>
              <Btn variant="secondary" onClick={()=>printUsersPDF(filtered)}>🖨️ Imprimer PDF</Btn>
              {isAdmin && <Btn variant="gold" onClick={()=>{setForm(defaultForm);setModalOpen(true);}}>➕ Nouveau compte</Btn>}
            </div>
          }
        />
        {loading ? <Spinner /> : <Table columns={columns} data={filtered} emptyMessage="Aucun utilisateur trouvé" />}
      </Card>

      {/* ══ MODAL CRÉATION ══ */}
      <Modal open={modalOpen} onClose={()=>setModalOpen(false)} title="➕ Nouveau compte utilisateur" width={600}>
        <form onSubmit={handleCreate} style={{padding:24}}>
          <FormRow>
            <FormField label="Prénom *" required><input value={form.prenom} onChange={e=>setForm({...form,prenom:e.target.value})} required placeholder="Jean" /></FormField>
            <FormField label="Nom *" required><input value={form.nom} onChange={e=>setForm({...form,nom:e.target.value})} required placeholder="Rakoto" /></FormField>
          </FormRow>
          <FormRow cols={1}>
            <FormField label="Email *" required><input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required placeholder="jean.rakoto@lhm-madagascar.org" /></FormField>
          </FormRow>
          <FormRow cols={1}>
            <FormField label="Rôle *">
              <select value={form.role} onChange={e=>setForm({...form,role:e.target.value})}>
                {ROLES.map(r=><option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </FormField>
          </FormRow>
          <FormRow>
            <FormField label="Service">
              <select value={form.service} onChange={e=>setForm({...form,service:e.target.value})}>
                {SERVICES.map(s=><option key={s}>{s}</option>)}
              </select>
            </FormField>
            <FormField label="Poste"><input value={form.poste} onChange={e=>setForm({...form,poste:e.target.value})} placeholder="Ex: Comptable" /></FormField>
          </FormRow>
          <FormRow cols={1}>
            <FormField label="Mot de passe initial">
              <div style={{display:'flex',gap:8}}>
                <input type={showPwd?'text':'password'} value={form.password} onChange={e=>setForm({...form,password:e.target.value})} style={{flex:1}} />
                <Btn type="button" variant="secondary" size="sm" onClick={()=>setShowPwd(!showPwd)}>{showPwd?'🙈':'👁️'}</Btn>
              </div>
              <p style={{fontSize:'0.72rem',color:'var(--gray-400)',marginTop:4}}>⚠️ L'utilisateur devra changer ce mot de passe à sa première connexion.</p>
            </FormField>
          </FormRow>
          <div style={{display:'flex',gap:12,justifyContent:'flex-end',paddingTop:16,borderTop:'1px solid var(--gray-100)'}}>
            <Btn type="button" variant="secondary" onClick={()=>setModalOpen(false)}>Annuler</Btn>
            <Btn type="submit" variant="gold" disabled={saving}>{saving?'Création…':'👤 Créer le compte'}</Btn>
          </div>
        </form>
      </Modal>

      {/* ══ MODAL MODIFICATION ══ */}
      {editModal && (
        <Modal open={!!editModal} onClose={()=>setEditModal(null)} title={`✏️ Modifier — ${editModal.prenom} ${editModal.nom}`} width={620}>
          <form onSubmit={handleUpdate} style={{padding:24}}>
            {/* Infos compte */}
            <div style={{background:'rgba(37,99,235,0.06)',border:'1px solid rgba(37,99,235,0.2)',borderRadius:9,padding:'10px 14px',marginBottom:20,display:'flex',gap:14,alignItems:'center'}}>
              <div style={{width:48,height:48,borderRadius:'50%',background:'linear-gradient(135deg,var(--navy),var(--navy-light))',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontWeight:700,fontSize:'1rem',flexShrink:0}}>
                {(editModal.prenom?.[0]||'')+(editModal.nom?.[0]||'')}
              </div>
              <div>
                <p style={{fontWeight:700,color:'var(--navy)'}}>Matricule : <code style={{background:'var(--gray-100)',padding:'2px 8px',borderRadius:4}}>{editModal.matricule}</code></p>
                <p style={{fontSize:'0.78rem',color:'var(--gray-500)',marginTop:2}}>Créé le {new Date(editModal.created_at).toLocaleDateString('fr-FR')}</p>
              </div>
            </div>

            <FormRow>
              <FormField label="Prénom *" required><input value={editForm.prenom} onChange={e=>setEditForm({...editForm,prenom:e.target.value})} required /></FormField>
              <FormField label="Nom *" required><input value={editForm.nom} onChange={e=>setEditForm({...editForm,nom:e.target.value})} required /></FormField>
            </FormRow>
            <FormRow cols={1}>
              <FormField label="Email *" required><input type="email" value={editForm.email} onChange={e=>setEditForm({...editForm,email:e.target.value})} required /></FormField>
            </FormRow>
            <FormRow cols={1}>
              <FormField label="Rôle">
                <select value={editForm.role} onChange={e=>setEditForm({...editForm,role:e.target.value})}>
                  {ROLES.map(r=><option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </FormField>
            </FormRow>
            <FormRow>
              <FormField label="Service">
                <select value={editForm.service} onChange={e=>setEditForm({...editForm,service:e.target.value})}>
                  {SERVICES.map(s=><option key={s}>{s}</option>)}
                </select>
              </FormField>
              <FormField label="Poste"><input value={editForm.poste} onChange={e=>setEditForm({...editForm,poste:e.target.value})} /></FormField>
            </FormRow>
            <FormRow cols={1}>
              <FormField label="Statut du compte">
                <select value={editForm.actif?'actif':'inactif'} onChange={e=>setEditForm({...editForm,actif:e.target.value==='actif'})}>
                  <option value="actif">✅ Actif</option>
                  <option value="inactif">❌ Inactif</option>
                </select>
              </FormField>
            </FormRow>

            {/* Reset mot de passe */}
            <div style={{background:'rgba(245,158,11,0.06)',border:'1px solid rgba(245,158,11,0.25)',borderRadius:10,padding:'14px 16px',marginBottom:8}}>
              <p style={{fontWeight:700,color:'#92400e',fontSize:'0.83rem',marginBottom:8}}>🔑 Réinitialiser le mot de passe (optionnel)</p>
              <div style={{display:'flex',gap:8}}>
                <input type={showPwd?'text':'password'} value={editForm.newPassword||''} onChange={e=>setEditForm({...editForm,newPassword:e.target.value})} placeholder="Laisser vide pour ne pas changer…" style={{flex:1}} />
                <Btn type="button" variant="secondary" size="sm" onClick={()=>setShowPwd(!showPwd)}>{showPwd?'🙈':'👁️'}</Btn>
              </div>
              <p style={{fontSize:'0.71rem',color:'var(--gray-400)',marginTop:5}}>Si rempli, le nouveau mot de passe sera appliqué immédiatement.</p>
            </div>

            <div style={{display:'flex',gap:12,justifyContent:'flex-end',paddingTop:16,borderTop:'1px solid var(--gray-100)'}}>
              <Btn type="button" variant="secondary" onClick={()=>setEditModal(null)}>Annuler</Btn>
              <Btn type="submit" variant="gold" disabled={saving}>{saving?'Enregistrement…':'💾 Enregistrer les modifications'}</Btn>
            </div>
          </form>
        </Modal>
      )}

      {/* ══ MODAL SUPPRESSION ══ */}
      {delConfirm && (
        <Modal open={!!delConfirm} onClose={()=>setDelConfirm(null)} title="⚠️ Confirmer la suppression" width={460}>
          <div style={{padding:28}}>
            <div style={{background:'#fee2e2',border:'1px solid #fca5a5',borderRadius:12,padding:'22px 20px',marginBottom:20,textAlign:'center'}}>
              <p style={{fontSize:'3rem',marginBottom:10}}>🗑️</p>
              <p style={{fontWeight:700,color:'#991b1b',fontSize:'1rem',marginBottom:8}}>Supprimer définitivement ce compte ?</p>
              <div style={{background:'white',borderRadius:8,padding:'10px 16px',display:'inline-block'}}>
                <p style={{fontWeight:700,color:'var(--navy)',fontSize:'0.95rem'}}>{delConfirm.prenom} {delConfirm.nom}</p>
                <p style={{fontSize:'0.8rem',color:'var(--gray-500)'}}>{delConfirm.email}</p>
                <p style={{fontSize:'0.8rem',color:'var(--gray-400)',marginTop:2}}>{ROLES.find(r=>r.value===delConfirm.role)?.label||delConfirm.role}</p>
              </div>
            </div>
            <div style={{background:'#fff7ed',border:'1px solid #fed7aa',borderRadius:9,padding:'12px 14px',marginBottom:22,fontSize:'0.82rem',color:'#92400e',lineHeight:1.6}}>
              ⚠️ Cette action est <strong>irréversible</strong>. Le compte sera définitivement supprimé du système.
            </div>
            <div style={{display:'flex',gap:12,justifyContent:'center'}}>
              <Btn variant="secondary" onClick={()=>setDelConfirm(null)}>Annuler</Btn>
              <Btn variant="danger" onClick={()=>handleDelete(delConfirm.id)}>🗑️ Supprimer définitivement</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
