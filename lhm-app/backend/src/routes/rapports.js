const express = require('express');
const db = require('../models/inMemoryDB');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/dashboard', (req, res) => {
  const alertesStock = db.articles.filter(a => a.quantite <= a.stockSecurite).length;
  const congesEnAttente = db.absences.filter(a => a.statut === 'en_attente').length;
  const projetsEnRetard = db.projets.filter(p => p.statut === 'en_retard').length;
  const volontairesActifs = db.volontaires.filter(v => v.statut === 'actif').length;
  const personnelActif = db.personnel.filter(p => p.statut === 'actif').length;

  const stockCritique = db.articles
    .filter(a => a.quantite <= a.stockMin)
    .map(a => ({ code: a.code, designation: a.designation, quantite: a.quantite }));

  const projetsRecents = db.projets.slice(0, 3).map(p => ({
    id: p.id, nom: p.nom, statut: p.statut, avancement: p.avancement, budget: p.budget, depenses: p.depenses
  }));

  const valeurStock = db.articles.reduce((sum, a) => sum + (a.quantite * a.prixUnitaire), 0);
  const depensesProjets = db.projets.reduce((sum, p) => sum + p.depenses, 0);

  res.json({
    kpis: {
      personnelTotal: personnelActif,
      volontairesTotal: volontairesActifs,
      projetsEnCours: db.projets.filter(p => p.statut === 'en_cours').length,
      alertesStock,
      congesEnAttente,
      projetsEnRetard,
      valeurStock,
      depensesMois: depensesProjets,
    },
    stockCritique,
    projetsRecents,
    alertes: [
      ...( congesEnAttente > 0 ? [{ type: 'warning', message: `${congesEnAttente} demande(s) de congé en attente` }] : []),
      ...( alertesStock > 0 ? [{ type: 'danger', message: `${alertesStock} article(s) en stock critique` }] : []),
      ...( projetsEnRetard > 0 ? [{ type: 'danger', message: `${projetsEnRetard} projet(s) en retard` }] : []),
    ],
    activitesRecentes: db.auditLogs.slice(0, 5),
  });
});

router.get('/personnel', (req, res) => {
  const parService = {};
  db.personnel.forEach(p => {
    parService[p.service] = (parService[p.service] || 0) + 1;
  });
  res.json({
    total: db.personnel.length,
    actifs: db.personnel.filter(p => p.statut === 'actif').length,
    parService: Object.entries(parService).map(([service, count]) => ({ service, count })),
    absences: db.absences,
    contrats: {
      cdi: db.personnel.filter(p => p.typeContrat === 'CDI').length,
      cdd: db.personnel.filter(p => p.typeContrat === 'CDD').length,
    }
  });
});

router.get('/stock', (req, res) => {
  const valeurTotale = db.articles.reduce((sum, a) => sum + (a.quantite * a.prixUnitaire), 0);
  const parCategorie = {};
  db.articles.forEach(a => {
    parCategorie[a.categorie] = (parCategorie[a.categorie] || { valeur: 0, articles: 0 });
    parCategorie[a.categorie].valeur += a.quantite * a.prixUnitaire;
    parCategorie[a.categorie].articles += 1;
  });
  res.json({
    valeurTotale,
    totalArticles: db.articles.length,
    articlesEnAlerte: db.articles.filter(a => a.quantite <= a.stockSecurite).length,
    parCategorie: Object.entries(parCategorie).map(([cat, data]) => ({ categorie: cat, ...data })),
    mouvementsRecents: db.mouvements.slice(-10),
  });
});

router.get('/projets', (req, res) => {
  const budgetTotal = db.projets.reduce((s, p) => s + p.budget, 0);
  const depensesTotal = db.projets.reduce((s, p) => s + p.depenses, 0);
  res.json({
    total: db.projets.length,
    enCours: db.projets.filter(p => p.statut === 'en_cours').length,
    enRetard: db.projets.filter(p => p.statut === 'en_retard').length,
    termines: db.projets.filter(p => p.statut === 'termine').length,
    budgetTotal,
    depensesTotal,
    tauxConsommation: budgetTotal > 0 ? Math.round((depensesTotal / budgetTotal) * 100) : 0,
    projets: db.projets,
  });
});

module.exports = router;
