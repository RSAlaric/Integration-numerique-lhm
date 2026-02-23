const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../models/inMemoryDB');
const { authMiddleware, roles, addAuditLog } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// Categories
router.get('/categories', (req, res) => res.json(db.categories));

// Articles
router.get('/articles', (req, res) => {
  const articles = db.articles.map(a => {
    let alerte = null;
    if (a.quantite <= a.stockMin) alerte = 'rouge';
    else if (a.quantite <= a.stockSecurite) alerte = 'orange';
    
    let alertePeremption = null;
    if (a.datePeremption) {
      const daysLeft = Math.ceil((new Date(a.datePeremption) - new Date()) / (1000 * 60 * 60 * 24));
      if (daysLeft <= 30) alertePeremption = daysLeft;
    }
    return { ...a, alerte, alertePeremption };
  });
  res.json(articles);
});

router.get('/articles/:id', (req, res) => {
  const a = db.articles.find(a => a.id === req.params.id);
  if (!a) return res.status(404).json({ message: 'Article non trouvé' });
  res.json(a);
});

router.post('/articles', roles('super_admin', 'resp_stock'), (req, res) => {
  const count = db.articles.length + 1;
  const newA = { id: uuidv4(), code: `ART-${String(count).padStart(3, '0')}`, ...req.body, createdAt: new Date() };
  db.articles.push(newA);
  addAuditLog(db, req.user.id, `${req.user.prenom} ${req.user.nom}`, 'CREATE', 'Article', null, `${newA.code} créé`, req.ip);
  res.status(201).json(newA);
});

router.put('/articles/:id', roles('super_admin', 'resp_stock'), (req, res) => {
  const idx = db.articles.findIndex(a => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Non trouvé' });
  db.articles[idx] = { ...db.articles[idx], ...req.body, updatedAt: new Date() };
  res.json(db.articles[idx]);
});

router.delete('/articles/:id', roles('super_admin'), (req, res) => {
  const idx = db.articles.findIndex(a => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Non trouvé' });
  db.articles.splice(idx, 1);
  res.json({ message: 'Supprimé' });
});

// Mouvements
router.get('/mouvements', (req, res) => {
  const mouvements = db.mouvements.map(m => {
    const article = db.articles.find(a => a.id === m.articleId);
    return { ...m, articleDesignation: article ? article.designation : 'Inconnu', articleCode: article ? article.code : '' };
  });
  res.json(mouvements.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
});

router.post('/mouvements', roles('super_admin', 'resp_stock'), (req, res) => {
  const { articleId, type, quantite } = req.body;
  const article = db.articles.find(a => a.id === articleId);
  if (!article) return res.status(404).json({ message: 'Article non trouvé' });
  
  if (type === 'entree') article.quantite += Number(quantite);
  else if (type === 'sortie') {
    if (article.quantite < quantite) return res.status(400).json({ message: 'Stock insuffisant' });
    article.quantite -= Number(quantite);
  }
  
  const newM = { id: uuidv4(), ...req.body, createdAt: new Date() };
  db.mouvements.push(newM);
  addAuditLog(db, req.user.id, `${req.user.prenom} ${req.user.nom}`, type === 'entree' ? 'ENTREE_STOCK' : 'SORTIE_STOCK', article.code, null, `Quantité: ${quantite}`, req.ip);
  res.status(201).json(newM);
});

// Alertes stock
router.get('/alertes', (req, res) => {
  const alertes = db.articles
    .filter(a => a.quantite <= a.stockSecurite)
    .map(a => ({
      id: a.id, code: a.code, designation: a.designation,
      quantite: a.quantite, stockMin: a.stockMin, stockSecurite: a.stockSecurite,
      niveau: a.quantite <= a.stockMin ? 'rouge' : 'orange'
    }));
  res.json(alertes);
});

module.exports = router;
