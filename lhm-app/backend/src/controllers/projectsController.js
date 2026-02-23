const { db, findById, update, addAuditLog } = require('../database');
const { v4: uuidv4 } = require('uuid');

exports.getAll = (req, res) => {
  const { statut } = req.query;
  let projects = [...db.projects];
  if (statut) projects = projects.filter(p => p.statut === statut);

  const enriched = projects.map(p => {
    const responsable = db.users.find(u => u.id === p.responsable_id);
    const enRetard = p.statut === 'en_cours' && new Date(p.date_fin_prevue) < new Date() && p.avancement < 100;
    return { ...p, responsable_nom: responsable ? `${responsable.prenom} ${responsable.nom}` : 'Inconnu', en_retard: enRetard, budget_restant: p.budget - p.budget_consomme };
  });

  res.json({ success: true, count: enriched.length, data: enriched });
};

exports.getById = (req, res) => {
  const p = findById('projects', req.params.id);
  if (!p) return res.status(404).json({ success: false, message: 'Projet non trouvé' });
  res.json({ success: true, data: p });
};

exports.create = (req, res) => {
  const data = { id: uuidv4(), ...req.body, statut: 'planifié', avancement: 0, budget_consomme: 0, created_at: new Date().toISOString() };
  db.projects.push(data);
  addAuditLog(req.user.id, 'CRÉATION_PROJET', `Projet:${data.nom}`, null, data);
  res.status(201).json({ success: true, message: 'Projet créé', data });
};

exports.update = (req, res) => {
  const existing = findById('projects', req.params.id);
  if (!existing) return res.status(404).json({ success: false, message: 'Projet non trouvé' });
  const updated = update('projects', req.params.id, req.body);
  addAuditLog(req.user.id, 'MODIFICATION_PROJET', `Projet:${existing.nom}`, existing, updated);
  res.json({ success: true, message: 'Projet mis à jour', data: updated });
};

exports.getStats = (req, res) => {
  const total = db.projects.length;
  const enCours = db.projects.filter(p => p.statut === 'en_cours').length;
  const termines = db.projects.filter(p => p.statut === 'terminé').length;
  const enRetard = db.projects.filter(p => p.statut === 'en_cours' && new Date(p.date_fin_prevue) < new Date() && p.avancement < 100).length;
  const budgetTotal = db.projects.reduce((s, p) => s + p.budget, 0);
  const budgetConsomme = db.projects.reduce((s, p) => s + p.budget_consomme, 0);

  res.json({ success: true, data: { total, enCours, termines, enRetard, budgetTotal, budgetConsomme } });
};
