const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../models/inMemoryDB');
const { authMiddleware, roles, addAuditLog } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// GET all personnel
router.get('/', (req, res) => {
  const personnel = db.personnel.map(p => {
    const { salaire, ...rest } = p;
    const canSeeSalary = ['super_admin', 'direction', 'assistant_admin'].includes(req.user.role);
    return canSeeSalary ? p : rest;
  });
  res.json(personnel);
});

// GET one
router.get('/:id', (req, res) => {
  const p = db.personnel.find(p => p.id === req.params.id);
  if (!p) return res.status(404).json({ message: 'Personnel non trouvé' });
  res.json(p);
});

// CREATE
router.post('/', roles('super_admin', 'assistant_admin'), (req, res) => {
  const count = db.personnel.length + 1;
  const newP = {
    id: uuidv4(),
    matricule: `MAT-${String(count).padStart(3, '0')}`,
    ...req.body,
    statut: 'actif',
    createdAt: new Date()
  };
  db.personnel.push(newP);
  addAuditLog(db, req.user.id, `${req.user.prenom} ${req.user.nom}`, 'CREATE', 'Personnel', null, `${newP.matricule} créé`, req.ip);
  res.status(201).json(newP);
});

// UPDATE
router.put('/:id', roles('super_admin', 'assistant_admin'), (req, res) => {
  const idx = db.personnel.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Personnel non trouvé' });
  const old = { ...db.personnel[idx] };
  db.personnel[idx] = { ...db.personnel[idx], ...req.body, updatedAt: new Date() };
  addAuditLog(db, req.user.id, `${req.user.prenom} ${req.user.nom}`, 'UPDATE', 'Personnel', old.matricule, db.personnel[idx].matricule, req.ip);
  res.json(db.personnel[idx]);
});

// DELETE
router.delete('/:id', roles('super_admin'), (req, res) => {
  const idx = db.personnel.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Personnel non trouvé' });
  const deleted = db.personnel.splice(idx, 1)[0];
  addAuditLog(db, req.user.id, `${req.user.prenom} ${req.user.nom}`, 'DELETE', 'Personnel', deleted.matricule, 'Supprimé', req.ip);
  res.json({ message: 'Supprimé avec succès' });
});

// ABSENCES
router.get('/:id/absences', (req, res) => {
  const absences = db.absences.filter(a => a.personnelId === req.params.id);
  res.json(absences);
});

router.get('/absences/all', (req, res) => {
  const absences = db.absences.map(a => {
    const agent = db.personnel.find(p => p.id === a.personnelId);
    return { ...a, agentNom: agent ? `${agent.prenom} ${agent.nom}` : 'Inconnu' };
  });
  res.json(absences);
});

router.post('/absences/new', (req, res) => {
  const newAbs = { id: uuidv4(), ...req.body, statut: 'en_attente', createdAt: new Date() };
  db.absences.push(newAbs);
  res.status(201).json(newAbs);
});

router.put('/absences/:id/valider', roles('super_admin', 'assistant_admin'), (req, res) => {
  const abs = db.absences.find(a => a.id === req.params.id);
  if (!abs) return res.status(404).json({ message: 'Absence non trouvée' });
  abs.statut = req.body.statut;
  abs.validePar = req.user.id;
  abs.dateValidation = new Date();
  res.json(abs);
});

module.exports = router;
