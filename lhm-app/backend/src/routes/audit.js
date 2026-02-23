const express = require('express');
const db = require('../models/inMemoryDB');
const { authMiddleware, roles } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);
router.use(roles('super_admin', 'direction'));

router.get('/', (req, res) => {
  res.json(db.auditLogs.slice(0, 100));
});

module.exports = router;
