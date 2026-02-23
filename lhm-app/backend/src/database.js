/**
 * LHM Madagascar - Base de données en mémoire (JSON store)
 * En production, remplacer par PostgreSQL avec Sequelize ou Prisma
 */

const { v4: uuidv4 } = require('uuid');

// ============================================================
// STORE EN MÉMOIRE - Simule une base de données
// ============================================================
const db = {
  users: [],
  personnel: [],
  absences: [],
  documents: [],
  volunteers: [],
  volunteerAssignments: [],
  stock: [],
  stockMovements: [],
  projects: [],
  auditLogs: [],
  notifications: [],
  chatRooms: [
    { id:"g_general",     type:"group", name:"Général",            icon:"💬", desc:"Canal ouvert à tous" },
    { id:"g_direction",   type:"group", name:"Direction",           icon:"👔", desc:"Équipe de direction" },
    { id:"g_rh",          type:"group", name:"Ressources Humaines",  icon:"👥", desc:"Personnel et absences" },
    { id:"g_stock",       type:"group", name:"Stock & Logistique",   icon:"📦", desc:"Gestion des stocks" },
    { id:"g_projets",     type:"group", name:"Projets",              icon:"🎯", desc:"Suivi des projets" },
    { id:"g_volontaires", type:"group", name:"Volontaires",          icon:"🤝", desc:"Coordination volontaires" },
    { id:"g_priere",      type:"group", name:"Prière & Dévotion",    icon:"🙏", desc:"Partage spirituel" },
  ],
  chatMessages: []
};

// ============================================================
// DONNÉES INITIALES (SEED)
// ============================================================
const initDatabase = () => {
  // Utilisateurs initiaux
  const bcrypt = require('bcryptjs');
  const salt = bcrypt.genSaltSync(10);

  db.users = [
    {
      id: 'usr-001',
      matricule: 'ADM-001',
      nom: 'Administrateur',
      prenom: 'Système',
      email: 'admin@lhm-madagascar.org',
      password: bcrypt.hashSync('Admin@1234', salt),
      role: 'super_admin',
      service: 'Direction',
      poste: 'Administrateur Système',
      actif: true,
      derniere_connexion: null,
      tentatives_connexion: 0,
      bloque: false,
      created_at: new Date().toISOString(),
      password_changed_at: new Date().toISOString()
    },
    {
      id: 'usr-002',
      matricule: 'DIR-001',
      nom: 'Rakoto',
      prenom: 'Jean',
      email: 'direction@lhm-madagascar.org',
      password: bcrypt.hashSync('Direction@1234', salt),
      role: 'direction',
      service: 'Direction',
      poste: 'Directeur Général',
      actif: true,
      derniere_connexion: null,
      tentatives_connexion: 0,
      bloque: false,
      created_at: new Date().toISOString(),
      password_changed_at: new Date().toISOString()
    },
    {
      id: 'usr-003',
      matricule: 'RH-001',
      nom: 'Rabe',
      prenom: 'Marie',
      email: 'rh@lhm-madagascar.org',
      password: bcrypt.hashSync('RH@1234', salt),
      role: 'assistant_admin',
      service: 'Administration',
      poste: 'Assistant Administration',
      actif: true,
      derniere_connexion: null,
      tentatives_connexion: 0,
      bloque: false,
      created_at: new Date().toISOString(),
      password_changed_at: new Date().toISOString()
    },
    {
      id: 'usr-004',
      matricule: 'STK-001',
      nom: 'Randria',
      prenom: 'Paul',
      email: 'stock@lhm-madagascar.org',
      password: bcrypt.hashSync('Stock@1234', salt),
      role: 'responsable_stock',
      service: 'Logistique',
      poste: 'Responsable Stock',
      actif: true,
      derniere_connexion: null,
      tentatives_connexion: 0,
      bloque: false,
      created_at: new Date().toISOString(),
      password_changed_at: new Date().toISOString()
    },
    {
      id: 'usr-005',
      matricule: 'VOL-001',
      nom: 'Rasolofo',
      prenom: 'Hery',
      email: 'volontaires@lhm-madagascar.org',
      password: bcrypt.hashSync('Vol@1234', salt),
      role: 'responsable_volontaires',
      service: 'Mobilisation',
      poste: 'Responsable Volontaires',
      actif: true,
      derniere_connexion: null,
      tentatives_connexion: 0,
      bloque: false,
      created_at: new Date().toISOString(),
      password_changed_at: new Date().toISOString()
    }
  ];

  // Personnel initial
  db.personnel = [
    {
      id: 'pers-001',
      user_id: 'usr-002',
      matricule: 'DIR-001',
      nom: 'Rakoto', prenom: 'Jean', nom_jeune_fille: '',
      date_naissance: '1975-03-15', lieu_naissance: 'Antananarivo',
      adresse: 'Lot 45 Ambohimanarina, Antananarivo',
      telephone: '+261 34 00 111 22', email: 'direction@lhm-madagascar.org',
      situation_familiale: 'Marié(e)',
      contact_urgence_nom: 'Rakoto Sahondra', contact_urgence_tel: '+261 34 00 333 44',
      poste: 'Directeur Général', service: 'Direction',
      superieur: null, type_contrat: 'CDI',
      date_entree: '2010-01-01',
      competences: ['Leadership', 'Gestion de projet', 'Communication'],
      langues: [{ langue: 'Malagasy', niveau: 'Natif' }, { langue: 'Français', niveau: 'Courant' }],
      formations: ['MBA Management', 'Formation Leadership Chrétien'],
      cnaps: 'CNAPS-001234', aro: 'ARO-5678',
      statut: 'actif',
      created_at: new Date().toISOString()
    },
    {
      id: 'pers-002',
      user_id: 'usr-003',
      matricule: 'RH-001',
      nom: 'Rabe', prenom: 'Marie', nom_jeune_fille: 'Randria',
      date_naissance: '1985-07-22', lieu_naissance: 'Fianarantsoa',
      adresse: 'Lot 12 Tsiadana, Antananarivo',
      telephone: '+261 33 00 555 66', email: 'rh@lhm-madagascar.org',
      situation_familiale: 'Marié(e)',
      contact_urgence_nom: 'Rabe Pierre', contact_urgence_tel: '+261 33 00 777 88',
      poste: 'Assistant Administration', service: 'Administration',
      superieur: 'pers-001', type_contrat: 'CDI',
      date_entree: '2015-06-01',
      competences: ['Gestion RH', 'Comptabilité', 'MS Office'],
      langues: [{ langue: 'Malagasy', niveau: 'Natif' }, { langue: 'Français', niveau: 'Courant' }],
      formations: ['BTS Secrétariat', 'Formation RH'],
      cnaps: 'CNAPS-002345', aro: 'ARO-6789',
      statut: 'actif',
      created_at: new Date().toISOString()
    },
    {
      id: 'pers-003',
      user_id: 'usr-004',
      matricule: 'STK-001',
      nom: 'Randria', prenom: 'Paul', nom_jeune_fille: '',
      date_naissance: '1990-11-08', lieu_naissance: 'Mahajanga',
      adresse: 'Lot 78 Isotry, Antananarivo',
      telephone: '+261 32 00 999 00', email: 'stock@lhm-madagascar.org',
      situation_familiale: 'Célibataire',
      contact_urgence_nom: 'Randria Josoa', contact_urgence_tel: '+261 32 00 111 00',
      poste: 'Responsable Stock', service: 'Logistique',
      superieur: 'pers-001', type_contrat: 'CDI',
      date_entree: '2018-03-15',
      competences: ['Gestion de stock', 'Logistique', 'Excel'],
      langues: [{ langue: 'Malagasy', niveau: 'Natif' }, { langue: 'Français', niveau: 'Intermédiaire' }],
      formations: ['BTS Logistique'],
      cnaps: 'CNAPS-003456', aro: 'ARO-7890',
      statut: 'actif',
      created_at: new Date().toISOString()
    }
  ];

  // Stock initial
  db.stock = [
    {
      id: 'stk-001', code: 'ART-001',
      designation: 'Rames de papier A4',
      categorie: 'Bureautique', sous_categorie: 'Papeterie',
      unite: 'Rame', prix_unitaire: 8500,
      fournisseur: 'Papeterie Centrale', emplacement: 'Dépôt A - Étagère 1',
      quantite: 45, seuil_min: 10, seuil_securite: 20, seuil_optimal: 50,
      date_peremption: null,
      created_at: new Date().toISOString()
    },
    {
      id: 'stk-002', code: 'ART-002',
      designation: 'Stylos bille bleus',
      categorie: 'Bureautique', sous_categorie: 'Écriture',
      unite: 'Pièce', prix_unitaire: 1200,
      fournisseur: 'Papeterie Centrale', emplacement: 'Dépôt A - Étagère 2',
      quantite: 8, seuil_min: 20, seuil_securite: 35, seuil_optimal: 60,
      date_peremption: null,
      created_at: new Date().toISOString()
    },
    {
      id: 'stk-003', code: 'ART-003',
      designation: 'Masques chirurgicaux',
      categorie: 'Médical', sous_categorie: 'Protection',
      unite: 'Boîte (50)', prix_unitaire: 15000,
      fournisseur: 'Pharmamed', emplacement: 'Dépôt B - Étagère 1',
      quantite: 3, seuil_min: 5, seuil_securite: 10, seuil_optimal: 20,
      date_peremption: '2025-12-31',
      created_at: new Date().toISOString()
    },
    {
      id: 'stk-004', code: 'ART-004',
      designation: 'Cartouches encre imprimante HP',
      categorie: 'Bureautique', sous_categorie: 'Informatique',
      unite: 'Pièce', prix_unitaire: 45000,
      fournisseur: 'Electro-Mada', emplacement: 'Dépôt A - Étagère 3',
      quantite: 12, seuil_min: 3, seuil_securite: 6, seuil_optimal: 15,
      date_peremption: null,
      created_at: new Date().toISOString()
    },
    {
      id: 'stk-005', code: 'ART-005',
      designation: 'Riz (sac 25kg)',
      categorie: 'Alimentaire', sous_categorie: 'Céréales',
      unite: 'Sac', prix_unitaire: 85000,
      fournisseur: 'Épicerie SICA', emplacement: 'Dépôt C - Entrepôt',
      quantite: 20, seuil_min: 5, seuil_securite: 10, seuil_optimal: 25,
      date_peremption: '2026-06-30',
      created_at: new Date().toISOString()
    }
  ];

  // Volontaires initiaux
  db.volunteers = [
    {
      id: 'vol-001',
      nom: 'Rakotobe', prenom: 'Andry',
      email: 'andry.r@email.com', telephone: '+261 34 12 345 67',
      date_naissance: '1998-05-14',
      competences: ['Opérateur de saisie', 'Volontaire BCC'],
      disponibilites: { jours: ['Lundi', 'Mercredi', 'Vendredi'], periodes: ['matin', 'après-midi'], type: 'régulier' },
      motivation: 'Servir Dieu à travers le travail communautaire',
      statut: 'actif', statut_workflow: 'affecté',
      created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'vol-002',
      nom: 'Rafaralahy', prenom: 'Soa',
      email: 'soa.r@email.com', telephone: '+261 33 98 765 43',
      date_naissance: '2000-02-28',
      competences: ['Correcteur BCC', 'Volontaire BCC'],
      disponibilites: { jours: ['Mardi', 'Jeudi'], periodes: ['après-midi', 'soir'], type: 'régulier' },
      motivation: 'Partager la Bonne Nouvelle',
      statut: 'actif', statut_workflow: 'validé',
      created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'vol-003',
      nom: 'Andriantsoa', prenom: 'Fidy',
      email: 'fidy.a@email.com', telephone: '+261 32 55 444 33',
      date_naissance: '1995-09-01',
      competences: ['Volontaire Technicien Radio', 'Gestionnaire de stock'],
      disponibilites: { jours: ['Samedi', 'Dimanche'], periodes: ['matin'], type: 'occasionnel' },
      motivation: 'Soutenir la radio évangélique',
      statut: 'actif', statut_workflow: 'enregistré',
      created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  // Projets initiaux
  db.projects = [
    {
      id: 'proj-001',
      nom: 'Programme BCC 2024',
      description: 'Diffusion du cours biblique par correspondance',
      responsable_id: 'usr-002',
      date_debut: '2024-01-01', date_fin_prevue: '2024-12-31',
      budget: 5000000, budget_consomme: 3200000,
      statut: 'en_cours', avancement: 65,
      risques: ['Délai de livraison des cours', 'Disponibilité des volontaires'],
      created_at: new Date().toISOString()
    },
    {
      id: 'proj-002',
      nom: 'Radio Feon\'ny Filazantsara - Saison 2024',
      description: 'Émissions radio évangéliques hebdomadaires',
      responsable_id: 'usr-005',
      date_debut: '2024-03-01', date_fin_prevue: '2024-12-31',
      budget: 8000000, budget_consomme: 5600000,
      statut: 'en_cours', avancement: 70,
      risques: ['Pannes techniques', 'Budget carburant'],
      created_at: new Date().toISOString()
    },
    {
      id: 'proj-003',
      nom: 'Formation Pastorale Régionale',
      description: 'Formation des responsables d\'église en région',
      responsable_id: 'usr-002',
      date_debut: '2024-06-01', date_fin_prevue: '2024-08-31',
      budget: 3000000, budget_consomme: 3000000,
      statut: 'terminé', avancement: 100,
      risques: [],
      created_at: new Date().toISOString()
    }
  ];

  // Absences initiales
  db.absences = [
    {
      id: 'abs-001',
      personnel_id: 'pers-002',
      type: 'Congé annuel',
      date_debut: '2024-12-23', date_fin: '2024-12-31',
      motif: 'Congés de fin d\'année',
      statut: 'approuvé',
      demandeur_id: 'usr-003',
      valideur_id: 'usr-002',
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'abs-002',
      personnel_id: 'pers-003',
      type: 'Congé maladie',
      date_debut: '2024-12-18', date_fin: '2024-12-20',
      motif: 'Grippe avec certificat médical',
      statut: 'en_attente',
      demandeur_id: 'usr-004',
      valideur_id: null,
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  // Mouvements de stock initiaux
  db.stockMovements = [
    {
      id: 'mv-001', type: 'entrée', article_id: 'stk-001',
      quantite: 50, prix_unitaire: 8500,
      fournisseur: 'Papeterie Centrale', numero_facture: 'FAC-2024-001',
      motif: 'Réapprovisionnement', valideur_id: 'usr-004',
      date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'mv-002', type: 'sortie', article_id: 'stk-001',
      quantite: 5, destinataire: 'Service Administration',
      motif: 'Consommation bureau', valideur_id: 'usr-004',
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'mv-003', type: 'sortie', article_id: 'stk-002',
      quantite: 12, destinataire: 'Service Communication',
      motif: 'Activité BCC', valideur_id: 'usr-004',
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  console.log('✅ Base de données initialisée avec les données de démonstration');
};

// Helpers CRUD génériques
const findAll = (table, filter = {}) => {
  return db[table].filter(item => {
    return Object.keys(filter).every(key => item[key] === filter[key]);
  });
};

const findById = (table, id) => db[table].find(item => item.id === id);

const create = (table, data) => {
  const item = { id: uuidv4(), ...data, created_at: new Date().toISOString() };
  db[table].push(item);
  return item;
};

const update = (table, id, data) => {
  const idx = db[table].findIndex(item => item.id === id);
  if (idx === -1) return null;
  db[table][idx] = { ...db[table][idx], ...data, updated_at: new Date().toISOString() };
  return db[table][idx];
};

const remove = (table, id) => {
  const idx = db[table].findIndex(item => item.id === id);
  if (idx === -1) return false;
  db[table].splice(idx, 1);
  return true;
};

// Journal d'audit
const addAuditLog = (userId, action, objet, ancienneValeur = null, nouvelleValeur = null) => {
  db.auditLogs.push({
    id: uuidv4(),
    date: new Date().toISOString(),
    utilisateur_id: userId,
    action,
    objet,
    ancienne_valeur: ancienneValeur,
    nouvelle_valeur: nouvelleValeur
  });
};

module.exports = { db, initDatabase, findAll, findById, create, update, remove, addAuditLog };
