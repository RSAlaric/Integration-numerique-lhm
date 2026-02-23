import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardHeader, Table, Btn, Badge, Modal, FormRow, FormField, Spinner } from '../components/ui/Card';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../i18n/LanguageContext';

// ─────────────────────────────────────────────────────────────
// CONSTANTES
// ─────────────────────────────────────────────────────────────
const QUOTA_ANNUEL = 30; // jours par année civile (1 jan → 31 déc)

const TYPES_FR = ['Congé annuel','Congé maladie','Congé maternité/paternité','Congé sans solde','Permission spéciale'];
const TYPES_EN = ['Annual leave','Sick leave','Maternity/paternity leave','Unpaid leave','Special permission'];

const MOIS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const MOIS_EN = ['January','February','March','April','May','June','July','August','September','October','November','December'];

// ─────────────────────────────────────────────────────────────
// CALCUL jours ouvrables (lun-ven)
// ─────────────────────────────────────────────────────────────
function calculerJours(dateDebut, dateFin) {
  if (!dateDebut || !dateFin) return 0;
  const d1 = new Date(dateDebut), d2 = new Date(dateFin);
  if (d2 < d1) return 0;
  let count = 0;
  const cur = new Date(d1);
  while (cur <= d2) {
    const day = cur.getDay();
    if (day !== 0 && day !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

// ─────────────────────────────────────────────────────────────
// Vérifie si un type d'absence est un "congé annuel"
// ─────────────────────────────────────────────────────────────
function isCongeAnnuel(type) {
  return type === 'Congé annuel' || type === 'Annual leave';
}

// ─────────────────────────────────────────────────────────────
// JAUGE mini — utilisée dans le tableau
// ─────────────────────────────────────────────────────────────
function MiniJauge({ pris, quota, t, lang }) {
  const reste = Math.max(0, quota - pris);
  const pct   = Math.min(100, (pris / quota) * 100);
  const color = pct >= 100 ? '#dc2626' : pct >= 80 ? '#f59e0b' : '#16a34a';
  return (
    <div style={{ minWidth:160, marginTop:4 }}>
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.69rem', marginBottom:2, fontWeight:600 }}>
        <span style={{ color:'var(--gray-400)' }}>{lang==='fr'?'Pris':'Taken'}</span>
        <span style={{ color }}>{pris}/{quota} j</span>
      </div>
      <div style={{ height:6, background:'var(--gray-200)', borderRadius:99, overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${pct}%`, background:color, borderRadius:99, transition:'width 0.4s' }} />
      </div>
      <div style={{ fontSize:'0.66rem', marginTop:2, color:reste===0?'#dc2626':'var(--gray-400)', fontWeight:reste===0?700:400 }}>
        {reste===0 ? t('absences.exhausted') : `${reste} ${t('absences.remaining')}`}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// BADGE STATUT
// ─────────────────────────────────────────────────────────────
function StatutBadge({ statut }) {
  const map = { en_attente:'warning', approuvé:'success', refusé:'error' };
  return <Badge type={map[statut]||'default'}>{statut.replace('_',' ')}</Badge>;
}

// ─────────────────────────────────────────────────────────────
// PAGE ABSENCES
// ─────────────────────────────────────────────────────────────
export default function AbsencesPage() {
  const { hasRole }  = useAuth();
  const { t, lang }  = useLang();
  const fr = lang === 'fr';

  const [absences,  setAbsences]  = useState([]);
  const [personnel, setPersonnel] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [filterStatut,    setFilterStatut]    = useState('');
  const [filterPersonnel, setFilterPersonnel] = useState('');
  const [filterAnnee,     setFilterAnnee]     = useState(new Date().getFullYear());

  const [form, setForm] = useState({
    personnel_id:'', type:'Congé annuel', date_debut:'', date_fin:'', motif:''
  });

  const TYPES       = lang === 'en' ? TYPES_EN : TYPES_FR;
  const canApprove  = hasRole('super_admin','assistant_admin','direction');
  const anneeEnCours = new Date().getFullYear();

  // Années disponibles pour le filtre (depuis 2023 jusqu'à l'année suivante)
  const anneesDisponibles = useMemo(() => {
    const years = [];
    for (let y = 2023; y <= anneeEnCours + 1; y++) years.push(y);
    return years;
  }, [anneeEnCours]);

  useEffect(() => {
    const el = document.getElementById('page-title');
    if (el) el.textContent = t('absences.title');
    loadData();
  }, [lang]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [a, p] = await Promise.all([api.get('/absences'), api.get('/personnel')]);
      setAbsences(a.data.data);
      setPersonnel(p.data.data);
    } catch { toast.error(t('common.error')); }
    finally { setLoading(false); }
  };

  // ─── CALCUL QUOTA — FILTRÉ PAR ANNÉE CIVILE ────────────────
  // Pour chaque personne, on compte les jours de congé annuel approuvés
  // dont la date de début tombe dans l'année civile sélectionnée.
  // Cela signifie que le compteur repart à 0 au 1er janvier de chaque année.
  const congesPourAnnee = useMemo(() => {
    const map = {};   // { pid: nbJours }
    absences.forEach(a => {
      if (!isCongeAnnuel(a.type) || a.statut !== 'approuvé') return;
      const anneeAbsence = new Date(a.date_debut).getFullYear();
      if (anneeAbsence !== filterAnnee) return;   // ← filtre par année civile
      const pid = a.personnel_id || a.personnelId;
      if (!map[pid]) map[pid] = 0;
      map[pid] += calculerJours(a.date_debut, a.date_fin);
    });
    return map;
  }, [absences, filterAnnee]);

  // Jours calculés pour le formulaire en cours
  const joursForm   = useMemo(() => calculerJours(form.date_debut, form.date_fin), [form.date_debut, form.date_fin]);
  const typeIsAnnuel = isCongeAnnuel(form.type);

  // Reste pour la personne sélectionnée dans l'année du formulaire
  const anneeFormDebut = form.date_debut ? new Date(form.date_debut).getFullYear() : anneeEnCours;
  const congesAnneeForm = useMemo(() => {
    const map = {};
    absences.forEach(a => {
      if (!isCongeAnnuel(a.type) || a.statut !== 'approuvé') return;
      if (new Date(a.date_debut).getFullYear() !== anneeFormDebut) return;
      const pid = a.personnel_id || a.personnelId;
      if (!map[pid]) map[pid] = 0;
      map[pid] += calculerJours(a.date_debut, a.date_fin);
    });
    return map;
  }, [absences, anneeFormDebut]);

  const resteSelectionne = useMemo(() => {
    if (!form.personnel_id || !typeIsAnnuel) return null;
    const pris = congesAnneeForm[form.personnel_id] || 0;
    return QUOTA_ANNUEL - pris;
  }, [form.personnel_id, form.type, congesAnneeForm]);

  const prisSelectionne = form.personnel_id ? (congesAnneeForm[form.personnel_id] || 0) : 0;
  const quotaDepasse    = resteSelectionne !== null && joursForm > resteSelectionne;

  // ─── DONNÉES AFFICHÉES — filtrées ──────────────────────────
  const filteredAbsences = absences.filter(a => {
    const matchStatut   = !filterStatut    || a.statut === filterStatut;
    const matchPersonnel= !filterPersonnel || String(a.personnel_id || a.personnelId) === filterPersonnel;
    const matchAnnee    = new Date(a.date_debut || a.created_at || Date.now()).getFullYear() === filterAnnee;
    return matchStatut && matchPersonnel && matchAnnee;
  });

  // ─── STATS ─────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total:      filteredAbsences.length,
    en_attente: filteredAbsences.filter(a => a.statut === 'en_attente').length,
    approuves:  filteredAbsences.filter(a => a.statut === 'approuvé').length,
    refuses:    filteredAbsences.filter(a => a.statut === 'refusé').length,
    jours_pris: Object.values(congesPourAnnee).reduce((s,v) => s+v, 0),
  }), [filteredAbsences, congesPourAnnee]);

  // ─── ACTIONS ───────────────────────────────────────────────
  const handleCreate = async e => {
    e.preventDefault();
    if (quotaDepasse) {
      toast.error(`${t('absences.quotaExceeded')} (${resteSelectionne} ${lang==='fr'?'jours restants pour':'days remaining for'} ${anneeFormDebut})`);
      return;
    }
    setSaving(true);
    try {
      await api.post('/absences', form);
      toast.success(t('common.success'));
      setModalOpen(false); loadData();
    } catch (err) { toast.error(err.response?.data?.message || t('common.error')); }
    finally { setSaving(false); }
  };

  const handleValidate = async (id, statut) => {
    try { await api.put(`/absences/${id}`, { statut }); toast.success(`→ ${statut}`); loadData(); }
    catch { toast.error(t('common.error')); }
  };

  const openModal = () => {
    setForm({ personnel_id:'', type: lang==='fr'?'Congé annuel':'Annual leave', date_debut:'', date_fin:'', motif:'' });
    setModalOpen(true);
  };

  // ─── COLONNES TABLEAU ──────────────────────────────────────
  const columns = [
    { key:'personnel_nom', header:t('absences.staffMember'), render:(v,row) => {
      const pid  = row.personnel_id || row.personnelId;
      const pris = congesPourAnnee[pid] || 0;
      const perso = personnel.find(p => String(p.id) === String(pid));
      return (
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:isCongeAnnuel(row.type)?4:0 }}>
            {perso?.photo && (
              <div style={{ width:28, height:32, borderRadius:6, overflow:'hidden', flexShrink:0 }}>
                <img src={perso.photo} alt={perso.prenom} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              </div>
            )}
            <p style={{ fontWeight:600, color:'var(--navy)', fontSize:'0.87rem' }}>{v||'—'}</p>
          </div>
          {isCongeAnnuel(row.type) && <MiniJauge pris={pris} quota={QUOTA_ANNUEL} t={t} lang={lang} />}
        </div>
      );
    }},
    { key:'type', header:t('absences.type'), render:v => (
      <Badge type={isCongeAnnuel(v)?'gold':'info'}>{v}</Badge>
    )},
    { key:'date_debut', header:t('absences.startDate'), render:v => v ? new Date(v).toLocaleDateString(lang==='fr'?'fr-FR':'en-GB') : '—' },
    { key:'date_fin',   header:t('absences.endDate'),   render:v => v ? new Date(v).toLocaleDateString(lang==='fr'?'fr-FR':'en-GB') : '—' },
    { key:'_duree',     header:t('absences.duration'),  render:(_,row) => {
      const j = calculerJours(row.date_debut, row.date_fin);
      return <span style={{ fontWeight:700, color:'var(--navy)' }}>{j} {lang==='fr'?'j.':'d.'}</span>;
    }},
    { key:'motif', header:t('absences.motif'), render:v => (
      <span style={{ fontSize:'0.82rem', color:'var(--gray-500)' }}>{v||'—'}</span>
    )},
    { key:'statut', header:t('common.status'), render:v => <StatutBadge statut={v} /> },
    { key:'actions', header:t('common.actions'), render:(_,row) => (
      <div style={{ display:'flex', gap:5 }}>
        {canApprove && row.statut === 'en_attente' && <>
          <Btn size="sm" variant="success" onClick={() => handleValidate(row.id,'approuvé')}>✅</Btn>
          <Btn size="sm" variant="danger"  onClick={() => handleValidate(row.id,'refusé')}>❌</Btn>
        </>}
      </div>
    )},
  ];

  // ─── RENDU ─────────────────────────────────────────────────

  // ── IMPRESSION PDF ABSENCES ───────────────────────────────
  const printAbsencesPDF = () => {
    const now = new Date().toLocaleDateString(fr?'fr-FR':'en-GB',{year:'numeric',month:'long',day:'numeric'});
    const w = window.open('','_blank','width=1100,height=750');
    w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"/>
<title>${fr?'Liste des Absences':'Absences List'} — LHM Madagascar</title>
<style>
@page{size:A4 landscape;margin:12mm 10mm}
*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;font-size:9.5px;color:#222}
.hdr{display:flex;align-items:center;gap:14px;margin-bottom:12px;padding-bottom:10px;border-bottom:3px solid #0f2044}
.hdr img{height:40px;object-fit:contain}.hdr h1{font-size:14px;color:#0f2044;font-weight:700}.hdr p{font-size:9px;color:#666;margin-top:2px}
.stats{display:flex;gap:12px;margin-bottom:10px}
.stat{background:#f0f4ff;border:1px solid #dbeafe;border-radius:7px;padding:5px 12px}
.sn{font-size:15px;font-weight:700;color:#0f2044}.sl{font-size:8px;color:#6b7280}
table{width:100%;border-collapse:collapse}thead tr{background:#0f2044;color:white}
th{padding:6px 7px;text-align:left;font-size:8px;font-weight:600}
tbody tr:nth-child(even){background:#f8faff}td{padding:5px 7px;border-bottom:1px solid #e5e7eb;vertical-align:middle}
.badge{display:inline-block;padding:2px 6px;border-radius:8px;font-size:7.5px;font-weight:600}
.approved{background:#dcfce7;color:#166534}.pending{background:#fef9c3;color:#854d0e}.refused{background:#fee2e2;color:#991b1b}
.bold{font-weight:600;color:#0f2044}.sub{font-size:7.5px;color:#6b7280}
.ftr{margin-top:10px;text-align:center;font-size:8px;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:5px}
</style></head><body>
<div class="hdr">
  <img src="${window.location.origin}/logo-lhm-light.png" onerror="this.style.display='none'" alt="LHM"/>
  <div>
    <h1>${fr?'Rapport des Demandes d\'Absence & Congé':'Absence & Leave Report'} — LHM Madagascar — ${fr?'Année':'Year'} ${filterAnnee}</h1>
    <p>${fr?'Imprimé le':'Printed on'} ${now} ${filterStatut?'| '+fr?'Filtre':'Filter'+': '+filterStatut:''}</p>
  </div>
</div>
<div class="stats">
  <div class="stat"><div class="sn">${filteredAbsences.length}</div><div class="sl">Total</div></div>
  <div class="stat"><div class="sn">${filteredAbsences.filter(a=>a.statut==='approuvé').length}</div><div class="sl">${fr?'Approuvés':'Approved'} ✅</div></div>
  <div class="stat"><div class="sn">${filteredAbsences.filter(a=>a.statut==='en_attente').length}</div><div class="sl">${fr?'En attente':'Pending'} ⏳</div></div>
  <div class="stat"><div class="sn">${filteredAbsences.filter(a=>a.statut==='refusé').length}</div><div class="sl">${fr?'Refusés':'Refused'} ❌</div></div>
  <div class="stat"><div class="sn">${stats.jours_pris}</div><div class="sl">${fr?'Jours pris':'Days taken'} 📅</div></div>
</div>
<table><thead><tr>
  <th>N°</th>
  <th>${fr?'Membre du personnel':'Staff member'}</th>
  <th>${fr?'Type':'Type'}</th>
  <th>${fr?'Date début':'Start date'}</th>
  <th>${fr?'Date fin':'End date'}</th>
  <th>${fr?'Durée (j. ouvr.)':'Duration (work days)'}</th>
  <th>${fr?'Motif':'Reason'}</th>
  <th>${fr?'Statut':'Status'}</th>
</tr></thead>
<tbody>
${filteredAbsences.map((a,i)=>{
  const jours = calculerJours(a.date_debut, a.date_fin);
  const sc = a.statut==='approuvé'?'approved':a.statut==='en_attente'?'pending':'refused';
  const slabel = a.statut==='approuvé'?(fr?'Approuvé':'Approved'):a.statut==='en_attente'?(fr?'En attente':'Pending'):(fr?'Refusé':'Refused');
  return `<tr>
    <td style="color:#9ca3af;font-weight:700">${i+1}</td>
    <td class="bold">${a.personnel_nom||'—'}</td>
    <td>${a.type||'—'}</td>
    <td>${a.date_debut?new Date(a.date_debut).toLocaleDateString(fr?'fr-FR':'en-GB'):'—'}</td>
    <td>${a.date_fin?new Date(a.date_fin).toLocaleDateString(fr?'fr-FR':'en-GB'):'—'}</td>
    <td style="font-weight:700;text-align:center">${jours}</td>
    <td>${a.motif||'—'}</td>
    <td><span class="badge ${sc}">${slabel}</span></td>
  </tr>`;
}).join('')}
</tbody></table>
<div class="ftr">LHM Madagascar — Feon'ny Filazantsara — ${fr?'Document confidentiel':'Confidential document'} — ${filteredAbsences.length} ${fr?'demande(s)':'request(s)'} — ${fr?'Année':'Year'} ${filterAnnee}</div>
</body></html>`);
    w.document.close(); w.onload = () => w.print();
  };

  return (
    <div className="animate-fade">

      {/* ── KPI CARDS ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:14, marginBottom:20 }}>
        {[
          { label:t('absences.kpi.total'),    value:stats.total,      color:'var(--navy)',    icon:'📋' },
          { label:t('absences.kpi.pending'),  value:stats.en_attente, color:'#f59e0b',        icon:'⏳' },
          { label:t('absences.kpi.approved'), value:stats.approuves,  color:'var(--emerald)', icon:'✅' },
          { label:t('absences.kpi.refused'),  value:stats.refuses,    color:'var(--red)',     icon:'❌' },
          { label:t('absences.kpi.daysTaken'),value:stats.jours_pris, color:'#7c3aed',       icon:'📅' },
        ].map(s => (
          <div key={s.label} style={{ background:'white', borderRadius:'var(--radius)', boxShadow:'var(--shadow)', padding:'16px 18px', borderLeft:`4px solid ${s.color}` }}>
            <p style={{ fontSize:'0.72rem', color:'var(--gray-500)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:4 }}>{s.icon} {s.label}</p>
            <p style={{ fontSize:'1.9rem', fontWeight:700, color:s.color, lineHeight:1 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── SUIVI QUOTA PAR ANNÉE CIVILE ── */}
      <Card style={{ marginBottom:20 }}>
        <CardHeader
          title={t('absences.tracking')}
          subtitle={
            <span>
              {t('absences.quota')} : <strong>{QUOTA_ANNUEL} {t('absences.daysPerYear')}</strong>
              &nbsp;—&nbsp;
              {lang==='fr'
                ? `Compteur remis à 0 le 1er Janvier de chaque année`
                : `Counter resets to 0 on January 1st every year`}
            </span>
          }
          action={
            /* Sélecteur d'année */
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontSize:'0.82rem', color:'var(--gray-500)', fontWeight:600 }}>
                {lang==='fr' ? 'Année :' : 'Year:'}
              </span>
              <select value={filterAnnee} onChange={e => setFilterAnnee(Number(e.target.value))}
                style={{ padding:'6px 12px', borderRadius:8, border:'1px solid var(--gray-200)', fontWeight:700, color:'var(--navy)', fontSize:'0.88rem' }}>
                {anneesDisponibles.map(y => (
                  <option key={y} value={y}>{y}{y === anneeEnCours ? (lang==='fr' ? ' (en cours)' : ' (current)') : ''}</option>
                ))}
              </select>
            </div>
          }
        />

        {/* ── Bandeau info reset ── */}
        <div style={{ display:'flex', alignItems:'center', gap:10, background:'rgba(201,168,76,0.08)', border:'1px solid rgba(201,168,76,0.25)', borderRadius:10, padding:'10px 14px', marginBottom:16 }}>
          <span style={{ fontSize:'1.1rem' }}>🗓️</span>
          <p style={{ fontSize:'0.82rem', color:'var(--gold-dark)', fontWeight:600 }}>
            {lang==='fr'
              ? `Chaque personnel dispose de ${QUOTA_ANNUEL} jours de congé annuel du 1er Janvier au 31 Décembre ${filterAnnee}. Le compteur repart automatiquement à 0 le 1er Janvier ${filterAnnee + 1}.`
              : `Each staff member has ${QUOTA_ANNUEL} annual leave days from January 1st to December 31st ${filterAnnee}. The counter automatically resets to 0 on January 1st ${filterAnnee + 1}.`}
          </p>
        </div>

        {/* ── Grille par personne ── */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(230px,1fr))', gap:12 }}>
          {personnel.filter(p => p.statut === 'actif').map(p => {
            const pris  = congesPourAnnee[p.id] || 0;
            const reste = Math.max(0, QUOTA_ANNUEL - pris);
            const pct   = Math.min(100, (pris / QUOTA_ANNUEL) * 100);
            const color = pct >= 100 ? '#dc2626' : pct >= 80 ? '#f59e0b' : '#16a34a';
            const moisRestants = 12 - new Date().getMonth(); // pour info

            return (
              <div key={p.id} style={{
                border:`1px solid ${pct>=100?'#fca5a5':pct>=80?'#fde68a':'var(--gray-200)'}`,
                borderRadius:10, padding:'12px 14px', background:'white',
                position:'relative', overflow:'hidden',
              }}>
                {/* Barre de couleur top */}
                <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:color, opacity:0.7 }} />

                {/* En-tête : photo + nom */}
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                  <div style={{ width:38, height:44, borderRadius:8, overflow:'hidden', border:'1.5px solid var(--gray-200)', background:'var(--gray-100)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    {p.photo
                      ? <img src={p.photo} alt={p.prenom} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                      : <span style={{ fontSize:'1.1rem' }}>👤</span>}
                  </div>
                  <div style={{ overflow:'hidden' }}>
                    <p style={{ fontWeight:700, color:'var(--navy)', fontSize:'0.84rem', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{p.prenom} {p.nom}</p>
                    <p style={{ fontSize:'0.7rem', color:'var(--gray-400)' }}>{p.poste}</p>
                  </div>
                </div>

                {/* Jauge */}
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.73rem', marginBottom:4, fontWeight:600 }}>
                  <span style={{ color:'var(--gray-500)' }}>{pris} {lang==='fr'?'j. pris':'d. taken'}</span>
                  <span style={{ color, fontWeight:700 }}>{reste} {lang==='fr'?'j. restants':'d. left'}</span>
                </div>
                <div style={{ height:9, background:'var(--gray-200)', borderRadius:99, overflow:'hidden', marginBottom:5 }}>
                  <div style={{ height:'100%', width:`${pct}%`, background:color, borderRadius:99, transition:'width 0.4s' }} />
                </div>

                {/* Légende */}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontSize:'0.68rem', color:'var(--gray-400)' }}>{pris}/{QUOTA_ANNUEL} j — {filterAnnee}</span>
                  {pct >= 100
                    ? <span style={{ fontSize:'0.69rem', color:'#dc2626', fontWeight:700 }}>{t('absences.exhausted')}</span>
                    : pct >= 80
                      ? <span style={{ fontSize:'0.69rem', color:'#f59e0b', fontWeight:600 }}>⚠️ {lang==='fr'?'Presque épuisé':'Almost done'}</span>
                      : <span style={{ fontSize:'0.69rem', color:'#16a34a' }}>✓ OK</span>
                  }
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* ── TABLEAU DEMANDES ── */}
      <Card>
        <CardHeader
          title={t('absences.requests')}
          subtitle={`${filteredAbsences.length} ${lang==='fr'?'demande(s) — année':'request(s) — year'} ${filterAnnee}`}
          action={
            <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
              <select value={filterPersonnel} onChange={e => setFilterPersonnel(e.target.value)} style={{ width:'auto', minWidth:160 }}>
                <option value="">{t('common.allStaff')}</option>
                {personnel.map(p => <option key={p.id} value={p.id}>{p.prenom} {p.nom}</option>)}
              </select>
              <select value={filterStatut} onChange={e => setFilterStatut(e.target.value)} style={{ width:'auto' }}>
                <option value="">{t('common.allStatuses')}</option>
                <option value="en_attente">{t('absences.statuses.pending')}</option>
                <option value="approuvé">{t('absences.statuses.approved')}</option>
                <option value="refusé">{t('absences.statuses.refused')}</option>
              </select>
              <Btn variant="secondary" onClick={printAbsencesPDF}>🖨️ {fr?'Imprimer PDF':'Print PDF'}</Btn>
              <Btn variant="gold" onClick={openModal}>{t('absences.newRequest')}</Btn>
            </div>
          }
        />
        {loading
          ? <Spinner />
          : <Table columns={columns} data={filteredAbsences} emptyMessage={lang==='fr'?"Aucune demande pour cette année":"No requests for this year"} />}
      </Card>

      {/* ── MODAL NOUVELLE DEMANDE ── */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={t('absences.newRequest')}>
        <form onSubmit={handleCreate} style={{ padding:24 }}>

          {/* Sélection du personnel */}
          <FormRow cols={1}>
            <FormField label={`${t('absences.staffMember')} *`} required>
              <select value={form.personnel_id} onChange={e => setForm({...form, personnel_id:e.target.value})} required>
                <option value="">{t('absences.selectStaff')}</option>
                {personnel.map(p => {
                  const pris  = congesAnneeForm[p.id] || 0;
                  const reste = QUOTA_ANNUEL - pris;
                  const tag   = reste <= 0
                    ? ` ⛔ ${t('absences.quotaTag')}`
                    : reste <= 5
                      ? ` (${reste}j ${t('absences.remaining')})`
                      : '';
                  return <option key={p.id} value={p.id}>{p.prenom} {p.nom} — {p.poste}{tag}</option>;
                })}
              </select>
            </FormField>
          </FormRow>

          {/* Type d'absence */}
          <FormRow cols={1}>
            <FormField label={t('absences.type')}>
              <select value={form.type} onChange={e => setForm({...form, type:e.target.value})}>
                {TYPES.map(tp => <option key={tp}>{tp}</option>)}
              </select>
            </FormField>
          </FormRow>

          {/* Dates */}
          <FormRow>
            <FormField label={`${t('absences.startDate')} *`}>
              <input type="date" value={form.date_debut} onChange={e => setForm({...form, date_debut:e.target.value})} required />
            </FormField>
            <FormField label={`${t('absences.endDate')} *`}>
              <input type="date" value={form.date_fin} onChange={e => setForm({...form, date_fin:e.target.value})} required />
            </FormField>
          </FormRow>

          {/* Durée calculée */}
          {joursForm > 0 && (
            <div style={{ background:'var(--gray-50)', border:'1px solid var(--gray-200)', borderRadius:8, padding:'8px 14px', marginBottom:14, display:'flex', gap:10, alignItems:'center' }}>
              <span style={{ fontSize:'0.8rem', color:'var(--gray-500)' }}>{t('absences.workDays')}</span>
              <span style={{ fontWeight:700, color:'var(--navy)', fontSize:'0.92rem' }}>{joursForm} {t('absences.days')}</span>
              {anneeFormDebut !== anneeEnCours && (
                <span style={{ fontSize:'0.75rem', color:'var(--gold-dark)', fontWeight:600, marginLeft:'auto' }}>
                  📅 {lang==='fr'?`Imputé sur l'année`:'Charged to year'} {anneeFormDebut}
                </span>
              )}
            </div>
          )}

          {/* BLOC QUOTA — visible seulement pour congé annuel */}
          {form.personnel_id && typeIsAnnuel && (
            <div style={{
              background: resteSelectionne <= 0 ? '#fef2f2' : '#f0fdf4',
              border: `1px solid ${resteSelectionne <= 0 ? '#fca5a5' : '#86efac'}`,
              borderRadius:12, padding:'14px 16px', marginBottom:16,
            }}>
              {/* En-tête */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                <p style={{ fontSize:'0.82rem', fontWeight:700, color:resteSelectionne<=0?'#dc2626':'#166534' }}>
                  {resteSelectionne <= 0 ? t('absences.quotaExhausted') : `📅 ${t('absences.quotaInfo')}`}
                </p>
                <div style={{ textAlign:'right' }}>
                  <span style={{ fontSize:'1.1rem', fontWeight:800, color:resteSelectionne<=0?'#dc2626':'#166534' }}>
                    {Math.max(0, resteSelectionne)}/{QUOTA_ANNUEL}
                  </span>
                  <span style={{ fontSize:'0.75rem', color:'var(--gray-500)', marginLeft:4 }}>
                    {lang==='fr'?'jours restants':'days left'}
                  </span>
                </div>
              </div>

              {/* Barre */}
              <div style={{ height:14, background:'#e5e7eb', borderRadius:99, overflow:'hidden', marginBottom:8 }}>
                <div style={{
                  height:'100%',
                  width:`${Math.min(100, (prisSelectionne/QUOTA_ANNUEL)*100)}%`,
                  background: resteSelectionne<=0?'#dc2626': resteSelectionne<=5?'#f59e0b':'#16a34a',
                  borderRadius:99, transition:'width 0.4s',
                  display:'flex', alignItems:'center', justifyContent:'flex-end', paddingRight:4,
                }} />
              </div>

              {/* Légende sous la barre */}
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.73rem', color:'var(--gray-500)', marginBottom:8 }}>
                <span>{lang==='fr'?'Déjà pris':'Already taken'} : <strong style={{ color:'var(--navy)' }}>{prisSelectionne} j</strong></span>
                <span>{lang==='fr'?'Quota annuel':'Annual quota'} : {QUOTA_ANNUEL} j — {anneeFormDebut}</span>
              </div>

              {/* Message si jours saisis */}
              {joursForm > 0 && (
                <p style={{ fontSize:'0.78rem', color:quotaDepasse?'#dc2626':'#166534', fontWeight:600, padding:'6px 10px', background:quotaDepasse?'rgba(220,38,38,0.06)':'rgba(22,163,74,0.06)', borderRadius:7 }}>
                  {quotaDepasse
                    ? `❌ ${t('absences.usesdays')} ${joursForm} j. — ${t('absences.exceeds')} (${resteSelectionne} j. ${lang==='fr'?'disponibles':'available'})`
                    : `✅ ${t('absences.usesdays')} ${joursForm} j. — ${lang==='fr'?'il restera':'will remain'} ${resteSelectionne - joursForm} j.`}
                </p>
              )}

              {/* Rappel reset */}
              <p style={{ fontSize:'0.72rem', color:'var(--gray-400)', marginTop:8, fontStyle:'italic' }}>
                🗓️ {lang==='fr'
                  ? `Ce compteur concerne l'année civile ${anneeFormDebut} (1er Jan → 31 Déc). Il repart à 0 le 1er Jan ${anneeFormDebut + 1}.`
                  : `This counter is for calendar year ${anneeFormDebut} (Jan 1 → Dec 31). It resets on Jan 1st ${anneeFormDebut + 1}.`}
              </p>
            </div>
          )}

          {/* Motif */}
          <FormRow cols={1}>
            <FormField label={t('absences.motif')}>
              <textarea value={form.motif} onChange={e => setForm({...form, motif:e.target.value})} rows={3} style={{ resize:'vertical' }} />
            </FormField>
          </FormRow>

          {/* Boutons */}
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
            <Btn type="button" variant="secondary" onClick={() => setModalOpen(false)}>{t('common.cancel')}</Btn>
            <Btn type="submit" variant="gold" disabled={saving || quotaDepasse}>
              {saving ? t('common.sending') : quotaDepasse ? t('absences.quotaExceeded') : t('absences.submit')}
            </Btn>
          </div>
        </form>
      </Modal>
    </div>
  );
}
