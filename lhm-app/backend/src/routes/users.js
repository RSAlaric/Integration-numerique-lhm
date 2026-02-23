const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../models/inMemoryDB');
const { authMiddleware, roles } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/', roles('super_admin'), (req, res) => {
  res.json(db.users.map(({ password, ...u }) => u));
});

router.post('/', roles('super_admin'), async (req, res) => {
  const { email, password, ...rest } = req.body;
  if (db.users.find(u => u.email === email)) {
    return res.status(400).json({ message: 'Email déjà utilisé' });
  }
  const hashed = await bcrypt.hash(password, 10);
  const newUser = { id: uuidv4(), email, password: hashed, ...rest, actif: true, derniereConnexion: null, createdAt: new Date() };
  db.users.push(newUser);
  const { password: _, ...userWithoutPassword } = newUser;
  res.status(201).json(userWithoutPassword);
});

router.put('/:id', roles('super_admin'), async (req, res) => {
  const idx = db.users.findIndex(u => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Non trouvé' });
  const { password, ...rest } = req.body;
  db.users[idx] = { ...db.users[idx], ...rest };
  if (password) db.users[idx].password = await bcrypt.hash(password, 10);
  const { password: _, ...u } = db.users[idx];
  res.json(u);
});

router.delete('/:id', roles('super_admin'), (req, res) => {
  const idx = db.users.findIndex(u => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Non trouvé' });
  db.users.splice(idx, 1);
  res.json({ message: 'Supprimé' });
});

module.exports = router;
