# 🚚 ColiSpace - Application de Transport de Colis

Application React Native/Expo pour connecter expéditeurs et transporteurs de colis avec espaces de collaboration intégrés.

## 📋 Prérequis

- Node.js (version 16+)
- npm ou yarn
- Expo CLI
- Compte Supabase

## 🛠 Installation & Configuration

### 1. Installation des Dépendances
```bash
npm install
# expo-notifications est déjà inclus
```

### 2. Configuration Supabase
- Créer un nouveau projet sur [Supabase](https://supabase.com)
- Copier l'URL et la clé anon dans `lib/supabase.ts`
- Créer un fichier `.env.local` :
  ```
  EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
  EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
  ```

### 3. ⚠️ CRITIQUE : Configuration Base de Données
**IMPORTANT :** Exécuter le script `database_schema.sql` dans l'éditeur SQL de Supabase **dans l'ordre exact** :

1. Tables principales (`coli_spaces`, `timeline_steps`, `messages`)
2. Politiques RLS pour la sécurité
3. Triggers et fonctions automatiques
4. Indexes de performance
5. Abonnements temps réel

```bash
# Le script se trouve dans le fichier database_schema.sql
# À exécuter dans Supabase > SQL Editor
```

## 📱 Fonctionnalités Implémentées ✅

### Architecture Complète
- ✅ **Navigation multi-écrans** avec React Navigation
- ✅ **Authentification sécurisée** avec Supabase Auth
- ✅ **Base de données RLS** (Row Level Security)
- ✅ **Temps réel** avec Supabase Realtime
- ✅ **Notifications push** avec Expo Notifications

### Flow Utilisateur Complet
1. ✅ **Création d'annonces** (GP ou expéditeur)
2. ✅ **Découverte et réponse** aux annonces
3. ✅ **Espaces Coli privés** avec chat intégré
4. ✅ **Timeline collaborative** avec validations par rôle
5. ✅ **Notifications automatiques** pour tous les événements

### Sécurité & Permissions
- ✅ **RLS activé** sur toutes les tables
- ✅ **Validation des rôles** pour chaque action
- ✅ **Accès limité** aux données des espaces Coli

## 📱 Notifications Push - Configuration

### 🚨 **PROBLÈME CONNU AVEC EXPO GO**
Expo Go ne supporte plus les notifications push depuis SDK 53. Voici les solutions :

### **Solution 1 : Mode Expo Go (Recommandé pour développement rapide)**
```bash
# Configuration automatique pour Expo Go
chmod +x switch-notifications.sh
./switch-notifications.sh
# Choisir "expo"
```
- ✅ **Alert** au lieu de notifications push
- ✅ **Test rapide** sans build
- ✅ **Toutes les fonctionnalités** préservées

### **Solution 2 : Development Build (Notifications Push Réelles)**
```bash
# 1. Installer EAS CLI
npm install -g @expo/eas-cli
eas login

# 2. Créer un development build
eas build --platform android --profile development

# 3. Installer sur votre téléphone
# Scanner le QR code fourni
```
- ✅ **Vraies notifications push** Android/iOS
- ✅ **Vibration + son** personnalisé
- ✅ **Background notifications**
- ❌ **Build requis** (~10-15 min)

### **Test Rapide**
```bash
# Script de démarrage intelligent
./start-dev.sh
```

## 📊 Structure des Tables

### coli_spaces (Nouvelle table)
```sql
- id: UUID (PK)
- announcement_id: UUID (FK → announcements)
- sender_id: UUID (FK → auth.users)
- gp_id: UUID (FK → auth.users, nullable)
- receiver_name, receiver_phone, receiver_email, receiver_address: TEXT
- status: TEXT (created, active, completed, cancelled)
- created_at, updated_at: TIMESTAMPS
```

### timeline_steps (Nouvelle table)
```sql
- id: UUID (PK)
- coli_space_id: UUID (FK → coli_spaces)
- step_id: TEXT (created, validated, picked_up, etc.)
- label: TEXT (nom affiché)
- completed: BOOLEAN
- validated_by: UUID (FK → auth.users)
- validated_at: TIMESTAMP
- created_at: TIMESTAMP
```

### messages (Table existante étendue)
```sql
- id: UUID (PK)
- coli_space_id: UUID (FK → coli_spaces)
- user_id: UUID (FK → auth.users)
- message: TEXT
- attachments: JSONB (array d'URLs d'images)
- created_at: TIMESTAMP
```

## 🔐 Permissions par Rôle

| Étape Timeline | Expéditeur | GP (Transporteur) | Receveur |
|----------------|------------|-------------------|----------|
| ✅ Annonce créée | Automatique | Automatique | Automatique |
| ⭕ Colis validé | ✅ Peut valider | ✅ Peut valider | ❌ |
| ⭕ GP prend en charge | ❌ | ✅ Peut valider | ❌ |
| ➡️ Transport en cours | Automatique | Automatique | Automatique |
| ⭕ Livré au destinataire | ❌ | ✅ Peut valider | ❌ |
| ✅ Clôturé | Automatique | Automatique | Automatique |

## 📱 Écrans Implémentés

- `WelcomeScreen` - Page d'accueil animée
- `AuthScreen` - Connexion/Inscription
- `AnnouncementsScreen` - Liste des annonces publiques
- `CreateGPAnnouncementScreen` - Créer annonce transporteur
- `CreateSenderAnnouncementScreen` - Créer annonce expéditeur
- `ReceiverInfoScreen` - Saisie infos destinataire (nouveau)
- `ColiSpaceScreen` - Espace de collaboration privé
- `AnnouncementDetailsScreen` - Détails d'annonce
- `MessagesScreen` - Accès aux espaces Coli

## 🎯 Flow Utilisateur Détaillé

### 1. Création d'Annonce
**Transporteur (GP)** : Crée annonce → Espace Coli créé automatiquement (vide)
**Expéditeur** : Crée annonce → Espace Coli créé avec destinataire inclus

### 2. Réponse à une Annonce
**Clic "Répondre"** :
- **Annonce GP** → Formulaire destinataire → Création espace Coli complet
- **Annonce expéditeur** → Accès direct à l'espace Coli existant

### 3. Espace Coli Privé
- **Header** : Trajet source → destination
- **Timeline** : 6 étapes avec boutons de validation conditionnels
- **Chat temps réel** : Messages entre les 3 acteurs
- **Notifications** : Automatiques pour nouveaux messages et validations

### 4. Timeline Interactive
- Étapes automatiquement créées à la création de l'espace
- Boutons "Valider cette étape" selon les permissions
- Sauvegarde en base de données temps réel
- Notifications push aux autres participants

## 🗃 Scripts SQL (Fichier database_schema.sql)

**À exécuter dans Supabase > SQL Editor :**

1. **Tables** : `coli_spaces`, `timeline_steps`, `messages`
2. **RLS Policies** : Sécurité d'accès par rôle
3. **Triggers** : Création automatique des timelines
4. **Indexes** : Optimisation des performances
5. **Realtime** : Abonnements pour le chat live

## 🐛 Debugging & Support

```bash
# Logs détaillés
npm run android -- --logs

# Reset cache Metro
npx react-native start --reset-cache

# Vérifications importantes :
# ✅ Scripts SQL exécutés dans l'ordre
# ✅ expo-notifications installé
# ✅ Permissions notifications accordées
# ✅ RLS activé sur toutes les tables
# ✅ Clés Supabase configurées
```

## 🎯 Améliorations Futures

- [ ] Validation double pour "Colis validé"
- [ ] Upload d'images dans le chat
- [ ] Géolocalisation GPS en temps réel
- [ ] Système de notation/commentaires
- [ ] Interface mobile ultra-optimisée
- [ ] Notifications push avancées (iOS/Android)

---

## 📞 Support & Dépannage

**Problèmes courants :**
1. **Notifications non reçues** → Vérifier permissions + expo-notifications installé
2. **Espaces Coli vides** → Scripts SQL non exécutés ou RLS mal configuré
3. **Timeline non sauvegardée** → Table `timeline_steps` manquante
4. **Chat non temps réel** → Realtime non activé dans Supabase

**🎉 ColiSpace est maintenant PRODUCTION READY !**

**Dernière vérification :** Toutes les fonctionnalités du cahier des charges sont implémentées et testées.
