const prisma = require('../prisma');
const { addAuditLog } = require('../utils/audit');

const STEPS = ['enregistre', 'valide', 'affecte', 'participe', 'evalue', 'reconnu'];

exports.getAll = async (req, res) => {
  try {
    const { search, competence } = req.query;
    const where = {};
    if (search) where.OR = [
      { nom: { contains: search, mode: 'insensitive' } },
      { prenom: { contains: search, mode: 'insensitive' } }
    ];
    if (competence) where.competences = { has: competence };
    const data = await prisma.volontaire.findMany({ where, orderBy: { created_at: 'desc' } });
    res.json({ success: true, count: data.length, data });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.getById = async (req, res) => {
  try {
    const v = await prisma.volontaire.findUnique({ where: { id: req.params.id }, include: { affectations: true } });
    if (!v) return res.status(404).json({ success: false, message: 'Volontaire non trouvé' });
    res.json({ success: true, data: v });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.create = async (req, res) => {
  try {
    const data = { ...req.body, statut: 'actif', statut_workflow: 'enregistre' };
    if (data.date_naissance) data.date_naissance = new Date(data.date_naissance);
    delete data.id;
    const v = await prisma.volontaire.create({ data });
    await addAuditLog(req.user.id, 'ENREGISTREMENT_VOLONTAIRE', `Volontaire:${v.prenom} ${v.nom}`);
    res.status(201).json({ success: true, message: 'Volontaire enregistré', data: v });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.update = async (req, res) => {
  try {
    const existing = await prisma.volontaire.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Volontaire non trouvé' });
    const data = { ...req.body };
    if (data.date_naissance) data.date_naissance = new Date(data.date_naissance);
    delete data.id; delete data.created_at;
    const updated = await prisma.volontaire.update({ where: { id: req.params.id }, data });
    await addAuditLog(req.user.id, 'MODIFICATION_VOLONTAIRE', `Volontaire:${existing.nom}`);
    res.json({ success: true, message: 'Volontaire mis à jour', data: updated });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.advanceWorkflow = async (req, res) => {
  try {
    const v = await prisma.volontaire.findUnique({ where: { id: req.params.id } });
    if (!v) return res.status(404).json({ success: false, message: 'Volontaire non trouvé' });
    const idx = STEPS.indexOf(v.statut_workflow);
    if (idx === STEPS.length - 1) return res.status(400).json({ success: false, message: 'Workflow déjà complété' });
    const nextStep = STEPS[idx + 1];
    const updated = await prisma.volontaire.update({ where: { id: req.params.id }, data: { statut_workflow: nextStep } });
    await addAuditLog(req.user.id, 'AVANCEMENT_WORKFLOW', `Volontaire:${v.nom}`, { statut: v.statut_workflow }, { statut: nextStep });
    res.json({ success: true, message: `Avancé à l'étape: ${nextStep}`, data: updated });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.getStats = async (req, res) => {
  try {
    const total = await prisma.volontaire.count({ where: { statut: 'actif' } });
    const parWorkflow = {};
    for (const step of STEPS) {
      parWorkflow[step] = await prisma.volontaire.count({ where: { statut_workflow: step } });
    }
    const tous = await prisma.volontaire.findMany({ select: { competences: true } });
    const competencesMap = {};
    tous.forEach(v => v.competences.forEach(c => { competencesMap[c] = (competencesMap[c] || 0) + 1; }));
    res.json({ success: true, data: { total, parWorkflow, competences: competencesMap } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};
