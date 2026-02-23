const prisma = require('../prisma');
const { addAuditLog } = require('../utils/audit');

exports.getAll = async (req, res) => {
  try {
    const where = {};
    if (req.query.statut) where.statut = req.query.statut;
    const data = await prisma.projet.findMany({
      where, orderBy: { created_at: 'desc' },
      include: { responsable: { select: { nom: true, prenom: true } } }
    });
    const enriched = data.map(p => ({
      ...p,
      responsable_nom: p.responsable ? `${p.responsable.prenom} ${p.responsable.nom}` : '—',
      en_retard: p.statut === 'en_cours' && new Date(p.date_fin_prevue) < new Date() && p.avancement < 100,
      budget_restant: p.budget - p.budget_consomme
    }));
    res.json({ success: true, count: enriched.length, data: enriched });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.getById = async (req, res) => {
  try {
    const p = await prisma.projet.findUnique({ where: { id: req.params.id } });
    if (!p) return res.status(404).json({ success: false, message: 'Projet non trouvé' });
    res.json({ success: true, data: p });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.create = async (req, res) => {
  try {
    const data = { ...req.body, statut: 'planifie', avancement: 0, budget_consomme: 0 };
    if (data.date_debut) data.date_debut = new Date(data.date_debut);
    if (data.date_fin_prevue) data.date_fin_prevue = new Date(data.date_fin_prevue);
    if (data.budget) data.budget = parseFloat(data.budget);
    if (!data.responsable_id) delete data.responsable_id;
    delete data.id;
    const p = await prisma.projet.create({ data });
    await addAuditLog(req.user.id, 'CRÉATION_PROJET', `Projet:${p.nom}`);
    res.status(201).json({ success: true, message: 'Projet créé', data: p });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.update = async (req, res) => {
  try {
    const existing = await prisma.projet.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Projet non trouvé' });
    const data = { ...req.body };
    if (data.avancement) data.avancement = parseInt(data.avancement);
    if (data.budget_consomme) data.budget_consomme = parseFloat(data.budget_consomme);
    if (data.risques && typeof data.risques === 'string') data.risques = data.risques.split(',').map(r => r.trim()).filter(Boolean);
    delete data.id; delete data.created_at;
    const updated = await prisma.projet.update({ where: { id: req.params.id }, data });
    await addAuditLog(req.user.id, 'MODIFICATION_PROJET', `Projet:${existing.nom}`);
    res.json({ success: true, message: 'Projet mis à jour', data: updated });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.getStats = async (req, res) => {
  try {
    const [total, enCours, termines, projets] = await Promise.all([
      prisma.projet.count(),
      prisma.projet.count({ where: { statut: 'en_cours' } }),
      prisma.projet.count({ where: { statut: 'termine' } }),
      prisma.projet.findMany({ select: { budget: true, budget_consomme: true, statut: true, date_fin_prevue: true, avancement: true } })
    ]);
    const enRetard = projets.filter(p => p.statut === 'en_cours' && new Date(p.date_fin_prevue) < new Date()).length;
    const budgetTotal = projets.reduce((s, p) => s + p.budget, 0);
    const budgetConsomme = projets.reduce((s, p) => s + p.budget_consomme, 0);
    res.json({ success: true, data: { total, enCours, termines, enRetard, budgetTotal, budgetConsomme } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};
