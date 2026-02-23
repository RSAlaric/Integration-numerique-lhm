import React, { useEffect, useState, useRef } from 'react';
import { Card, CardHeader, Table, Btn, Badge, Modal, FormRow, FormField, SearchBar, Spinner } from '../components/ui/Card';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../i18n/LanguageContext';

const SERVICES = ['Direction','Administration','Logistique','Communication','Mobilisation','Technique'];
const CONTRATS = ['CDI','CDD','Bénévole','Stage','Autre'];
const STATUTS_FAMILLE = ['Célibataire','Marié(e)','Divorcé(e)','Veuf/Veuve'];
const BANQUES  = ['BFV-SG','BOA','BNI','BMOI','Access Bank','Autre'];

const defaultForm = {
  nom:'', prenom:'',
  prenom_conjoint:'', nom_conjoint:'',   // remplace nom_jeune_fille / nom_epoux
  date_naissance:'', lieu_naissance:'',
  adresse:'', telephone:'', email:'',
  situation_familiale:'Célibataire',
  contact_urgence_nom:'', contact_urgence_tel:'',
  cin_numero:'', cin_date:'', cin_lieu:'',
  rib_code:'', banque:'',
  poste:'', service:'Administration', type_contrat:'CDI', date_entree:'',
  cnaps:'', aro:'', statut:'actif',
  photo:'', doc_diplome:'', doc_cv:'', doc_contrat:''
};

// ─── Labels du conjoint selon situation familiale ───────────
function getConjointConfig(situation, lang) {
  const fr = lang === 'fr';
  switch (situation) {
    case 'Marié(e)':
      return {
        show: true,
        icon: '💍',
        title:  fr ? 'Informations du conjoint(e)' : 'Spouse information',
        labelPrenom: fr ? 'Prénom du mari / de la femme'        : "Spouse's first name",
        labelNom:    fr ? 'Nom de famille du mari / de la femme' : "Spouse's family name",
        style: { bg:'rgba(201,168,76,0.07)', border:'1px solid rgba(201,168,76,0.3)' },
      };
    case 'Divorcé(e)':
      return {
        show: true,
        icon: '📋',
        title:  fr ? 'Ex-conjoint(e)' : 'Ex-spouse',
        labelPrenom: fr ? "Prénom de l'ex-conjoint(e)" : "Ex-spouse's first name",
        labelNom:    fr ? "Nom de l'ex-conjoint(e)"    : "Ex-spouse's family name",
        style: { bg:'var(--gray-50)', border:'1px solid var(--gray-200)' },
      };
    case 'Veuf/Veuve':
      return {
        show: true,
        icon: '🕊️',
        title:  fr ? 'Conjoint(e) décédé(e)' : 'Deceased spouse',
        labelPrenom: fr ? 'Prénom du conjoint(e) décédé(e)' : "Deceased spouse's first name",
        labelNom:    fr ? 'Nom du conjoint(e) décédé(e)'    : "Deceased spouse's family name",
        style: { bg:'var(--gray-50)', border:'1px solid var(--gray-200)' },
      };
    default:
      return { show: false };
  }
}

// ─── PHOTO UPLOAD ───────────────────────────────────────────
function PhotoUpload({ value, onChange, t }) {
  const ref = useRef();
  const handleFile = e => {
    const file = e.target.files[0]; if (!file) return;
    if (file.size > 2*1024*1024) { toast.error(t('personnel.photoTooBig')); return; }
    const reader = new FileReader();
    reader.onload = ev => onChange(ev.target.result);
    reader.readAsDataURL(file);
  };
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
      <div onClick={() => ref.current.click()}
        style={{ width:110, height:120, borderRadius:12, border:'2px dashed var(--gold)', background:value?'transparent':'var(--gray-50)', cursor:'pointer', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center' }}>
        {value
          ? <img src={value} alt="Photo" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
          : <div style={{ textAlign:'center', color:'var(--gray-400)', fontSize:'0.75rem' }}>
              <div style={{ fontSize:'2rem', marginBottom:4 }}>📷</div>
              <span>{t('personnel.photoHint')}</span>
            </div>}
      </div>
      <input ref={ref} type="file" accept="image/*" onChange={handleFile} style={{ display:'none' }} />
      <div style={{ display:'flex', gap:6 }}>
        <button type="button" onClick={() => ref.current.click()}
          style={{ fontSize:'0.72rem', padding:'4px 10px', border:'1px solid var(--gold)', borderRadius:6, background:'transparent', color:'var(--gold-dark)', cursor:'pointer', fontWeight:600 }}>
          {value ? t('personnel.changePhoto') : t('personnel.addPhoto')}
        </button>
        {value && (
          <button type="button" onClick={() => onChange('')}
            style={{ fontSize:'0.72rem', padding:'4px 10px', border:'1px solid var(--gray-200)', borderRadius:6, background:'transparent', color:'var(--gray-500)', cursor:'pointer' }}>
            {t('personnel.removePhoto')}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── DOCUMENT UPLOAD ────────────────────────────────────────
function DocUpload({ label, value, onChange, t }) {
  const ref = useRef();
  const handleFile = e => {
    const file = e.target.files[0]; if (!file) return;
    if (file.size > 10*1024*1024) { toast.error(t('personnel.docTooBig')); return; }
    const reader = new FileReader();
    reader.onload = ev => onChange({ data: ev.target.result, name: file.name, type: file.type });
    reader.readAsDataURL(file);
  };
  const doc = typeof value === 'object' ? value : (value ? { data: value, name: label+'.pdf', type:'application/pdf' } : null);
  return (
    <div style={{ border:`1px solid ${doc?'var(--gold)':'var(--gray-200)'}`, borderRadius:10, padding:'12px 14px', background:doc?'rgba(201,168,76,0.04)':'var(--gray-50)', transition:'border-color 0.2s' }}>
      <p style={{ fontSize:'0.75rem', fontWeight:700, color:'var(--navy)', marginBottom:8 }}>📄 {label}</p>
      {doc?.data ? (
        <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
          <span style={{ fontSize:'0.78rem', color:'var(--gold-dark)', fontWeight:600, flex:1, minWidth:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>✓ {doc.name}</span>
          <div style={{ display:'flex', gap:5, flexShrink:0 }}>
            <button type="button" onClick={() => { const w=window.open(); w.document.write(`<iframe src="${doc.data}" style="width:100%;height:100vh;border:none"></iframe>`); }}
              style={{ fontSize:'0.7rem', padding:'4px 9px', border:'1px solid var(--navy)', borderRadius:6, background:'transparent', color:'var(--navy)', cursor:'pointer', fontWeight:600 }}>
              👁 {t('personnel.viewDoc')}
            </button>
            <a href={doc.data} download={doc.name}
              style={{ fontSize:'0.7rem', padding:'4px 9px', border:'1px solid var(--gold)', borderRadius:6, background:'transparent', color:'var(--gold-dark)', cursor:'pointer', fontWeight:600, textDecoration:'none' }}>
              ⬇ {t('common.download')}
            </a>
            <button type="button" onClick={() => onChange('')}
              style={{ fontSize:'0.7rem', padding:'4px 9px', border:'1px solid #fca5a5', borderRadius:6, background:'transparent', color:'#dc2626', cursor:'pointer' }}>✕</button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => ref.current.click()}
          style={{ width:'100%', padding:'9px', border:'2px dashed var(--gray-300)', borderRadius:8, background:'white', cursor:'pointer', color:'var(--gray-400)', fontSize:'0.78rem', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
          📎 {t('personnel.uploadDoc')}
        </button>
      )}
      <input ref={ref} type="file" accept=".pdf,.doc,.docx,image/*" onChange={handleFile} style={{ display:'none' }} />
    </div>
  );
}

// ─── PRINT — LISTE ──────────────────────────────────────────
function printList(data, filterService, lang) {
  const fr  = lang === 'fr';
  const now = new Date().toLocaleDateString(fr?'fr-FR':'en-GB',{year:'numeric',month:'long',day:'numeric'});
  const w   = window.open('','_blank','width=1200,height=750');
  w.document.write(`<!DOCTYPE html><html lang="${lang}"><head><meta charset="UTF-8"/>
<title>${fr?'Liste du Personnel':'Staff List'} — LHM Madagascar</title>
<style>
@page{size:A4 landscape;margin:12mm 10mm}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Arial,sans-serif;font-size:9px;color:#222}
.hdr{display:flex;align-items:center;gap:14px;margin-bottom:12px;padding-bottom:10px;border-bottom:3px solid #0f2044}
.hdr img{height:42px;object-fit:contain}.hdr h1{font-size:14px;color:#0f2044;font-weight:700}.hdr p{font-size:9px;color:#666;margin-top:2px}
.stats{display:flex;gap:12px;margin-bottom:11px}
.stat{background:#f0f4ff;border:1px solid #dbeafe;border-radius:8px;padding:6px 12px}
.sn{font-size:16px;font-weight:700;color:#0f2044}.sl{font-size:8px;color:#6b7280}
table{width:100%;border-collapse:collapse}
thead tr{background:#0f2044;color:white}th{padding:5px 6px;text-align:left;font-size:8px;font-weight:600}
tbody tr:nth-child(even){background:#f8faff}
td{padding:4px 6px;border-bottom:1px solid #e5e7eb;vertical-align:middle}
.badge{display:inline-block;padding:2px 5px;border-radius:8px;font-size:7.5px;font-weight:600}
.b-actif,.b-active{background:#dcfce7;color:#166534}
.b-inactif,.b-inactive,.b-suspendu{background:#fee2e2;color:#991b1b}
.ph{width:26px;height:30px;object-fit:cover;border-radius:3px;border:1px solid #ddd}
.noph{width:26px;height:30px;background:#e5e7eb;border-radius:3px;display:inline-flex;align-items:center;justify-content:center;font-size:11px}
.bold{font-weight:600;color:#0f2044}.sub{font-size:7.5px;color:#6b7280}
.mat{font-family:monospace;font-weight:700;color:#0f2044}
.ftr{margin-top:10px;text-align:center;font-size:8px;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:5px}
</style></head><body>
<div class="hdr">
  <img src="${window.location.origin}/logo-lhm-light.png" onerror="this.style.display='none'" alt="LHM"/>
  <div>
    <h1>${fr?'Liste du Personnel':'Staff List'} — LHM Madagascar</h1>
    <p>${filterService?(fr?'Service : ':'Dept.: ')+filterService:(fr?'Tous les services':'All departments')} &nbsp;|&nbsp; ${fr?'Imprimé le':'Printed on'} ${now}</p>
  </div>
</div>
<div class="stats">
  <div class="stat"><div class="sn">${data.length}</div><div class="sl">Total</div></div>
  <div class="stat"><div class="sn">${data.filter(p=>p.statut==='actif').length}</div><div class="sl">${fr?'Actifs':'Active'}</div></div>
  <div class="stat"><div class="sn">${[...new Set(data.map(p=>p.service))].length}</div><div class="sl">${fr?'Services':'Depts.'}</div></div>
</div>
<table>
<thead><tr>
  <th>Photo</th><th>${fr?'Matricule':'ID'}</th><th>${fr?'Nom & Prénom':'Name'}</th>
  <th>${fr?'Conjoint(e)':'Spouse'}</th><th>${fr?'Situation':'Marital'}</th>
  <th>CIN</th><th>${fr?'Téléphone':'Phone'}</th>
  <th>${fr?'Poste':'Position'}</th><th>${fr?'Service':'Dept.'}</th>
  <th>${fr?'Contrat':'Contract'}</th><th>${fr?'Entrée':'Start'}</th>
  <th>CNAPS</th><th>Statut</th>
</tr></thead>
<tbody>
${data.map(p=>`<tr>
  <td>${p.photo?`<img class="ph" src="${p.photo}" alt=""/>`:'<div class="noph">👤</div>'}</td>
  <td class="mat">${p.matricule||'—'}</td>
  <td><div class="bold">${p.prenom||''} ${p.nom||''}</div><div class="sub">${p.email||''}</div></td>
  <td class="bold">${[p.prenom_conjoint,p.nom_conjoint].filter(Boolean).join(' ')||'—'}</td>
  <td>${p.situation_familiale||'—'}</td>
  <td>${p.cin_numero||'—'}</td><td>${p.telephone||'—'}</td>
  <td>${p.poste||'—'}</td><td>${p.service||'—'}</td>
  <td>${p.type_contrat||'—'}</td>
  <td>${p.date_entree?new Date(p.date_entree).toLocaleDateString('fr-FR'):'—'}</td>
  <td>${p.cnaps||'—'}</td>
  <td><span class="badge b-${p.statut}">${p.statut}</span></td>
</tr>`).join('')}
</tbody></table>
<div class="ftr">LHM Madagascar — Feon'ny Filazantsara &nbsp;•&nbsp; ${fr?'Document confidentiel — Usage interne':'Confidential — Internal use'} &nbsp;•&nbsp; ${data.length} ${fr?'membre(s)':'member(s)'}</div>
</body></html>`);
  w.document.close();
  w.onload = () => w.print();
}

// ─── PRINT — FICHE INDIVIDUELLE ─────────────────────────────
function printFiche(p, lang) {
  const fr  = lang === 'fr';
  const now = new Date().toLocaleDateString(fr?'fr-FR':'en-GB',{year:'numeric',month:'long',day:'numeric'});
  const fmt = v => v ? new Date(v).toLocaleDateString(fr?'fr-FR':'en-GB') : '—';

  const conjointLabel = (() => {
    if (p.situation_familiale === 'Marié(e)')   return fr ? 'Conjoint(e)'            : 'Spouse';
    if (p.situation_familiale === 'Divorcé(e)') return fr ? 'Ex-conjoint(e)'         : 'Ex-spouse';
    if (p.situation_familiale === 'Veuf/Veuve') return fr ? 'Conjoint(e) décédé(e)'  : 'Deceased spouse';
    return null;
  })();
  const conjointNom = [p.prenom_conjoint, p.nom_conjoint].filter(Boolean).join(' ');

  const w = window.open('','_blank','width=820,height=1100');
  w.document.write(`<!DOCTYPE html><html lang="${lang}"><head><meta charset="UTF-8"/>
<title>${fr?'Fiche Personnel':'Staff Card'} — ${p.prenom} ${p.nom}</title>
<style>
@page{size:A4 portrait;margin:13mm}*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Arial,sans-serif;font-size:10.5px;color:#222}
.hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:15px;padding-bottom:10px;border-bottom:3px solid #0f2044}
.hdr img{height:44px}.hdr-c h1{font-size:17px;color:#0f2044;font-weight:700;text-align:center}.hdr-c p{font-size:9px;color:#999;text-align:center;margin-top:2px}
.identity{display:flex;gap:16px;background:linear-gradient(135deg,#0f2044,#1a3a6e);color:white;padding:14px 16px;border-radius:10px;margin-bottom:14px;align-items:center}
.ph-box{width:76px;height:90px;border:2px solid #c9a84c;border-radius:8px;overflow:hidden;display:flex;align-items:center;justify-content:center;background:#1a2e4a;flex-shrink:0}
.ph-box img{width:100%;height:100%;object-fit:cover}
.id-text h2{font-size:17px;font-weight:700}.id-text p{font-size:10px;opacity:.8;margin-top:3px}
.mat{font-family:monospace;background:rgba(201,168,76,.3);padding:2px 8px;border-radius:4px;font-size:11px;color:#c9a84c;font-weight:700;display:inline-block;margin-top:5px}
.sec{margin-bottom:13px}.sec-t{font-size:9px;font-weight:700;color:#c9a84c;text-transform:uppercase;letter-spacing:.08em;margin-bottom:7px;border-bottom:1px solid #e5e7eb;padding-bottom:3px}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:5px 16px}
.f label{font-size:8px;color:#9ca3af;text-transform:uppercase;letter-spacing:.05em;display:block;margin-bottom:1px}.f span{font-size:10.5px;color:#0f2044;font-weight:500}
.conj-box{margin-top:8px;background:rgba(201,168,76,0.09);border:1px solid rgba(201,168,76,0.3);border-radius:7px;padding:7px 12px}
.conj-box .cl{font-size:8px;color:#a07830;text-transform:uppercase;letter-spacing:.05em;margin-bottom:2px;font-weight:700}
.conj-box .cv{font-size:11px;color:#0f2044;font-weight:600}
.ftr{margin-top:16px;text-align:center;font-size:8.5px;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:7px}
</style></head><body>
<div class="hdr">
  <img src="${window.location.origin}/logo-lhm-light.png" onerror="this.style.display='none'" alt="LHM"/>
  <div class="hdr-c"><h1>${fr?'Fiche du Personnel':'Staff Record'}</h1><p>${fr?'Document confidentiel — Imprimé le':'Confidential — Printed on'} ${now}</p></div>
  <div style="width:80px"></div>
</div>
<div class="identity">
  <div class="ph-box">${p.photo?`<img src="${p.photo}" alt="photo"/>`:'<div style="font-size:2.2rem;color:#ccc">👤</div>'}</div>
  <div class="id-text">
    <h2>${p.prenom||''} ${p.nom||''}</h2>
    <p>${p.poste||''} — ${p.service||''}</p>
    <p>${p.email||''}${p.telephone?' | '+p.telephone:''}</p>
    ${p.situation_familiale?`<p style="font-size:9px;margin-top:3px;opacity:.75">${p.situation_familiale}${conjointNom?' — '+conjointNom:''}</p>`:''}
    <div class="mat">${p.matricule||'—'}</div>
  </div>
</div>
<div class="sec">
  <div class="sec-t">${fr?'A — Informations personnelles':'A — Personal information'}</div>
  <div class="grid">
    <div class="f"><label>${fr?'Date de naissance':'Date of birth'}</label><span>${fmt(p.date_naissance)}</span></div>
    <div class="f"><label>${fr?'Lieu de naissance':'Place of birth'}</label><span>${p.lieu_naissance||'—'}</span></div>
    <div class="f"><label>${fr?'Situation familiale':'Marital status'}</label><span>${p.situation_familiale||'—'}</span></div>
    <div class="f"><label>${fr?'Adresse':'Address'}</label><span>${p.adresse||'—'}</span></div>
    <div class="f"><label>${fr?'Contact urgence':'Emergency contact'}</label><span>${p.contact_urgence_nom||'—'}</span></div>
    <div class="f"><label>${fr?'Tél. urgence':'Emergency phone'}</label><span>${p.contact_urgence_tel||'—'}</span></div>
  </div>
  ${conjointLabel && conjointNom ? `<div class="conj-box"><div class="cl">💍 ${conjointLabel}</div><div class="cv">${conjointNom}</div></div>` : ''}
</div>
<div class="sec">
  <div class="sec-t">${fr?'B — Identité officielle &amp; Banque':'B — Official identity &amp; Banking'}</div>
  <div class="grid">
    <div class="f"><label>${fr?'N° CIN':'ID Card N°'}</label><span>${p.cin_numero||'—'}</span></div>
    <div class="f"><label>${fr?'Date délivrance':'Issued on'}</label><span>${fmt(p.cin_date)}</span></div>
    <div class="f"><label>${fr?'Lieu délivrance':'Place of issue'}</label><span>${p.cin_lieu||'—'}</span></div>
    <div class="f"><label>${fr?'Code RIB':'RIB code'}</label><span style="font-family:monospace">${p.rib_code||'—'}</span></div>
    <div class="f"><label>${fr?'Banque':'Bank'}</label><span>${p.banque||'—'}</span></div>
  </div>
</div>
<div class="sec">
  <div class="sec-t">${fr?'C — Informations professionnelles':'C — Professional information'}</div>
  <div class="grid">
    <div class="f"><label>${fr?'Contrat':'Contract'}</label><span>${p.type_contrat||'—'}</span></div>
    <div class="f"><label>${fr?"Date d'entrée":'Start date'}</label><span>${fmt(p.date_entree)}</span></div>
    <div class="f"><label>${fr?'N° CNAPS':'CNAPS N°'}</label><span>${p.cnaps||'—'}</span></div>
    <div class="f"><label>${fr?'N° ARO':'ARO N°'}</label><span>${p.aro||'—'}</span></div>
    <div class="f"><label>Statut</label><span>${p.statut||'—'}</span></div>
  </div>
</div>
<div class="ftr">LHM Madagascar — Feon'ny Filazantsara &nbsp;•&nbsp; ${fr?'Fiche confidentielle — Usage interne':'Confidential record — Internal use only'}</div>
</body></html>`);
  w.document.close();
  w.onload = () => w.print();
}

// ─── PAGE PRINCIPALE ────────────────────────────────────────
export default function PersonnelPage() {
  const { hasRole }   = useAuth();
  const { t, lang }   = useLang();
  const [personnel,      setPersonnel]      = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [search,         setSearch]         = useState('');
  const [filterService,  setFilterService]  = useState('');
  const [modalOpen,      setModalOpen]      = useState(false);
  const [editing,        setEditing]        = useState(null);
  const [form,           setForm]           = useState(defaultForm);
  const [saving,         setSaving]         = useState(false);

  const canEdit = hasRole('super_admin','assistant_admin');

  useEffect(() => {
    const el = document.getElementById('page-title');
    if (el) el.textContent = t('personnel.title');
    loadPersonnel();
  }, [lang]);

  const loadPersonnel = async () => {
    setLoading(true);
    try { const r = await api.get('/personnel'); setPersonnel(r.data.data); }
    catch { toast.error(t('common.error')); }
    finally { setLoading(false); }
  };

  const filtered = personnel.filter(p => {
    const s = search.toLowerCase();
    const matchSearch = !s
      || p.nom?.toLowerCase().includes(s)
      || p.prenom?.toLowerCase().includes(s)
      || p.matricule?.toLowerCase().includes(s)
      || p.poste?.toLowerCase().includes(s);
    return matchSearch && (!filterService || p.service === filterService);
  });

  const openModal = (p = null) => {
    setEditing(p);
    setForm(p ? { ...defaultForm, ...p } : defaultForm);
    setModalOpen(true);
  };

  const handleSave = async e => {
    e.preventDefault(); setSaving(true);
    try {
      if (editing) await api.put(`/personnel/${editing.id}`, form);
      else         await api.post('/personnel', form);
      toast.success(t('common.success'));
      setModalOpen(false); loadPersonnel();
    } catch (err) { toast.error(err.response?.data?.message || t('common.error')); }
    finally { setSaving(false); }
  };

  const handleDeactivate = async id => {
    if (!window.confirm(t('personnel.deactivate'))) return;
    try { await api.delete(`/personnel/${id}`); toast.success(t('personnel.deactivated')); loadPersonnel(); }
    catch { toast.error(t('common.error')); }
  };

  const conjointNom = p => [p.prenom_conjoint, p.nom_conjoint].filter(Boolean).join(' ');

  const columns = [
    { key:'photo', header:t('personnel.photo'), render:(v,row) => (
      <div style={{ width:36, height:42, borderRadius:8, overflow:'hidden', border:'1.5px solid var(--gray-200)', background:'var(--gray-100)', display:'flex', alignItems:'center', justifyContent:'center' }}>
        {v ? <img src={v} alt={row.prenom} style={{ width:'100%', height:'100%', objectFit:'cover' }}/> : <span style={{ fontSize:'1.1rem' }}>👤</span>}
      </div>
    )},
    { key:'matricule', header:t('personnel.matricule'), render:v => (
      <span style={{ fontFamily:'monospace', fontWeight:700, color:'var(--navy)', fontSize:'0.82rem' }}>{v}</span>
    )},
    { key:'nom', header:t('personnel.nameAndTitle'), render:(_,row) => (
      <div>
        <p style={{ fontWeight:600, color:'var(--navy)' }}>{row.prenom} {row.nom}</p>
        {conjointNom(row) && (
          <p style={{ fontSize:'0.71rem', color:'var(--gold-dark)', marginTop:2 }}>
            💍 {conjointNom(row)}
          </p>
        )}
        <p style={{ fontSize:'0.73rem', color:'var(--gray-400)', marginTop:1 }}>{row.email}</p>
      </div>
    )},
    { key:'poste',   header:t('personnel.post') },
    { key:'service', header:t('personnel.service'), render:v => <Badge type="info">{v}</Badge> },
    { key:'type_contrat', header:t('personnel.contract'), render:v => <Badge type="gold">{v}</Badge> },
    { key:'situation_familiale', header:lang==='fr'?'Situation':'Marital', render:v => (
      <span style={{ fontSize:'0.78rem', color:'var(--gray-600)' }}>{v||'—'}</span>
    )},
    { key:'statut', header:t('common.status'), render:v => (
      <Badge type={v==='actif'?'success':v==='suspendu'?'warning':'error'}>{v}</Badge>
    )},
    { key:'actions', header:t('common.actions'), render:(_,row) => (
      <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
        <Btn size="sm" variant="secondary" onClick={() => printFiche(row, lang)} title={t('personnel.printCard')}>🖨️</Btn>
        <Btn size="sm" variant="secondary" onClick={() => openModal(row)}>✏️</Btn>
        {canEdit && <Btn size="sm" variant="danger" onClick={() => handleDeactivate(row.id)}>🗑️</Btn>}
      </div>
    )},
  ];

  const conjCfg = getConjointConfig(form.situation_familiale, lang);

  return (
    <div className="animate-fade">

      {/* TOOLBAR */}
      <Card style={{ marginBottom:20 }}>
        <CardHeader
          title={t('personnel.title')}
          subtitle={`${filtered.length} ${t('personnel.found')}`}
          action={
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              <Btn variant="secondary" onClick={() => printList(filtered, filterService, lang)}>
                🖨️ {lang==='fr' ? 'Imprimer la liste' : 'Print list'}
              </Btn>
              {canEdit && <Btn variant="gold" onClick={() => openModal()}>{t('personnel.newMember')}</Btn>}
            </div>
          }
        />
        <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
          <div style={{ flex:1, minWidth:180 }}>
            <SearchBar value={search} onChange={setSearch} placeholder={t('personnel.search')} />
          </div>
          <select value={filterService} onChange={e => setFilterService(e.target.value)} style={{ width:'auto', minWidth:150 }}>
            <option value="">{t('common.allServices')}</option>
            {SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </Card>

      <Card>
        {loading ? <Spinner /> : <Table columns={columns} data={filtered} emptyMessage={t('personnel.noPersonnel')} />}
      </Card>

      {/* MODAL */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? `${t('personnel.editModal')} — ${editing.prenom} ${editing.nom}` : t('personnel.newModal')}
        width={740}
      >
        <form onSubmit={handleSave} style={{ padding:'24px' }}>

          {/* PHOTO + Nom/Poste rapide */}
          <div style={{ display:'flex', gap:20, marginBottom:22, paddingBottom:18, borderBottom:'1px solid var(--gray-100)', flexWrap:'wrap' }}>
            <div style={{ minWidth:130, display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
              <p style={{ fontSize:'0.72rem', fontWeight:700, color:'var(--gold-dark)', textTransform:'uppercase', letterSpacing:'0.06em' }}>
                {t('personnel.photoSection')}
              </p>
              <PhotoUpload value={form.photo} onChange={v => setForm({...form, photo:v})} t={t} />
            </div>
            <div style={{ flex:1, minWidth:200 }}>
              <p style={{ fontSize:'0.72rem', fontWeight:700, color:'var(--gold-dark)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:10 }}>
                {t('personnel.quickId')}
              </p>
              <FormRow>
                <FormField label={`${t('personnel.firstName')} *`}>
                  <input value={form.prenom} onChange={e => setForm({...form, prenom:e.target.value})} required />
                </FormField>
                <FormField label={`${t('personnel.lastName')} *`}>
                  <input value={form.nom} onChange={e => setForm({...form, nom:e.target.value})} required />
                </FormField>
              </FormRow>
              <FormRow>
                <FormField label={`${t('personnel.post')} *`}>
                  <input value={form.poste} onChange={e => setForm({...form, poste:e.target.value})} required />
                </FormField>
                <FormField label={t('personnel.service')}>
                  <select value={form.service} onChange={e => setForm({...form, service:e.target.value})}>
                    {SERVICES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </FormField>
              </FormRow>
            </div>
          </div>

          {/* ══ SECTION A — Informations personnelles ══ */}
          <div style={{ marginBottom:18, paddingBottom:14, borderBottom:'1px solid var(--gray-100)' }}>
            <h4 style={{ color:'var(--gold-dark)', fontWeight:700, fontSize:'0.73rem', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:14 }}>
              {t('personnel.sectionA')}
            </h4>

            {/* ① Situation familiale — toujours en premier */}
            <FormRow>
              <FormField label={t('personnel.situation')}>
                <select
                  value={form.situation_familiale}
                  onChange={e => setForm({...form, situation_familiale:e.target.value, prenom_conjoint:'', nom_conjoint:''})}
                >
                  {STATUTS_FAMILLE.map(s => <option key={s}>{s}</option>)}
                </select>
              </FormField>
              <div />
            </FormRow>

            {/* ② Bloc conjoint conditionnel : visible si Marié / Divorcé / Veuf */}
            {conjCfg.show && (
              <div style={{ background:conjCfg.style.bg, border:conjCfg.style.border, borderRadius:10, padding:'12px 14px', marginBottom:14, marginTop:4 }}>
                <p style={{ fontSize:'0.71rem', color:'var(--gold-dark)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:10 }}>
                  {conjCfg.icon} {conjCfg.title}
                </p>
                <FormRow>
                  <FormField label={conjCfg.labelPrenom}>
                    <input
                      value={form.prenom_conjoint || ''}
                      onChange={e => setForm({...form, prenom_conjoint:e.target.value})}
                      placeholder={lang==='fr' ? 'Prénom…' : 'First name…'}
                    />
                  </FormField>
                  <FormField label={conjCfg.labelNom}>
                    <input
                      value={form.nom_conjoint || ''}
                      onChange={e => setForm({...form, nom_conjoint:e.target.value})}
                      placeholder={lang==='fr' ? 'Nom de famille…' : 'Family name…'}
                    />
                  </FormField>
                </FormRow>
              </div>
            )}

            {/* ③ Reste de la section A */}
            <FormRow>
              <FormField label={t('personnel.birthDate')}>
                <input type="date" value={form.date_naissance} onChange={e => setForm({...form, date_naissance:e.target.value})} />
              </FormField>
              <FormField label={t('personnel.birthPlace')}>
                <input value={form.lieu_naissance} onChange={e => setForm({...form, lieu_naissance:e.target.value})} />
              </FormField>
            </FormRow>
            <FormRow cols={1}>
              <FormField label={t('personnel.address')}>
                <input value={form.adresse} onChange={e => setForm({...form, adresse:e.target.value})} />
              </FormField>
            </FormRow>
            <FormRow>
              <FormField label={t('personnel.phone')}>
                <input value={form.telephone} onChange={e => setForm({...form, telephone:e.target.value})} />
              </FormField>
              <FormField label={t('personnel.email')}>
                <input type="email" value={form.email} onChange={e => setForm({...form, email:e.target.value})} />
              </FormField>
            </FormRow>
            <FormRow>
              <FormField label={t('personnel.emergencyName')}>
                <input value={form.contact_urgence_nom} onChange={e => setForm({...form, contact_urgence_nom:e.target.value})} />
              </FormField>
              <FormField label={t('personnel.emergencyPhone')}>
                <input value={form.contact_urgence_tel} onChange={e => setForm({...form, contact_urgence_tel:e.target.value})} />
              </FormField>
            </FormRow>
          </div>

          {/* ══ SECTION B — CIN + Bancaire ══ */}
          <div style={{ marginBottom:18, paddingBottom:14, borderBottom:'1px solid var(--gray-100)' }}>
            <h4 style={{ color:'var(--gold-dark)', fontWeight:700, fontSize:'0.73rem', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:14 }}>
              B — {t('personnel.cinNumber')} &amp; {t('personnel.ribCode')}
            </h4>
            <FormRow>
              <FormField label={t('personnel.cinNumber')}>
                <input value={form.cin_numero} onChange={e => setForm({...form, cin_numero:e.target.value})} placeholder="101 234 567 890" />
              </FormField>
              <FormField label={t('personnel.cinDate')}>
                <input type="date" value={form.cin_date} onChange={e => setForm({...form, cin_date:e.target.value})} />
              </FormField>
            </FormRow>
            <FormRow>
              <FormField label={t('personnel.cinPlace')}>
                <input value={form.cin_lieu} onChange={e => setForm({...form, cin_lieu:e.target.value})} placeholder="Ex: Antananarivo" />
              </FormField>
              <div />
            </FormRow>
            <FormRow>
              <FormField label={t('personnel.ribCode')}>
                <input value={form.rib_code} onChange={e => setForm({...form, rib_code:e.target.value})} placeholder="00005 12345 01234567890 97" style={{ fontFamily:'monospace' }} />
              </FormField>
              <FormField label={t('personnel.bankName')}>
                <select value={form.banque} onChange={e => setForm({...form, banque:e.target.value})}>
                  <option value="">—</option>
                  {BANQUES.map(b => <option key={b}>{b}</option>)}
                </select>
              </FormField>
            </FormRow>
          </div>

          {/* ══ SECTION C — Professionnel ══ */}
          <div style={{ marginBottom:18, paddingBottom:14, borderBottom:'1px solid var(--gray-100)' }}>
            <h4 style={{ color:'var(--gold-dark)', fontWeight:700, fontSize:'0.73rem', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:14 }}>
              {t('personnel.sectionB')}
            </h4>
            <FormRow>
              <FormField label={t('personnel.contractType')}>
                <select value={form.type_contrat} onChange={e => setForm({...form, type_contrat:e.target.value})}>
                  {CONTRATS.map(c => <option key={c}>{c}</option>)}
                </select>
              </FormField>
              <FormField label={t('personnel.entryDate')}>
                <input type="date" value={form.date_entree} onChange={e => setForm({...form, date_entree:e.target.value})} />
              </FormField>
            </FormRow>
            <FormRow>
              <FormField label={t('common.status')}>
                <select value={form.statut} onChange={e => setForm({...form, statut:e.target.value})}>
                  <option value="actif">{t('common.active')}</option>
                  <option value="inactif">{t('common.inactive')}</option>
                  <option value="suspendu">Suspendu / Suspended</option>
                </select>
              </FormField>
              <div />
            </FormRow>
          </div>

          {/* ══ SECTION D — Administratif ══ */}
          <div style={{ marginBottom:18, paddingBottom:14, borderBottom:'1px solid var(--gray-100)' }}>
            <h4 style={{ color:'var(--gold-dark)', fontWeight:700, fontSize:'0.73rem', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:14 }}>
              {t('personnel.sectionD')}
            </h4>
            <FormRow>
              <FormField label={t('personnel.cnaps')}>
                <input value={form.cnaps} onChange={e => setForm({...form, cnaps:e.target.value})} />
              </FormField>
              <FormField label={t('personnel.aro')}>
                <input value={form.aro} onChange={e => setForm({...form, aro:e.target.value})} />
              </FormField>
            </FormRow>
          </div>

          {/* ══ SECTION E — Documents ══ */}
          <div style={{ marginBottom:18 }}>
            <h4 style={{ color:'var(--gold-dark)', fontWeight:700, fontSize:'0.73rem', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:14 }}>
              {t('personnel.sectionE')} — {t('personnel.docSection')}
            </h4>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))', gap:12 }}>
              <DocUpload label={t('personnel.diploma')}      value={form.doc_diplome} onChange={v => setForm({...form, doc_diplome:v})} t={t} />
              <DocUpload label={t('personnel.cv')}           value={form.doc_cv}      onChange={v => setForm({...form, doc_cv:v})}      t={t} />
              <DocUpload label={t('personnel.workContract')} value={form.doc_contrat} onChange={v => setForm({...form, doc_contrat:v})} t={t} />
            </div>
          </div>

          {/* BOUTONS */}
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end', paddingTop:18, borderTop:'1px solid var(--gray-100)', flexWrap:'wrap' }}>
            <Btn type="button" variant="secondary" onClick={() => setModalOpen(false)}>{t('common.cancel')}</Btn>
            {editing && (
              <Btn type="button" variant="secondary" onClick={() => printFiche({...form, matricule:editing.matricule}, lang)}>
                🖨️ {t('personnel.printCard')}
              </Btn>
            )}
            <Btn type="submit" variant="gold" disabled={saving}>
              {saving ? t('common.saving') : editing ? `💾 ${t('common.update')}` : t('personnel.newMember')}
            </Btn>
          </div>

        </form>
      </Modal>
    </div>
  );
}
