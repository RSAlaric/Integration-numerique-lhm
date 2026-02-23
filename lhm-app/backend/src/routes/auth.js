const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../models/inMemoryDB');
const { JWT_SECRET, addAuditLog } = require('../middleware/auth');

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email et mot de passe requis' });
    
    const user = db.users.find(u => u.email === email);
    if (!user) return res.status(401).json({ message: 'Identifiants incorrects' });
    if (!user.actif) return res.status(401).json({ message: 'Compte désactivé' });
    
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: 'Identifiants incorrects' });
    
    user.derniereConnexion = new Date();
    
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
    addAuditLog(db, user.id, `${user.prenom} ${user.nom}`, 'LOGIN', 'Système', null, 'Session ouverte', req.ip);
    
    const { password: _, ...userWithoutPassword } = user;
    res.json({ token, user: userWithoutPassword });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

router.post('/logout', (req, res) => {
  res.json({ message: 'Déconnexion réussie' });
});

module.exports = router;
