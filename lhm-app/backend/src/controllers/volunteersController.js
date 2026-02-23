const { db, findById, update, addAuditLog } = require('../database');
const { v4: uuidv4 } = require('uuid');

const WORKFLOW_STEPS = ['enregistré', 'validé', 'affecté', 'participé', 'évalué', 'reconnu'];

exports.getAll = (req, res) => {
  const { statut, competence, search } = req.query;
  let volunteers = [...db.volunteers];

  if (statut) volunteers = volunteers.filter(v => v.statut_workflow === statut);
  if (competence) volunteers = volunteers.filter(v => v.competences && v.competences.includes(competence));
  if (search) {
    const s = search.toLowerCase();
    volunteers = volunteers.filter(v =>
      v.nom.toLowerCase().includes(s) || v.prenom.toLowerCase().includes(s) || v.email.toLowerCase().includes(s)
    );
  }

  res.json({ success: true, count: volunteers.length, data: volunteers });
};

exports.getById = (req, res) => {
  const v = findById('volunteers', req.params.id);
  if (!v) return res.status(404).json({ success: false, message: 'Volontaire non trouvé' });
  const assignments = db.volunteerAssignments.filter(a => a.volunteer_id === req.params.id);
  res.json({ success: true, data: { ...v, affectations: assignments } });
};

exports.create = (req, res) => {
  const data = { id: uuidv4(), ...req.body, statut: 'actif', statut_workflow: 'enregistré', created_at: new Date().toISOString() };
  db.volunteers.push(data);
  addAuditLog(req.user.id, 'ENREGISTREMENT_VOLONTAIRE', `Volontaire:${data.nom} ${data.prenom}`, null, data);
  res.status(201).json({ success: true, message: 'Volontaire enregistré', data });
};

exports.update = (req, res) => {
  const existing = findById('volunteers', req.params.id);
  if (!existing) return res.status(404).json({ success: false, message: 'Volontaire non trouvé' });
  const updated = update('volunteers', req.params.id, req.body);
  addAuditLog(req.user.id, 'MODIFICATION_VOLONTAIRE', `Volontaire:${existing.nom}`, existing, updated);
  res.json({ success: true, message: 'Volontaire mis à jour', data: updated });
};

exports.advanceWorkflow = (req, res) => {
  const volunteer = findById('volunteers', req.params.id);
  if (!volunteer) return res.status(404).json({ success: false, message: 'Volontaire non trouvé' });

  const currentIdx = WORKFLOW_STEPS.indexOf(volunteer.statut_workflow);
  if (currentIdx === WORKFLOW_STEPS.length - 1) {
    return res.status(400).json({ success: false, message: 'Workflow déjà complété' });
  }

  const nextStep = WORKFLOW_STEPS[currentIdx + 1];
  const updated = update('volunteers', req.params.id, { statut_workflow: nextStep });
  addAuditLog(req.user.id, 'AVANCEMENT_WORKFLOW', `Volontaire:${volunteer.nom}`, { statut: volunteer.statut_workflow }, { statut: nextStep });

  // Si reconnu, créer attestation
  if (nextStep === 'reconnu') {
    const attestation = { id: uuidv4(), volunteer_id: req.params.id, type: 'attestation', date: new Date().toISOString(), numero: `ATT-${Date.now()}` };
    db.documents = db.documents || [];
    db.documents.push(attestation);
  }

  res.json({ success: true, message: `Volontaire avancé à l'étape: ${nextStep}`, data: updated });
};

exports.getStats = (req, res) => {
  const total = db.volunteers.filter(v => v.statut === 'actif').length;
  const parWorkflow = {};
  WORKFLOW_STEPS.forEach(s => {
    parWorkflow[s] = db.volunteers.filter(v => v.statut_workflow === s).length;
  });
  const competencesMap = {};
  db.volunteers.forEach(v => {
    (v.competences || []).forEach(c => { competencesMap[c] = (competencesMap[c] || 0) + 1; });
  });

  res.json({ success: true, data: { total, parWorkflow, competences: competencesMap } });
};
