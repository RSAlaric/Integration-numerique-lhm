const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../models/inMemoryDB');
const { authMiddleware, roles } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/', (req, res) => res.json(db.projets));
router.get('/:id', (req, res) => {
  const p = db.projets.find(p => p.id === req.params.id);
  if (!p) return res.status(404).json({ message: 'Non trouvé' });
  res.json(p);
});
router.post('/', roles('super_admin', 'direction', 'coordinateur'), (req, res) => {
  const newP = { id: uuidv4(), ...req.body, depenses: 0, avancement: 0, createdAt: new Date() };
  db.projets.push(newP);
  res.status(201).json(newP);
});
router.put('/:id', roles('super_admin', 'direction', 'coordinateur'), (req, res) => {
  const idx = db.projets.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Non trouvé' });
  db.projets[idx] = { ...db.projets[idx], ...req.body, updatedAt: new Date() };
  res.json(db.projets[idx]);
});
router.delete('/:id', roles('super_admin'), (req, res) => {
  const idx = db.projets.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Non trouvé' });
  db.projets.splice(idx, 1);
  res.json({ message: 'Supprimé' });
});

module.exports = router;
