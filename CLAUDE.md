# Racing Word — Regles Claude Code

## Projet

- **App**: Racing Word — jeu de mots multijoueur temps reel (React Native Expo SDK 55)
- **Docs**: `docs/racing-word-prd.md` (source de verite), `docs/racing-word-architecture.md`
- **Taches**: `tache/fondations.md` — 36 taches fondations avec dependances
- **Package manager**: pnpm exclusivement (jamais npm/yarn)
- **Langue du code**: anglais (noms de variables, fonctions, types)
- **Langue UI**: francais (defaut) + anglais via i18n

---

## Regles Clean Code

### Taille des fichiers
- **Max 250 lignes par fichier** — si un fichier depasse, le decouper en sous-modules
- Pas de fichier "fourre-tout" — chaque fichier a une seule responsabilite

### Organisation des dossiers
- **Si un dossier contient plus de 7 fichiers**, creer des sous-dossiers thematiques
- Chaque sous-dossier doit avoir un `index.ts` barrel export si necessaire
- Structure: `feature/sous-feature/Component.tsx`

### Nommage
- Fichiers composants: `PascalCase.tsx` (ex: `CrystalBall.tsx`)
- Fichiers utilitaires/hooks/stores: `camelCase.ts` (ex: `gameStore.ts`, `useTimer.ts`)
- Fichiers types: `camelCase.ts` (ex: `game.ts`, `player.ts`)
- Fichiers data: `camelCase.ts` (ex: `skins.ts`, `avatars.ts`)
- Constantes: `UPPER_SNAKE_CASE` pour les valeurs, `camelCase` pour les objets

### Composants React
- Un composant par fichier
- Props typees avec interface (pas type alias inline)
- Pas de `any` — typer tout strictement
- Pas de composants classes — fonctions uniquement
- Pas de `StyleSheet.create` pour les layouts — utiliser NativeWind/Tailwind
- `StyleSheet.create` reserve aux animations complexes et au crystal ball (Skia)

### Imports
- Utiliser les alias `@/` pour tous les imports internes
- Grouper: 1) React/RN, 2) Expo/libs externes, 3) @/ internes
- Pas d'imports circulaires

### State & Side Effects
- Zustand pour le state global (6 stores modulaires)
- Pas de `useEffect` inutile — privilegier les derived values
- Pas de state duplique entre stores

### Animations
- **Reanimated v4 uniquement** — JAMAIS Moti (casse avec Reanimated v4)
- `useSharedValue` + `useAnimatedStyle` pour les animations continues
- Layout Animations (`entering={FadeIn}`) pour les entrees/sorties
- `withSequence` + `withDelay` pour les sequences complexes

### Erreurs courantes a eviter
- Ne JAMAIS utiliser `expo-av` (supprime en SDK 55) — utiliser `expo-audio`
- Ne JAMAIS utiliser le temps local pour le timer du jeu — serveur uniquement
- Ne JAMAIS mettre plus de 8 mots visibles dans le word feed
- Ne JAMAIS utiliser Moti pour les animations

---

## Stack Technique

```
Framework     : React Native 0.83 + Expo SDK 55 + React 19.2
Animations    : react-native-reanimated v4
Styling       : NativeWind v4 (Tailwind CSS)
Effets visuels: @shopify/react-native-skia (crystal ball uniquement)
Icons         : @expo/vector-icons (Ionicons + MaterialCommunityIcons)
State         : Zustand 5.x
Backend       : Supabase (Auth + Realtime + PostgreSQL)
Audio         : expo-audio
Navigation    : Expo Router v4 (file-based routing)
i18n          : i18next + react-i18next
Package mgr   : pnpm
Build         : EAS Build
```
