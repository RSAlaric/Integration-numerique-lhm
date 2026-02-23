const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../prisma');
const { addAuditLog } = require('../utils/audit');

exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ success: false, message: 'Email et mot de passe requis' });

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) return res.status(401).json({ success: false, message: 'Identifiants incorrects' });
  if (user.bloque) return res.status(403).json({ success: false, message: "Compte bloqué. Contactez l'administrateur." });

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    const tentatives = user.tentatives_connexion + 1;
    const bloque = tentatives >= 3;
    await prisma.user.update({ where: { id: user.id }, data: { tentatives_connexion: tentatives, bloque } });
    if (bloque) return res.status(403).json({ success: false, message: 'Compte bloqué après 3 tentatives échouées.' });
    return res.status(401).json({ success: false, message: `Identifiants incorrects. ${3 - tentatives} tentative(s) restante(s).` });
  }

  await prisma.user.update({ where: { id: user.id }, data: { tentatives_connexion: 0, derniere_connexion: new Date() } });
  const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'lhm-secret-key-2024', { expiresIn: process.env.JWT_EXPIRES_IN || '24h' });
  await addAuditLog(user.id, 'CONNEXION', 'Authentification', null, null, req.ip);

  const { password: _, ...userSafe } = user;
  res.json({ success: true, message: 'Connexion réussie', token, user: userSafe });
};

exports.getMe = (req, res) => {
  const { password: _, ...userSafe } = req.user;
  res.json({ success: true, user: userSafe });
};

exports.changePassword = async (req, res) => {
  const { ancien_password, nouveau_password } = req.body;
  if (!ancien_password || !nouveau_password) return res.status(400).json({ success: false, message: 'Champs requis manquants' });
  if (nouveau_password.length < 8) return res.status(400).json({ success: false, message: 'Minimum 8 caractères' });

  const isValid = await bcrypt.compare(ancien_password, req.user.password);
  if (!isValid) return res.status(401).json({ success: false, message: 'Ancien mot de passe incorrect' });

  await prisma.user.update({
    where: { id: req.user.id },
    data: { password: await bcrypt.hash(nouveau_password, 10), password_changed_at: new Date() }
  });
  await addAuditLog(req.user.id, 'CHANGEMENT_MOT_DE_PASSE', 'Utilisateur');
  res.json({ success: true, message: 'Mot de passe modifié avec succès' });
};
