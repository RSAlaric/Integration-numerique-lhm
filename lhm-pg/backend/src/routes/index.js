const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');

const auth = require('../controllers/authController');
const personnel = require('../controllers/personnelController');
const stock = require('../controllers/stockController');
const volunteers = require('../controllers/volunteersController');
const projects = require('../controllers/projectsController');
const dashboard = require('../controllers/dashboardController');
const users = require('../controllers/usersController');

// AUTH
router.post('/auth/login', auth.login);
router.get('/auth/me', authenticate, auth.getMe);
router.put('/auth/change-password', authenticate, auth.changePassword);

// DASHBOARD
router.get('/dashboard', authenticate, dashboard.getDashboard);
router.get('/audit-logs', authenticate, authorize('super_admin', 'direction'), dashboard.getAuditLogs);

// PERSONNEL
router.get('/personnel', authenticate, personnel.getAll);
router.get('/personnel/stats', authenticate, personnel.getStats);
router.post('/personnel', authenticate, authorize('super_admin', 'assistant_admin'), personnel.create);
router.get('/personnel/:id', authenticate, personnel.getById);
router.put('/personnel/:id', authenticate, authorize('super_admin', 'assistant_admin'), personnel.update);
router.delete('/personnel/:id', authenticate, authorize('super_admin'), personnel.delete);

// ABSENCES
router.get('/absences', authenticate, personnel.getAbsences);
router.post('/absences', authenticate, personnel.createAbsence);
router.put('/absences/:id', authenticate, authorize('super_admin', 'assistant_admin', 'direction'), personnel.updateAbsence);

// STOCK
router.get('/stock', authenticate, stock.getAll);
router.get('/stock/stats', authenticate, stock.getStats);
router.post('/stock', authenticate, authorize('super_admin', 'responsable_stock'), stock.create);
router.get('/stock/:id', authenticate, stock.getById);
router.put('/stock/:id', authenticate, authorize('super_admin', 'responsable_stock'), stock.update);
router.delete('/stock/:id', authenticate, authorize('super_admin', 'responsable_stock'), stock.delete);
router.get('/stock-movements', authenticate, stock.getMovements);
router.post('/stock-movements', authenticate, authorize('super_admin', 'responsable_stock'), stock.createMovement);

// VOLONTAIRES
router.get('/volunteers', authenticate, volunteers.getAll);
router.get('/volunteers/stats', authenticate, volunteers.getStats);
router.post('/volunteers', authenticate, authorize('super_admin', 'responsable_volontaires'), volunteers.create);
router.get('/volunteers/:id', authenticate, volunteers.getById);
router.put('/volunteers/:id', authenticate, authorize('super_admin', 'responsable_volontaires'), volunteers.update);
router.put('/volunteers/:id/workflow', authenticate, authorize('super_admin', 'responsable_volontaires'), volunteers.advanceWorkflow);

// PROJETS
router.get('/projects', authenticate, projects.getAll);
router.get('/projects/stats', authenticate, projects.getStats);
router.post('/projects', authenticate, authorize('super_admin', 'direction'), projects.create);
router.get('/projects/:id', authenticate, projects.getById);
router.put('/projects/:id', authenticate, projects.update);

// UTILISATEURS
router.get('/users', authenticate, authorize('super_admin'), users.getAll);
router.post('/users', authenticate, authorize('super_admin'), users.create);
router.put('/users/:id', authenticate, authorize('super_admin'), users.update);
router.put('/users/:id/toggle-block', authenticate, authorize('super_admin'), users.toggleBlock);

module.exports = router;
