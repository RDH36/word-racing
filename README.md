# Racing Word

Jeu de mots multijoueur en temps reel pour mobile (iOS & Android).

Trouve le maximum de mots correspondant a une definition dans un temps limite, pendant que tes adversaires font de meme. Les mots valides apparaissent en temps reel dans une boule de cristal partagee.

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Framework | React Native 0.83 + Expo SDK 55 + React 19.2 |
| Animations | react-native-reanimated v4 |
| Styling | NativeWind v4 (Tailwind CSS) |
| Effets visuels | @shopify/react-native-skia |
| State | Zustand 5.x |
| Backend | Supabase (Auth + Realtime + PostgreSQL) |
| Audio | expo-audio |
| Navigation | Expo Router v4 (file-based) |
| i18n | i18next (FR + EN) |
| Build | EAS Build |

## Demarrage

```bash
pnpm install
pnpm start
```

- `a` — ouvrir sur Android
- `i` — ouvrir sur iOS
- `w` — ouvrir sur web

## Structure du projet

```
src/
  app/           -- Ecrans (Expo Router file-based routing)
  components/    -- Composants React organises par feature
  stores/        -- Zustand stores (6 stores modulaires)
  hooks/         -- Custom hooks
  lib/           -- Utilitaires et services
  data/          -- Donnees statiques (questions, skins, avatars)
  types/         -- Interfaces TypeScript
  constants/     -- Theme, config
  i18n/          -- Traductions FR/EN
```

## Documentation

- `docs/racing-word-prd.md` — Product Requirements Document (source de verite)
- `docs/racing-word-architecture.md` — Architecture technique
- `tache/fondations.md` — Taches fondations (36 taches avec dependances)
