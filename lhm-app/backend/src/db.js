// db.js - In-memory database for LHM Madagascar
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

// ==================== INITIAL DATA ====================

const services = [
  { id: 's1', name: 'Direction Générale' },
  { id: 's2', name: 'Administration & RH' },
  { id: 's3', name: 'Diffusion Radio' },
  { id: 's4', name: 'Projets Communautaires' },
  { id: 's5', name: 'Logistique & Stock' },
  { id: 's6', name: 'Informatique' },
  { id: 's7', name: 'Communication' },
];

const users = [
  {
    id: 'u1',
    username: 'admin',
    email: 'admin@lhm-madagascar.org',
    passwordHash: bcrypt.hashSync('Admin@2024!', 10),
    role: 'admin',
    name: 'Administrateur Système',
    service: 's6',
    active: true,
    lastLogin: null,
    passwordChangedAt: new Date().toISOString(),
    failedAttempts: 0,
    locked: false,
  },
  {
    id: 'u2',
    username: 'direction',
    email: 'direction@lhm-madagascar.org',
    passwordHash: bcrypt.hashSync('Direction@2024!', 10),
    role: 'direction',
    name: 'Jean-Baptiste Rakoto',
    service: 's1',
    active: true,
    lastLogin: null,
    passwordChangedAt: new Date().toISOString(),
    failedAttempts: 0,
    locked: false,
  },
  {
    id: 'u3',
    username: 'rh',
    email: 'rh@lhm-madagascar.org',
    passwordHash: bcrypt.hashSync('RH@2024Pass!', 10),
    role: 'rh',
    name: 'Marie Razafimahaleo',
    service: 's2',
    active: true,
    lastLogin: null,
    passwordChangedAt: new Date().toISOString(),
    failedAttempts: 0,
    locked: false,
  },
  {
    id: 'u4',
    username: 'stock',
    email: 'stock@lhm-madagascar.org',
    passwordHash: bcrypt.hashSync('Stock@2024!', 10),
    role: 'stock',
    name: 'Pierre Andriantsoa',
    service: 's5',
    active: true,
    lastLogin: null,
    passwordChangedAt: new Date().toISOString(),
    failedAttempts: 0,
    locked: false,
  },
  {
    id: 'u5',
    username: 'coordinateur',
    email: 'coord@lhm-madagascar.org',
    passwordHash: bcrypt.hashSync('Coord@2024!', 10),
    role: 'coordinateur',
    name: 'Sarah Randrianasolo',
    service: 's4',
    active: true,
    lastLogin: null,
    passwordChangedAt: new Date().toISOString(),
    failedAttempts: 0,
    locked: false,
  },
  {
    id: 'u6',
    username: 'volontaires',
    email: 'volontaires@lhm-madagascar.org',
    passwordHash: bcrypt.hashSync('Volont@2024!', 10),
    role: 'responsable_volontaires',
    name: 'Paul Rabemananjara',
    service: 's4',
    active: true,
    lastLogin: null,
    passwordChangedAt: new Date().toISOString(),
    failedAttempts: 0,
    locked: false,
  },
];

// Generate 50 personnel
const firstNames = ['Jean','Marie','Pierre','Anne','Paul','Sophie','Luc','Claire','Marc','Julie','Thomas','Emma','Nicolas','Laura','David','Alice','Philippe','Camille','Antoine','Léa','Michel','Chantal','François','Nathalie','Patrick','Isabelle','Christian','Valérie','Éric','Sylvie','Hery','Vola','Noro','Tiana','Fanja','Tsiry','Lova','Rivo','Soa','Mamy','Aina','Zo','Ny','Tojo','Rija','Misa','Dina','Tina','Lanto','Fara'];
const lastNames = ['Rakoto','Razafy','Andriantsoa','Rabemananjara','Randriamaro','Rakotobe','Ratsimbazafy','Andriamarolahy','Rakotondrabe','Rakotonirina','Razafimahefa','Randrianasolo','Rakotomalala','Andrianaivo','Razafindrakoto','Rakotovao','Randrianarisoa','Andrianjafy','Razafimahaleo','Rakotondrasoa','Rakotoarimanana','Randrianarimanana','Razafitsalama','Andriamihaja','Raharivelo','Rakotoarisoa','Randriamampionona','Andrianirina','Ramaroson','Rakotomanana'];
const postes = ['Technicien Radio','Secrétaire','Comptable','Coordinateur Projet','Animateur','Ingénieur Son','Journaliste','Chauffeur','Agent de Sécurité','Technicien Informatique','Responsable Communication','Chargé de Projet','Assistant RH','Gestionnaire de Stock','Électricien','Opérateur de Saisie'];
const contrats = ['CDI','CDD','Autre'];

const personnel = [];
for (let i = 0; i < 50; i++) {
  const fn = firstNames[i % firstNames.length];
  const ln = lastNames[i % lastNames.length];
  const serviceId = services[i % services.length].id;
  const poste = postes[i % postes.length];
  const entryYear = 2015 + (i % 9);
  personnel.push({
    id: `p${i + 1}`,
    matricule: `LHM-${entryYear}-${String(i + 1).padStart(4, '0')}`,
    firstName: fn,
    lastName: ln,
    maidenName: '',
    birthDate: `${1970 + (i % 25)}-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
    birthPlace: ['Antananarivo','Toamasina','Fianarantsoa','Mahajanga','Antsiranana'][i % 5],
    address: `${i + 1} Rue de la Paix, ${['Antananarivo','Toamasina','Fianarantsoa'][i % 3]}`,
    phone: `+261 3${i % 4}${String(10000000 + i).substring(1)}`,
    email: `${fn.toLowerCase()}.${ln.toLowerCase()}@lhm-madagascar.org`,
    familySituation: ['Célibataire','Marié(e)','Divorcé(e)'][i % 3],
    emergencyContact: { name: `Contact ${i}`, phone: `+261 320000${String(i).padStart(3, '0')}` },
    entryDate: `${entryYear}-0${(i % 9) + 1}-15`,
    poste,
    service: serviceId,
    supervisor: i > 0 ? `p${Math.max(1, i - 5)}` : null,
    contractType: contrats[i % 3],
    salary: 500000 + (i * 50000),
    rib: `MG${String(i + 1000000).padStart(10, '0')}`,
    objectives: `Objectifs annuels ${new Date().getFullYear()} pour ${fn} ${ln}`,
    skills: ['Communication','Gestion de projet','Informatique','Rédaction'].slice(0, (i % 4) + 1),
    languages: [{ lang: 'Malagasy', level: 'C2' }, { lang: 'Français', level: ['B2','C1','C2'][i % 3] }],
    formations: [],
    certifications: [],
    cnaps: `CNAPS-${String(i + 100000).padStart(8, '0')}`,
    aro: `ARO-${String(i + 200000).padStart(8, '0')}`,
    photo: null,
    status: 'active',
    createdAt: new Date().toISOString(),
  });
}

// Generate 200 volunteers
const motivations = ['Servir Dieu et la communauté','Partager mes compétences','Contribuer à la mission évangélique','Développer mes aptitudes','Soutenir les projets communautaires'];
const volunteerSkills = ['Opérateur de saisie','Correcteur BCC','Gestionnaire de stock','Volontaire BCC','Volontaire technicien Radio'];
const volunteerStatuses = ['enrolled','evaluated','assigned','active','recognized'];

const volunteers = [];
for (let i = 0; i < 200; i++) {
  const fn = firstNames[i % firstNames.length];
  const ln = lastNames[i % lastNames.length];
  volunteers.push({
    id: `v${i + 1}`,
    firstName: fn,
    lastName: `${ln}-V`,
    phone: `+261 3${i % 4}${String(20000000 + i).substring(1)}`,
    email: `volontaire${i + 1}@email.mg`,
    motivation: motivations[i % motivations.length],
    skills: volunteerSkills.slice(0, (i % 5) + 1),
    availability: {
      days: ['Lundi','Mardi','Mercredi','Jeudi','Vendredi'].slice(0, (i % 5) + 1),
      slots: ['Matin','Après-midi','Soir'].slice(0, (i % 3) + 1),
      frequency: i % 2 === 0 ? 'Régulier' : 'Occasionnel',
    },
    preferences: 'Activités radio et saisie',
    restrictions: '',
    status: volunteerStatuses[i % volunteerStatuses.length],
    joinDate: `2023-0${(i % 9) + 1}-${String((i % 28) + 1).padStart(2, '0')}`,
    photo: null,
    createdAt: new Date().toISOString(),
  });
}

// Stock categories and articles
const stockCategories = [
  { id: 'cat1', name: 'Bureautique', subcategories: [
    { id: 'sub1', name: 'Fournitures', categoryId: 'cat1' },
    { id: 'sub2', name: 'Équipements Bureau', categoryId: 'cat1' },
  ]},
  { id: 'cat2', name: 'Audiovisuel', subcategories: [
    { id: 'sub3', name: 'Équipements Radio', categoryId: 'cat2' },
    { id: 'sub4', name: 'Accessoires', categoryId: 'cat2' },
  ]},
  { id: 'cat3', name: 'Alimentaire', subcategories: [
    { id: 'sub5', name: 'Vivres', categoryId: 'cat3' },
    { id: 'sub6', name: 'Boissons', categoryId: 'cat3' },
  ]},
  { id: 'cat4', name: 'Médical', subcategories: [
    { id: 'sub7', name: 'Médicaments', categoryId: 'cat4' },
    { id: 'sub8', name: 'Matériel de Soin', categoryId: 'cat4' },
  ]},
  { id: 'cat5', name: 'Informatique', subcategories: [
    { id: 'sub9', name: 'Matériel', categoryId: 'cat5' },
    { id: 'sub10', name: 'Consommables', categoryId: 'cat5' },
  ]},
];

const articleNames = [
  ['Stylos bille','Ramettes A4','Classeurs','Trombones','Post-it','Ciseaux','Ruban adhésif','Correcteurs','Enveloppes','Agrafeuses'],
  ['Imprimante','Scanner','Téléphone fixe','Calculatrice','Lampe de bureau','Bureau','Chaise ergonomique','Armoire','Tableau blanc','Projecteur'],
  ['Microphone','Casque audio','Câble XLR','Table de mixage','Amplificateur','Haut-parleur','Enregistreur numérique','Filtre anti-pop','Pied de micro','Câble RCA'],
  ['Adaptateur','Batterie de secours','Câble HDMI','Multiprise','Disque dur externe','Clé USB','Support micro','Écran de studio','Câble réseau','Switch réseau'],
  ['Riz','Haricots','Huile végétale','Sel','Sucre','Farine','Lait en poudre','Conserves','Pâtes','Biscuits'],
  ['Eau minérale','Jus de fruits','Café','Thé','Lait UHT','Sodas','Sirop','Boisson énergétique','Eau gazeuse','Infusions'],
  ['Paracétamol','Ibuprofène','Amoxicilline','Vitamine C','Antipaludéen','Antiseptique','Antidiarrhéique','Antiallergique','Sérum oral','Antifongique'],
  ['Gants médicaux','Masques chirurgicaux','Compresses','Seringues','Pansements','Bandes','Alcool médical','Thermomètre','Tensiomètre','Stéthoscope'],
  ['Ordinateur portable','Souris','Clavier','Câble USB','Hub USB','Webcam','Écran LCD','Imprimante laser','Routeur WiFi','Serveur NAS'],
  ['Cartouches encre','Toner','CD-R','DVD-R','Câbles divers','Papier photo','Étiquettes','Spirales','Reliures','Protège-documents'],
];

const units = ['pièce','kg','litre','paquet','boîte','carton','rouleau'];
const suppliers = ['Fournisseur Tana A','Fournisseur Tana B','Import Madagascar','Tech Supply MG','Grossiste Central','Pharmacie Centrale','Épicerie Grossiste'];
const locations = ['Dépôt Principal','Salle de Stock A','Salle de Stock B','Bureau Direction','Salle Radio','Réserve'];

const stockItems = [];
let artIndex = 0;
for (let catIdx = 0; catIdx < stockCategories.length; catIdx++) {
  const cat = stockCategories[catIdx];
  for (let subIdx = 0; subIdx < cat.subcategories.length; subIdx++) {
    const sub = cat.subcategories[subIdx];
    const names = articleNames[catIdx * 2 + subIdx] || articleNames[0];
    for (let n = 0; n < names.length; n++) {
      artIndex++;
      const quantity = Math.floor(Math.random() * 200);
      const minStock = 10 + Math.floor(Math.random() * 20);
      const safetyStock = minStock + 10;
      stockItems.push({
        id: `art${artIndex}`,
        code: `LHM-ART-${String(artIndex).padStart(4, '0')}`,
        name: names[n],
        categoryId: cat.id,
        subcategoryId: sub.id,
        unit: units[artIndex % units.length],
        unitPrice: 500 + artIndex * 200,
        quantity,
        minStock,
        safetyStock,
        supplier: suppliers[artIndex % suppliers.length],
        location: locations[artIndex % locations.length],
        expiryDate: catIdx === 2 || catIdx === 3 ? `2025-${String((artIndex % 12) + 1).padStart(2, '0')}-28` : null,
        photo: null,
        description: `${names[n]} - usage interne LHM Madagascar`,
        createdAt: new Date().toISOString(),
      });
    }
  }
}

// Stock movements
const stockMovements = [];
for (let i = 0; i < 100; i++) {
  const item = stockItems[i % stockItems.length];
  const type = i % 3 === 0 ? 'entry' : i % 3 === 1 ? 'exit' : 'transfer';
  stockMovements.push({
    id: `mv${i + 1}`,
    type,
    itemId: item.id,
    quantity: (i % 10) + 1,
    date: new Date(Date.now() - i * 86400000).toISOString(),
    reference: type === 'entry' ? `BL-2024-${String(i).padStart(4, '0')}` : `BS-2024-${String(i).padStart(4, '0')}`,
    supplier: type === 'entry' ? item.supplier : null,
    recipient: type === 'exit' ? personnel[i % personnel.length].firstName + ' ' + personnel[i % personnel.length].lastName : null,
    reason: type === 'exit' ? ['Activité','Projet','Consommation'][i % 3] : null,
    unitPrice: item.unitPrice,
    validatedBy: 'u4',
    createdAt: new Date(Date.now() - i * 86400000).toISOString(),
  });
}

// Projects
const projectNames = ['Évangélisation Zone Nord','Formation Biblique BCC','Radio Feon\'ny Filazantsara S2','Programme Alphabétisation','Aide Alimentaire Anosy','Construction Centre Communautaire','Formation Animateurs Radio','Distribution Matériel Scolaire','Programme Santé Communautaire','Séminaire Leadership Chrétien','Projet Eau Potable Région Sud','Bibliothèque Mobile','Atelier Couture Femmes','Programme Orphelins','Micro-crédit Communautaire','Sensibilisation VIH/SIDA','Formation Informatique Jeunes','Concert Évangélique','Retraite Spirituelle Annuelle','Mission Terrain Antsiranana'];
const projectStatuses = ['planning','active','on_hold','completed','delayed'];

const projects = projectNames.map((name, i) => ({
  id: `proj${i + 1}`,
  name,
  description: `Projet ${name} - Initiative LHM Madagascar pour la communauté`,
  status: projectStatuses[i % projectStatuses.length],
  startDate: `2024-0${(i % 9) + 1}-01`,
  endDate: `2024-${String((i % 11) + 2).padStart(2, '0')}-28`,
  budget: 1000000 + i * 500000,
  budgetUsed: Math.floor((1000000 + i * 500000) * (0.2 + (i % 8) * 0.1)),
  progress: 10 + (i * 4) % 90,
  coordinator: personnel[i % personnel.length].id,
  team: personnel.slice(i % 5, (i % 5) + 3).map(p => p.id),
  risks: i % 3 === 0 ? ['Manque de financement','Accès difficile zone rurale'] : [],
  createdAt: new Date().toISOString(),
}));

// Absences/Leave requests
const absences = [];
for (let i = 0; i < 30; i++) {
  absences.push({
    id: `abs${i + 1}`,
    personnelId: personnel[i % personnel.length].id,
    type: ['Congé annuel','Congé maladie','Congé maternité','Congé sans solde','Permission spéciale'][i % 5],
    startDate: `2024-${String((i % 11) + 1).padStart(2, '0')}-${String((i % 20) + 1).padStart(2, '0')}`,
    endDate: `2024-${String((i % 11) + 1).padStart(2, '0')}-${String((i % 20) + 5).padStart(2, '0')}`,
    reason: 'Demande de congé pour raison personnelle',
    status: ['pending','approved','rejected'][i % 3],
    requestedAt: new Date(Date.now() - i * 86400000 * 2).toISOString(),
    validatedBy: i % 3 !== 0 ? 'u3' : null,
    validatedAt: i % 3 !== 0 ? new Date(Date.now() - i * 86400000).toISOString() : null,
    comments: '',
  });
}

// Audit logs
const auditLogs = [
  { id: 'log1', timestamp: new Date().toISOString(), userId: 'u1', action: 'LOGIN', object: 'System', oldValue: null, newValue: null },
  { id: 'log2', timestamp: new Date(Date.now() - 3600000).toISOString(), userId: 'u3', action: 'CREATE', object: 'Personnel', oldValue: null, newValue: 'Nouvelle fiche créée' },
  { id: 'log3', timestamp: new Date(Date.now() - 7200000).toISOString(), userId: 'u4', action: 'UPDATE', object: 'Stock', oldValue: 'Quantité: 50', newValue: 'Quantité: 45' },
];

// ==================== DATABASE OBJECT ====================
const db = {
  users,
  services,
  personnel,
  volunteers,
  stockCategories,
  stockItems,
  stockMovements,
  projects,
  absences,
  auditLogs,

  // Helper methods
  addAuditLog(userId, action, object, oldValue = null, newValue = null) {
    auditLogs.unshift({
      id: `log${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId,
      action,
      object,
      oldValue,
      newValue,
    });
  },

  findUser(id) { return users.find(u => u.id === id); },
  findUserByUsername(username) { return users.find(u => u.username === username); },
  findUserByEmail(email) { return users.find(u => u.email === email); },
  getStats() {
    const criticalStock = stockItems.filter(i => i.quantity <= i.minStock).length;
    const pendingLeave = absences.filter(a => a.status === 'pending').length;
    const activeProjects = projects.filter(p => p.status === 'active').length;
    const delayedProjects = projects.filter(p => p.status === 'delayed').length;
    return {
      totalPersonnel: personnel.filter(p => p.status === 'active').length,
      totalVolunteers: volunteers.length,
      activeProjects,
      delayedProjects,
      criticalStock,
      pendingLeave,
      volunteerOccupancyRate: Math.round((volunteers.filter(v => v.status === 'active').length / volunteers.length) * 100),
    };
  }
};

module.exports = db;
