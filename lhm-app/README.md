# 🏛️ LHM Madagascar – Système de Gestion Intégrée
**Feon'ny Filazantsara**

Application web complète de gestion pour l'organisation LHM Madagascar.

---

## 🚀 Démarrage rapide

### Prérequis
- Node.js 18+ installé
- npm ou yarn

### 1. Backend
```bash
cd backend
npm install
npm run dev
# Serveur sur http://localhost:5000
```

### 2. Frontend
```bash
cd frontend
npm install
npm start
# Application sur http://localhost:3000
```

---

## 👤 Comptes de démonstration

| Rôle | Email | Mot de passe |
|------|-------|-------------|
| Administrateur | admin@lhm-madagascar.org | Admin@1234 |
| Direction | direction@lhm-madagascar.org | Direction@1234 |
| Assistant RH | rh@lhm-madagascar.org | RH@1234 |
| Responsable Stock | stock@lhm-madagascar.org | Stock@1234 |
| Responsable Volontaires | volontaires@lhm-madagascar.org | Vol@1234 |

---

## 📋 Modules disponibles

| Module | Fonctionnalités |
|--------|----------------|
| **📊 Tableau de bord** | KPIs, alertes, activité récente, graphiques |
| **👥 Personnel** | Fiches complètes (4 sections), création, modification |
| **📅 Absences & Congés** | Demandes, workflow validation, statistiques |
| **🤝 Volontaires** | Profils, workflow 6 étapes, compétences |
| **📦 Stock** | Catalogue, mouvements, alertes, historique |
| **🎯 Projets** | Suivi avancement, budget, statuts |
| **🔐 Utilisateurs** | Comptes, rôles, blocage (admin seulement) |

---

## 🏗️ Architecture

```
lhm-app/
├── backend/              # API REST Node.js/Express
│   ├── src/
│   │   ├── controllers/  # Logique métier
│   │   ├── middleware/   # Auth JWT
│   │   ├── routes/       # Définition des routes API
│   │   ├── database.js   # Base de données en mémoire
│   │   └── server.js     # Point d'entrée
│   └── package.json
│
└── frontend/             # React.js
    ├── src/
    │   ├── components/   # Composants réutilisables
    │   ├── contexts/     # AuthContext
    │   ├── pages/        # Pages de l'application
    │   ├── utils/        # API, helpers
    │   └── App.js
    └── package.json
```

---

## 🔒 Sécurité implémentée
- Authentification JWT
- Hachage bcrypt des mots de passe
- Blocage après 3 tentatives échouées
- Matrice de rôles et permissions
- Journal d'audit sur toutes les actions
- Rate limiting sur l'API
- Headers de sécurité (Helmet)

---

## 🛣️ API Endpoints

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | /api/auth/login | Connexion |
| GET | /api/auth/me | Profil connecté |
| GET | /api/dashboard | Données tableau de bord |
| GET/POST | /api/personnel | Liste/Création personnel |
| GET/PUT | /api/personnel/:id | Détail/Modification |
| GET/POST | /api/absences | Absences |
| GET/POST | /api/stock | Stock |
| GET/POST | /api/stock-movements | Mouvements de stock |
| GET/POST | /api/volunteers | Volontaires |
| PUT | /api/volunteers/:id/workflow | Avancer workflow |
| GET/POST | /api/projects | Projets |
| GET/POST | /api/users | Utilisateurs (admin) |

---

## 🔮 Évolution recommandée

1. **Base de données PostgreSQL** : Remplacer le store en mémoire par PostgreSQL + Prisma ORM
2. **Upload de fichiers** : AWS S3 ou Cloudinary pour les documents et photos
3. **Export PDF/Excel** : Intégrer jsPDF et ExcelJS côté serveur
4. **Notifications email** : Nodemailer + SMTP pour les workflows
5. **Application mobile** : React Native partagé avec ce frontend
