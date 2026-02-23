const { db, findById, update, addAuditLog } = require('../database');
const { v4: uuidv4 } = require('uuid');

const getAlertLevel = (article) => {
  if (article.quantite <= article.seuil_min) return 'rouge';
  if (article.quantite <= article.seuil_securite) return 'orange';
  return 'ok';
};

const isExpiringSoon = (article) => {
  if (!article.date_peremption) return false;
  const diff = (new Date(article.date_peremption) - new Date()) / (1000 * 60 * 60 * 24);
  return diff <= 30 && diff > 0;
};

exports.getAll = (req, res) => {
  const { categorie, search, alerte } = req.query;
  let stock = db.stock.map(a => ({
    ...a,
    alerte: getAlertLevel(a),
    expiration_proche: isExpiringSoon(a),
    valeur_totale: a.quantite * a.prix_unitaire
  }));

  if (categorie) stock = stock.filter(a => a.categorie === categorie);
  if (search) {
    const s = search.toLowerCase();
    stock = stock.filter(a => a.designation.toLowerCase().includes(s) || a.code.toLowerCase().includes(s));
  }
  if (alerte === 'critique') stock = stock.filter(a => a.alerte === 'rouge' || a.alerte === 'orange');
  if (alerte === 'expiration') stock = stock.filter(a => a.expiration_proche);

  res.json({ success: true, count: stock.length, data: stock });
};

exports.getById = (req, res) => {
  const article = findById('stock', req.params.id);
  if (!article) return res.status(404).json({ success: false, message: 'Article non trouvé' });
  res.json({ success: true, data: { ...article, alerte: getAlertLevel(article), valeur_totale: article.quantite * article.prix_unitaire } });
};

exports.create = (req, res) => {
  const data = req.body;
  const count = db.stock.length + 1;
  data.id = uuidv4();
  data.code = `ART-${String(count).padStart(3, '0')}`;
  data.created_at = new Date().toISOString();
  data.quantite = data.quantite || 0;
  db.stock.push(data);
  addAuditLog(req.user.id, 'CRÉATION_ARTICLE', `Stock:${data.code}`, null, data);
  res.status(201).json({ success: true, message: 'Article créé', data });
};

exports.update = (req, res) => {
  const existing = findById('stock', req.params.id);
  if (!existing) return res.status(404).json({ success: false, message: 'Article non trouvé' });
  const updated = update('stock', req.params.id, req.body);
  addAuditLog(req.user.id, 'MODIFICATION_ARTICLE', `Stock:${existing.code}`, existing, updated);
  res.json({ success: true, message: 'Article mis à jour', data: updated });
};

exports.delete = (req, res) => {
  const idx = db.stock.findIndex(a => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Article non trouvé' });
  const removed = db.stock.splice(idx, 1)[0];
  addAuditLog(req.user.id, 'SUPPRESSION_ARTICLE', `Stock:${removed.code}`, removed, null);
  res.json({ success: true, message: 'Article supprimé' });
};

// Mouvements
exports.getMovements = (req, res) => {
  let mvts = [...db.stockMovements];
  if (req.query.article_id) mvts = mvts.filter(m => m.article_id === req.query.article_id);
  if (req.query.type) mvts = mvts.filter(m => m.type === req.query.type);

  const enriched = mvts.map(m => {
    const article = findById('stock', m.article_id);
    return { ...m, article_designation: article ? article.designation : 'Inconnu', article_code: article ? article.code : '' };
  }).sort((a, b) => new Date(b.date) - new Date(a.date));

  res.json({ success: true, count: enriched.length, data: enriched });
};

exports.createMovement = (req, res) => {
  const { article_id, type, quantite } = req.body;
  const article = findById('stock', article_id);
  if (!article) return res.status(404).json({ success: false, message: 'Article non trouvé' });

  if (type === 'sortie' && article.quantite < quantite) {
    return res.status(400).json({ success: false, message: `Stock insuffisant. Disponible: ${article.quantite}` });
  }

  const ancien = article.quantite;
  const newQty = type === 'entrée' ? article.quantite + Number(quantite) : article.quantite - Number(quantite);
  update('stock', article_id, { quantite: newQty });

  const mvt = { id: uuidv4(), ...req.body, valideur_id: req.user.id, quantite_avant: ancien, quantite_apres: newQty, date: new Date().toISOString() };
  db.stockMovements.push(mvt);
  addAuditLog(req.user.id, `MOUVEMENT_${type.toUpperCase()}`, `Stock:${article.code}`, { quantite: ancien }, { quantite: newQty });
  res.status(201).json({ success: true, message: `Mouvement de ${type} enregistré`, data: mvt });
};

exports.getStats = (req, res) => {
  const stock = db.stock.map(a => ({ ...a, alerte: getAlertLevel(a), expiration_proche: isExpiringSoon(a) }));
  const valeurTotale = stock.reduce((sum, a) => sum + (a.quantite * a.prix_unitaire), 0);
  const alertesRouges = stock.filter(a => a.alerte === 'rouge').length;
  const alertesOranges = stock.filter(a => a.alerte === 'orange').length;
  const expirationProche = stock.filter(a => a.expiration_proche).length;
  const categories = [...new Set(stock.map(a => a.categorie))];

  res.json({ success: true, data: { total_articles: stock.length, valeur_totale: valeurTotale, alertes_rouges: alertesRouges, alertes_oranges: alertesOranges, expiration_proche: expirationProche, categories } });
};
