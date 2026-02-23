const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticate, authorize } = require('../middleware/auth');

// ========== VOLUNTEERS ==========
const volRouter = express.Router();

volRouter.get('/', authenticate, (req, res) => {
  const { search, status, skill, page = 1, limit = 20 } = req.query;
  let list = db.volunteers;
  if (search) {
    const s = search.toLowerCase();
    list = list.filter(v => v.firstName.toLowerCase().includes(s) || v.lastName.toLowerCase().includes(s));
  }
  if (status) list = list.filter(v => v.status === status);
  if (skill) list = list.filter(v => v.skills.includes(skill));
  const total = list.length;
  const paginated = list.slice((page - 1) * limit, page * limit);
  res.json({ data: paginated, total, page: parseInt(page) });
});

volRouter.get('/stats/summary', authenticate, (req, res) => {
  const byStatus = {};
  ['enrolled','evaluated','assigned','active','recognized'].forEach(s => {
    byStatus[s] = db.volunteers.filter(v => v.status === s).length;
  });
  const bySkill = {};
  ['Opérateur de saisie','Correcteur BCC','Gestionnaire de stock','Volontaire BCC','Volontaire technicien Radio'].forEach(sk => {
    bySkill[sk] = db.volunteers.filter(v => v.skills.includes(sk)).length;
  });
  res.json({ total: db.volunteers.length, byStatus, bySkill });
});

volRouter.get('/:id', authenticate, (req, res) => {
  const vol = db.volunteers.find(v => v.id === req.params.id);
  if (!vol) return res.status(404).json({ error: 'Volontaire non trouvé' });
  res.json(vol);
});

volRouter.post('/', authenticate, authorize('admin','coordinateur','responsable_volontaires'), (req, res) => {
  const id = `v${Date.now()}`;
  const newVol = { id, status: 'enrolled', joinDate: new Date().toISOString().split('T')[0], createdAt: new Date().toISOString(), ...req.body };
  db.volunteers.push(newVol);
  db.addAuditLog(req.user.id, 'CREATE', 'Volontaire', null, `${req.body.firstName} ${req.body.lastName}`);
  res.status(201).json(newVol);
});

volRouter.put('/:id', authenticate, authorize('admin','coordinateur','responsable_volontaires'), (req, res) => {
  const idx = db.volunteers.findIndex(v => v.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Volontaire non trouvé' });
  db.volunteers[idx] = { ...db.volunteers[idx], ...req.body, updatedAt: new Date().toISOString() };
  db.addAuditLog(req.user.id, 'UPDATE', 'Volontaire', null, `Mise à jour ${db.volunteers[idx].firstName}`);
  res.json(db.volunteers[idx]);
});

volRouter.delete('/:id', authenticate, authorize('admin'), (req, res) => {
  const idx = db.volunteers.findIndex(v => v.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Volontaire non trouvé' });
  db.volunteers.splice(idx, 1);
  res.json({ message: 'Volontaire supprimé' });
});

// ========== STOCK ==========
const stockRouter = express.Router();

stockRouter.get('/categories', authenticate, (req, res) => {
  res.json(db.stockCategories);
});

stockRouter.get('/items', authenticate, (req, res) => {
  const { search, category, alert, page = 1, limit = 20 } = req.query;
  let list = db.stockItems;
  if (search) list = list.filter(i => i.name.toLowerCase().includes(search.toLowerCase()) || i.code.toLowerCase().includes(search.toLowerCase()));
  if (category) list = list.filter(i => i.categoryId === category);
  if (alert === 'critical') list = list.filter(i => i.quantity <= i.minStock);
  if (alert === 'safety') list = list.filter(i => i.quantity > i.minStock && i.quantity <= i.safetyStock);
  const total = list.length;
  const paginated = list.slice((page - 1) * limit, page * limit);
  res.json({ data: paginated, total, page: parseInt(page) });
});

stockRouter.get('/items/:id', authenticate, (req, res) => {
  const item = db.stockItems.find(i => i.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'Article non trouvé' });
  res.json(item);
});

stockRouter.post('/items', authenticate, authorize('admin','stock'), (req, res) => {
  const id = `art${Date.now()}`;
  const code = `LHM-ART-${String(db.stockItems.length + 1).padStart(4, '0')}`;
  const newItem = { id, code, quantity: 0, createdAt: new Date().toISOString(), ...req.body };
  db.stockItems.push(newItem);
  db.addAuditLog(req.user.id, 'CREATE', 'Stock', null, `Article: ${req.body.name}`);
  res.status(201).json(newItem);
});

stockRouter.put('/items/:id', authenticate, authorize('admin','stock'), (req, res) => {
  const idx = db.stockItems.findIndex(i => i.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Article non trouvé' });
  db.stockItems[idx] = { ...db.stockItems[idx], ...req.body, updatedAt: new Date().toISOString() };
  db.addAuditLog(req.user.id, 'UPDATE', 'Stock', null, `Mise à jour: ${db.stockItems[idx].name}`);
  res.json(db.stockItems[idx]);
});

stockRouter.get('/movements', authenticate, (req, res) => {
  const { type, itemId, page = 1, limit = 20 } = req.query;
  let list = db.stockMovements;
  if (type) list = list.filter(m => m.type === type);
  if (itemId) list = list.filter(m => m.itemId === itemId);
  const total = list.length;
  const paginated = list.slice((page - 1) * limit, page * limit);
  res.json({ data: paginated, total });
});

stockRouter.post('/movements', authenticate, authorize('admin','stock'), (req, res) => {
  const { type, itemId, quantity, ...rest } = req.body;
  const itemIdx = db.stockItems.findIndex(i => i.id === itemId);
  if (itemIdx === -1) return res.status(404).json({ error: 'Article non trouvé' });
  if (type === 'exit' && db.stockItems[itemIdx].quantity < quantity) {
    return res.status(400).json({ error: 'Stock insuffisant' });
  }
  if (type === 'entry') db.stockItems[itemIdx].quantity += parseInt(quantity);
  else if (type === 'exit') db.stockItems[itemIdx].quantity -= parseInt(quantity);
  const movement = { id: `mv${Date.now()}`, type, itemId, quantity: parseInt(quantity), date: new Date().toISOString(), validatedBy: req.user.id, createdAt: new Date().toISOString(), ...rest };
  db.stockMovements.unshift(movement);
  db.addAuditLog(req.user.id, type === 'entry' ? 'STOCK_ENTRY' : 'STOCK_EXIT', 'Stock', null, `${quantity} x ${db.stockItems[itemIdx].name}`);
  res.status(201).json(movement);
});

stockRouter.get('/stats/summary', authenticate, (req, res) => {
  const critical = db.stockItems.filter(i => i.quantity <= i.minStock);
  const safety = db.stockItems.filter(i => i.quantity > i.minStock && i.quantity <= i.safetyStock);
  const totalValue = db.stockItems.reduce((acc, i) => acc + i.quantity * i.unitPrice, 0);
  const expiringSoon = db.stockItems.filter(i => {
    if (!i.expiryDate) return false;
    const days = (new Date(i.expiryDate) - new Date()) / 86400000;
    return days <= 30 && days > 0;
  });
  res.json({ total: db.stockItems.length, critical: critical.length, safety: safety.length, totalValue, expiringSoon: expiringSoon.length });
});

// ========== PROJECTS ==========
const projRouter = express.Router();

projRouter.get('/', authenticate, (req, res) => {
  const { status, search, page = 1, limit = 20 } = req.query;
  let list = db.projects;
  if (status) list = list.filter(p => p.status === status);
  if (search) list = list.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  const total = list.length;
  const paginated = list.slice((page - 1) * limit, page * limit);
  res.json({ data: paginated, total });
});

projRouter.get('/:id', authenticate, (req, res) => {
  const proj = db.projects.find(p => p.id === req.params.id);
  if (!proj) return res.status(404).json({ error: 'Projet non trouvé' });
  res.json(proj);
});

projRouter.post('/', authenticate, authorize('admin','coordinateur','direction'), (req, res) => {
  const id = `proj${Date.now()}`;
  const newProj = { id, status: 'planning', progress: 0, budgetUsed: 0, createdAt: new Date().toISOString(), ...req.body };
  db.projects.push(newProj);
  db.addAuditLog(req.user.id, 'CREATE', 'Projet', null, req.body.name);
  res.status(201).json(newProj);
});

projRouter.put('/:id', authenticate, authorize('admin','coordinateur','direction'), (req, res) => {
  const idx = db.projects.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Projet non trouvé' });
  db.projects[idx] = { ...db.projects[idx], ...req.body, updatedAt: new Date().toISOString() };
  db.addAuditLog(req.user.id, 'UPDATE', 'Projet', null, db.projects[idx].name);
  res.json(db.projects[idx]);
});

// ========== ABSENCES ==========
const absRouter = express.Router();

absRouter.get('/', authenticate, (req, res) => {
  const { status, personnelId } = req.query;
  let list = db.absences;
  if (status) list = list.filter(a => a.status === status);
  if (personnelId) list = list.filter(a => a.personnelId === personnelId);
  res.json(list);
});

absRouter.post('/', authenticate, (req, res) => {
  const newAbs = { id: `abs${Date.now()}`, status: 'pending', requestedAt: new Date().toISOString(), validatedBy: null, validatedAt: null, ...req.body };
  db.absences.push(newAbs);
  db.addAuditLog(req.user.id, 'LEAVE_REQUEST', 'Absence', null, req.body.type);
  res.status(201).json(newAbs);
});

absRouter.put('/:id/validate', authenticate, authorize('admin','rh'), (req, res) => {
  const idx = db.absences.findIndex(a => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Demande non trouvée' });
  const { status, comments } = req.body;
  db.absences[idx] = { ...db.absences[idx], status, comments, validatedBy: req.user.id, validatedAt: new Date().toISOString() };
  db.addAuditLog(req.user.id, 'LEAVE_VALIDATED', 'Absence', 'pending', status);
  res.json(db.absences[idx]);
});

// ========== DASHBOARD ==========
const dashRouter = express.Router();

dashRouter.get('/stats', authenticate, (req, res) => {
  res.json(db.getStats());
});

dashRouter.get('/alerts', authenticate, (req, res) => {
  const alerts = [];
  const criticalItems = db.stockItems.filter(i => i.quantity <= i.minStock);
  criticalItems.slice(0, 5).forEach(i => alerts.push({ type: 'stock', severity: 'high', message: `Stock critique: ${i.name} (${i.quantity} ${i.unit})`, id: i.id }));
  const pendingLeave = db.absences.filter(a => a.status === 'pending');
  if (pendingLeave.length > 0) alerts.push({ type: 'leave', severity: 'medium', message: `${pendingLeave.length} demande(s) de congé en attente`, id: 'leaves' });
  const delayedProjects = db.projects.filter(p => p.status === 'delayed');
  delayedProjects.slice(0, 3).forEach(p => alerts.push({ type: 'project', severity: 'medium', message: `Projet en retard: ${p.name}`, id: p.id }));
  res.json(alerts);
});

dashRouter.get('/audit', authenticate, authorize('admin'), (req, res) => {
  res.json(db.auditLogs.slice(0, 100));
});

// ========== SERVICES ==========
const servRouter = express.Router();
servRouter.get('/', authenticate, (req, res) => res.json(db.services));

// ========== USERS ==========
const usersRouter = express.Router();
usersRouter.get('/', authenticate, authorize('admin'), (req, res) => {
  const safe = db.users.map(({ passwordHash, ...u }) => u);
  res.json(safe);
});
usersRouter.post('/', authenticate, authorize('admin'), (req, res) => {
  const { username, password, email, name, role, service } = req.body;
  if (db.findUserByUsername(username)) return res.status(400).json({ error: 'Nom d\'utilisateur déjà pris' });
  const newUser = {
    id: `u${Date.now()}`, username, email, name, role, service, active: true, locked: false, failedAttempts: 0,
    passwordHash: require('bcryptjs').hashSync(password, 10),
    passwordChangedAt: new Date().toISOString(), lastLogin: null
  };
  db.users.push(newUser);
  db.addAuditLog(req.user.id, 'CREATE', 'User', null, `${username} (${role})`);
  const { passwordHash, ...safe } = newUser;
  res.status(201).json(safe);
});
usersRouter.put('/:id/unlock', authenticate, authorize('admin'), (req, res) => {
  const user = db.findUser(req.params.id);
  if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });
  user.locked = false;
  user.failedAttempts = 0;
  db.addAuditLog(req.user.id, 'UNLOCK', 'User', null, user.username);
  res.json({ message: 'Compte déverrouillé' });
});

module.exports = { volRouter, stockRouter, projRouter, absRouter, dashRouter, servRouter, usersRouter };
