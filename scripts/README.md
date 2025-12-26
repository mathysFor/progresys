# Scripts d'import

## Import des questions de quiz

### Prérequis

1. Installer les dépendances :
```bash
npm install
```

2. Configurer Firebase Admin SDK :
   - Option 1 : Utiliser les credentials par défaut (si vous avez fait `firebase login`)
   - Option 2 : Créer un fichier de service account et définir la variable d'environnement `FIREBASE_SERVICE_ACCOUNT`

### Utilisation

```bash
npm run import-quiz
```

Le script va :
1. Lire le fichier `quizz.docx` à la racine du projet
2. Extraire toutes les questions
3. Les parser et détecter le type (QCM ou Vrai/Faux)
4. Les importer dans Firestore dans la collection `quiz_questions`

### Format attendu des questions

Le script supporte plusieurs formats :

**QCM :**
```
1. Quelle est la capitale de la France?
A) Paris
B) Lyon
C) Marseille
D) Toulouse
Réponse: A
```

**Vrai/Faux :**
```
2. La Terre est ronde?
Vrai/Faux
Réponse: Vrai
```

### Notes

- Le script attend 5 secondes avant d'importer (vous pouvez annuler avec Ctrl+C)
- Les questions sont numérotées automatiquement selon leur ordre
- Si le format n'est pas reconnu, la question sera importée avec des options par défaut

