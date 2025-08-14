# 🏦 Gestionnaire de Coffre-Fort

Une application moderne de gestion de coffre-fort pour gérer votre caisse et les commandes clients.

## ✨ Fonctionnalités

### 💰 Gestion de l'Argent
- **Ajouter de l'argent** : Déposez des fonds dans votre coffre-fort
- **Retirer de l'argent** : Effectuez des retraits avec suivi automatique
- **Modification et suppression** : Gérez vos transactions facilement

### 📦 Gestion des Commandes
- **Créer des commandes** : Passez des commandes pour vos clients
- **Vérification automatique** : Impossible de commander sans fonds suffisants
- **Suivi complet** : Statuts (En attente, Terminée, Annulée)
- **Modification et suppression** : Gérez vos commandes avec remboursement automatique

### 📊 Historique et Suivi
- **Historique complet** : Toutes vos transactions sont enregistrées
- **Filtrage avancé** : Par type de transaction (Dépôts, Retraits, Commandes)
- **Suppression sélective** : Supprimez des transactions individuelles
- **Suppression globale** : Effacez tout l'historique d'un coup

### 🎯 Tableau de Bord
- **Vue d'ensemble** : Solde actuel, totaux par catégorie
- **Statistiques visuelles** : Cartes colorées avec icônes
- **Commandes récentes** : Aperçu des dernières commandes

## 🚀 Technologies Utilisées

- **Next.js 14** - Framework React moderne
- **TypeScript** - Typage statique pour plus de sécurité
- **Tailwind CSS** - Styles utilitaires modernes
- **Lucide React** - Icônes élégantes
- **Date-fns** - Gestion des dates
- **LocalStorage** - Persistance des données côté client

## 📱 Interface Utilisateur

- **Design responsive** - Fonctionne sur mobile, tablette et desktop
- **Interface intuitive** - Navigation par onglets claire
- **Modales élégantes** - Formulaires dans des pop-ups modernes
- **Feedback visuel** - Messages d'erreur et de confirmation
- **Thème cohérent** - Couleurs et styles harmonieux

## 🛠️ Installation et Développement

### Prérequis
- Node.js 18+ 
- npm ou yarn

### Installation
```bash
# Cloner le repository
git clone https://github.com/votre-username/coffre-fort-manager.git
cd coffre-fort-manager

# Installer les dépendances
npm install

# Lancer en mode développement
npm run dev
```

L'application sera disponible sur `http://localhost:3000`

### Build pour production
```bash
# Créer le build de production
npm run build

# Lancer en mode production
npm start
```

## 🌐 Déploiement

### Vercel (Recommandé)
1. Connectez votre repository GitHub à Vercel
2. Vercel détectera automatiquement Next.js
3. Le déploiement se fera automatiquement à chaque push

### GitHub Pages
L'application est configurée pour l'export statique :
```bash
npm run build
```

## 💾 Stockage des Données

Les données sont stockées localement dans le navigateur via `localStorage`. Cela signifie :
- ✅ Pas besoin de serveur ou base de données
- ✅ Données persistantes entre les sessions
- ⚠️ Données liées au navigateur (non synchronisées entre appareils)
- ⚠️ Données perdues si le cache du navigateur est vidé

## 🔒 Sécurité

- Validation des montants (nombres positifs uniquement)
- Vérification du solde avant les commandes
- Gestion d'erreurs complète
- Pas de données sensibles stockées côté serveur

## 📋 Structure du Projet

```
coffre-fort-manager/
├── app/                    # Pages Next.js App Router
│   ├── globals.css        # Styles globaux
│   ├── layout.tsx         # Layout principal
│   └── page.tsx           # Page d'accueil
├── components/            # Composants React
│   ├── CashBoxSummary.tsx # Résumé du coffre-fort
│   ├── MoneyManager.tsx   # Gestion de l'argent
│   ├── OrderManager.tsx   # Gestion des commandes
│   └── TransactionHistory.tsx # Historique
├── hooks/                 # Hooks personnalisés
│   └── useCashBox.ts     # Logic métier principal
├── types/                 # Types TypeScript
│   └── index.ts          # Définitions des types
└── public/               # Assets statiques
```

## 🎨 Personnalisation

### Couleurs
Modifiez les couleurs dans `tailwind.config.js` :
```javascript
theme: {
  extend: {
    colors: {
      primary: {
        // Vos couleurs personnalisées
      }
    }
  }
}
```

### Styles
Les styles personnalisés sont dans `app/globals.css` avec des classes utilitaires.

## 🤝 Contribution

1. Fork le projet
2. Créez une branche pour votre fonctionnalité (`git checkout -b feature/AmazingFeature`)
3. Committez vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 📞 Support

Si vous avez des questions ou des problèmes :
- Ouvrez une issue sur GitHub
- Consultez la documentation
- Vérifiez les exemples d'utilisation

---

**Développé avec ❤️ pour une gestion efficace de votre coffre-fort**