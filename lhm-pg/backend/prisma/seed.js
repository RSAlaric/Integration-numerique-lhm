// ============================================================
// SEED - Données initiales LHM Madagascar
// Exécuter : node prisma/seed.js
// ============================================================

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Démarrage du seed...\n');

  // Nettoyage des tables dans l'ordre (contraintes FK)
  await prisma.auditLog.deleteMany();
  await prisma.mouvementStock.deleteMany();
  await prisma.affectation.deleteMany();
  await prisma.absence.deleteMany();
  await prisma.article.deleteMany();
  await prisma.volontaire.deleteMany();
  await prisma.projet.deleteMany();
  await prisma.personnel.deleteMany();
  await prisma.user.deleteMany();
  console.log('🗑️  Tables nettoyées');

  // ============================================================
  // UTILISATEURS
  // ============================================================
  const hash = async (pwd) => bcrypt.hash(pwd, 10);

  const users = await Promise.all([
    prisma.user.create({ data: {
      id: 'usr-001', matricule: 'ADM-001',
      nom: 'Administrateur', prenom: 'Système',
      email: 'admin@lhm-madagascar.org',
      password: await hash('Admin@1234'),
      role: 'super_admin', service: 'Direction', poste: 'Administrateur Système'
    }}),
    prisma.user.create({ data: {
      id: 'usr-002', matricule: 'DIR-001',
      nom: 'Rakoto', prenom: 'Jean',
      email: 'direction@lhm-madagascar.org',
      password: await hash('Direction@1234'),
      role: 'direction', service: 'Direction', poste: 'Directeur Général'
    }}),
    prisma.user.create({ data: {
      id: 'usr-003', matricule: 'RH-001',
      nom: 'Rabe', prenom: 'Marie',
      email: 'rh@lhm-madagascar.org',
      password: await hash('RH@1234'),
      role: 'assistant_admin', service: 'Administration', poste: 'Assistant Administration'
    }}),
    prisma.user.create({ data: {
      id: 'usr-004', matricule: 'STK-001',
      nom: 'Randria', prenom: 'Paul',
      email: 'stock@lhm-madagascar.org',
      password: await hash('Stock@1234'),
      role: 'responsable_stock', service: 'Logistique', poste: 'Responsable Stock'
    }}),
    prisma.user.create({ data: {
      id: 'usr-005', matricule: 'VOL-001',
      nom: 'Rasolofo', prenom: 'Hery',
      email: 'volontaires@lhm-madagascar.org',
      password: await hash('Vol@1234'),
      role: 'responsable_volontaires', service: 'Mobilisation', poste: 'Responsable Volontaires'
    }}),
  ]);
  console.log(`✅ ${users.length} utilisateurs créés`);

  // ============================================================
  // PERSONNEL
  // ============================================================
  const personnelData = await Promise.all([
    prisma.personnel.create({ data: {
      id: 'pers-001', user_id: 'usr-002', matricule: 'DIR-001',
      nom: 'Rakoto', prenom: 'Jean',
      date_naissance: new Date('1975-03-15'), lieu_naissance: 'Antananarivo',
      adresse: 'Lot 45 Ambohimanarina, Antananarivo',
      telephone: '+261 34 00 111 22', email: 'direction@lhm-madagascar.org',
      situation_familiale: 'Marié(e)',
      contact_urgence_nom: 'Rakoto Sahondra', contact_urgence_tel: '+261 34 00 333 44',
      poste: 'Directeur Général', service: 'Direction', type_contrat: 'CDI',
      date_entree: new Date('2010-01-01'),
      competences: ['Leadership', 'Gestion de projet', 'Communication'],
      langues: [{ langue: 'Malagasy', niveau: 'Natif' }, { langue: 'Français', niveau: 'Courant' }],
      formations: ['MBA Management', 'Formation Leadership Chrétien'],
      cnaps: 'CNAPS-001234', aro: 'ARO-5678',
      statut: 'actif'
    }}),
    prisma.personnel.create({ data: {
      id: 'pers-002', user_id: 'usr-003', matricule: 'RH-001',
      nom: 'Rabe', prenom: 'Marie', nom_jeune_fille: 'Randria',
      date_naissance: new Date('1985-07-22'), lieu_naissance: 'Fianarantsoa',
      adresse: 'Lot 12 Tsiadana, Antananarivo',
      telephone: '+261 33 00 555 66', email: 'rh@lhm-madagascar.org',
      situation_familiale: 'Marié(e)',
      contact_urgence_nom: 'Rabe Pierre', contact_urgence_tel: '+261 33 00 777 88',
      poste: 'Assistant Administration', service: 'Administration',
      superieur_id: 'pers-001', type_contrat: 'CDI',
      date_entree: new Date('2015-06-01'),
      competences: ['Gestion RH', 'Comptabilité', 'MS Office'],
      langues: [{ langue: 'Malagasy', niveau: 'Natif' }, { langue: 'Français', niveau: 'Courant' }],
      formations: ['BTS Secrétariat', 'Formation RH'],
      cnaps: 'CNAPS-002345', aro: 'ARO-6789',
      statut: 'actif'
    }}),
    prisma.personnel.create({ data: {
      id: 'pers-003', user_id: 'usr-004', matricule: 'STK-001',
      nom: 'Randria', prenom: 'Paul',
      date_naissance: new Date('1990-11-08'), lieu_naissance: 'Mahajanga',
      adresse: 'Lot 78 Isotry, Antananarivo',
      telephone: '+261 32 00 999 00', email: 'stock@lhm-madagascar.org',
      situation_familiale: 'Célibataire',
      contact_urgence_nom: 'Randria Josoa', contact_urgence_tel: '+261 32 00 111 00',
      poste: 'Responsable Stock', service: 'Logistique',
      superieur_id: 'pers-001', type_contrat: 'CDI',
      date_entree: new Date('2018-03-15'),
      competences: ['Gestion de stock', 'Logistique', 'Excel'],
      langues: [{ langue: 'Malagasy', niveau: 'Natif' }, { langue: 'Français', niveau: 'Intermédiaire' }],
      formations: ['BTS Logistique'],
      cnaps: 'CNAPS-003456', aro: 'ARO-7890',
      statut: 'actif'
    }}),
  ]);
  console.log(`✅ ${personnelData.length} membres du personnel créés`);

  // ============================================================
  // ABSENCES
  // ============================================================
  await Promise.all([
    prisma.absence.create({ data: {
      personnel_id: 'pers-002', type: 'Conge_annuel',
      date_debut: new Date('2024-12-23'), date_fin: new Date('2024-12-31'),
      motif: "Congés de fin d'année", statut: 'approuve',
      demandeur_id: 'usr-003', valideur_id: 'usr-002'
    }}),
    prisma.absence.create({ data: {
      personnel_id: 'pers-003', type: 'Conge_maladie',
      date_debut: new Date('2024-12-18'), date_fin: new Date('2024-12-20'),
      motif: 'Grippe avec certificat médical', statut: 'en_attente',
      demandeur_id: 'usr-004'
    }}),
  ]);
  console.log('✅ 2 absences créées');

  // ============================================================
  // STOCK
  // ============================================================
  const articles = await Promise.all([
    prisma.article.create({ data: {
      id: 'art-001', code: 'ART-001', designation: 'Rames de papier A4',
      categorie: 'Bureautique', sous_categorie: 'Papeterie',
      unite: 'Rame', prix_unitaire: 8500, fournisseur: 'Papeterie Centrale',
      emplacement: 'Dépôt A - Étagère 1', quantite: 45,
      seuil_min: 10, seuil_securite: 20, seuil_optimal: 50
    }}),
    prisma.article.create({ data: {
      id: 'art-002', code: 'ART-002', designation: 'Stylos bille bleus',
      categorie: 'Bureautique', sous_categorie: 'Écriture',
      unite: 'Pièce', prix_unitaire: 1200, fournisseur: 'Papeterie Centrale',
      emplacement: 'Dépôt A - Étagère 2', quantite: 8,
      seuil_min: 20, seuil_securite: 35, seuil_optimal: 60
    }}),
    prisma.article.create({ data: {
      id: 'art-003', code: 'ART-003', designation: 'Masques chirurgicaux',
      categorie: 'Médical', sous_categorie: 'Protection',
      unite: 'Boîte (50)', prix_unitaire: 15000, fournisseur: 'Pharmamed',
      emplacement: 'Dépôt B - Étagère 1', quantite: 3,
      seuil_min: 5, seuil_securite: 10, seuil_optimal: 20,
      date_peremption: new Date('2025-12-31')
    }}),
    prisma.article.create({ data: {
      id: 'art-004', code: 'ART-004', designation: 'Cartouches encre imprimante HP',
      categorie: 'Bureautique', sous_categorie: 'Informatique',
      unite: 'Pièce', prix_unitaire: 45000, fournisseur: 'Electro-Mada',
      emplacement: 'Dépôt A - Étagère 3', quantite: 12,
      seuil_min: 3, seuil_securite: 6, seuil_optimal: 15
    }}),
    prisma.article.create({ data: {
      id: 'art-005', code: 'ART-005', designation: 'Riz (sac 25kg)',
      categorie: 'Alimentaire', sous_categorie: 'Céréales',
      unite: 'Sac', prix_unitaire: 85000, fournisseur: 'Épicerie SICA',
      emplacement: 'Dépôt C - Entrepôt', quantite: 20,
      seuil_min: 5, seuil_securite: 10, seuil_optimal: 25,
      date_peremption: new Date('2026-06-30')
    }}),
  ]);
  console.log(`✅ ${articles.length} articles de stock créés`);

  // Mouvements de stock initiaux
  await prisma.mouvementStock.create({ data: {
    article_id: 'art-001', type: 'entree', quantite: 50,
    quantite_avant: 0, quantite_apres: 50,
    prix_unitaire: 8500, fournisseur: 'Papeterie Centrale',
    numero_facture: 'FAC-2024-001', motif: 'Réapprovisionnement initial',
    valideur_id: 'usr-004', date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  }});
  await prisma.mouvementStock.create({ data: {
    article_id: 'art-001', type: 'sortie', quantite: 5,
    quantite_avant: 50, quantite_apres: 45,
    destinataire: 'Service Administration', motif: 'Consommation bureau',
    valideur_id: 'usr-004', date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
  }});
  console.log('✅ 2 mouvements de stock créés');

  // ============================================================
  // VOLONTAIRES
  // ============================================================
  await Promise.all([
    prisma.volontaire.create({ data: {
      nom: 'Rakotobe', prenom: 'Andry',
      email: 'andry.r@email.com', telephone: '+261 34 12 345 67',
      date_naissance: new Date('1998-05-14'),
      competences: ['Opérateur de saisie', 'Volontaire BCC'],
      disponibilites: { jours: ['Lundi', 'Mercredi', 'Vendredi'], periodes: ['matin', 'après-midi'], type: 'régulier' },
      motivation: "Servir Dieu à travers le travail communautaire",
      statut: 'actif', statut_workflow: 'affecte'
    }}),
    prisma.volontaire.create({ data: {
      nom: 'Rafaralahy', prenom: 'Soa',
      email: 'soa.r@email.com', telephone: '+261 33 98 765 43',
      date_naissance: new Date('2000-02-28'),
      competences: ['Correcteur BCC', 'Volontaire BCC'],
      disponibilites: { jours: ['Mardi', 'Jeudi'], periodes: ['après-midi'], type: 'régulier' },
      motivation: 'Partager la Bonne Nouvelle',
      statut: 'actif', statut_workflow: 'valide'
    }}),
    prisma.volontaire.create({ data: {
      nom: 'Andriantsoa', prenom: 'Fidy',
      email: 'fidy.a@email.com', telephone: '+261 32 55 444 33',
      date_naissance: new Date('1995-09-01'),
      competences: ['Volontaire Technicien Radio', 'Gestionnaire de stock'],
      disponibilites: { jours: ['Samedi', 'Dimanche'], periodes: ['matin'], type: 'occasionnel' },
      motivation: "Soutenir la radio évangélique",
      statut: 'actif', statut_workflow: 'enregistre'
    }}),
  ]);
  console.log('✅ 3 volontaires créés');

  // ============================================================
  // PROJETS
  // ============================================================
  await Promise.all([
    prisma.projet.create({ data: {
      nom: "Programme BCC 2024",
      description: 'Diffusion du cours biblique par correspondance',
      responsable_id: 'usr-002',
      date_debut: new Date('2024-01-01'), date_fin_prevue: new Date('2024-12-31'),
      budget: 5000000, budget_consomme: 3200000,
      statut: 'en_cours', avancement: 65,
      risques: ["Délai de livraison des cours", "Disponibilité des volontaires"]
    }}),
    prisma.projet.create({ data: {
      nom: "Radio Feon'ny Filazantsara - Saison 2024",
      description: 'Émissions radio évangéliques hebdomadaires',
      responsable_id: 'usr-005',
      date_debut: new Date('2024-03-01'), date_fin_prevue: new Date('2024-12-31'),
      budget: 8000000, budget_consomme: 5600000,
      statut: 'en_cours', avancement: 70,
      risques: ['Pannes techniques', 'Budget carburant']
    }}),
    prisma.projet.create({ data: {
      nom: 'Formation Pastorale Régionale',
      description: "Formation des responsables d'église en région",
      responsable_id: 'usr-002',
      date_debut: new Date('2024-06-01'), date_fin_prevue: new Date('2024-08-31'),
      budget: 3000000, budget_consomme: 3000000,
      statut: 'termine', avancement: 100, risques: []
    }}),
  ]);
  console.log('✅ 3 projets créés');

  // Audit log initial
  await prisma.auditLog.create({ data: {
    utilisateur_id: 'usr-001',
    action: 'INITIALISATION_BASE',
    objet: 'Système',
    nouvelle_valeur: { message: 'Base de données initialisée avec les données de démonstration' }
  }});

  console.log('\n🎉 Seed terminé avec succès !');
  console.log('\n📋 Comptes créés :');
  console.log('   admin@lhm-madagascar.org        / Admin@1234');
  console.log('   direction@lhm-madagascar.org    / Direction@1234');
  console.log('   rh@lhm-madagascar.org           / RH@1234');
  console.log('   stock@lhm-madagascar.org        / Stock@1234');
  console.log('   volontaires@lhm-madagascar.org  / Vol@1234');
}

main()
  .catch(e => { console.error('❌ Erreur seed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
