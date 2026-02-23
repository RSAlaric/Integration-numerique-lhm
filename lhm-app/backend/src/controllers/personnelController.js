const { db, findAll, findById, create, update, remove, addAuditLog } = require('../database');
const { v4: uuidv4 } = require('uuid');

exports.getAll = (req, res) => {
  const { service, statut, search } = req.query;
  let personnel = [...db.personnel];

  if (service) personnel = personnel.filter(p => p.service === service);
  if (statut) personnel = personnel.filter(p => p.statut === statut);
  if (search) {
    const s = search.toLowerCase();
    personnel = personnel.filter(p =>
      p.nom.toLowerCase().includes(s) || p.prenom.toLowerCase().includes(s) ||
      p.matricule.toLowerCase().includes(s) || p.poste.toLowerCase().includes(s)
    );
  }

  res.json({ success: true, count: personnel.length, data: personnel });
};

exports.getById = (req, res) => {
  const p = findById('personnel', req.params.id);
  if (!p) return res.status(404).json({ success: false, message: 'Personnel non trouvé' });
  // Masquer salaire selon rôle
  if (!['super_admin', 'direction', 'assistant_admin'].includes(req.user.role)) {
    const { salaire, rib, ...safe } = p;
    return res.json({ success: true, data: safe });
  }
  res.json({ success: true, data: p });
};

exports.create = (req, res) => {
  const data = req.body;
  // Auto-générer matricule
  const prefix = data.service ? data.service.substring(0, 3).toUpperCase() : 'PER';
  const count = db.personnel.filter(p => p.service === data.service).length + 1;
  data.matricule = `${prefix}-${String(count).padStart(3, '0')}`;
  data.id = uuidv4();
  data.created_at = new Date().toISOString();
  data.statut = data.statut || 'actif';

  db.personnel.push(data);
  addAuditLog(req.user.id, 'CRÉATION', `Personnel:${data.matricule}`, null, data);
  res.status(201).json({ success: true, message: 'Personnel créé avec succès', data });
};

exports.update = (req, res) => {
  const existing = findById('personnel', req.params.id);
  if (!existing) return res.status(404).json({ success: false, message: 'Personnel non trouvé' });

  const updated = update('personnel', req.params.id, req.body);
  addAuditLog(req.user.id, 'MODIFICATION', `Personnel:${existing.matricule}`, existing, updated);
  res.json({ success: true, message: 'Personnel mis à jour', data: updated });
};

exports.delete = (req, res) => {
  const existing = findById('personnel', req.params.id);
  if (!existing) return res.status(404).json({ success: false, message: 'Personnel non trouvé' });

  update('personnel', req.params.id, { statut: 'inactif' });
  addAuditLog(req.user.id, 'DÉSACTIVATION', `Personnel:${existing.matricule}`, existing, null);
  res.json({ success: true, message: 'Personnel désactivé' });
};

// Absences
exports.getAbsences = (req, res) => {
  let absences = [...db.absences];
  if (req.query.personnel_id) absences = absences.filter(a => a.personnel_id === req.query.personnel_id);
  if (req.query.statut) absences = absences.filter(a => a.statut === req.query.statut);

  // Enrichir avec infos personnel
  const enriched = absences.map(a => {
    const p = findById('personnel', a.personnel_id);
    return { ...a, personnel_nom: p ? `${p.prenom} ${p.nom}` : 'Inconnu' };
  });

  res.json({ success: true, count: enriched.length, data: enriched });
};

exports.createAbsence = (req, res) => {
  const data = { id: uuidv4(), ...req.body, statut: 'en_attente', demandeur_id: req.user.id, created_at: new Date().toISOString() };
  db.absences.push(data);
  addAuditLog(req.user.id, 'DEMANDE_ABSENCE', `Personnel:${data.personnel_id}`, null, data);
  res.status(201).json({ success: true, message: 'Demande d\'absence créée', data });
};

exports.updateAbsence = (req, res) => {
  const idx = db.absences.findIndex(a => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Absence non trouvée' });

  const { statut } = req.body;
  db.absences[idx] = { ...db.absences[idx], statut, valideur_id: req.user.id, updated_at: new Date().toISOString() };
  addAuditLog(req.user.id, `ABSENCE_${statut.toUpperCase()}`, `Absence:${req.params.id}`, null, { statut });
  res.json({ success: true, message: `Absence ${statut}`, data: db.absences[idx] });
};

// Stats
exports.getStats = (req, res) => {
  const total = db.personnel.filter(p => p.statut === 'actif').length;
  const parService = {};
  db.personnel.filter(p => p.statut === 'actif').forEach(p => {
    parService[p.service] = (parService[p.service] || 0) + 1;
  });
  const absencesEnAttente = db.absences.filter(a => a.statut === 'en_attente').length;
  const congesApprouves = db.absences.filter(a => a.statut === 'approuvé' && a.type === 'Congé annuel').length;

  res.json({ success: true, data: { total, parService, absencesEnAttente, congesApprouves } });
};
