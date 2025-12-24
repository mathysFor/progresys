# Configuration des variables d'environnement

Créez un fichier `.env.local` à la racine du projet avec les variables suivantes :

## Firebase Configuration
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## Firebase Admin SDK (for server-side operations)
```env
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_PRIVATE_KEY=your_private_key
```

## Stripe Configuration
```env
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

## BREVO (formerly Sendinblue) Email Service
```env
BREVO_API_KEY=your_brevo_api_key
BREVO_SENDER_EMAIL=noreply@yourdomain.com
BREVO_SENDER_NAME=Progresys
```

## Application URL (for email links)
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Notes importantes

- Le fichier `.env.local` ne doit jamais être commité dans Git (il est déjà dans `.gitignore`)
- Pour la production, configurez ces variables dans votre plateforme de déploiement (Vercel, Netlify, etc.)
- `BREVO_API_KEY` : Récupérez votre clé API depuis votre compte BREVO
- `BREVO_SENDER_EMAIL` : Doit être un email vérifié dans votre compte BREVO
- `NEXT_PUBLIC_APP_URL` : Utilisez l'URL de production en production (ex: https://votre-domaine.com)

