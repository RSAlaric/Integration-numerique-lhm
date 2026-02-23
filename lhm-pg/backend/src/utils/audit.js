const prisma = require('../prisma');

const addAuditLog = async (userId, action, objet, ancienneValeur = null, nouvelleValeur = null, ip = null) => {
  try {
    await prisma.auditLog.create({
      data: {
        utilisateur_id: userId || null,
        action, objet,
        ancienne_valeur: ancienneValeur || undefined,
        nouvelle_valeur: nouvelleValeur || undefined,
        ip
      }
    });
  } catch (e) { console.error('Audit log error:', e.message); }
};

module.exports = { addAuditLog };
