require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { initDatabase } = require('./database');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Sécurité
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, message: 'Trop de requêtes. Réessayez dans 15 minutes.' }
});
app.use('/api', limiter);

// Middleware
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', routes);

// Santé
app.get('/health', (req, res) => res.json({ status: 'OK', app: 'LHM Madagascar API', timestamp: new Date().toISOString() }));

// 404
app.use((req, res) => res.status(404).json({ success: false, message: 'Route non trouvée' }));

// Erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Erreur serveur interne' });
});

// Init DB et démarrage
initDatabase();
app.listen(PORT, () => {
  console.log(`\n🚀 LHM Madagascar API démarrée sur http://localhost:${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}/health`);
  console.log(`\n📋 Comptes de démonstration :`);
  console.log(`   Admin:     admin@lhm-madagascar.org / Admin@1234`);
  console.log(`   Direction: direction@lhm-madagascar.org / Direction@1234`);
  console.log(`   RH:        rh@lhm-madagascar.org / RH@1234`);
  console.log(`   Stock:     stock@lhm-madagascar.org / Stock@1234`);
  console.log(`   Volont.:   volontaires@lhm-madagascar.org / Vol@1234\n`);
});

module.exports = app;
