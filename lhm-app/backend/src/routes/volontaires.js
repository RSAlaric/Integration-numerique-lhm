const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../models/inMemoryDB');
const { authMiddleware, roles, addAuditLog } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/', (req, res) => res.json(db.volontaires));

router.get('/:id', (req, res) => {
  const v = db.volontaires.find(v => v.id === req.params.id);
  if (!v) return res.status(404).json({ message: 'Volontaire non trouvé' });
  res.json(v);
});

router.post('/', roles('super_admin', 'assistant_admin', 'resp_volontaires'), (req, res) => {
  const newV = { id: uuidv4(), ...req.body, statut: 'actif', createdAt: new Date() };
  db.volontaires.push(newV);
  addAuditLog(db, req.user.id, `${req.user.prenom} ${req.user.nom}`, 'CREATE', 'Volontaire', null, `${newV.prenom} ${newV.nom} créé`, req.ip);
  res.status(201).json(newV);
});

router.put('/:id', roles('super_admin', 'assistant_admin', 'resp_volontaires'), (req, res) => {
  const idx = db.volontaires.findIndex(v => v.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Non trouvé' });
  db.volontaires[idx] = { ...db.volontaires[idx], ...req.body, updatedAt: new Date() };
  res.json(db.volontaires[idx]);
});

router.delete('/:id', roles('super_admin'), (req, res) => {
  const idx = db.volontaires.findIndex(v => v.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Non trouvé' });
  db.volontaires.splice(idx, 1);
  res.json({ message: 'Supprimé' });
});

module.exports = router;
