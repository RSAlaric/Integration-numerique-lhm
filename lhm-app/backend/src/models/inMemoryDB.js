const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const db = {
  users: [],
  personnel: [],
  absences: [],
  volontaires: [],
  affectations: [],
  categories: [],
  articles: [],
  mouvements: [],
  projets: [],
  auditLogs: [],
};

async function seed() {
  const hash = (pw) => bcrypt.hashSync(pw, 10);

  db.users = [
    { id: 'u1', nom: 'Rakoto', prenom: 'Jean', email: 'admin@lhm.mg', password: hash('Admin1234!'), role: 'super_admin', actif: true, derniereConnexion: null, createdAt: new Date() },
    { id: 'u2', nom: 'Rabe', prenom: 'Marie', email: 'direction@lhm.mg', password: hash('Direction1!'), role: 'direction', actif: true, derniereConnexion: null, createdAt: new Date() },
    { id: 'u3', nom: 'Rasoa', prenom: 'Hery', email: 'rh@lhm.mg', password: hash('RH1234!'), role: 'assistant_admin', actif: true, derniereConnexion: null, createdAt: new Date() },
    { id: 'u4', nom: 'Andry', prenom: 'Lova', email: 'volontaires@lhm.mg', password: hash('Volont1!'), role: 'resp_volontaires', actif: true, derniereConnexion: null, createdAt: new Date() },
    { id: 'u5', nom: 'Miora', prenom: 'Fanja', email: 'stock@lhm.mg', password: hash('Stock1234!'), role: 'resp_stock', actif: true, derniereConnexion: null, createdAt: new Date() },
    { id: 'u6', nom: 'Ranivo', prenom: 'Tojo', email: 'coordinateur@lhm.mg', password: hash('Coord1234!'), role: 'coordinateur', actif: true, derniereConnexion: null, createdAt: new Date() },
    { id: 'u7', nom: 'Razafy', prenom: 'Lalao', email: 'user@lhm.mg', password: hash('User1234!'), role: 'utilisateur', actif: true, derniereConnexion: null, createdAt: new Date() },
  ];

  db.personnel = [
    { id: 'p1', matricule: 'MAT-001', nom: 'Rakoto', prenom: 'Jean', dateNaissance: '1980-05-15', lieuNaissance: 'Antananarivo', adresse: '123 Rue Rainandriamampandry', telephone: '+261 34 00 111 22', email: 'jrakoto@lhm.mg', situationFamiliale: 'Marié(e)', personneUrgence: 'Rakoto Hanta - 034 00 222 33', dateEntree: '2015-01-10', poste: 'Directeur Général', service: 'Direction', superieur: null, typeContrat: 'CDI', salaire: 2500000, objectifsAnnuels: 'Développer les programmes évangéliques', cnaps: 'CNAPS-123456', aro: 'ARO-789', statut: 'actif', createdAt: new Date() },
    { id: 'p2', matricule: 'MAT-002', nom: 'Rabe', prenom: 'Marie', dateNaissance: '1985-08-22', lieuNaissance: 'Fianarantsoa', adresse: '45 Rue Rabearivelo', telephone: '+261 33 00 333 44', email: 'mrabe@lhm.mg', situationFamiliale: 'Célibataire', personneUrgence: 'Rabe Luc - 033 00 444 55', dateEntree: '2018-03-01', poste: 'Responsable RH', service: 'Administration', superieur: 'MAT-001', typeContrat: 'CDI', salaire: 1800000, objectifsAnnuels: 'Optimiser la gestion du personnel', cnaps: 'CNAPS-234567', aro: 'ARO-890', statut: 'actif', createdAt: new Date() },
    { id: 'p3', matricule: 'MAT-003', nom: 'Rasoa', prenom: 'Hery', dateNaissance: '1990-12-03', lieuNaissance: 'Toamasina', adresse: '78 Av de l Indépendance', telephone: '+261 32 00 555 66', email: 'hrasoa@lhm.mg', situationFamiliale: 'Marié(e)', personneUrgence: 'Rasoa Bebe - 032 00 666 77', dateEntree: '2020-06-15', poste: 'Coordinateur Projets', service: 'Projets', superieur: 'MAT-001', typeContrat: 'CDD', salaire: 1500000, objectifsAnnuels: 'Coordonner 5 projets communautaires', cnaps: 'CNAPS-345678', aro: 'ARO-901', statut: 'actif', createdAt: new Date() },
    { id: 'p4', matricule: 'MAT-004', nom: 'Andriamaro', prenom: 'Soa', dateNaissance: '1988-03-17', lieuNaissance: 'Mahajanga', adresse: '12 Rue du Marché', telephone: '+261 38 00 777 88', email: 'sandriamaro@lhm.mg', situationFamiliale: 'Marié(e)', personneUrgence: 'Andriamaro Paul - 038 00 888 99', dateEntree: '2019-09-01', poste: 'Responsable Stock', service: 'Logistique', superieur: 'MAT-001', typeContrat: 'CDI', salaire: 1600000, objectifsAnnuels: 'Maintenir un stock optimal', cnaps: 'CNAPS-456789', aro: 'ARO-012', statut: 'actif', createdAt: new Date() },
    { id: 'p5', matricule: 'MAT-005', nom: 'Razafy', prenom: 'Lalao', dateNaissance: '1995-07-08', lieuNaissance: 'Antsiranana', adresse: '55 Rue Pasteur', telephone: '+261 34 00 999 10', email: 'lrazafy@lhm.mg', situationFamiliale: 'Célibataire', personneUrgence: 'Razafy Jo - 034 00 110 21', dateEntree: '2022-01-10', poste: 'Technicien Radio', service: 'Communication', superieur: 'MAT-001', typeContrat: 'CDD', salaire: 1200000, objectifsAnnuels: 'Assurer la diffusion radio quotidienne', cnaps: 'CNAPS-567890', aro: 'ARO-123', statut: 'actif', createdAt: new Date() },
  ];

  db.absences = [
    { id: 'ab1', personnelId: 'p2', type: 'Congés annuels', dateDebut: '2024-12-20', dateFin: '2024-12-31', motif: "Vacances de fin d'année", statut: 'approuve', validePar: 'p1', createdAt: new Date('2024-12-01') },
    { id: 'ab2', personnelId: 'p3', type: 'Congés maladie', dateDebut: '2025-01-15', dateFin: '2025-01-17', motif: 'Fièvre', statut: 'approuve', validePar: 'p1', createdAt: new Date('2025-01-14') },
    { id: 'ab3', personnelId: 'p5', type: 'Permission spéciale', dateDebut: '2025-02-10', dateFin: '2025-02-10', motif: 'Cérémonie familiale', statut: 'en_attente', validePar: null, createdAt: new Date('2025-02-05') },
  ];

  db.volontaires = [
    { id: 'v1', nom: 'Rakotondrabe', prenom: 'Nirina', telephone: '+261 34 11 222 33', email: 'nirina@gmail.com', motivation: 'Servir Dieu à travers ce ministère', competences: ['Volontaire BCC', 'Opérateur de saisie'], disponibilites: { jours: ['Lundi', 'Mercredi', 'Vendredi'], periodes: ['Matin'] }, type: 'regulier', statut: 'actif', dateInscription: '2024-01-15', createdAt: new Date() },
    { id: 'v2', nom: 'Randriamihaja', prenom: 'Tiana', telephone: '+261 33 22 333 44', email: 'tiana@gmail.com', motivation: "Contribuer à l'évangélisation", competences: ['Correcteur BCC', 'Gestionnaire de stock'], disponibilites: { jours: ['Mardi', 'Jeudi'], periodes: ['Après-midi'] }, type: 'regulier', statut: 'actif', dateInscription: '2024-03-20', createdAt: new Date() },
    { id: 'v3', nom: 'Rakotovao', prenom: 'Harena', telephone: '+261 32 33 444 55', email: 'harena@gmail.com', motivation: 'Aider les projets communautaires', competences: ['Volontaire Technicien Radio'], disponibilites: { jours: ['Samedi'], periodes: ['Matin', 'Après-midi'] }, type: 'occasionnel', statut: 'actif', dateInscription: '2024-06-10', createdAt: new Date() },
    { id: 'v4', nom: 'Andriantsoa', prenom: 'Fanja', telephone: '+261 38 44 555 66', email: 'fanja@gmail.com', motivation: 'Service évangélique', competences: ['Volontaire BCC', 'Correcteur BCC'], disponibilites: { jours: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'], periodes: ['Matin', 'Après-midi'] }, type: 'regulier', statut: 'actif', dateInscription: '2023-11-01', createdAt: new Date() },
    { id: 'v5', nom: 'Rabeharisoa', prenom: 'Mamy', telephone: '+261 34 55 666 77', email: 'mamy@gmail.com', motivation: 'Soutenir le ministère radio', competences: ['Opérateur de saisie'], disponibilites: { jours: ['Mercredi', 'Samedi'], periodes: ['Soir'] }, type: 'occasionnel', statut: 'inactif', dateInscription: '2024-08-05', createdAt: new Date() },
  ];

  db.categories = [
    { id: 'cat-1', nom: 'Bureautique', sousCategories: ['Papeterie', 'Informatique', 'Mobilier'] },
    { id: 'cat-2', nom: 'Médical', sousCategories: ['Médicaments', 'Matériel médical'] },
    { id: 'cat-3', nom: 'Alimentaire', sousCategories: ['Épicerie', 'Boissons', 'Produits frais'] },
    { id: 'cat-4', nom: 'Audiovisuel', sousCategories: ['Équipements radio', 'Enregistrement', 'Diffusion'] },
  ];

  db.articles = [
    { id: 'a1', code: 'ART-001', designation: 'Rames de papier A4 (500 feuilles)', categorie: 'Bureautique', sousCategorie: 'Papeterie', unite: 'Rame', prixUnitaire: 8500, fournisseur: 'Papeterie Centrale', emplacement: 'Entrepôt A - Étagère 1', quantite: 45, stockMin: 10, stockSecurite: 20, stockOptimal: 50, createdAt: new Date() },
    { id: 'a2', code: 'ART-002', designation: 'Stylos bille bleus (boîte 12)', categorie: 'Bureautique', sousCategorie: 'Papeterie', unite: 'Boîte', prixUnitaire: 4200, fournisseur: 'Papeterie Centrale', emplacement: 'Entrepôt A - Étagère 1', quantite: 8, stockMin: 5, stockSecurite: 10, stockOptimal: 25, createdAt: new Date() },
    { id: 'a3', code: 'ART-003', designation: 'Microphone condensateur', categorie: 'Audiovisuel', sousCategorie: 'Équipements radio', unite: 'Pièce', prixUnitaire: 350000, fournisseur: 'Tech Mada', emplacement: 'Studio Radio', quantite: 3, stockMin: 1, stockSecurite: 2, stockOptimal: 5, createdAt: new Date() },
    { id: 'a4', code: 'ART-004', designation: 'Paracétamol 500mg (boîte 30 cp)', categorie: 'Médical', sousCategorie: 'Médicaments', unite: 'Boîte', prixUnitaire: 3500, fournisseur: 'Pharmacie Centrale', emplacement: 'Armoire médicale', quantite: 4, stockMin: 5, stockSecurite: 10, stockOptimal: 20, datePeremption: '2025-12-31', createdAt: new Date() },
    { id: 'a5', code: 'ART-005', designation: "Eau minérale 1.5L", categorie: 'Alimentaire', sousCategorie: 'Boissons', unite: 'Bouteille', prixUnitaire: 1500, fournisseur: 'Eau Vive', emplacement: 'Cuisine', quantite: 60, stockMin: 12, stockSecurite: 24, stockOptimal: 72, createdAt: new Date() },
    { id: 'a6', code: 'ART-006', designation: "Cartouche d'encre noire HP", categorie: 'Bureautique', sousCategorie: 'Informatique', unite: 'Pièce', prixUnitaire: 85000, fournisseur: 'Tech Mada', emplacement: 'Entrepôt A - Étagère 2', quantite: 2, stockMin: 2, stockSecurite: 3, stockOptimal: 6, createdAt: new Date() },
  ];

  db.mouvements = [
    { id: 'm1', articleId: 'a1', type: 'entree', quantite: 20, prixUnitaire: 8500, fournisseur: 'Papeterie Centrale', numeroBon: 'BL-2025-001', date: '2025-01-10', responsable: 'MAT-004', notes: 'Commande mensuelle', createdAt: new Date('2025-01-10') },
    { id: 'm2', articleId: 'a1', type: 'sortie', quantite: 5, destinataire: 'Service Administration', motif: 'Consommation', numeroBon: 'BS-2025-001', date: '2025-01-15', responsable: 'MAT-004', createdAt: new Date('2025-01-15') },
    { id: 'm3', articleId: 'a5', type: 'entree', quantite: 48, prixUnitaire: 1500, fournisseur: 'Eau Vive', numeroBon: 'BL-2025-002', date: '2025-02-01', responsable: 'MAT-004', createdAt: new Date('2025-02-01') },
  ];

  db.projets = [
    { id: 'pr1', nom: 'Évangélisation Analamanga 2025', description: "Campagne d'évangélisation dans la région Analamanga", responsable: 'MAT-003', dateDebut: '2025-01-01', dateFin: '2025-12-31', budget: 5000000, depenses: 1250000, statut: 'en_cours', avancement: 25, risques: [], createdAt: new Date() },
    { id: 'pr2', nom: 'Formation BCC - Session 1', description: 'Formation des correcteurs BCC pour la session de mars', responsable: 'MAT-003', dateDebut: '2025-03-01', dateFin: '2025-03-31', budget: 800000, depenses: 200000, statut: 'en_cours', avancement: 15, risques: ['Manque de formateurs'], createdAt: new Date() },
    { id: 'pr3', nom: 'Rénovation Studio Radio', description: 'Rénovation et équipement du studio radio FM', responsable: 'MAT-005', dateDebut: '2025-02-01', dateFin: '2025-04-30', budget: 3500000, depenses: 3200000, statut: 'en_retard', avancement: 70, risques: ['Budget dépassé', 'Délai technique'], createdAt: new Date() },
  ];

  db.auditLogs = [
    { id: 'log1', date: new Date(), userId: 'u1', userNom: 'Rakoto Jean', action: 'LOGIN', objet: 'Système', ancienneValeur: null, nouvelleValeur: 'Session ouverte', ip: '127.0.0.1' },
  ];
}

seed().then(() => console.log('✅ Base de données initialisée'));

module.exports = db;
