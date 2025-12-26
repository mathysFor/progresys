# Guide d'import des questions de quiz

## Option 1 : Script automatique (Recommandé)

### Étape 1 : Installer la dépendance

```bash
npm install
```

Cela installera `mammoth` qui est nécessaire pour parser le fichier `.docx`.

### Étape 2 : Configurer Firebase Admin (si pas déjà fait)

Le script utilise Firebase Admin SDK. Vous avez deux options :

**Option A : Utiliser les credentials par défaut**
```bash
firebase login
```

**Option B : Utiliser un service account**
1. Allez dans Firebase Console > Paramètres du projet > Comptes de service
2. Générez une nouvelle clé privée
3. Définissez la variable d'environnement :
```bash
export FIREBASE_SERVICE_ACCOUNT='{"type":"service_account",...}'
```

### Étape 3 : Exécuter le script

```bash
npm run import-quiz
```

Le script va :
- Lire `quizz.docx` à la racine du projet
- Extraire toutes les questions
- Les parser automatiquement
- Les importer dans Firestore

## Option 2 : Import manuel via l'interface admin

1. Allez sur `/admin/quiz`
2. Cliquez sur "📥 Importer en masse"
3. Collez vos questions au format JSON :

```json
[
  {
    "question": "Quelle est la capitale de la France?",
    "type": "qcm",
    "options": ["Paris", "Lyon", "Marseille", "Toulouse"],
    "correctAnswer": 0,
    "order": 1
  },
  {
    "question": "La Terre est ronde?",
    "type": "true_false",
    "options": [],
    "correctAnswer": true,
    "order": 2
  }
]
```

## Format attendu dans quizz.docx

Le script détecte automatiquement le format. Voici les formats supportés :

### Format QCM :
```
1. Quelle est la capitale de la France?
A) Paris
B) Lyon
C) Marseille
D) Toulouse
Réponse: A
```

### Format Vrai/Faux :
```
2. La Terre est ronde?
Vrai/Faux
Réponse: Vrai
```

## Vérification

Après l'import, allez sur `/admin/quiz` et vérifiez que toutes les questions sont présentes dans l'onglet "Questions".

## Dépannage

### Erreur "File not found"
- Vérifiez que `quizz.docx` est bien à la racine du projet

### Erreur "No questions found"
- Le format du document n'est peut-être pas reconnu
- Essayez de copier le texte du docx et utilisez l'import manuel

### Erreur Firebase
- Vérifiez que vous avez bien configuré Firebase Admin SDK
- Vérifiez que les règles Firestore permettent l'écriture (elles devraient déjà être configurées)

