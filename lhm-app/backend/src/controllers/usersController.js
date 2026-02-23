const bcrypt = require('bcryptjs');
const { db, findById, update, addAuditLog } = require('../database');
const { v4: uuidv4 } = require('uuid');

exports.getAll = (req, res) => {
  const users = db.users.map(({ password, ...u }) => u);
  res.json({ success: true, count: users.length, data: users });
};

exports.create = async (req, res) => {
  const { email, password, nom, prenom, role, service, poste } = req.body;
  if (db.users.find(u => u.email === email)) {
    return res.status(409).json({ success: false, message: 'Email déjà utilisé' });
  }
  const count = db.users.length + 1;
  const user = {
    id: uuidv4(),
    matricule: `USR-${String(count).padStart(3, '0')}`,
    email: email.toLowerCase(), nom, prenom, role, service, poste,
    password: await bcrypt.hash(password || 'Password@123', 10),
    actif: true, tentatives_connexion: 0, bloque: false,
    derniere_connexion: null,
    created_at: new Date().toISOString(),
    password_changed_at: new Date().toISOString()
  };
  db.users.push(user);
  addAuditLog(req.user.id, 'CRÉATION_UTILISATEUR', `Utilisateur:${email}`, null, { email, role });
  const { password: _, ...safe } = user;
  res.status(201).json({ success: true, message: 'Utilisateur créé', data: safe });
};

exports.update = (req, res) => {
  const idx = db.users.findIndex(u => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
  const { password, ...data } = req.body;
  db.users[idx] = { ...db.users[idx], ...data, updated_at: new Date().toISOString() };
  addAuditLog(req.user.id, 'MODIFICATION_UTILISATEUR', `Utilisateur:${db.users[idx].email}`, null, data);
  const { password: _, ...safe } = db.users[idx];
  res.json({ success: true, message: 'Utilisateur mis à jour', data: safe });
};

exports.toggleBlock = (req, res) => {
  const user = findById('users', req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
  const newBlocked = !user.bloque;
  update('users', req.params.id, { bloque: newBlocked, tentatives_connexion: 0 });
  addAuditLog(req.user.id, newBlocked ? 'BLOCAGE_UTILISATEUR' : 'DÉBLOCAGE_UTILISATEUR', `Utilisateur:${user.email}`, null, null);
  res.json({ success: true, message: newBlocked ? 'Utilisateur bloqué' : 'Utilisateur débloqué' });
};
