# 🚀 Guide de Déploiement

Ce guide vous explique comment déployer votre application de gestion de coffre-fort sur GitHub et Vercel.

## 📋 Prérequis

- Compte GitHub
- Compte Vercel (gratuit)
- Git installé sur votre machine

## 🔧 Étape 1: Préparer le Repository GitHub

### 1.1 Créer un nouveau repository sur GitHub

1. Allez sur [GitHub](https://github.com)
2. Cliquez sur le bouton "New" ou "+" → "New repository"
3. Nommez votre repository (ex: `coffre-fort-manager`)
4. Ajoutez une description: "Application de gestion de coffre-fort pour commandes clients"
5. Laissez le repository **Public** (nécessaire pour GitHub Pages gratuit)
6. **NE PAS** initialiser avec README, .gitignore ou licence (nous les avons déjà)
7. Cliquez sur "Create repository"

### 1.2 Initialiser Git et pousser le code

Ouvrez un terminal dans le dossier de votre projet et exécutez :

```bash
# Initialiser le repository Git
git init

# Ajouter tous les fichiers
git add .

# Faire le premier commit
git commit -m "Initial commit: Application de gestion de coffre-fort"

# Ajouter l'origine remote (remplacez YOUR_USERNAME par votre nom d'utilisateur GitHub)
git remote add origin https://github.com/YOUR_USERNAME/coffre-fort-manager.git

# Pousser vers GitHub
git push -u origin main
```

## 🌐 Étape 2: Déployer sur Vercel

### 2.1 Méthode Automatique (Recommandée)

1. Allez sur [Vercel](https://vercel.com)
2. Cliquez sur "Sign up" et connectez-vous avec votre compte GitHub
3. Une fois connecté, cliquez sur "New Project"
4. Importez votre repository `coffre-fort-manager`
5. Vercel détectera automatiquement que c'est un projet Next.js
6. Cliquez sur "Deploy"
7. Attendez quelques minutes... 🎉 Votre app est en ligne !

### 2.2 Configuration Vercel (Optionnelle)

Si vous voulez personnaliser le domaine :
1. Dans votre projet Vercel, allez dans "Settings" → "Domains"
2. Ajoutez votre domaine personnalisé ou utilisez le domaine .vercel.app fourni

## 📄 Étape 3: Activer GitHub Pages (Alternative)

Si vous préférez GitHub Pages :

1. Dans votre repository GitHub, allez dans "Settings"
2. Scrollez jusqu'à "Pages" dans le menu de gauche
3. Dans "Source", sélectionnez "GitHub Actions"
4. Le workflow `.github/workflows/deploy.yml` se déclenchera automatiquement
5. Votre site sera disponible à `https://YOUR_USERNAME.github.io/coffre-fort-manager`

## 🔄 Étape 4: Mises à jour automatiques

### Pour Vercel :
- Chaque fois que vous poussez du code vers la branche `main`, Vercel redéploiera automatiquement
- Vous recevrez une notification par email à chaque déploiement

### Pour GitHub Pages :
- Chaque push vers `main` déclenchera le workflow GitHub Actions
- Le site sera mis à jour automatiquement

## 📝 Commandes Git utiles pour les mises à jour

```bash
# Ajouter vos modifications
git add .

# Commiter avec un message descriptif
git commit -m "Ajout de nouvelles fonctionnalités"

# Pousser vers GitHub (déclenchera le redéploiement automatique)
git push origin main
```

## 🛠️ Dépannage

### Problème: Build échoue sur Vercel
- Vérifiez que toutes les dépendances sont dans `package.json`
- Regardez les logs de build dans le dashboard Vercel
- Assurez-vous que `npm run build` fonctionne localement

### Problème: GitHub Pages ne se met pas à jour
- Vérifiez l'onglet "Actions" de votre repository pour voir les erreurs
- Assurez-vous que le workflow a les permissions nécessaires

### Problème: Données perdues après redéploiement
- C'est normal ! Les données sont stockées dans le navigateur (localStorage)
- Chaque utilisateur aura ses propres données locales
- Pour une solution permanente, il faudrait ajouter une base de données

## 🎯 URLs de votre application

Après déploiement, votre application sera accessible via :

- **Vercel**: `https://your-project-name.vercel.app`
- **GitHub Pages**: `https://your-username.github.io/coffre-fort-manager`

## 🔒 Sécurité et Bonnes Pratiques

1. **Données sensibles** : Ne jamais commiter de clés API ou mots de passe
2. **Variables d'environnement** : Utilisez les variables d'environnement Vercel pour les données sensibles
3. **HTTPS** : Vercel et GitHub Pages utilisent HTTPS par défaut
4. **Sauvegardes** : Les données étant locales, conseillez aux utilisateurs de faire des exports réguliers

## 📊 Monitoring et Analytics

### Vercel Analytics (Optionnel)
1. Dans votre dashboard Vercel, activez "Analytics"
2. Vous pourrez voir les statistiques de visite

### Google Analytics (Optionnel)
Ajoutez Google Analytics en modifiant `app/layout.tsx` pour inclure le script de tracking.

---

🎉 **Félicitations !** Votre application de gestion de coffre-fort est maintenant déployée et accessible au monde entier !