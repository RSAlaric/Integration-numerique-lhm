const bcrypt = require('bcryptjs');
const prisma = require('../prisma');
const { addAuditLog } = require('../utils/audit');

const genMatricule = async () => {
  const count = await prisma.user.count();
  return `USR-${String(count + 1).padStart(3, '0')}`;
};

exports.getAll = async (req, res) => {
  try {
    const users = await prisma.user.findMany({ orderBy: { created_at: 'asc' } });
    res.json({ success: true, count: users.length, data: users.map(({ password: _, ...u }) => u) });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.create = async (req, res) => {
  try {
    const { email, password, nom, prenom, role, service, poste } = req.body;
    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) return res.status(409).json({ success: false, message: 'Email déjà utilisé' });
    const user = await prisma.user.create({
      data: {
        matricule: await genMatricule(),
        email: email.toLowerCase(), nom, prenom, role, service, poste,
        password: await bcrypt.hash(password || 'Password@123', 10)
      }
    });
    await addAuditLog(req.user.id, 'CRÉATION_UTILISATEUR', `Utilisateur:${email}`);
    const { password: _, ...safe } = user;
    res.status(201).json({ success: true, message: 'Utilisateur créé', data: safe });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.update = async (req, res) => {
  try {
    const { password, ...data } = req.body;
    const user = await prisma.user.update({ where: { id: req.params.id }, data });
    await addAuditLog(req.user.id, 'MODIFICATION_UTILISATEUR', `Utilisateur:${user.email}`);
    const { password: _, ...safe } = user;
    res.json({ success: true, message: 'Utilisateur mis à jour', data: safe });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.toggleBlock = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: { bloque: !user.bloque, tentatives_connexion: 0 }
    });
    await addAuditLog(req.user.id, updated.bloque ? 'BLOCAGE_UTILISATEUR' : 'DÉBLOCAGE_UTILISATEUR', `Utilisateur:${user.email}`);
    res.json({ success: true, message: updated.bloque ? 'Utilisateur bloqué' : 'Utilisateur débloqué' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};
