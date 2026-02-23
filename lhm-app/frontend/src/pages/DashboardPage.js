import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { KPICard, Card, CardHeader, AlertBanner, Badge, Spinner } from '../components/ui/Card';
import api from '../utils/api';

const COLORS = ['#0f2044', '#c9a84c', '#1a7a4a', '#2980b9', '#e67e22', '#c0392b'];

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'Tableau de bord – LHM Madagascar';
    const el = document.getElementById('page-title');
    if (el) el.textContent = 'Tableau de bord';
    api.get('/dashboard').then(r => setData(r.data.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (!data) return <p>Erreur de chargement</p>;

  const { kpis, alertes, activite_recente } = data;

  const stockData = [
    { name: 'OK', value: kpis.stock.total_articles - kpis.stock.alertes_rouges - kpis.stock.alertes_oranges },
    { name: 'Orange', value: kpis.stock.alertes_oranges },
    { name: 'Rouge', value: kpis.stock.alertes_rouges },
  ].filter(d => d.value > 0);

  const projetsData = [
    { name: 'En cours', valeur: kpis.projets.en_cours },
    { name: 'En retard', valeur: kpis.projets.en_retard },
  ];

  return (
    <div className="animate-fade">
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.8rem', color: 'var(--navy)', marginBottom: 4 }}>
          Vue d'ensemble
        </h2>
        <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Alertes */}
      {alertes && alertes.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 28 }}>
          {alertes.map((a, i) => <AlertBanner key={i} type={a.type} message={a.message} />)}
        </div>
      )}

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
        <KPICard icon="👥" label="Personnel actif" value={kpis.personnel.actif} sub={`${kpis.personnel.absences_attente} congé(s) en attente`} color="var(--navy)" />
        <KPICard icon="🤝" label="Volontaires actifs" value={kpis.volontaires.total} sub={`${kpis.volontaires.taux_occupation}% d'occupation`} color="var(--emerald)" />
        <KPICard icon="📦" label="Articles en stock" value={kpis.stock.total_articles} sub={`${kpis.stock.alertes_rouges} alerte(s) critique(s)`} color={kpis.stock.alertes_rouges > 0 ? 'var(--red)' : 'var(--blue-accent)'} />
        <KPICard icon="🎯" label="Projets en cours" value={kpis.projets.en_cours} sub={`${kpis.projets.en_retard} en retard`} color="var(--gold-dark)" />
        <KPICard icon="💰" label="Valeur du stock" value={`${(kpis.stock.valeur/1000000).toFixed(1)}M Ar`} color="var(--emerald)" />
        <KPICard icon="👤" label="Utilisateurs actifs" value={kpis.utilisateurs.total} color="var(--navy-light)" />
      </div>

      {/* Charts + Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: 20, marginBottom: 20 }}>
        {/* Stock chart */}
        <Card>
          <CardHeader title="État du Stock" subtitle="Niveaux d'alerte" />
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={stockData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                {stockData.map((_, i) => <Cell key={i} fill={['#1a7a4a', '#e67e22', '#c0392b'][i]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Projets chart */}
        <Card>
          <CardHeader title="Projets" subtitle="Avancement" />
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={projetsData} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="valeur" fill="var(--navy)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Activité récente */}
        <Card>
          <CardHeader title="Activité récente" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 200, overflowY: 'auto' }}>
            {activite_recente && activite_recente.length > 0 ? activite_recente.map((log, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, paddingBottom: 10, borderBottom: '1px solid var(--gray-100)' }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', flexShrink: 0 }}>
                  {log.action.includes('CONNEXION') ? '🔑' : log.action.includes('CRÉATION') ? '➕' : log.action.includes('MODIFICATION') ? '✏️' : '📋'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--navy)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{log.action.replace(/_/g, ' ')}</p>
                  <p style={{ fontSize: '0.73rem', color: 'var(--gray-400)' }}>{log.utilisateur_nom} • {new Date(log.date).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
            )) : <p style={{ color: 'var(--gray-400)', fontSize: '0.85rem', textAlign: 'center', padding: '20px 0' }}>Aucune activité récente</p>}
          </div>
        </Card>
      </div>

      {/* Budget projets */}
      <Card>
        <CardHeader title="Budget des Projets" subtitle="Consommation vs alloué (en Ariary)" />
        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--gray-500)' }}>Budget total alloué</span>
              <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--navy)' }}>{kpis.projets.budgetTotal?.toLocaleString('fr-FR') || '—'} Ar</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--gray-500)' }}>Budget consommé</span>
              <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--gold-dark)' }}>{kpis.projets.budget_consomme?.toLocaleString('fr-FR') || '—'} Ar</span>
            </div>
            {kpis.projets.budgetTotal > 0 && (
              <>
                <div style={{ height: 10, borderRadius: 5, background: 'var(--gray-100)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min((kpis.projets.budget_consomme / kpis.projets.budgetTotal) * 100, 100)}%`, background: 'linear-gradient(90deg, var(--navy), var(--navy-light))', borderRadius: 5, transition: 'width 0.6s ease' }} />
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--gray-400)', marginTop: 6 }}>
                  {Math.round((kpis.projets.budget_consomme / kpis.projets.budgetTotal) * 100)}% consommé
                </p>
              </>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
