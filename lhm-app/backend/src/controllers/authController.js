const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db, addAuditLog } = require('../database');

const JWT_SECRET = process.env.JWT_SECRET || 'lhm-secret-key-2024';
const JWT_EXPIRES = process.env.JWT_EXPIRES_IN || '24h';

exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email et mot de passe requis' });
  }

  const user = db.users.find(u => u.email === email.toLowerCase());
  if (!user) {
    return res.status(401).json({ success: false, message: 'Identifiants incorrects' });
  }

  if (user.bloque) {
    return res.status(403).json({ success: false, message: 'Compte bloqué après 3 tentatives. Contactez l\'administrateur.' });
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    user.tentatives_connexion = (user.tentatives_connexion || 0) + 1;
    if (user.tentatives_connexion >= 3) {
      user.bloque = true;
      return res.status(403).json({ success: false, message: 'Compte bloqué après 3 tentatives échouées.' });
    }
    return res.status(401).json({ success: false, message: `Identifiants incorrects. ${3 - user.tentatives_connexion} tentative(s) restante(s).` });
  }

  user.tentatives_connexion = 0;
  user.derniere_connexion = new Date().toISOString();

  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
  addAuditLog(user.id, 'CONNEXION', 'Authentification', null, { ip: req.ip, timestamp: new Date().toISOString() });

  const { password: _, ...userSafe } = user;
  res.json({ success: true, message: 'Connexion réussie', token, user: userSafe });
};

exports.getMe = (req, res) => {
  const { password: _, ...userSafe } = req.user;
  res.json({ success: true, user: userSafe });
};

exports.changePassword = async (req, res) => {
  const { ancien_password, nouveau_password } = req.body;
  if (!ancien_password || !nouveau_password) {
    return res.status(400).json({ success: false, message: 'Champs requis manquants' });
  }
  if (nouveau_password.length < 8) {
    return res.status(400).json({ success: false, message: 'Le mot de passe doit contenir au moins 8 caractères' });
  }

  const isValid = await bcrypt.compare(ancien_password, req.user.password);
  if (!isValid) {
    return res.status(401).json({ success: false, message: 'Ancien mot de passe incorrect' });
  }

  const userIdx = db.users.findIndex(u => u.id === req.user.id);
  db.users[userIdx].password = await bcrypt.hash(nouveau_password, 10);
  db.users[userIdx].password_changed_at = new Date().toISOString();

  addAuditLog(req.user.id, 'CHANGEMENT_MOT_DE_PASSE', 'Utilisateur', null, null);
  res.json({ success: true, message: 'Mot de passe modifié avec succès' });
};
