const prisma = require('../prisma');
const { addAuditLog } = require('../utils/audit');

const genMatricule = async (service) => {
  const prefix = (service || 'PER').substring(0, 3).toUpperCase();
  const count = await prisma.personnel.count({ where: { service } });
  return `${prefix}-${String(count + 1).padStart(3, '0')}`;
};

exports.getAll = async (req, res) => {
  try {
    const { service, statut, search } = req.query;
    const where = {};
    if (service) where.service = service;
    if (statut) where.statut = statut;
    if (search) where.OR = [
      { nom: { contains: search, mode: 'insensitive' } },
      { prenom: { contains: search, mode: 'insensitive' } },
      { matricule: { contains: search, mode: 'insensitive' } },
      { poste: { contains: search, mode: 'insensitive' } }
    ];
    const data = await prisma.personnel.findMany({ where, orderBy: { created_at: 'desc' } });
    // Masquer salaire selon rôle
    const filtered = data.map(p => {
      if (!['super_admin', 'direction', 'assistant_admin'].includes(req.user.role)) {
        const { salaire, rib, ...safe } = p; return safe;
      }
      return p;
    });
    res.json({ success: true, count: filtered.length, data: filtered });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.getById = async (req, res) => {
  try {
    const p = await prisma.personnel.findUnique({ where: { id: req.params.id } });
    if (!p) return res.status(404).json({ success: false, message: 'Personnel non trouvé' });
    if (!['super_admin', 'direction', 'assistant_admin'].includes(req.user.role)) {
      const { salaire, rib, ...safe } = p; return res.json({ success: true, data: safe });
    }
    res.json({ success: true, data: p });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.create = async (req, res) => {
  try {
    const data = { ...req.body };
    data.matricule = await genMatricule(data.service);
    if (data.date_naissance) data.date_naissance = new Date(data.date_naissance);
    if (data.date_entree) data.date_entree = new Date(data.date_entree);
    if (data.salaire) data.salaire = parseFloat(data.salaire);
    delete data.id; delete data.created_at; delete data.updated_at;
    // Prisma attend les enums exacts
    if (!['CDI','CDD','Benevole','Stage','Autre'].includes(data.type_contrat)) data.type_contrat = 'CDI';
    const p = await prisma.personnel.create({ data });
    await addAuditLog(req.user.id, 'CRÉATION_PERSONNEL', `Personnel:${p.matricule}`, null, { nom: p.nom, poste: p.poste });
    res.status(201).json({ success: true, message: 'Personnel créé', data: p });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.update = async (req, res) => {
  try {
    const existing = await prisma.personnel.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Personnel non trouvé' });
    const data = { ...req.body };
    if (data.date_naissance) data.date_naissance = new Date(data.date_naissance);
    if (data.date_entree) data.date_entree = new Date(data.date_entree);
    if (data.salaire) data.salaire = parseFloat(data.salaire);
    delete data.id; delete data.created_at; delete data.updated_at; delete data.matricule;
    const updated = await prisma.personnel.update({ where: { id: req.params.id }, data });
    await addAuditLog(req.user.id, 'MODIFICATION_PERSONNEL', `Personnel:${existing.matricule}`, null, null);
    res.json({ success: true, message: 'Personnel mis à jour', data: updated });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.delete = async (req, res) => {
  try {
    const existing = await prisma.personnel.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Personnel non trouvé' });
    await prisma.personnel.update({ where: { id: req.params.id }, data: { statut: 'inactif' } });
    await addAuditLog(req.user.id, 'DÉSACTIVATION_PERSONNEL', `Personnel:${existing.matricule}`);
    res.json({ success: true, message: 'Personnel désactivé' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.getStats = async (req, res) => {
  try {
    const total = await prisma.personnel.count({ where: { statut: 'actif' } });
    const parServiceRaw = await prisma.personnel.groupBy({ by: ['service'], _count: { _all: true }, where: { statut: 'actif' } });
    const parService = Object.fromEntries(parServiceRaw.map(r => [r.service, r._count._all]));
    const absencesEnAttente = await prisma.absence.count({ where: { statut: 'en_attente' } });
    const congesApprouves = await prisma.absence.count({ where: { statut: 'approuve', type: 'Conge_annuel' } });
    res.json({ success: true, data: { total, parService, absencesEnAttente, congesApprouves } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// Absences
exports.getAbsences = async (req, res) => {
  try {
    const where = {};
    if (req.query.personnel_id) where.personnel_id = req.query.personnel_id;
    if (req.query.statut) where.statut = req.query.statut;
    const absences = await prisma.absence.findMany({
      where, orderBy: { created_at: 'desc' },
      include: { personnel: { select: { nom: true, prenom: true, poste: true } } }
    });
    const enriched = absences.map(a => ({
      ...a, personnel_nom: `${a.personnel.prenom} ${a.personnel.nom}`
    }));
    res.json({ success: true, count: enriched.length, data: enriched });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.createAbsence = async (req, res) => {
  try {
    const data = { ...req.body, demandeur_id: req.user.id, statut: 'en_attente' };
    if (data.date_debut) data.date_debut = new Date(data.date_debut);
    if (data.date_fin) data.date_fin = new Date(data.date_fin);
    delete data.id;
    const absence = await prisma.absence.create({ data });
    await addAuditLog(req.user.id, 'DEMANDE_ABSENCE', `Personnel:${data.personnel_id}`);
    res.status(201).json({ success: true, message: "Demande d'absence créée", data: absence });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.updateAbsence = async (req, res) => {
  try {
    const absence = await prisma.absence.findUnique({ where: { id: req.params.id } });
    if (!absence) return res.status(404).json({ success: false, message: 'Absence non trouvée' });
    const { statut, commentaire } = req.body;
    const updated = await prisma.absence.update({
      where: { id: req.params.id },
      data: { statut, commentaire, valideur_id: req.user.id }
    });
    await addAuditLog(req.user.id, `ABSENCE_${statut.toUpperCase()}`, `Absence:${req.params.id}`);
    res.json({ success: true, message: `Absence ${statut}`, data: updated });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};
