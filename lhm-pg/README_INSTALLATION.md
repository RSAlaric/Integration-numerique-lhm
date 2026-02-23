# 🗄️ LHM Madagascar – Installation avec PostgreSQL
**Guide complet Windows — Base de données persistante**

---

## 📋 ÉTAPE 1 — Installer PostgreSQL

### 1.1 Télécharger
- Allez sur : **https://www.postgresql.org/download/windows/**
- Cliquez sur **"Download the installer"**
- Téléchargez la version **16.x** (la plus récente)

### 1.2 Installer
Lancez l'installateur et suivez ces étapes :

| Écran | Action |
|-------|--------|
| Installation Directory | Laissez par défaut : `C:\Program Files\PostgreSQL\16` |
| Select Components | Cochez tout (PostgreSQL Server, pgAdmin 4, Command Line Tools) |
| Data Directory | Laissez par défaut |
| **Password** | ⚠️ **NOTEZ CE MOT DE PASSE** — par exemple : `lhm2024` |
| Port | Laissez **5432** |
| Locale | Laissez par défaut |

Cliquez **Next** jusqu'à la fin. Décochez "Launch Stack Builder" à la fin.

### 1.3 Vérifier l'installation
Ouvrez CMD et tapez :
```
psql --version
```
Vous devriez voir : `psql (PostgreSQL) 16.x`

---

## 🗃️ ÉTAPE 2 — Créer la base de données

### Option A — Via pgAdmin (interface graphique) ✅ Recommandé

1. Ouvrez **pgAdmin 4** (dans le menu Démarrer)
2. Entrez votre mot de passe PostgreSQL
3. Dans le panneau gauche : clic droit sur **Databases** → **Create** → **Database...**
4. Dans le champ **Database** : tapez `lhm_madagascar`
5. Cliquez **Save**

### Option B — Via ligne de commande

Ouvrez CMD et tapez :
```
psql -U postgres -c "CREATE DATABASE lhm_madagascar;"
```
Entrez votre mot de passe PostgreSQL quand demandé.

---

## 📂 ÉTAPE 3 — Extraire et configurer le projet

### 3.1 Extraire le ZIP
1. Téléchargez **LHM_Madagascar_PostgreSQL.zip**
2. Extrayez dans `C:\Projets\lhm-pg\`

Vous devriez avoir :
```
C:\Projets\lhm-pg\
    ├── backend\
    │   ├── prisma\
    │   │   ├── schema.prisma
    │   │   └── seed.js
    │   ├── src\
    │   ├── .env.example
    │   └── package.json
    └── frontend\
        ├── src\
        └── package.json
```

### 3.2 Créer le fichier .env
1. Allez dans le dossier `C:\Projets\lhm-pg\backend\`
2. Copiez le fichier `.env.example` et renommez la copie en `.env`
3. Ouvrez `.env` avec le Bloc-notes
4. Modifiez la ligne `DATABASE_URL` avec votre mot de passe :

```
DATABASE_URL="postgresql://postgres:VOTRE_MOT_DE_PASSE@localhost:5432/lhm_madagascar"
```

**Exemple** si votre mot de passe est `lhm2024` :
```
DATABASE_URL="postgresql://postgres:lhm2024@localhost:5432/lhm_madagascar"
```

Sauvegardez le fichier.

---

## ⚙️ ÉTAPE 4 — Installer et configurer le backend

Ouvrez CMD et exécutez ces commandes **une par une** :

```
cd C:\Projets\lhm-pg\backend
```

```
npm install
```
> ⏳ Attend 1-2 minutes

```
npx prisma generate
```
> Génère le client Prisma (vous verrez "Generated Prisma Client")

```
npx prisma db push
```
> Crée toutes les tables dans PostgreSQL (vous verrez "All migrations have been applied")

```
node prisma/seed.js
```
> Insère les données de démonstration. Vous devriez voir :
> ```
> ✅ 5 utilisateurs créés
> ✅ 3 membres du personnel créés
> ✅ 2 absences créées
> ✅ 5 articles de stock créés
> ✅ 3 volontaires créés
> ✅ 3 projets créés
> 🎉 Seed terminé avec succès !
> ```

---

## 🚀 ÉTAPE 5 — Démarrer l'application

### Terminal 1 — Backend
```
cd C:\Projets\lhm-pg\backend
npm start
```

✅ Vous verrez :
```
✅ PostgreSQL connecté
🚀 LHM Madagascar API → http://localhost:5000
```

### Terminal 2 — Frontend
Ouvrez un **nouveau** CMD :
```
cd C:\Projets\lhm-pg\frontend
npm install
npm start
```

✅ Votre navigateur s'ouvrira sur **http://localhost:3000**

---

## 🔑 ÉTAPE 6 — Se connecter

| Rôle | Email | Mot de passe |
|------|-------|-------------|
| Administrateur | admin@lhm-madagascar.org | Admin@1234 |
| Direction | direction@lhm-madagascar.org | Direction@1234 |
| Assistant RH | rh@lhm-madagascar.org | RH@1234 |
| Responsable Stock | stock@lhm-madagascar.org | Stock@1234 |
| Volontaires | volontaires@lhm-madagascar.org | Vol@1234 |

---

## 💡 Vérifier la base de données avec pgAdmin

1. Ouvrez **pgAdmin 4**
2. Naviguez : `Servers → PostgreSQL 16 → Databases → lhm_madagascar → Schemas → public → Tables`
3. Vous verrez toutes les tables créées : `users`, `personnel`, `articles`, `volontaires`, `projets`, etc.
4. Clic droit sur une table → **View/Edit Data** → **All Rows** pour voir les données

---

## 🔄 Commandes utiles

| Commande | Description |
|----------|-------------|
| `npm start` | Démarrer le serveur |
| `npx prisma studio` | Interface graphique pour la BDD (http://localhost:5555) |
| `node prisma/seed.js` | Réinsérer les données de démonstration |
| `npx prisma db push` | Appliquer les changements du schéma |
| `npx prisma migrate reset --force && node prisma/seed.js` | ⚠️ Réinitialiser complètement la BDD |

---

## ⚠️ Résolution des problèmes

**"Can't reach database server"**
→ PostgreSQL n'est pas démarré. Allez dans les Services Windows (Win+R → `services.msc`) et démarrez `postgresql-x64-16`.

**"password authentication failed"**
→ Votre mot de passe dans `.env` est incorrect. Vérifiez la ligne `DATABASE_URL`.

**"database lhm_madagascar does not exist"**
→ La base de données n'a pas été créée. Relancez l'Étape 2.

**"npx prisma n'est pas reconnu"**
→ Node.js n'est pas bien installé, ou les dépendances ne sont pas installées. Relancez `npm install`.

**Port 5432 déjà utilisé**
→ Une autre instance de PostgreSQL tourne. Vérifiez les services ou changez le port dans `.env` et dans pgAdmin.
