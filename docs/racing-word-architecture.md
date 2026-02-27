# Racing Word — Architecture Technique

**Version 1.0 — Basée sur le PRD v1.0**

---

## 1. Vue d'ensemble du système

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Mobile)                          │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │  Screens  │  │Components│  │  Stores  │  │    Hooks      │  │
│  │ (Expo    │◄─│ (Crystal │◄─│ (Zustand)│◄─│ (useGameRoom  │  │
│  │  Router) │  │  Ball,   │  │          │  │  useTimer     │  │
│  │          │  │  WordFeed)│  │          │  │  useWordFeed) │  │
│  └────┬─────┘  └──────────┘  └────┬─────┘  └───────┬───────┘  │
│       │                           │                 │           │
│  ┌────┴───────────────────────────┴─────────────────┴────────┐ │
│  │                      Service Layer                         │ │
│  │  lib/supabase.ts  │  lib/wordValidator.ts  │  lib/ads.ts  │ │
│  └────────────────────────────┬──────────────────────────────┘ │
└───────────────────────────────┼─────────────────────────────────┘
                                │
                    ┌───────────┴───────────┐
                    │    NETWORK LAYER      │
                    │  REST + WebSocket     │
                    └───────────┬───────────┘
                                │
┌───────────────────────────────┼─────────────────────────────────┐
│                        SUPABASE (Backend)                       │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │   Auth   │  │ Realtime │  │PostgreSQL│  │   Storage     │  │
│  │ (Magic   │  │(game_    │  │(profiles │  │  (avatars,    │  │
│  │  Link /  │  │ words,   │  │ rooms,   │  │   assets)     │  │
│  │  OAuth)  │  │ rooms)   │  │ words)   │  │               │  │
│  └──────────┘  └──────────┘  └──────────┘  └───────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Edge Functions (Deno)                                    │  │
│  │  • matchmaking  • timer-sync  • bot-player  • rewards    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Database Functions / Triggers                            │  │
│  │  • on_word_insert → validate + broadcast                  │  │
│  │  • on_game_end → calculate_winner + distribute_rewards    │  │
│  │  • on_profile_create → generate_player_code               │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Stack technique confirmée

| Couche | Technologie | Version | Notes |
|--------|-------------|---------|-------|
| Framework | React Native | 0.83.1 | New Architecture only (SDK 55) |
| Meta-framework | Expo SDK | 55 | Structure `/src/app` |
| React | React | 19.2 | Concurrent features |
| Navigation | Expo Router | v4+ | File-based routing, Native Tabs |
| Animations | react-native-reanimated | v4 | **PAS Moti** — cassé avec v4 |
| Styling | NativeWind | v4 | Tailwind pour layouts |
| Effets visuels | @shopify/react-native-skia | latest | Crystal ball uniquement |
| Icons | @expo/vector-icons | latest | Ionicons + MaterialCommunityIcons |
| State | Zustand | 5.x | Stores modulaires |
| Backend | Supabase | latest | Auth + Realtime + PostgreSQL |
| Audio | expo-audio | SDK 55 | **PAS expo-av** (supprimé) |
| i18n | i18next + react-i18next | latest | FR (défaut) + EN |
| Ads | react-native-google-mobile-ads | latest | Rewarded ads uniquement |
| Package manager | pnpm | latest | Exclusif |
| Build | EAS Build | latest | iOS + Android |

---

## 3. Architecture des fichiers

```
RacingWord/
├── app.json                          ← Config Expo + plugins
├── babel.config.js                   ← Reanimated plugin
├── tailwind.config.js                ← NativeWind config
├── tsconfig.json
├── pnpm-lock.yaml
│
├── assets/
│   ├── fonts/
│   │   ├── FredokaOne-Regular.ttf
│   │   ├── Nunito-Regular.ttf
│   │   ├── Nunito-Bold.ttf
│   │   └── Nunito-ExtraBold.ttf
│   ├── sounds/
│   │   ├── word-valid.mp3
│   │   ├── word-invalid.mp3
│   │   ├── countdown.mp3
│   │   ├── winner.mp3
│   │   └── button-tap.mp3
│   └── images/
│       └── splash.png
│
├── src/
│   ├── app/                          ← Expo Router (screens)
│   │   ├── _layout.tsx               ← Root layout + providers
│   │   ├── index.tsx                 ← Splash screen
│   │   ├── (tabs)/
│   │   │   ├── _layout.tsx           ← Bottom tabs (Native Tabs API)
│   │   │   ├── home.tsx              ← Overworld map
│   │   │   ├── profile.tsx           ← Profil + stats
│   │   │   ├── shop.tsx              ← Skins + avatars
│   │   │   └── social.tsx            ← Amis + leaderboard
│   │   ├── game/
│   │   │   ├── lobby.tsx             ← Matchmaking + countdown
│   │   │   └── [roomId].tsx          ← Gameplay (crystal ball)
│   │   ├── tutorial.tsx              ← Tutorial overlay
│   │   ├── achievements.tsx          ← Achievements
│   │   ├── quests.tsx                ← Quêtes
│   │   └── settings.tsx              ← Paramètres
│   │
│   ├── components/
│   │   ├── crystal-ball/
│   │   │   ├── CrystalBall.tsx       ← Skia orb (Canvas)
│   │   │   ├── WordFeed.tsx          ← Liste mots animée
│   │   │   ├── WordItem.tsx          ← Mot individuel animé
│   │   │   └── OrbGlow.tsx           ← Effet glow Skia
│   │   ├── game/
│   │   │   ├── WordInput.tsx         ← Input + validation + shake
│   │   │   ├── TimerBar.tsx          ← Barre chrono animée
│   │   │   ├── ScoreRow.tsx          ← Scores joueurs
│   │   │   ├── DefinitionCard.tsx    ← Carte définition
│   │   │   └── WinnerReveal.tsx      ← Animation vainqueur + confetti
│   │   ├── home/
│   │   │   ├── OverworldMap.tsx       ← Map SVG + chemin + nodes
│   │   │   ├── StageNode.tsx          ← Noeud d'étape (done/current/locked)
│   │   │   ├── TutorialBanner.tsx     ← Banner progression tutoriel
│   │   │   ├── CurrencyBar.tsx        ← Pièces/gemmes/vies (top bar)
│   │   │   ├── FightButton.tsx        ← Bouton COMBATTRE 3D
│   │   │   ├── SkyBackground.tsx      ← Gradient ciel + nuages animés
│   │   │   ├── PlayerCharacter.tsx    ← Avatar flottant sur la map
│   │   │   └── SplashParticle.tsx     ← Particule violette splash
│   │   ├── tutorial/
│   │   │   ├── TutorialPanel.tsx      ← Bottom sheet + steps
│   │   │   ├── TutorialStep.tsx       ← Contenu par étape
│   │   │   └── DotIndicators.tsx      ← Dots navigation
│   │   ├── profile/
│   │   │   ├── AvatarCard.tsx
│   │   │   └── StatsBadge.tsx
│   │   ├── achievements/
│   │   │   └── AchievementCard.tsx
│   │   ├── quests/
│   │   │   └── QuestCard.tsx
│   │   ├── leaderboard/
│   │   │   ├── LeaderboardRow.tsx
│   │   │   └── PinnedMyRank.tsx
│   │   ├── social/
│   │   │   ├── FriendCard.tsx
│   │   │   └── FriendRequestCard.tsx
│   │   ├── shop/
│   │   │   └── SkinCard.tsx
│   │   ├── ads/
│   │   │   ├── CoinAdButton.tsx
│   │   │   ├── NoLivesModal.tsx
│   │   │   ├── ContinueAdModal.tsx
│   │   │   └── SkinTrialButton.tsx
│   │   └── ui/
│   │       ├── ProgressBar.tsx
│   │       ├── BottomNav.tsx
│   │       └── Toast.tsx
│   │
│   ├── stores/
│   │   ├── gameStore.ts              ← État partie (room, words, timer)
│   │   ├── playerStore.ts            ← Profil, currency, avatar
│   │   ├── questStore.ts             ← Quêtes + achievements
│   │   ├── skinStore.ts              ← Skins actifs + temporaires
│   │   ├── leaderboardStore.ts       ← Classements + amis
│   │   └── adsStore.ts               ← Cooldowns pubs
│   │
│   ├── hooks/
│   │   ├── useGameRoom.ts            ← Supabase Realtime subscription
│   │   ├── useTimer.ts               ← Timer sync serveur
│   │   ├── useWordFeed.ts            ← Gestion word feed animé
│   │   ├── useMatchmaking.ts         ← Logique matchmaking
│   │   ├── useLeaderboard.ts         ← Fetch + realtime leaderboard
│   │   └── useRewardedAd.ts          ← AdMob rewarded
│   │
│   ├── lib/
│   │   ├── supabase.ts               ← Client Supabase singleton
│   │   ├── wordValidator.ts          ← Validation mots (NFD normalize)
│   │   ├── gameTimer.ts              ← Sync timer côté serveur
│   │   ├── matchmaking.ts            ← findOrCreateRoom
│   │   ├── leaderboard.ts            ← Queries leaderboard
│   │   └── playerCode.ts             ← Génération code joueur
│   │
│   ├── data/
│   │   ├── questions.ts              ← Définitions + réponses (FR/EN)
│   │   ├── achievements.ts           ← Liste achievements
│   │   ├── quests.ts                 ← Quêtes daily/weekly
│   │   ├── skins.ts                  ← Skins boule de cristal
│   │   ├── avatars.ts                ← Avatars disponibles
│   │   └── playerColors.ts           ← Couleurs joueurs
│   │
│   ├── i18n/
│   │   ├── index.ts                  ← Config i18next
│   │   ├── fr.ts                     ← Traductions FR (défaut)
│   │   └── en.ts                     ← Traductions EN
│   │
│   ├── types/
│   │   ├── game.ts                   ← Question, WordEntry, RoomPlayer
│   │   ├── player.ts                 ← Profile, Friend, FriendRequest
│   │   ├── shop.ts                   ← Skin, Avatar
│   │   ├── leaderboard.ts            ← LeaderboardEntry, MyRankData
│   │   └── navigation.ts             ← Route params
│   │
│   └── constants/
│       ├── theme.ts                  ← Couleurs, fonts, spacing
│       └── config.ts                 ← URLs, timeouts, limites
│
└── supabase/
    ├── migrations/
    │   ├── 001_profiles.sql
    │   ├── 002_game_rooms.sql
    │   ├── 003_game_words.sql
    │   ├── 004_friendships.sql
    │   ├── 005_achievements.sql
    │   ├── 006_quests.sql
    │   ├── 007_leaderboard_views.sql
    │   └── 008_realtime.sql
    ├── functions/
    │   ├── matchmaking/index.ts
    │   ├── end-game/index.ts
    │   └── bot-player/index.ts
    └── seed.sql
```

---

## 4. Architecture en couches

```
┌─────────────────────────────────────────────────┐
│              PRESENTATION LAYER                  │
│                                                  │
│  Screens (Expo Router)    Components (React)     │
│  • Reanimated v4 animations                      │
│  • NativeWind styling (layouts)                  │
│  • StyleSheet (game animations)                  │
│  • Skia Canvas (crystal ball)                    │
│  • i18next translations                          │
└──────────────────────┬──────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────┐
│              BUSINESS LOGIC LAYER                │
│                                                  │
│  Zustand Stores          Custom Hooks            │
│  • gameStore             • useGameRoom           │
│  • playerStore           • useTimer              │
│  • questStore            • useMatchmaking        │
│  • skinStore             • useWordFeed           │
│  • leaderboardStore      • useRewardedAd         │
│  • adsStore              • useLeaderboard        │
│                                                  │
│  Validators              Static Data             │
│  • wordValidator.ts      • questions.ts          │
│  • gameTimer.ts          • achievements.ts       │
│  • playerCode.ts         • skins.ts              │
└──────────────────────┬──────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────┐
│                DATA LAYER                        │
│                                                  │
│  Supabase Client (lib/supabase.ts)               │
│  • REST API (CRUD profiles, rooms, words)        │
│  • Realtime (game_words, room_players, rooms)    │
│  • Auth (sign up, login, session)                │
│                                                  │
│  AsyncStorage                                    │
│  • Langue préférée                               │
│  • Session token cache                           │
│                                                  │
│  AdMob SDK                                       │
│  • Rewarded ads preload + display                │
└─────────────────────────────────────────────────┘
```

---

## 5. Architecture de navigation

```
Root Stack (_layout.tsx)
├── index.tsx (Splash Screen)
│   └── Tap → navigate to (tabs)/home
│
├── (tabs)/ (_layout.tsx — Bottom Tabs, Native Tabs API)
│   ├── profile.tsx        ← Tab 1: Profil
│   ├── social.tsx         ← Tab 2: Amis/Leaderboard
│   ├── home.tsx           ← Tab 3: Accueil (centre, raised)
│   ├── shop.tsx           ← Tab 4: Boutique
│   └── quests.tsx         ← Tab 5: Quêtes (remplace "Objets")
│
├── game/
│   ├── lobby.tsx          ← Matchmaking (modal ou push)
│   └── [roomId].tsx       ← Gameplay (fullscreen, no tabs)
│
├── tutorial.tsx           ← Modal overlay (bottom sheet)
├── achievements.tsx       ← Push screen
└── settings.tsx           ← Push screen
```

### Ordre des tabs (bottom nav)

```
[Profil 🦉] [Amis 👥] [⚔️ Accueil] [Shop 🏪] [Quêtes 📋]
                        ↑ centre, raised circle
```

### Navigation flows

```
PREMIER LANCEMENT:
  Splash → Home → Tutorial (auto si !tutorial_done) → Home

PARTIE NORMALE:
  Home → tap COMBATTRE → Lobby → Countdown 3-2-1 → Game [roomId]
  → Timer end → WinnerReveal → Home

NAVIGATION TABS:
  Profil ↔ Amis ↔ Home ↔ Shop ↔ Quêtes

DEEP LINKS:
  Home → Achievements (push)
  Home → Settings (push)
  Social → Friend profile (push)
```

---

## 6. Architecture State Management (Zustand)

### 6.1 Vue d'ensemble des stores

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  gameStore   │     │ playerStore │     │  skinStore   │
│              │     │             │     │             │
│ roomId       │     │ profile     │     │ activeSkin  │
│ status       │     │ coins       │     │ unlocked[]  │
│ question     │     │ gems        │     │ tempSkin    │
│ wordFeed[]   │     │ hearts      │     │ tempExpiry  │
│ players[]    │     │ avatar      │     └─────────────┘
│ myScore      │     │ stage       │
│ timeLeft     │     └─────────────┘     ┌─────────────┐
│ winner       │                          │  adsStore   │
└─────────────┘     ┌─────────────┐     │             │
                    │ questStore  │     │ lastCoinAd  │
┌─────────────┐     │             │     │ lastLifeAd  │
│leaderboard  │     │ daily[]     │     │ cooldowns() │
│   Store     │     │ weekly[]    │     └─────────────┘
│             │     │ achievements│
│ activeTab   │     │ progress{}  │
│ data{}      │     └─────────────┘
│ myRanks{}   │
│ friends[]   │
│ pending[]   │
└─────────────┘
```

### 6.2 Flux de données temps réel (partie)

```
                    ┌──────────────────┐
                    │  Joueur tape     │
                    │  un mot          │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │  wordValidator   │
                    │  .validateWord() │
                    └────────┬─────────┘
                             │
                 ┌───────────┴───────────┐
                 │                       │
          ┌──────▼──────┐         ┌──────▼──────┐
          │   VALID     │         │   INVALID   │
          └──────┬──────┘         └──────┬──────┘
                 │                       │
     ┌───────────▼──────────┐    ┌───────▼──────────┐
     │  supabase.insert     │    │  Shake animation  │
     │  (game_words)        │    │  + flash rouge    │
     └───────────┬──────────┘    └──────────────────┘
                 │
     ┌───────────▼──────────┐
     │  Supabase Realtime   │
     │  postgres_changes    │
     │  INSERT on game_words│
     └───────────┬──────────┘
                 │
      ┌──────────▼──────────────┐
      │  TOUS les joueurs       │
      │  reçoivent le mot       │
      │  via useGameRoom hook   │
      └──────────┬──────────────┘
                 │
      ┌──────────▼──────────────┐
      │  gameStore.addWordToFeed│
      │  → WordFeed re-render   │
      │  → WordItem animation   │
      │  → Score update         │
      └────────────────────────┘
```

---

## 7. Architecture Backend (Supabase)

### 7.1 Schéma des tables

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    profiles      │     │   game_rooms    │     │   game_words    │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id (PK, FK auth)│     │ id (PK)         │     │ id (PK)         │
│ username         │◄────│ created_by (FK) │     │ room_id (FK)  ──┼──► game_rooms
│ player_code      │     │ code (UNIQUE)   │     │ player_id (FK)──┼──► profiles
│ avatar_id        │     │ status          │     │ word            │
│ skin_id          │     │ question_id     │     │ points          │
│ coins            │     │ timer_start     │     │ submitted_at    │
│ gems             │     │ timer_duration  │     └─────────────────┘
│ hearts           │     │ created_at      │
│ total_score      │     └─────────────────┘     ┌─────────────────┐
│ games_played     │                              │  room_players   │
│ games_won        │     ┌─────────────────┐     ├─────────────────┤
│ current_stage    │     │  friendships    │     │ id (PK)         │
│ tutorial_done    │     ├─────────────────┤     │ room_id (FK)  ──┼──► game_rooms
│ created_at       │     │ id (PK)         │     │ player_id (FK)──┼──► profiles
└────────┬────────┘     │ player_id (FK)──┼──►  │ color           │
         │              │ friend_id (FK)──┼──►  │ score           │
         │              │ status          │     │ is_ready        │
         │              │ created_at      │     │ joined_at       │
         │              └─────────────────┘     └─────────────────┘
         │
         │              ┌─────────────────┐     ┌─────────────────┐
         │              │player_achievements│   │  player_quests  │
         │              ├─────────────────┤     ├─────────────────┤
         └──────────────│ player_id (FK)  │     │ player_id (FK)──┼──► profiles
                        │ achievement_id  │     │ quest_id        │
                        │ unlocked_at     │     │ progress        │
                        └─────────────────┘     │ completed       │
                                                │ completed_at    │
                                                └─────────────────┘
```

### 7.2 Vues matérialisées (leaderboards)

| Vue | Source | Tri | Refresh |
|-----|--------|-----|---------|
| `leaderboard_global` | profiles | total_score DESC | Toutes les heures |
| `leaderboard_weekly` | room_players + game_rooms | weekly_score DESC | Toutes les heures |
| `leaderboard_alltime` | room_players | best_score DESC | Toutes les heures |

### 7.3 Realtime subscriptions

| Table | Event | Usage |
|-------|-------|-------|
| `game_words` | INSERT | Mots en temps réel dans la boule |
| `room_players` | INSERT/UPDATE | Joueurs qui rejoignent + ready |
| `game_rooms` | UPDATE | Changement status (waiting→playing→finished) |

### 7.4 Edge Functions

| Fonction | Trigger | Responsabilité |
|----------|---------|----------------|
| `matchmaking` | Appelé par client | Trouver/créer room, assigner couleur |
| `end-game` | Timer expire (cron ou client) | Calculer winner, distribuer rewards, update stats |
| `bot-player` | Matchmaking timeout (30s) | Créer 1-2 bots, soumettre mots simulés |

### 7.5 Row Level Security (RLS)

```sql
-- Profiles : lecture publique, écriture propriétaire
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON profiles FOR SELECT USING (true);
CREATE POLICY "Owner write" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Game words : INSERT si joueur dans la room, SELECT public dans la room
ALTER TABLE game_words ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Player in room can insert" ON game_words FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM room_players WHERE room_id = game_words.room_id AND player_id = auth.uid())
  );
CREATE POLICY "Room participants can read" ON game_words FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM room_players WHERE room_id = game_words.room_id AND player_id = auth.uid())
  );

-- Game rooms : lecture publique (pour matchmaking), création auth
ALTER TABLE game_rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth read rooms" ON game_rooms FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Auth create rooms" ON game_rooms FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Friendships : lecture/écriture propriétaire
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own friendships" ON friendships FOR ALL
  USING (auth.uid() = player_id OR auth.uid() = friend_id);
```

---

## 8. Architecture des composants clés

### 8.1 Crystal Ball — Composant le plus critique

```
CrystalBall.tsx (parent)
├── Canvas (Skia)
│   ├── Circle (glow externe — BlurMask)
│   ├── Circle (corps orb — RadialGradient)
│   ├── Circle (reflet shine — RadialGradient)
│   └── Circle (bord lumineux — stroke)
│
└── View (absoluteFill, par-dessus le Canvas)
    └── WordFeed.tsx
        └── WordFeedItem.tsx (×8 max visibles)
            └── WordItem.tsx (animation pop + glow)
```

**Principe :** Le Canvas Skia ne gère QUE le fond visuel de l'orbe. Les mots sont des composants React Native standard (Reanimated v4) positionnés par-dessus en absolute.

### 8.2 Skin system — Thème dynamique

```typescript
// Le composant CrystalBall reçoit un objet skin
// UN SEUL composant — pas un par skin
<CrystalBall
  skin={currentSkin}    // objet Skin avec couleurs/gradients
  words={wordFeed}
  size={280}
/>

// Le skin modifie :
// - orbGradient (couleurs du RadialGradient Skia)
// - orbGlow (couleur du glow)
// - background (gradient du screen)
// - particleColor (particules ambiantes)
// - wordAppear (type d'animation d'entrée du mot)
```

### 8.3 Animations — Patterns Reanimated v4

```
PATTERN 1 — Shared Values + useAnimatedStyle
Usage : Animations continues (particules, float, pulse, timer)
Exemple : SplashParticle, PlayerCharacter float, StageNode pulse

PATTERN 2 — Layout Animations (entering/exiting)
Usage : Entrée/sortie de composants dans le tree
Exemple : WinnerReveal (ZoomIn.delay().springify()),
          LeaderboardRow (FadeInDown.delay()),
          WordItem dans le feed

PATTERN 3 — withSequence + withDelay
Usage : Animations multi-phases complexes
Exemple : WinnerReveal (shockwave → rays → veil → card → crown → name)

PATTERN 4 — Animations réactives à une action
Usage : Feedback utilisateur
Exemple : WordInput shake (withSequence translateX),
          Border flash vert/rouge (withSequence borderColor)
```

---

## 9. Architecture de la synchronisation temps réel

### 9.1 Lifecycle d'une partie

```
           CLIENT A                  SUPABASE                  CLIENT B
              │                         │                         │
              │─── findOrCreateRoom ───►│                         │
              │◄── room_id + waiting ───│                         │
              │                         │                         │
              │    subscribe room       │    subscribe room       │
              │◄────────────────────────│─────────────────────────│
              │                         │                         │
              │                         │◄── joinRoom ────────────│
              │◄── room_players INSERT ─│                         │
              │                         │                         │
              │─── setReady ───────────►│                         │
              │                         │◄── setReady ────────────│
              │                         │                         │
              │    [all ready]          │    [all ready]          │
              │◄── room UPDATE playing ─│── room UPDATE playing ─►│
              │    + timer_start        │   + timer_start         │
              │                         │                         │
              │    ════ GAME START ════ │ ════ GAME START ════    │
              │                         │                         │
              │─── INSERT game_word ───►│                         │
              │◄── Realtime INSERT ─────│── Realtime INSERT ─────►│
              │                         │                         │
              │                         │◄── INSERT game_word ────│
              │◄── Realtime INSERT ─────│── Realtime INSERT ─────►│
              │                         │                         │
              │    ════ TIMER END ═════ │ ════ TIMER END ═════    │
              │                         │                         │
              │    [Edge Function]      │                         │
              │◄── room UPDATE finished │── room UPDATE finished ►│
              │    + winner data        │   + winner data         │
              │                         │                         │
              │    WinnerReveal         │    WinnerReveal         │
```

### 9.2 Timer — Synchronisation serveur

```typescript
// CRITIQUE : le timer ne doit JAMAIS se baser sur le temps local
//
// 1. Le serveur écrit timer_start (TIMESTAMPTZ) quand la room passe en "playing"
// 2. Chaque client calcule le temps restant :
//    remaining = timer_duration - (Date.now() - Date.parse(timer_start))
// 3. Le client anime la barre avec ce remaining
// 4. Quand remaining <= 0, le client affiche "Temps écoulé"
//    mais c'est le SERVEUR qui calcule le vainqueur (Edge Function)
```

---

## 10. Performances — Contraintes et solutions

| Contrainte | Solution |
|------------|----------|
| Word feed accumulation | Max 8 items visibles, slice(-8) |
| Skia canvas re-renders | Canvas statique, mots en View overlay |
| Reanimated perf | Shared values sur UI thread, pas de setState dans animations |
| Leaderboard queries | Vues matérialisées, refresh horaire |
| Realtime bandwidth | Subscribe uniquement à la room active, unsubscribe au démontage |
| Font loading | expo-font plugin (préchargé au build) |
| Ad preloading | Charger la rewarded ad au mount de HomeScreen |
| Image/SVG | SVG inline pour le chemin (pas d'images lourdes) |
| List rendering | FlatList pour leaderboard/achievements, pas ScrollView |

---

## 11. Sécurité

| Risque | Mitigation |
|--------|------------|
| Triche mots (client modifié) | Validation serveur via DB trigger sur INSERT game_words |
| Timer manipulation | Timer basé sur timestamp serveur, pas client |
| Score inflation | Calcul du score côté serveur (Edge Function end-game) |
| Accès non autorisé | RLS Supabase sur toutes les tables |
| Injection SQL | Supabase client SDK (requêtes paramétrées) |
| Rate limiting | Supabase rate limits + cooldown ads côté client |
| Fake friend requests | RLS + validation UUID auth |

---

## 12. Plan d'implémentation (Phases)

### Phase 1 — Fondations (Semaine 1-2)

```
1.1  Initialiser le projet Expo SDK 55
     pnpm create expo-app RacingWord -- --template default@sdk-55
1.2  Installer toutes les dépendances (voir PRD §2)
1.3  Configurer NativeWind, Reanimated, Skia
1.4  Configurer Supabase (projet + tables + RLS + Realtime)
1.5  Setup i18n (i18next + fichiers FR/EN)
1.6  Setup navigation (Root Stack + Bottom Tabs)
1.7  Créer les types TypeScript (types/)
1.8  Créer les constantes et data statiques (data/, constants/)
1.9  Créer les Zustand stores (squelettes)
1.10 Créer le client Supabase (lib/supabase.ts)
```

### Phase 2 — Screens de base (Semaine 2-3)

```
2.1  Splash Screen + particules animées
2.2  Home Screen — Sky gradient + nuages + chemin SVG + nodes
2.3  Home Screen — CurrencyBar + TutorialBanner + FightButton
2.4  Home Screen — Bottom Nav (Native Tabs)
2.5  Profile Screen — Avatar, stats, achievements récents
2.6  Settings Screen — Langue, sons, version
```

### Phase 3 — Gameplay core (Semaine 3-5) — LA PLUS CRITIQUE

```
3.1  CrystalBall component (Skia Canvas)
3.2  WordItem animation (pop + glow + spring bounce)
3.3  WordFeed (remontée animée, max 8 visibles)
3.4  WordInput (input + validation + shake/flash)
3.5  TimerBar (barre animée + dot lumineux)
3.6  DefinitionCard
3.7  ScoreRow (scores joueurs)
3.8  Game Screen [roomId].tsx — assemblage complet
3.9  wordValidator.ts — validation NFD normalize
3.10 WinnerReveal — animation 5 temps + confetti
```

### Phase 4 — Multiplayer (Semaine 5-6)

```
4.1  Matchmaking (findOrCreateRoom)
4.2  Lobby Screen — countdown + joueurs
4.3  useGameRoom hook — Realtime subscription
4.4  useTimer hook — sync serveur
4.5  Submit word → INSERT game_words → Realtime broadcast
4.6  End game → Edge Function → winner calculation
4.7  Bot player (Edge Function)
```

### Phase 5 — Social + Progression (Semaine 6-7)

```
5.1  Leaderboard (4 onglets + pinned rank)
5.2  Système d'amis (code joueur, demandes, acceptation)
5.3  Achievements system (tracking + unlock + rewards)
5.4  Quêtes daily/weekly (tracking + claim)
5.5  Tutorial (4 étapes, bottom sheet)
```

### Phase 6 — Monétisation + Shop (Semaine 7-8)

```
6.1  Shop Screen — Grille skins + preview orbe
6.2  Skin system — Thème dynamique dans CrystalBall
6.3  Avatars — Achat + équipement
6.4  Rewarded Ads — 4 points d'intégration
6.5  Système de vies (rechargement 30min)
```

### Phase 7 — Polish + Launch (Semaine 8-9)

```
7.1  Sons (expo-audio) — effets de jeu
7.2  Haptics — feedback tactile
7.3  Performance profiling (Flipper / React DevTools)
7.4  Tests E2E (Detox ou Maestro)
7.5  EAS Build — iOS + Android
7.6  App Store / Play Store submission
```

---

## 13. Dépendances entre phases

```
Phase 1 (Fondations)
  │
  ├──► Phase 2 (Screens de base)
  │       │
  │       └──► Phase 5 (Social + Progression)
  │               │
  │               └──► Phase 6 (Monétisation)
  │                       │
  │                       └──► Phase 7 (Polish)
  │
  └──► Phase 3 (Gameplay core)
          │
          └──► Phase 4 (Multiplayer)
                  │
                  └──► Phase 7 (Polish)
```

**Chemin critique :** Phase 1 → Phase 3 → Phase 4 → Phase 7

Le gameplay (Crystal Ball + mots + timer + winner) est la fonctionnalité différenciante. C'est là que l'effort doit se concentrer en premier.

---

## 14. Décisions architecturales clés

| Décision | Choix | Justification |
|----------|-------|---------------|
| Moti | **NON** | Cassé avec Reanimated v4 + SDK 55 |
| expo-av | **NON** | Supprimé en SDK 55, remplacé par expo-audio |
| Skia pour toute l'UI | **NON** | Skia uniquement pour l'orbe. Mots = React Native Views |
| expo-router vs React Navigation | **Expo Router** | File-based, SDK 55 native tabs, conventions Expo |
| newArchEnabled flag | **N/A** | N'existe plus en SDK 55 — New Architecture obligatoire |
| Hermes v1 | **NON** | Augmente build times, pas de gain justifié pour ce projet |
| Validation mots | **Client first, serveur confirm** | UX fluide + sécurité via DB trigger |
| Timer | **Serveur only** | Anti-triche, synchronisation entre joueurs |
| Leaderboard refresh | **Vues matérialisées** | Performance (pas de calcul à chaque requête) |
| Ads SDK | **react-native-google-mobile-ads** | Seul package compatible EAS Build (expo-ads-admob supprimé) |
