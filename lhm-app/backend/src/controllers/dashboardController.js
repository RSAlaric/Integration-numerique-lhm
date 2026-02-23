const { db } = require('../database');

exports.getDashboard = (req, res) => {
  // Personnel
  const personnelActif = db.personnel.filter(p => p.statut === 'actif').length;
  const absencesEnAttente = db.absences.filter(a => a.statut === 'en_attente').length;

  // Volontaires
  const voluntairesActifs = db.volunteers.filter(v => v.statut === 'actif').length;
  const voluntairesAffectes = db.volunteers.filter(v => v.statut_workflow === 'affecté').length;
  const tauxOccupation = voluntairesActifs > 0 ? Math.round((voluntairesAffectes / voluntairesActifs) * 100) : 0;

  // Stock
  const articlesTotal = db.stock.length;
  const alertesRouges = db.stock.filter(a => a.quantite <= a.seuil_min).length;
  const alertesOranges = db.stock.filter(a => a.quantite > a.seuil_min && a.quantite <= a.seuil_securite).length;
  const expirationProche = db.stock.filter(a => {
    if (!a.date_peremption) return false;
    const diff = (new Date(a.date_peremption) - new Date()) / (1000 * 60 * 60 * 24);
    return diff <= 30 && diff > 0;
  }).length;
  const valeurStock = db.stock.reduce((s, a) => s + (a.quantite * a.prix_unitaire), 0);

  // Projets
  const projetsEnCours = db.projects.filter(p => p.statut === 'en_cours').length;
  const projetsEnRetard = db.projects.filter(p => p.statut === 'en_cours' && new Date(p.date_fin_prevue) < new Date()).length;
  const budgetConsommeMois = db.projects.reduce((s, p) => s + p.budget_consomme, 0);

  // Utilisateurs
  const totalUtilisateurs = db.users.filter(u => u.actif).length;

  // Alertes prioritaires
  const alertes = [];
  if (absencesEnAttente > 0) alertes.push({ type: 'warning', message: `${absencesEnAttente} demande(s) de congé en attente de validation`, module: 'personnel' });
  if (alertesRouges > 0) alertes.push({ type: 'error', message: `${alertesRouges} article(s) en stock critique (rouge)`, module: 'stock' });
  if (alertesOranges > 0) alertes.push({ type: 'warning', message: `${alertesOranges} article(s) en stock de sécurité (orange)`, module: 'stock' });
  if (projetsEnRetard > 0) alertes.push({ type: 'error', message: `${projetsEnRetard} projet(s) en retard`, module: 'projets' });
  if (expirationProche > 0) alertes.push({ type: 'warning', message: `${expirationProche} article(s) expirant dans les 30 jours`, module: 'stock' });

  // Activité récente (audit)
  const activiteRecente = db.auditLogs.slice(-10).reverse().map(log => {
    const user = db.users.find(u => u.id === log.utilisateur_id);
    return { ...log, utilisateur_nom: user ? `${user.prenom} ${user.nom}` : 'Inconnu' };
  });

  res.json({
    success: true,
    data: {
      kpis: {
        personnel: { actif: personnelActif, absences_attente: absencesEnAttente },
        volontaires: { total: voluntairesActifs, taux_occupation: tauxOccupation },
        stock: { total_articles: articlesTotal, alertes_rouges: alertesRouges, alertes_oranges: alertesOranges, valeur: valeurStock },
        projets: { en_cours: projetsEnCours, en_retard: projetsEnRetard, budget_consomme: budgetConsommeMois },
        utilisateurs: { total: totalUtilisateurs }
      },
      alertes,
      activite_recente: activiteRecente
    }
  });
};

exports.getAuditLogs = (req, res) => {
  const logs = db.auditLogs.slice().reverse().map(log => {
    const user = db.users.find(u => u.id === log.utilisateur_id);
    return { ...log, utilisateur_nom: user ? `${user.prenom} ${user.nom}` : 'Inconnu' };
  });
  res.json({ success: true, count: logs.length, data: logs });
};
