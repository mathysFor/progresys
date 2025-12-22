# Règles de Sécurité Firestore

Ce document explique comment déployer les règles de sécurité Firestore pour protéger votre base de données.

## Fichiers

- `firestore.rules` : Règles de sécurité Firestore (à déployer)
- `firestore.rules.example` : Version commentée avec instructions

## Comment déployer les règles

### Option 1 : Via Firebase Console (Recommandé pour commencer)

1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Sélectionnez votre projet `progresys-35773`
3. Dans le menu de gauche, cliquez sur **Firestore Database**
4. Allez dans l'onglet **Rules**
5. Copiez le contenu du fichier `firestore.rules`
6. Collez-le dans l'éditeur de règles
7. Cliquez sur **Publier**

### Option 2 : Via Firebase CLI

Si vous avez installé Firebase CLI :

```bash
# Installer Firebase CLI (si pas déjà fait)
npm install -g firebase-tools

# Se connecter à Firebase
firebase login

# Initialiser Firebase dans le projet (si pas déjà fait)
firebase init firestore

# Déployer les règles
firebase deploy --only firestore:rules
```

## Sécurité des règles

Les règles garantissent que :

✅ **Collection `users`** : Chaque utilisateur ne peut accéder qu'à son propre document
- Lecture : `users/{userId}` uniquement si `auth.uid == userId`
- Écriture : `users/{userId}` uniquement si `auth.uid == userId`

✅ **Collection `progress`** : Chaque utilisateur ne peut accéder qu'à sa propre progression
- Lecture : `progress/{userId}` uniquement si `auth.uid == userId`
- Écriture : `progress/{userId}` uniquement si `auth.uid == userId`

❌ **Tout le reste** : Refusé par défaut

## Test des règles

Après déploiement, vous pouvez tester les règles avec le simulateur Firestore dans Firebase Console :
1. Allez dans Firestore Database > Rules
2. Cliquez sur l'onglet **Simulator**
3. Testez différents scénarios :
   - Un utilisateur qui lit ses propres données ✅
   - Un utilisateur qui lit les données d'un autre ❌
   - Un utilisateur non authentifié qui lit ❌

## Mode développement (Temporaire)

⚠️ **ATTENTION : Ne pas utiliser en production !**

Pour le développement uniquement, vous pouvez temporairement utiliser des règles plus permissives :

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**N'oubliez pas de remettre les règles sécurisées avant la mise en production !**

