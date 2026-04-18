# TOBOZ — PWA (0€)

## Objectif
Utiliser TOBOZ sur iPhone **sans Expo Go** et **sans payer**.

Cette version est une **PWA** (site web installable via “Ajouter à l’écran d’accueil”).

## Lancer en local (web)

```bash
npm run web
```

## Exporter le site (build statique)

```bash
npm run build:web
```

Le site généré est dans `dist/`.

## Tester `dist/` en local

```bash
npm run serve:web
```

## Mettre en ligne gratuitement

### Option 1: Netlify (le plus simple)
- Crée un site Netlify (gratuit)
- Drag & drop du dossier `dist/`
- Tu obtiens une URL `https://....netlify.app`

### Option 2: GitHub Pages
- Commit le contenu de `dist/` sur une branche dédiée (ex: `gh-pages`)
- Active GitHub Pages sur cette branche

## Installer sur iPhone
1. Ouvre l’URL du site dans **Safari**
2. Bouton **Partager**
3. **Ajouter à l’écran d’accueil**
4. Lance TOBOZ depuis l’icône

## Notes importantes (iOS)
- Le stockage (equivalent AsyncStorage) se fait dans le navigateur: **iOS peut purger** le stockage web si l’espace manque.
- L’expérience “scène” peut être légèrement moins fiable qu’une app native (wakelock, multitâche, etc.).

