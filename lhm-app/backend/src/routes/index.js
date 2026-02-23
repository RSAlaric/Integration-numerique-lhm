const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');

// Controllers
const authCtrl = require('../controllers/authController');
const personnelCtrl = require('../controllers/personnelController');
const stockCtrl = require('../controllers/stockController');
const volunteersCtrl = require('../controllers/volunteersController');
const projectsCtrl = require('../controllers/projectsController');
const dashboardCtrl = require('../controllers/dashboardController');
const usersCtrl = require('../controllers/usersController');

// ============== AUTH ==============
router.post('/auth/login', authCtrl.login);
router.get('/auth/me', authenticate, authCtrl.getMe);
router.put('/auth/change-password', authenticate, authCtrl.changePassword);

// ============== DASHBOARD ==============
router.get('/dashboard', authenticate, dashboardCtrl.getDashboard);
router.get('/audit-logs', authenticate, authorize('super_admin', 'direction'), dashboardCtrl.getAuditLogs);

// ============== PERSONNEL ==============
router.get('/personnel', authenticate, personnelCtrl.getAll);
router.get('/personnel/stats', authenticate, personnelCtrl.getStats);
router.post('/personnel', authenticate, authorize('super_admin', 'assistant_admin'), personnelCtrl.create);
router.get('/personnel/:id', authenticate, personnelCtrl.getById);
router.put('/personnel/:id', authenticate, authorize('super_admin', 'assistant_admin'), personnelCtrl.update);
router.delete('/personnel/:id', authenticate, authorize('super_admin'), personnelCtrl.delete);

// Absences
router.get('/absences', authenticate, personnelCtrl.getAbsences);
router.post('/absences', authenticate, personnelCtrl.createAbsence);
router.put('/absences/:id', authenticate, authorize('super_admin', 'assistant_admin', 'direction'), personnelCtrl.updateAbsence);

// ============== STOCK ==============
router.get('/stock', authenticate, stockCtrl.getAll);
router.get('/stock/stats', authenticate, stockCtrl.getStats);
router.post('/stock', authenticate, authorize('super_admin', 'responsable_stock'), stockCtrl.create);
router.get('/stock/:id', authenticate, stockCtrl.getById);
router.put('/stock/:id', authenticate, authorize('super_admin', 'responsable_stock'), stockCtrl.update);
router.delete('/stock/:id', authenticate, authorize('super_admin', 'responsable_stock'), stockCtrl.delete);
router.get('/stock-movements', authenticate, stockCtrl.getMovements);
router.post('/stock-movements', authenticate, authorize('super_admin', 'responsable_stock'), stockCtrl.createMovement);

// ============== VOLONTAIRES ==============
router.get('/volunteers', authenticate, volunteersCtrl.getAll);
router.get('/volunteers/stats', authenticate, volunteersCtrl.getStats);
router.post('/volunteers', authenticate, authorize('super_admin', 'responsable_volontaires'), volunteersCtrl.create);
router.get('/volunteers/:id', authenticate, volunteersCtrl.getById);
router.put('/volunteers/:id', authenticate, authorize('super_admin', 'responsable_volontaires'), volunteersCtrl.update);
router.put('/volunteers/:id/workflow', authenticate, authorize('super_admin', 'responsable_volontaires'), volunteersCtrl.advanceWorkflow);

// ============== PROJETS ==============
router.get('/projects', authenticate, projectsCtrl.getAll);
router.get('/projects/stats', authenticate, projectsCtrl.getStats);
router.post('/projects', authenticate, authorize('super_admin', 'direction'), projectsCtrl.create);
router.get('/projects/:id', authenticate, projectsCtrl.getById);
router.put('/projects/:id', authenticate, projectsCtrl.update);

// ============== UTILISATEURS ==============
router.get('/users', authenticate, authorize('super_admin'), usersCtrl.getAll);
router.post('/users', authenticate, authorize('super_admin'), usersCtrl.create);
router.put('/users/:id', authenticate, authorize('super_admin'), usersCtrl.update);
router.put('/users/:id/toggle-block', authenticate, authorize('super_admin'), usersCtrl.toggleBlock);


// ============== MESSAGERIE ==============
const chatCtrl = require('../controllers/chatController');
router.get('/chat/rooms',          authenticate, chatCtrl.getRooms);
router.get('/chat/users',          authenticate, chatCtrl.getChatUsers);
router.post('/chat/rooms/private', authenticate, chatCtrl.createPrivateRoom);
router.post('/chat/rooms/group',   authenticate, chatCtrl.createGroup);
router.get('/chat/messages/:roomId',  authenticate, chatCtrl.getMessages);
router.post('/chat/messages',         authenticate, chatCtrl.sendMessage);
router.delete('/chat/messages/:msgId',authenticate, chatCtrl.deleteMessage);

module.exports = router;
