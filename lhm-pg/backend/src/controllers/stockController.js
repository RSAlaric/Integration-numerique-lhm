const prisma = require('../prisma');
const { addAuditLog } = require('../utils/audit');

const getAlertLevel = (a) => {
  if (a.quantite <= a.seuil_min) return 'rouge';
  if (a.quantite <= a.seuil_securite) return 'orange';
  return 'ok';
};
const isExpiringSoon = (a) => {
  if (!a.date_peremption) return false;
  const diff = (new Date(a.date_peremption) - new Date()) / (1000 * 60 * 60 * 24);
  return diff <= 30 && diff > 0;
};
const enrich = (a) => ({ ...a, alerte: getAlertLevel(a), expiration_proche: isExpiringSoon(a), valeur_totale: a.quantite * a.prix_unitaire });

const genCode = async () => {
  const count = await prisma.article.count();
  return `ART-${String(count + 1).padStart(3, '0')}`;
};

exports.getAll = async (req, res) => {
  try {
    const { categorie, search, alerte } = req.query;
    const where = {};
    if (categorie) where.categorie = categorie;
    if (search) where.OR = [
      { designation: { contains: search, mode: 'insensitive' } },
      { code: { contains: search, mode: 'insensitive' } }
    ];
    let data = (await prisma.article.findMany({ where, orderBy: { designation: 'asc' } })).map(enrich);
    if (alerte === 'critique') data = data.filter(a => a.alerte === 'rouge' || a.alerte === 'orange');
    if (alerte === 'expiration') data = data.filter(a => a.expiration_proche);
    res.json({ success: true, count: data.length, data });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.getById = async (req, res) => {
  try {
    const a = await prisma.article.findUnique({ where: { id: req.params.id } });
    if (!a) return res.status(404).json({ success: false, message: 'Article non trouvé' });
    res.json({ success: true, data: enrich(a) });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.create = async (req, res) => {
  try {
    const data = { ...req.body };
    data.code = await genCode();
    if (data.date_peremption) data.date_peremption = new Date(data.date_peremption);
    if (data.quantite) data.quantite = parseFloat(data.quantite);
    if (data.prix_unitaire) data.prix_unitaire = parseFloat(data.prix_unitaire);
    if (data.seuil_min) data.seuil_min = parseFloat(data.seuil_min);
    if (data.seuil_securite) data.seuil_securite = parseFloat(data.seuil_securite);
    if (data.seuil_optimal) data.seuil_optimal = parseFloat(data.seuil_optimal);
    delete data.id;
    const article = await prisma.article.create({ data });
    await addAuditLog(req.user.id, 'CRÉATION_ARTICLE', `Stock:${article.code}`);
    res.status(201).json({ success: true, message: 'Article créé', data: enrich(article) });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.update = async (req, res) => {
  try {
    const existing = await prisma.article.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Article non trouvé' });
    const data = { ...req.body };
    if (data.date_peremption) data.date_peremption = new Date(data.date_peremption);
    ['quantite','prix_unitaire','seuil_min','seuil_securite','seuil_optimal'].forEach(k => { if (data[k] !== undefined) data[k] = parseFloat(data[k]); });
    delete data.id; delete data.code; delete data.created_at;
    const updated = await prisma.article.update({ where: { id: req.params.id }, data });
    await addAuditLog(req.user.id, 'MODIFICATION_ARTICLE', `Stock:${existing.code}`);
    res.json({ success: true, message: 'Article mis à jour', data: enrich(updated) });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.delete = async (req, res) => {
  try {
    const existing = await prisma.article.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Article non trouvé' });
    await prisma.article.delete({ where: { id: req.params.id } });
    await addAuditLog(req.user.id, 'SUPPRESSION_ARTICLE', `Stock:${existing.code}`);
    res.json({ success: true, message: 'Article supprimé' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.getMovements = async (req, res) => {
  try {
    const where = {};
    if (req.query.article_id) where.article_id = req.query.article_id;
    if (req.query.type) where.type = req.query.type;
    const data = await prisma.mouvementStock.findMany({
      where, orderBy: { date: 'desc' },
      include: { article: { select: { code: true, designation: true } } }
    });
    const enriched = data.map(m => ({ ...m, article_designation: m.article.designation, article_code: m.article.code }));
    res.json({ success: true, count: enriched.length, data: enriched });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.createMovement = async (req, res) => {
  try {
    const { article_id, type, quantite } = req.body;
    const article = await prisma.article.findUnique({ where: { id: article_id } });
    if (!article) return res.status(404).json({ success: false, message: 'Article non trouvé' });

    const qty = parseFloat(quantite);
    if ((type === 'sortie') && article.quantite < qty) {
      return res.status(400).json({ success: false, message: `Stock insuffisant. Disponible: ${article.quantite} ${article.unite}` });
    }

    const newQty = type === 'entree' ? article.quantite + qty : article.quantite - qty;

    const [mvt] = await prisma.$transaction([
      prisma.mouvementStock.create({
        data: {
          article_id, type,
          quantite: qty, quantite_avant: article.quantite, quantite_apres: newQty,
          prix_unitaire: req.body.prix_unitaire ? parseFloat(req.body.prix_unitaire) : null,
          fournisseur: req.body.fournisseur || null,
          numero_facture: req.body.numero_facture || null,
          destinataire: req.body.destinataire || null,
          motif: req.body.motif || null,
          valideur_id: req.user.id
        }
      }),
      prisma.article.update({ where: { id: article_id }, data: { quantite: newQty } })
    ]);

    await addAuditLog(req.user.id, `MOUVEMENT_${type.toUpperCase()}`, `Stock:${article.code}`,
      { quantite: article.quantite }, { quantite: newQty });
    res.status(201).json({ success: true, message: `Mouvement de ${type} enregistré`, data: mvt });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.getStats = async (req, res) => {
  try {
    const articles = await prisma.article.findMany();
    const enriched = articles.map(enrich);
    const valeurTotale = enriched.reduce((s, a) => s + a.valeur_totale, 0);
    res.json({ success: true, data: {
      total_articles: articles.length,
      valeur_totale: valeurTotale,
      alertes_rouges: enriched.filter(a => a.alerte === 'rouge').length,
      alertes_oranges: enriched.filter(a => a.alerte === 'orange').length,
      expiration_proche: enriched.filter(a => a.expiration_proche).length,
      categories: [...new Set(articles.map(a => a.categorie))]
    }});
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};
