import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { personnelAPI, servicesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function PersonnelDetailPage() {
  const { id } = useParams();
  const [person, setPerson] = useState(null);
  const [services, setServices] = useState([]);
  const [activeTab, setActiveTab] = useState('info');
  const navigate = useNavigate();
  const { can } = useAuth();

  useEffect(() => {
    Promise.all([personnelAPI.get(id), servicesAPI.list()]).then(([p, s]) => {
      setPerson(p.data); setServices(s.data);
    });
  }, [id]);

  if (!person) return <div className="loading-screen" style={{ minHeight: 400 }}><div className="spinner" /></div>;
  const getServiceName = (sid) => services.find(s => s.id === sid)?.name || sid;
  const initials = `${person.firstName?.[0] || ''}${person.lastName?.[0] || ''}`.toUpperCase();

  const InfoRow = ({ label, value }) => (
    <div style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--gray-100)' }}>
      <span style={{ fontSize: 12, color: 'var(--gray-500)', width: 160, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 14, color: 'var(--gray-800)', fontWeight: 500 }}>{value || '—'}</span>
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button className="btn btn-outline btn-sm" onClick={() => navigate('/personnel')}>← Retour</button>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, color: 'var(--navy)' }}>Fiche Personnel</h1>
      </div>

      {/* PROFILE HEADER */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ padding: 24, display: 'flex', alignItems: 'center', gap: 20 }}>
          <div className="avatar avatar-lg" style={{ background: `hsl(${person.id.charCodeAt(1) * 30}, 50%, 35%)`, width: 72, height: 72, fontSize: 26 }}>
            {initials}
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, color: 'var(--navy)', marginBottom: 4 }}>
              {person.firstName} {person.lastName}
            </h2>
            <p style={{ color: 'var(--gray-500)', fontSize: 14 }}>{person.poste} · {getServiceName(person.service)}</p>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <span className={`badge ${person.contractType === 'CDI' ? 'badge-green' : 'badge-orange'}`}>{person.contractType}</span>
              <span className="badge badge-navy">{person.matricule}</span>
              <span className={`badge ${person.status === 'active' ? 'badge-green' : 'badge-gray'}`}>
                {person.status === 'active' ? '✓ Actif' : 'Archivé'}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <a href={`mailto:${person.email}`} className="btn btn-outline btn-sm">📧 Email</a>
            <a href={`tel:${person.phone}`} className="btn btn-outline btn-sm">📞 Appel</a>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="tabs">
        {['info', 'professional', 'skills', 'admin'].map(tab => (
          <button key={tab} className={`tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
            {{ info: '👤 Informations', professional: '💼 Professionnel', skills: '🎓 Compétences', admin: '📋 Administratif' }[tab]}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="card-body">
          {activeTab === 'info' && (
            <div>
              <InfoRow label="Prénom" value={person.firstName} />
              <InfoRow label="Nom" value={person.lastName} />
              <InfoRow label="Date de naissance" value={person.birthDate} />
              <InfoRow label="Lieu de naissance" value={person.birthPlace} />
              <InfoRow label="Adresse" value={person.address} />
              <InfoRow label="Téléphone" value={person.phone} />
              <InfoRow label="Email" value={person.email} />
              <InfoRow label="Situation familiale" value={person.familySituation} />
              <InfoRow label="Contact urgence" value={person.emergencyContact ? `${person.emergencyContact.name} — ${person.emergencyContact.phone}` : null} />
            </div>
          )}
          {activeTab === 'professional' && (
            <div>
              <InfoRow label="Matricule" value={person.matricule} />
              <InfoRow label="Poste" value={person.poste} />
              <InfoRow label="Service" value={getServiceName(person.service)} />
              <InfoRow label="Type de contrat" value={person.contractType} />
              <InfoRow label="Date d'entrée" value={person.entryDate} />
              <InfoRow label="Objectifs annuels" value={person.objectives} />
              {can(['admin', 'direction', 'rh']) && (
                <>
                  <InfoRow label="Salaire (Ar)" value={person.salary ? person.salary.toLocaleString('fr-FR') + ' Ar' : null} />
                  <InfoRow label="RIB" value={person.rib} />
                </>
              )}
            </div>
          )}
          {activeTab === 'skills' && (
            <div>
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>Compétences</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {person.skills?.length ? person.skills.map(s => <span key={s} className="badge badge-navy">{s}</span>) : <span style={{ color: 'var(--gray-400)' }}>Aucune compétence renseignée</span>}
                </div>
              </div>
              <div>
                <p style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>Langues</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {person.languages?.map(l => <span key={l.lang} className="badge badge-gold">{l.lang} — {l.level}</span>)}
                </div>
              </div>
            </div>
          )}
          {activeTab === 'admin' && (
            <div>
              <InfoRow label="N° CNAPS" value={person.cnaps} />
              <InfoRow label="N° ARO" value={person.aro} />
              <InfoRow label="Créé le" value={new Date(person.createdAt).toLocaleDateString('fr-FR')} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
