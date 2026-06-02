# Task Manager Collaborative - Application Desktop Complète

Une application de gestion de projets et tâches collaborative avec **Electron**, **React 19**, **Express.js**, **SQLite** et **Knex.js**.

## 📋 Fonctionnalités

✅ **Authentification JWT** - Inscription, connexion, déconnexion avec tokens httpOnly cookies  
✅ **Gestion des projets** - CRUD complet  
✅ **Gestion des tâches** - Avec statuts (todo/in_progress/done), priorités, assignations  
✅ **Dashboard** - Stats en temps réel sur les tâches par statut  
✅ **Profil utilisateur** - Mise à jour du nom et mot de passe  
✅ **Sécurité** - Helmet, rate limiting, bcrypt, validation Zod  
✅ **Tests** - Unit, API (Supertest), composants (React Testing Library)  

## 🛠️ Stack Technique

### Frontend
- **React 19** avec Vite
- **React Router v6** pour la navigation
- **React Query (TanStack Query)** pour la gestion du cache API
- **React Hook Form + Zod** pour les formulaires avec validation
- **Tailwind CSS** pour les styles
- **Lucide Icons** pour les icônes

### Backend
- **Express.js 4** avec architecture MVC
- **SQLite 3 + Knex.js** avec migrations et seeds
- **Helmet.js** pour la sécurité HTTP
- **express-rate-limit** pour limiter les requêtes
- **JWT** pour l'authentification (15min access + 7j refresh)
- **bcryptjs** pour le hashage des mots de passe

### Desktop
- **Electron 28** avec contextBridge (sandbox mode)
- **electron-builder** pour le packaging

### Tests
- **Vitest** pour les tests unit
- **Supertest** pour les tests API
- **React Testing Library** pour les composants

## 📁 Structure du Projet

\`\`\`
.
├── api/
│   ├── server.js              # Serveur Express principal
│   ├── middleware/            # Middleware (auth, validation, etc.)
│   ├── routes/                # Routes API (/api/v1/*)
│   ├── controllers/           # Contrôleurs
│   ├── services/              # Logique métier
│   └── db/
│       └── index.js           # Connexion Knex
├── src/
│   ├── main/
│   │   ├── main.js            # Processus principal Electron
│   │   └── preload.js         # Bridge IPC securisé
│   ├── renderer/
│   │   ├── app.tsx            # App React principale
│   │   ├── index.html
│   │   ├── pages/             # Pages (Login, Dashboard, etc.)
│   │   ├── components/        # Composants réutilisables
│   │   ├── contexts/          # Context API (AuthContext)
│   │   ├── hooks/             # Custom hooks (useAuth, useProjects, etc.)
│   │   ├── types/             # Types TypeScript
│   │   └── styles/            # CSS global
├── db/
│   ├── migrations/            # Migrations Knex
│   ├── seeds/                 # Seeds de données
│   └── knexfile.js
├── __tests__/
│   ├── api/                   # Tests API (Supertest)
│   ├── components/            # Tests React
│   └── unit/                  # Tests unitaires
├── .env                       # Variables d'environnement (local)
├── .env.example               # Template
├── package.json
├── vite.config.ts             # Config Vite
├── vitest.config.js           # Config Vitest
└── README.md
\`\`\`

## 🚀 Installation

### Prérequis
- **Node.js >= 18** (lts/hydrogen)
- **npm 9+** ou **yarn**

### Étapes

```bash
# 1. Cloner ou naviguer au répertoire du projet
cd "smart-city final"

# 2. Installer les dépendances
npm install --legacy-peer-deps

# 3. Initialiser la base de données
npm run db:reset

# 4. Vérifier que tout est OK
npm run db:migrate
```

## 📝 Configuration Environnement

Créez un fichier `.env` à la racine :

```env
NODE_ENV=development
PORT=3000
DB_PATH=./data/tasks.db

JWT_SECRET=dev-super-secret-jwt-key-change-in-production
JWT_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

BCRYPT_ROUNDS=12
CORS_ORIGIN=http://localhost:5173

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOGIN_RATE_LIMIT_MAX=5

ELECTRON_DEV=true
```

## 🎯 Commandes NPM

### Développement
```bash
# Démarrer l'app complète (backend + frontend + Electron)
npm run dev

# Lancer uniquement le backend
npm run dev:backend

# Lancer uniquement la UI frontend (Vite)
npm run dev:frontend

# Lancer uniquement Electron
npm run dev:electron
```

### Base de Données
```bash
# Créer les tables (migrations)
npm run db:migrate

# Annuler la dernière migration
npm run db:rollback

# Charger les seeds de démonstration
npm run db:seed

# Reset complet (rollback + migrate + seed)
npm run db:reset
```

### Tests
```bash
# Lancer tous les tests
npm test

# Tests en mode watch
npm run test:watch

# Rapport de couverture
npm run test:coverage
```

### Build
```bash
# Build complète (frontend + Electron app)
npm run build

# Seulement le frontend (Vite)
npm run build:frontend

# Package Electron (Windows, macOS, Linux)
npm run build:electron
```

## 🧪 Tests

### Couverture Minimale : 80%
- ✅ Controllers/Routes : tests d'intégration API
- ✅ Services : tests de logique métier
- ✅ Composants React : React Testing Library

### Lancer les tests
```bash
npm test               # Tous les tests une fois
npm run test:watch    # Mode watch avec UI Vitest
npm run test:coverage # Rapport HTML
```

## 🔐 Sécurité

### ✅ Authentification JWT
- Access token (15 min) + Refresh token (7 jours)
- Stockés en httpOnly cookies (sauf accessible par JavaScript)
- CSRF protection via SameSite=strict

### ✅ Validation
- Zod pour tous les inputs (côté serveur et client)
- Messages d'erreur en français
- Rate limiting : 100 req/15min globale, 5 login/15min

### ✅ Hashage des Mots de passe
- bcryptjs avec 12 rounds
- Jamais stockés en clair

### ✅ Sécurité HTTP
- Helmet.js avec CSP adapté pour Electron
- CORS restrictif
- No inline scripts

### ✅ Isolation des Données
- Les utilisateurs ne voient que leurs propres projets/tâches
- Vérifications en BDD pour l'autorisation

## 📱 Flux Utilisateur Type

1. **Inscription** : `/auth/register` → crée un nouvel utilisateur
2. **Connexion** : `/auth/login` → reçoit access + refresh tokens
3. **Dashboard** : Liste des projets et stats
4. **Créer un projet** : Form avec validation Zod
5. **Ajouter une tâche** : Sélectionner un projet, remplir formulaire
6. **Changer statut** : Drag-drop ou boutons (todo → in_progress → done)
7. **Profil** : Modifier nom ou mot de passe
8. **Déconnexion** : Efface les tokens, redirige vers `/login`

## 🗄️ Base de Données

### Tables

#### `users`
```sql
id (pk) | email (unique) | name | password_hash | created_at | updated_at
```

#### `projects`
```sql
id (pk) | name | description | owner_id (fk→users) | status | created_at | updated_at
```

#### `tasks`
```sql
id (pk) | title | description | project_id (fk→projects) | assignee_id (fk→users)
| status (enum) | priority (enum) | due_date | created_at | updated_at
```

#### `refresh_tokens`
```sql
id (pk) | user_id (fk→users) | token | expires_at | created_at
```

### Seeds de Démonstration

3 utilisateurs :
- alice@example.com / Password123!
- bob@example.com / Password123!
- charlie@example.com / Password123!

5 projets + 15 tâches avec statuts et assignations variés

## 🐛 Dépannage

### Problème : "Port 3000 déjà utilisé"
```bash
# Vérifier quel processus utilise le port
netstat -anob | findstr :3000  # Windows
lsof -i :3000                   # macOS/Linux

# Utiliser un autre port
PORT=3001 npm run dev:backend
```

### Problème : "DB file locked"
```bash
# Fermer tous les processus Node
taskkill /F /IM node.exe    # Windows
killall node                 # macOS/Linux

# Réinitialiser la BD
npm run db:reset
```

### Problème : "ERR_MODULE_NOT_FOUND"
```bash
# Réinstaller avec les flags corrects
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

## 📚 Documentation API

### Authentification

```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "Password123!"
}
→ 201 { id, email, name }
```

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Password123!"
}
→ 200 { user: { id, email, name }, accessToken, refreshToken }
```

```http
GET /api/v1/auth/me
Cookie: accessToken=...
→ 200 { id, email, name, created_at, updated_at }
```

### Projets

```http
GET /api/v1/projects
→ 200 [{ id, name, description, owner_id, status, ... }]

POST /api/v1/projects
{ "name": "...", "description": "..." }
→ 201 { id, name, ... }

PUT /api/v1/projects/:id
{ "name": "...", "status": "archived" }
→ 200 { ... }

DELETE /api/v1/projects/:id
→ 200 { message: "Projet supprimé" }
```

### Tâches

```http
GET /api/v1/tasks?project_id=1&status=todo
→ 200 [{ id, title, status, priority, assignee_id, ... }]

POST /api/v1/tasks
{ "title": "...", "project_id": 1, "status": "todo", "priority": "high" }
→ 201 { id, ... }

PUT /api/v1/tasks/:id
{ "status": "in_progress", "assignee_id": 2 }
→ 200 { ... }

DELETE /api/v1/tasks/:id
→ 200 { message: "Tâche supprimée" }
```

## 🤝 Contribution

Ce projet est un exemple complet d'architecture fullstack moderne.  
Pour améliorations : fork → branch → pull request.

## 📄 Licence

MIT

## 👨‍💻 Support

Pour toute question ou bug report :
1. Vérifier les logs : `npm run dev 2>&1 | tee app.log`
2. Lancer les tests : `npm test`
3. Vérifier la BD : `npm run db:migrate`

---

**Bon développement! 🚀**
