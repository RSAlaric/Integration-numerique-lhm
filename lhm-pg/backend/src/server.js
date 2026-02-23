require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const prisma = require('./prisma');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use('/api', routes);

app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'OK', database: 'PostgreSQL connecté', app: 'LHM Madagascar API', timestamp: new Date() });
  } catch {
    res.status(500).json({ status: 'ERROR', database: 'PostgreSQL non connecté' });
  }
});

app.use((req, res) => res.status(404).json({ success: false, message: 'Route non trouvée' }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ success: false, message: 'Erreur serveur interne' });
});

async function start() {
  try {
    await prisma.$connect();
    console.log('✅ PostgreSQL connecté');
    app.listen(PORT, () => {
      console.log(`\n🚀 LHM Madagascar API → http://localhost:${PORT}`);
      console.log(`🏥 Health check     → http://localhost:${PORT}/health`);
      console.log(`\n📋 Comptes :`);
      console.log(`   admin@lhm-madagascar.org       / Admin@1234`);
      console.log(`   direction@lhm-madagascar.org   / Direction@1234`);
      console.log(`   rh@lhm-madagascar.org          / RH@1234`);
      console.log(`   stock@lhm-madagascar.org       / Stock@1234`);
      console.log(`   volontaires@lhm-madagascar.org / Vol@1234\n`);
    });
  } catch (e) {
    console.error('❌ Impossible de se connecter à PostgreSQL:', e.message);
    console.error('   Vérifiez votre fichier .env et que PostgreSQL est lancé.');
    process.exit(1);
  }
}

start();
