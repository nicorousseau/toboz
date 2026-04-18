# Spécifications Finales : App "Toboz" (LivePrompter)

## 0. Contraintes de Budget et d'Infrastructure
- **Coût total : 0€.** Toutes les solutions choisies doivent être gratuites.
- **Pas de Serveur :** Privilégier le stockage local (AsyncStorage) pour éviter les frais d'hébergement.
- **Open Source :** Utiliser uniquement des bibliothèques React Native gratuites et open-source.
- **Pas d'API payante :** Si une fonctionnalité nécessite une API (ex: recherche de paroles), ne choisir que des services avec un "Free Tier" illimité ou suffisant pour un usage personnel.

## 0.1 Environnement de Développement
- **Outil :** Expo (Workflow "Managed").
- **Visualisation :** L'application doit être entièrement compatible avec **Expo Go**.
- **Compatibilité :** Ne pas utiliser de modules "Development Builds" ou de code natif (C++/Swift/Java) qui nécessiterait Xcode ou Android Studio. Tout doit pouvoir être testé immédiatement via le QR Code Expo.

## 1. Vision du Produit
Application mobile pour musiciens permettant de gérer un répertoire de chansons et d'afficher paroles/accords avec défilement automatique. L'appareil est fixé sur une perche micro ; l'interface doit être lisible à distance et manipulable avec un minimum d'interactions.

## 2. Architecture des Données (Storage)
- **Système :** AsyncStorage (Persistance locale hors-ligne).
- **Structure d'une Chanson :**
  - `id` : UUID unique.
  - `title` : Nom du morceau.
  - `artist` : Nom de l'artiste.
  - `content` : Texte brut au format ChordPro (ex: [Dm]Paroles).
  - `duration` : Durée totale en secondes pour le scroll.
  - `offset` : Délai avant le début du scroll (intro).
  - `fontSize` : Préférence de taille de texte spécifique au morceau.

## 3. Gestion du Répertoire (Dashboard)
- **Liste Globale :** Affichage de toutes les chansons stockées, triées par titre ou artiste.
- **Formulaire d'Ajout/Édition :**
  - Champs de saisie texte pour chaque propriété.
  - Large zone de saisie pour le contenu ChordPro.
  - Bouton "Importer du presse-papier" pour coller rapidement des paroles trouvées en ligne.
- **Suppression :** Swipe ou appui long pour supprimer un morceau.

## 4. Mode Concert (Setlist Manager)
- **Création de Setlist :** Écran permettant de sélectionner des chansons du répertoire global.
- **Ordonnancement :** Utilisation d'une liste Draggable (glisser-déposer) pour définir l'ordre de passage.
- **Navigation Live :**
  - Bouton "Suivant" et "Précédent" sur le lecteur en mode concert.
  - Affichage discret du titre de la chanson suivante en bas de l'écran.
  - Passage automatique à l'écran de liste de la Setlist à la fin du concert.

## 5. Interface du Lecteur (Live View)
- **Design :** Fond noir (#000), Texte blanc ou jaune (#FFF / #FFD700).
- **Rendu du contenu :** - Parser les [Accords] pour les placer au-dessus des mots correspondants.
  - Mode Monospace (Courier) obligatoire pour les blocs de tablatures (lignes commençant par `e|`, `B|`, `G|`, `D|`, `A|`, `E|`).
- **Auto-Scroll :**
  - Calcul : `Vitesse = HauteurTotalePixels / (duration - offset)`.
  - Contrôles : Play/Pause, Reset, et boutons "+" / "-" pour ajuster la taille du texte en temps réel.
- **Sécurité :** Bouton "Lock" pour verrouiller l'écran et éviter les manipulations accidentelles sur scène.

## 6. Paramètres Système
- **Wakelock :** Utilisation de `expo-keep-awake` pour maintenir l'écran allumé.
- **Auto-save :** Sauvegarde automatique dans AsyncStorage à chaque modification de chanson ou de setlist.

