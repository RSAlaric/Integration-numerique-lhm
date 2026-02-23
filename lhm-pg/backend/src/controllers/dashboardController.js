const prisma = require('../prisma');

exports.getDashboard = async (req, res) => {
  try {
    const [
      personnelActif, absencesEnAttente,
      voluntairesActifs, voluntairesAffectes,
      articles, projets, utilisateurs,
      activiteRecente
    ] = await Promise.all([
      prisma.personnel.count({ where: { statut: 'actif' } }),
      prisma.absence.count({ where: { statut: 'en_attente' } }),
      prisma.volontaire.count({ where: { statut: 'actif' } }),
      prisma.volontaire.count({ where: { statut: 'actif', statut_workflow: 'affecte' } }),
      prisma.article.findMany(),
      prisma.projet.findMany({ select: { statut: true, date_fin_prevue: true, avancement: true, budget: true, budget_consomme: true } }),
      prisma.user.count({ where: { actif: true } }),
      prisma.auditLog.findMany({
        orderBy: { date: 'desc' }, take: 8,
        include: { utilisateur: { select: { nom: true, prenom: true } } }
      })
    ]);

    const alertesRouges = articles.filter(a => a.quantite <= a.seuil_min).length;
    const alertesOranges = articles.filter(a => a.quantite > a.seuil_min && a.quantite <= a.seuil_securite).length;
    const expirationProche = articles.filter(a => {
      if (!a.date_peremption) return false;
      const diff = (new Date(a.date_peremption) - new Date()) / (1000 * 60 * 60 * 24);
      return diff <= 30 && diff > 0;
    }).length;
    const valeurStock = articles.reduce((s, a) => s + (a.quantite * a.prix_unitaire), 0);

    const projetsEnCours = projets.filter(p => p.statut === 'en_cours').length;
    const projetsEnRetard = projets.filter(p => p.statut === 'en_cours' && p.date_fin_prevue && new Date(p.date_fin_prevue) < new Date()).length;
    const budgetTotal = projets.reduce((s, p) => s + p.budget, 0);
    const budgetConsomme = projets.reduce((s, p) => s + p.budget_consomme, 0);
    const tauxOccupation = voluntairesActifs > 0 ? Math.round((voluntairesAffectes / voluntairesActifs) * 100) : 0;

    const alertes = [];
    if (absencesEnAttente > 0) alertes.push({ type: 'warning', message: `${absencesEnAttente} demande(s) de congé en attente`, module: 'personnel' });
    if (alertesRouges > 0) alertes.push({ type: 'error', message: `${alertesRouges} article(s) en stock critique`, module: 'stock' });
    if (alertesOranges > 0) alertes.push({ type: 'warning', message: `${alertesOranges} article(s) en stock de sécurité`, module: 'stock' });
    if (projetsEnRetard > 0) alertes.push({ type: 'error', message: `${projetsEnRetard} projet(s) en retard`, module: 'projets' });
    if (expirationProche > 0) alertes.push({ type: 'warning', message: `${expirationProche} article(s) expirant dans 30 jours`, module: 'stock' });

    res.json({ success: true, data: {
      kpis: {
        personnel: { actif: personnelActif, absences_attente: absencesEnAttente },
        volontaires: { total: voluntairesActifs, taux_occupation: tauxOccupation },
        stock: { total_articles: articles.length, alertes_rouges: alertesRouges, alertes_oranges: alertesOranges, valeur: valeurStock },
        projets: { en_cours: projetsEnCours, en_retard: projetsEnRetard, budget_consomme: budgetConsomme, budgetTotal },
        utilisateurs: { total: utilisateurs }
      },
      alertes,
      activite_recente: activiteRecente.map(l => ({
        ...l,
        utilisateur_nom: l.utilisateur ? `${l.utilisateur.prenom} ${l.utilisateur.nom}` : 'Système'
      }))
    }});
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.getAuditLogs = async (req, res) => {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { date: 'desc' }, take: 200,
      include: { utilisateur: { select: { nom: true, prenom: true, email: true } } }
    });
    const enriched = logs.map(l => ({ ...l, utilisateur_nom: l.utilisateur ? `${l.utilisateur.prenom} ${l.utilisateur.nom}` : 'Système' }));
    res.json({ success: true, count: enriched.length, data: enriched });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};
