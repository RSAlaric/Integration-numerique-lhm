const jwt = require('jsonwebtoken');
const { db } = require('../database');

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Token d\'authentification requis' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'lhm-secret-key-2024');
    const user = db.users.find(u => u.id === decoded.id);
    if (!user || !user.actif || user.bloque) {
      return res.status(401).json({ success: false, message: 'Compte inactif ou bloqué' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token invalide ou expiré' });
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Accès non autorisé pour votre rôle' });
  }
  next();
};

module.exports = { authenticate, authorize };
