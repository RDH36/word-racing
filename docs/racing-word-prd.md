# Racing Word — Product Requirements Document
**Version 1.0 — Pour Claude Code**

> Ce document décrit entièrement le jeu mobile Racing Word. Les prototypes HTML référencés dans ce PRD sont la **source de vérité visuelle** — le code React Native doit reproduire fidèlement ces animations, layouts et interactions sur mobile.

---

## 1. Vision du produit

Racing Word est un **jeu de mots multijoueur en temps réel** pour mobile (iOS & Android). Le gameplay consiste à trouver le maximum de mots correspondant à une définition dans un temps limité, pendant que les adversaires font de même. Les mots validés de tous les joueurs apparaissent en temps réel dans une **boule de cristal partagée**, créant une tension visuelle unique et addictive.

**Genre :** Casual / Word Game / Multiplayer  
**Cible :** 15-35 ans, francophone  
**Modèle économique :** Free-to-play, skins et cosmétiques payants  
**Plateformes :** iOS + Android via Expo / EAS Build

---

## 2. Stack technique

```
Framework     : React Native 0.83.1 + Expo SDK 55 + React 19.2
Animations    : react-native-reanimated v4
                ⚠️ NE PAS utiliser Moti — cassé avec Reanimated v4, non maintenu
Styling       : NativeWind v4 (Tailwind CSS pour RN)
Effets visuels: react-native-skia (boule de cristal uniquement)
Icons         : @expo/vector-icons (Ionicons + MaterialCommunityIcons)
State         : Zustand
Backend       : Supabase (Auth + Realtime + PostgreSQL)
Audio         : expo-audio (expo-av supprimé définitivement en SDK 55)
Navigation    : React Navigation v7 (Stack + Bottom Tabs)
Package mgr   : pnpm
Build         : EAS Build
```

### Ce qui change avec SDK 55 (breaking changes importants)

- **Legacy Architecture supprimée définitivement** — le flag `newArchEnabled` n'existe plus dans `app.json`
- **Nouvelle structure de dossiers** — code dans `/src/app` au lieu de `/app`
- **expo-av** — entièrement retiré, plus maintenu du tout. `expo-audio` obligatoire
- **Reanimated v4** — seule option. Legacy Architecture gone = Reanimated 3 impossible aussi
- **Hermes v1** — opt-in disponible mais augmente fortement les build times → ne pas activer
- **Native Tabs API** dans le template par défaut (expo-router avec tabs natifs iOS/Android)

### ⚠️ Pourquoi pas Moti ?

Moti 0.30.0 est basé sur Reanimated 3 et **ne supporte pas Reanimated v4**. Issue ouverte depuis septembre 2025, pas de fix prévu. SDK 55 ayant supprimé la Legacy Architecture, Reanimated 3 n'est plus possible non plus. **Reanimated v4 directement** — `useSharedValue`, `useAnimatedStyle`, layout animations (`entering={ZoomIn.delay(x).springify()}`).

### Initialisation du projet

```bash
# Template SDK 55 — nouvelle structure /src/app
pnpm create expo-app RacingWord -- --template default@sdk-55
cd RacingWord

# Animations (Reanimated v4 — react-native-worklets inclus auto)
pnpm expo install react-native-reanimated

# Styling
pnpm expo install nativewind
pnpm add tailwindcss@^3.4 --save-dev

# Effets visuels
pnpm expo install @shopify/react-native-skia

# Icons
pnpm expo install @expo/vector-icons

# Audio (expo-av définitivement mort en SDK 55)
pnpm expo install expo-audio

# Backend
pnpm expo install @supabase/supabase-js
pnpm add @react-native-async-storage/async-storage

# Navigation
pnpm expo install @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs
pnpm expo install react-native-screens react-native-safe-area-context react-native-gesture-handler

# State
pnpm add zustand
pnpm expo install expo-tracking-transparency   # iOS ATT consent
pnpm expo install expo-build-properties        # config plugin nécessaire
```

### Configuration NativeWind (tailwind.config.js)

```js
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        'orb-purple': '#7c3aed',
        'orb-blue': '#3b82f6',
        'gold': '#fbbf24',
        'game-dark': '#080612',
      },
      fontFamily: {
        'fredoka': ['Fredoka_One'],
        'nunito': ['Nunito_700'],
      }
    }
  }
}
```

---

## 3. Architecture des fichiers

> ⚠️ SDK 55 : le template par défaut place le code dans `/src/app` (et non `/app`)

```
src/
├── app/                             ← expo-router (nouvelle structure SDK 55)
│   ├── _layout.tsx                  ← Navigation root + providers
│   ├── index.tsx                    ← Splash screen
│   ├── (tabs)/
│   │   ├── _layout.tsx              ← Bottom tabs layout (Native Tabs API)
│   │   ├── home.tsx                 ← Overworld map
│   │   ├── profile.tsx              ← Profil + stats + avatar
│   │   ├── shop.tsx                 ← Skins + avatars
│   │   └── social.tsx               ← Amis + leaderboard (4 onglets)
│   ├── game/
│   │   ├── lobby.tsx                ← Matchmaking
│   │   └── [roomId].tsx             ← Gameplay screen
│   ├── tutorial.tsx                 ← Tutoriel overlay
│   ├── achievements.tsx             ← Achievements screen
│   └── quests.tsx                   ← Quêtes screen
│
├── components/
│   ├── crystal-ball/
│   │   ├── CrystalBall.tsx      ← Skia orb + word feed
│   │   ├── WordItem.tsx         ← Mot animé individuel
│   │   └── OrbGlow.tsx          ← Effet glow Skia
│   ├── game/
│   │   ├── WordInput.tsx        ← Input + validation
│   │   ├── TimerBar.tsx         ← Barre chrono animée
│   │   ├── ScoreRow.tsx         ← Scores joueurs
│   │   └── WinnerReveal.tsx     ← Animation vainqueur
│   ├── home/
│   │   ├── OverworldMap.tsx     ← Map SVG + nodes
│   │   ├── StageNode.tsx        ← Nœud d'étape
│   │   ├── TutorialBanner.tsx   ← Banner progression
│   │   └── CurrencyBar.tsx      ← Pièces/gemmes/vies
│   ├── tutorial/
│   │   └── TutorialPanel.tsx    ← Panel tutoriel
│   ├── profile/
│   │   ├── AvatarCard.tsx
│   │   └── StatsBadge.tsx
│   ├── achievements/
│   │   └── AchievementCard.tsx
│   └── quests/
│       └── QuestCard.tsx
│
├── stores/
│   ├── gameStore.ts             ← Zustand: état de la partie
│   ├── playerStore.ts           ← Zustand: profil, currency, avatar
│   ├── questStore.ts            ← Zustand: quêtes + achievements
│   ├── skinStore.ts             ← Zustand: skins actifs
│   └── leaderboardStore.ts      ← Zustand: classements + amis
│
├── lib/
│   ├── supabase.ts
│   ├── wordValidator.ts
│   └── gameTimer.ts
│
├── data/
│   ├── questions.ts             ← Définitions + réponses
│   ├── achievements.ts
│   ├── quests.ts
│   └── skins.ts
│
└── hooks/
    ├── useGameRoom.ts           ← Supabase Realtime
    ├── useTimer.ts
    └── useWordFeed.ts
```

---

## 4. Schéma base de données (Supabase)

```sql
-- Profils joueurs
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users,
  username TEXT UNIQUE NOT NULL,
  player_code TEXT UNIQUE NOT NULL,  -- ex: "RDH#4721" pour ajouter des amis
  avatar_id TEXT DEFAULT 'owl',
  skin_id TEXT DEFAULT 'crystal',
  coins INTEGER DEFAULT 0,
  gems INTEGER DEFAULT 0,
  hearts INTEGER DEFAULT 5,
  total_score INTEGER DEFAULT 0,
  games_played INTEGER DEFAULT 0,
  games_won INTEGER DEFAULT 0,
  current_stage INTEGER DEFAULT 1,
  tutorial_done BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Table amis
CREATE TABLE friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES profiles,
  friend_id UUID REFERENCES profiles,
  status TEXT DEFAULT 'pending',  -- pending | accepted
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(player_id, friend_id)
);

-- Rooms multijoueur
CREATE TABLE game_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,          -- code 6 chars pour rejoindre
  status TEXT DEFAULT 'waiting',       -- waiting | playing | finished
  question_id INTEGER NOT NULL,
  timer_start TIMESTAMPTZ,            -- timestamp serveur pour sync
  timer_duration INTEGER DEFAULT 60,  -- secondes
  created_by UUID REFERENCES profiles,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Joueurs dans une room
CREATE TABLE room_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES game_rooms ON DELETE CASCADE,
  player_id UUID REFERENCES profiles,
  color TEXT NOT NULL,                -- couleur du joueur dans cette room
  score INTEGER DEFAULT 0,
  is_ready BOOLEAN DEFAULT false,
  joined_at TIMESTAMPTZ DEFAULT now()
);

-- Mots soumis (source de vérité + Realtime)
CREATE TABLE game_words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES game_rooms ON DELETE CASCADE,
  player_id UUID REFERENCES profiles,
  word TEXT NOT NULL,
  points INTEGER DEFAULT 10,
  submitted_at TIMESTAMPTZ DEFAULT now()
);

-- Achievements
CREATE TABLE player_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES profiles,
  achievement_id TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(player_id, achievement_id)
);

-- Quêtes
CREATE TABLE player_quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES profiles,
  quest_id TEXT NOT NULL,
  progress INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  UNIQUE(player_id, quest_id)
);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE game_words;
ALTER PUBLICATION supabase_realtime ADD TABLE room_players;
ALTER PUBLICATION supabase_realtime ADD TABLE game_rooms;
```

---

## 5. Zustand Stores

```typescript
// stores/gameStore.ts
interface GameState {
  roomId: string | null
  status: 'idle' | 'waiting' | 'playing' | 'finished'
  currentQuestion: Question | null
  wordFeed: WordEntry[]        // tous les mots de tous les joueurs
  players: RoomPlayer[]
  myScore: number
  timeLeft: number
  winner: RoomPlayer | null

  // Actions
  submitWord: (word: string) => Promise<void>
  setTimeLeft: (t: number) => void
  addWordToFeed: (entry: WordEntry) => void
  setWinner: (player: RoomPlayer) => void
  resetGame: () => void
}

// stores/playerStore.ts
interface PlayerState {
  profile: Profile | null
  coins: number
  gems: number
  hearts: number
  currentSkin: string
  currentAvatar: string
  unlockedSkins: string[]
  unlockedAvatars: string[]

  // Actions
  addCoins: (n: number) => void
  spendGems: (n: number) => boolean
  setSkin: (skinId: string) => void
  setAvatar: (avatarId: string) => void
}
```

---

## 6. Screens

### 6.1 Splash Screen

**Référence visuelle :** `racing-word-home.html` → section `#splash`

**Description exacte :**
- Background : dégradé sombre `#1a0a3d → #2d1060 → #0d0828`
- 25 particules flottantes violettes qui montent lentement de bas en haut avec dérive horizontale aléatoire
- Logo centré avec animation d'apparition scale + blur (cubic-bezier spring)
- Icône 🔮 qui balance gauche/droite en loop
- Titre "Racing Word" en dégradé animé `#fbbf24 → #f472b6 → #a78bfa → #60a5fa` qui shimmer en boucle (backgroundPosition animation)
- Sous-titre "Duel de mots en temps réel" — fade + slide up avec délai 0.8s
- Texte "Appuie pour commencer" qui pulse en opacité (blink loop)
- Tap n'importe où → transition fade vers HomeScreen

**Code Reanimated v4 pour les particules :**

```tsx
// SplashParticle.tsx
import Animated, {
  useSharedValue, useAnimatedStyle,
  withRepeat, withSequence, withTiming, withDelay,
  Easing,
} from 'react-native-reanimated'
import { useEffect } from 'react'
import { Dimensions } from 'react-native'

const { height } = Dimensions.get('window')

const SplashParticle = ({ delay, x, size }: Props) => {
  const translateY = useSharedValue(height + 20)
  const opacity = useSharedValue(0)
  const scale = useSharedValue(0)

  useEffect(() => {
    const duration = 6000 + Math.random() * 8000
    translateY.value = withDelay(delay, withRepeat(
      withTiming(-20, { duration, easing: Easing.linear }),
      -1, false
    ))
    opacity.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(0.8, { duration: duration * 0.1 }),
        withTiming(0.3, { duration: duration * 0.8 }),
        withTiming(0, { duration: duration * 0.1 }),
      ), -1, false
    ))
    scale.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(1, { duration: duration * 0.5 }),
        withTiming(1.5, { duration: duration * 0.5 }),
      ), -1, false
    ))
  }, [])

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
    opacity: opacity.value,
  }))

  return (
    <Animated.View
      style={[{
        position: 'absolute',
        left: x,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: 'rgba(180,140,255,0.4)',
      }, style]}
    />
  )
}
```

---

### 6.2 Home Screen (Overworld Map)

**Référence visuelle :** `racing-word-home.html` → section `#home`

**Layout (de haut en bas) :**

```
┌─────────────────────────────────────┐
│  TOP BAR (z=10, absolute)           │
│  [🍬 1.7K] [💎 20] [🩷 0]  ⚙️ 📋   │
├─────────────────────────────────────┤
│  TUTORIAL BANNER (z=10, absolute)   │
│  🧌 Progression tutoriel  Étape 3/10│
│      [████░░░░░░░░░░░░░░░]          │
├─────────────────────────────────────┤
│                                     │
│  SKY (gradient)                     │
│  ☁️  ☁️        ☁️                   │
│  🌲🌳🌲🌳🌲🌳 (arbres bg)           │
│                                     │
│  PATH SCENE (SVG)                   │
│  Chemin sableux sinueux             │
│  🦉  ← personnage du joueur         │
│  ●●  ← nodes d'étapes              │
│                                     │
├─────────────────────────────────────┤
│  FIGHT ZONE (z=10, absolute)        │
│       [ÉTAPE 3]                     │
│     [ COMBATTRE ]                   │
├─────────────────────────────────────┤
│  BOTTOM NAV                         │
│  🦉  👥  [⚔️]  🏪  🎒              │
│  Profil Amis Accueil Shop Objets    │
└─────────────────────────────────────┘
```

**Sky gradient :**
```
#a8d8f0 → #c8eaf8 → #dff3fc → #f4e8d8 → #f4a97a
```

**Nuages :** 3 nuages SVG qui dérivent horizontalement en boucle, vitesses différentes (28s, 40s, 34s). Opacity 0.75.

**Chemin SVG (path d'overworld) :**
```svg
<!-- Le chemin sinueux du bas vers le haut -->
<path d="M80 300 Q120 260 160 220 Q200 180 140 140 Q80 100 180 60 Q240 30 280 0"
      fill="none" stroke="#ffd4b0" stroke-width="60" stroke-linecap="round"/>
<!-- Chemin intérieur plus clair -->
<path d="M80 300 Q120 260 160 220 Q200 180 140 140 Q80 100 180 60 Q240 30 280 0"
      fill="none" stroke="#ffe8cc" stroke-width="42" stroke-linecap="round"/>
```

**Stage Nodes (positionnés sur le chemin) :**

| Étape | Position | État | Couleur |
|-------|----------|------|---------|
| 1 | bottom:68% left:38% | ✓ done | vert `#4ade80` |
| 2 | bottom:55% left:52% | ✓ done | vert `#4ade80` |
| 3 | bottom:42% left:28% | current | or `#fbbf24` + pulse |
| 4 | bottom:28% left:55% | 🔒 locked | gris |
| 5 | bottom:14% left:40% | 🔒 locked | gris |

Node current → animation pulse : `box-shadow` qui s'étend et disparaît en boucle 1.5s.

**Personnage sur la map :**
- Emoji 🦉 (ou avatar du joueur)
- Animation float Y -8px en loop 2s ease-in-out
- Positionné juste avant le node current
- Filter drop-shadow pour profondeur

**Tutorial Banner :**
- Background `linear-gradient(135deg, #6c47d4, #8b5cf6)`
- Border-radius 16px, shadow purple
- Monstre 🧌 qui bob up/down + flip horizontal en loop
- Barre de progression (30% = étape 3/10) couleur `#fbbf24 → #fde68a`
- Tap → ouvre TutorialScreen

**Fight Button :**
- Background `linear-gradient(180deg, #e86a3a, #c44f22)`
- Shadow en bas `#9a3a18` pour effet 3D pressed
- Hover/Press : translateY +3px + shadow réduite
- Font : Fredoka One, taille 22

**Bottom Nav :**
- Background `#1a1040`
- Bouton central (⚔️) en cercle raised avec gradient purple, margin-top négatif
- Items inactifs opacity 40%, actif blanc
- Badge rouge pour notifications (!)

---

### 6.3 Tutorial Screen

**Référence visuelle :** `racing-word-home.html` → section `#tutorial`

**Structure :** Modal bottom sheet qui slide depuis le bas, backdrop flou.

**4 étapes du tutoriel :**

#### Étape 1 — La Boule de Cristal 🔮
```
Description : "La boule de cristal est le cœur du jeu ! C'est là que tous 
les mots apparaissent en temps réel — les tiens et ceux de tes adversaires.
Chaque joueur a sa propre couleur."

Demo visuelle :
- Mini orbe 80x80 (gradient dark purple)
- 4 mots demo qui poppent avec délais échelonnés :
  "poisson" (violet), "baleine" (rouge), "requin" (vert), "dauphin" (violet)
- Animation: scale 0→1 + opacity 0→1, cubic-bezier spring
```

#### Étape 2 — Trouver des mots 📝
```
Description : "Une définition s'affiche. Tape le max de mots qui correspondent 
avant la fin du chrono !"

Demo visuelle :
- Label définition : "Animaux qui vivent dans l'eau"
- Barre d'input avec curseur animé (width 20%→70% en boucle)
- Bouton → 
- Exemples : "✓ poisson" (vert), "✗ arbre" (rouge)
```

#### Étape 3 — Le Chrono Racing ⚡
```
Description : "60 secondes, chaque mot = +10 points. Les adversaires jouent 
en même temps — sois plus rapide !"

Demo visuelle :
- Barre timer avec shimmer gradient animé, width 65%
- 3 score pills : "Toi 40pts", "Alex 30pts", "Jo 20pts"
```

#### Étape 4 — Le Vainqueur 👑
```
Description : "À la fin, le plus de points gagne ! Animation spectaculaire 
+ récompenses 🍬💎"

Demo visuelle :
- Crown 👑 qui float + rotate
- Texte "Vainqueur / Toi / 50 pts • 5 mots"
- Gradient doré sur le nom
```

**Navigation tutoriel :**
- Dots indicateurs en bas (dot active = largeur 24px, sinon 8px)
- Bouton "Passer" (skip tout) + "Suivant →"
- Dernière étape : "Jouer maintenant ! ✦" → ferme tutoriel + lance partie

**Implémentation React Native :**
```tsx
// TutorialPanel.tsx
import { MotiView } from 'moti'
import BottomSheet from '@gorhom/bottom-sheet'

const TutorialPanel = () => {
  const snapPoints = ['70%']
  // ...
  return (
    <BottomSheet snapPoints={snapPoints} backdropComponent={BackdropBlur}>
      <TutorialStep step={currentStep} />
      <DotIndicators total={4} current={currentStep} />
      <TutorialButtons onNext={next} onSkip={close} isLast={currentStep === 3} />
    </BottomSheet>
  )
}
```

---

### 6.4 Game Screen (Boule de Cristal)

**Référence visuelle :** `racing-word-v2.html` — c'est le fichier le plus important, à reproduire fidèlement sur mobile.

**Layout vertical (mobile) :**

```
┌─────────────────────────────────────┐
│  ← Accueil              [timer 23s] │
├─────────────────────────────────────┤
│                                     │
│  ╔═══════════════════╗              │
│  ║  "Animaux dans    ║              │
│  ║   l'eau"          ║              │
│  ╚═══════════════════╝              │
│                                     │
│  [████████████░░░░░] ← timer bar    │
│                                     │
│         ✦  ORB  ✦                  │
│      ╭───────────╮                  │
│     │  🔵 poisson │                 │
│     │  🔴 baleine │  ← word feed    │
│     │  🟢 requin  │                 │
│      ╰───────────╯                  │
│                                     │
│  [🔵 Toi:20] [🔴 Alex:15] [🟢 Jo:10]│
│                                     │
│  [  tape un mot...      ] [✦]       │
└─────────────────────────────────────┘
```

#### 6.4.1 Boule de Cristal (react-native-skia)

La boule est un composant Skia. Dimensions : 280×280px, centré horizontalement.

```tsx
// CrystalBall.tsx
import { Canvas, Circle, RadialGradient, vec, BlurMask, Paint } from '@shopify/react-native-skia'

const CrystalBall = ({ words, size = 280 }: Props) => {
  const center = size / 2

  return (
    <View style={{ width: size, height: size }}>
      <Canvas style={{ flex: 1 }}>
        {/* Glow externe */}
        <Circle cx={center} cy={center} r={center + 8}>
          <Paint color="rgba(120,70,255,0.15)">
            <BlurMask blur={20} style="normal" />
          </Paint>
        </Circle>

        {/* Corps principal de l'orbe */}
        <Circle cx={center} cy={center} r={center - 2}>
          <RadialGradient
            c={vec(center * 0.7, center * 0.6)}
            r={center}
            colors={[
              'rgba(180,140,255,0.12)',
              'rgba(90,50,180,0.3)',
              'rgba(15,8,40,0.92)',
              'rgba(5,3,20,0.98)',
            ]}
          />
        </Circle>

        {/* Reflet/shine haut-gauche */}
        <Circle cx={center * 0.55} cy={center * 0.5} r={center * 0.25}>
          <RadialGradient
            c={vec(center * 0.55, center * 0.5)}
            r={center * 0.25}
            colors={['rgba(255,255,255,0.1)', 'transparent']}
          />
        </Circle>

        {/* Bord lumineux */}
        <Circle cx={center} cy={center} r={center - 2} color="transparent">
          <Paint style="stroke" strokeWidth={1.5} color="rgba(180,130,255,0.2)" />
        </Circle>
      </Canvas>

      {/* Word feed par-dessus le canvas */}
      <View style={StyleSheet.absoluteFill}>
        <WordFeed words={words} orbSize={size} />
      </View>
    </View>
  )
}
```

#### 6.4.2 Animation magique des mots (CRITIQUE)

C'est la mécanique visuelle centrale. Chaque mot doit apparaître avec cet effet :

**Phase 1 (0→300ms) :** Scale 0.3→1 + translateY +20→0 + blur 10→0 + opacity 0→1
**Phase 2 (300→480ms) :** Légère overshoot scale 1→1.06→1 (spring bounce)
**Phase 3 (ongoing) :** Glow halo autour du mot qui pulse puis disparaît (800ms)

```tsx
// WordItem.tsx — Reanimated v4
import Animated, {
  useSharedValue, useAnimatedStyle,
  withSpring, withTiming, withSequence, withDelay,
  Easing,
} from 'react-native-reanimated'
import { useEffect } from 'react'

interface WordItemProps {
  word: string
  color: string
  delay?: number
}

const WordItem = ({ word, color, delay = 0 }: WordItemProps) => {
  const opacity = useSharedValue(0)
  const scale = useSharedValue(0.3)
  const translateY = useSharedValue(20)

  useEffect(() => {
    // Phase 1 : apparition
    opacity.value = withDelay(delay, withTiming(1, { duration: 300, easing: Easing.out(Easing.ease) }))
    translateY.value = withDelay(delay, withSpring(0, { damping: 12, stiffness: 180 }))
    // Phase 2 : scale avec bounce
    scale.value = withDelay(delay, withSequence(
      withTiming(1.06, { duration: 300, easing: Easing.out(Easing.ease) }),
      withSpring(1, { damping: 10, stiffness: 200 }),
    ))
  }, [])

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
  }))

  return (
    <Animated.View
      style={[{
        paddingHorizontal: 14,
        paddingVertical: 3,
        borderRadius: 20,
        backgroundColor: color + '1a',
        borderWidth: 1,
        borderColor: color + '50',
        marginVertical: 2,
        shadowColor: color,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 8,
        elevation: 5,
      }, animStyle]}
    >
      <Text style={{
        color,
        fontSize: 14,
        fontWeight: '700',
        fontFamily: 'Nunito_700',
        letterSpacing: 0.8,
        textShadowColor: color,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
      }}>
        {word}
      </Text>
    </Animated.View>
  )
}
```

**Word Feed — remontée des mots :**
Les anciens mots remontent de 26px chaque fois qu'un nouveau arrive. Opacité diminue progressivement après le 4ème mot.

```tsx
// WordFeed.tsx — Reanimated v4
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated'

const WordFeedItem = ({ entry, ageFromBottom }: { entry: WordEntry, ageFromBottom: number }) => {
  const opacity = ageFromBottom > 4 ? Math.max(0, 1 - (ageFromBottom - 4) * 0.22) : 1

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: withSpring(-ageFromBottom * 26, { damping: 15 }) }],
    opacity: withSpring(opacity, { damping: 20 }),
  }))

  return (
    <Animated.View style={[styles.wordWrapper, animStyle]}>
      <WordItem word={entry.word} color={entry.color} />
    </Animated.View>
  )
}

const WordFeed = ({ words }: { words: WordEntry[] }) => {
  const visible = words.slice(-8)
  return (
    <View style={styles.feed}>
      {visible.map((entry, i) => (
        <WordFeedItem
          key={entry.id}
          entry={entry}
          ageFromBottom={visible.length - 1 - i}
        />
      ))}
    </View>
  )
}
```

#### 6.4.3 Timer Bar

```tsx
// TimerBar.tsx
import { MotiView } from 'moti'
import { useSharedValue, withTiming, useAnimatedStyle } from 'react-native-reanimated'

const TimerBar = ({ duration, onEnd }: Props) => {
  const progress = useSharedValue(1)

  useEffect(() => {
    progress.value = withTiming(0, {
      duration: duration * 1000,
      easing: Easing.linear,
    })
  }, [])

  const barStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }))

  return (
    <View style={styles.wrap}>
      <Animated.View style={[styles.fill, barStyle]}>
        {/* Dot lumineux au bout */}
        <View style={styles.dot} />
      </Animated.View>
    </View>
  )
}

// Styles
const styles = {
  wrap: { height: 5, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 3 },
  fill: {
    height: '100%',
    borderRadius: 3,
    // Gradient via LinearGradient d'expo
    overflow: 'hidden',
  },
  dot: {
    position: 'absolute',
    right: 0,
    top: -3,
    width: 10, height: 10,
    borderRadius: 5,
    backgroundColor: 'white',
    shadowColor: '#a78bfa',
    shadowRadius: 8,
    shadowOpacity: 1,
  }
}
```

#### 6.4.4 Input de mots

```tsx
// WordInput.tsx
const WordInput = ({ onSubmit, disabled }: Props) => {
  const [value, setValue] = useState('')
  const [status, setStatus] = useState<'idle' | 'ok' | 'err'>('idle')
  const shake = useSharedValue(0)
  const borderColor = useSharedValue('rgba(255,255,255,0.1)')

  const handleSubmit = () => {
    const result = onSubmit(value.trim().toLowerCase())
    if (result === 'valid') {
      // Flash vert
      borderColor.value = withSequence(
        withTiming('rgba(74,222,128,0.7)', { duration: 100 }),
        withTiming('rgba(255,255,255,0.1)', { duration: 300 })
      )
    } else {
      // Shake + flash rouge
      shake.value = withSequence(
        withTiming(-4, { duration: 50 }),
        withTiming(4, { duration: 50 }),
        withTiming(-4, { duration: 50 }),
        withTiming(0, { duration: 50 })
      )
    }
    setValue('')
  }

  return (
    <Animated.View style={[styles.row, { transform: [{ translateX: shake }] }]}>
      <Animated.View style={[styles.inputWrap, { borderColor }]}>
        <TextInput
          value={value}
          onChangeText={setValue}
          onSubmitEditing={handleSubmit}
          placeholder="Tape un mot..."
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
          style={styles.input}
          placeholderTextColor="rgba(255,255,255,0.18)"
        />
      </Animated.View>
      <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
        <Text style={styles.submitText}>✦</Text>
      </TouchableOpacity>
    </Animated.View>
  )
}
```

#### 6.4.5 Logique de validation côté client

```typescript
// lib/wordValidator.ts
export function validateWord(
  word: string,
  answers: string[],
  usedWords: string[]
): 'valid' | 'already_used' | 'invalid' {
  const clean = (w: string) =>
    w.toLowerCase()
     .normalize('NFD')
     .replace(/[\u0300-\u036f]/g, '')
     .trim()

  const cleaned = clean(word)
  if (!cleaned) return 'invalid'

  const match = answers.find(a => clean(a) === cleaned)
  if (!match) return 'invalid'
  if (usedWords.includes(match)) return 'already_used'
  return 'valid'
}
```

#### 6.4.6 Supabase Realtime — mots en temps réel

```typescript
// hooks/useGameRoom.ts
export const useGameRoom = (roomId: string) => {
  const { addWordToFeed } = useGameStore()

  useEffect(() => {
    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'game_words',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const player = players.find(p => p.player_id === payload.new.player_id)
          addWordToFeed({
            id: payload.new.id,
            word: payload.new.word,
            playerId: payload.new.player_id,
            color: player?.color ?? '#ffffff',
            timestamp: payload.new.submitted_at,
          })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [roomId])
}
```

**Soumettre un mot :**
```typescript
const submitWord = async (word: string) => {
  const result = validateWord(word, currentQuestion.answers, usedWords)
  if (result !== 'valid') return result

  // Insert en DB → déclenche automatiquement le Realtime pour tous
  const { error } = await supabase.from('game_words').insert({
    room_id: roomId,
    player_id: myPlayerId,
    word,
    points: 10,
  })

  if (!error) {
    usedWords.push(word) // ajouter localement pour éviter doublons
  }
  return result
}
```

---

### 6.5 Winner Reveal Animation

**Référence visuelle :** `racing-word-v2.html` → section `.winner-overlay`

Séquence animée en 5 temps déclenchée 400ms après la fin du timer :

**T+0ms :** Shockwave — cercle qui s'étend depuis le centre (scale 0→80, opacity 1→0, 1000ms)
**T+250ms :** Rayons — 12 rayons dorés qui jaillissent dans toutes les directions (1500ms)
**T+300ms :** Veil — overlay sombre avec backdrop blur qui fade in (600ms)
**T+500ms :** Card — carte vainqueur qui drop depuis le haut (scale 0.4→1 + Y -60→0 + blur, spring)
**T+600ms :** Crown — 👑 apparaît avec rotation spring, float loop ensuite
**T+800ms :** Name — nom du vainqueur en zoom explosif (scale 2.5→1 + blur 15→0, 700ms)
**T+1000ms :** Score + words count — fade slide up échelonné
**T+1700ms :** Button "Rejouer" — fade slide up

**Confetti :**
- 140 particules explosent depuis le centre avec vitesse initiale aléatoire
- Gravité 0.25 par frame
- Mix de rectangles et cercles
- Couleurs : `#fbbf24, #f472b6, #60a5fa, #34d399, #a78bfa, #fb923c, white`
- Fade out progressif (alpha -= 0.008 par frame)

```tsx
// WinnerReveal.tsx — Reanimated v4
import Animated, {
  useSharedValue, useAnimatedStyle,
  withTiming, withSpring, withDelay, withSequence,
  FadeIn, ZoomIn, SlideInDown,
  Easing,
} from 'react-native-reanimated'

const WinnerReveal = ({ winner, onReplay }: Props) => {
  const veilOpacity = useSharedValue(0)

  useEffect(() => {
    veilOpacity.value = withDelay(300, withTiming(1, { duration: 600 }))
  }, [])

  const veilStyle = useAnimatedStyle(() => ({ opacity: veilOpacity.value }))

  return (
    <View style={styles.overlay}>
      {/* Shockwave */}
      <Shockwave />
      {/* Rays */}
      <LightRays count={12} />

      {/* Dark veil */}
      <Animated.View style={[styles.veil, veilStyle]} />

      {/* Winner Card — ZoomIn entrant depuis Reanimated v4 layout animations */}
      <Animated.View
        entering={ZoomIn.delay(500).springify().damping(12).stiffness(150)}
        style={styles.card}
      >
        {/* Crown — FadeIn avec délai */}
        <Animated.Text
          entering={ZoomIn.delay(600).springify()}
          style={styles.crown}
        >
          👑
        </Animated.Text>

        <Animated.Text
          entering={FadeIn.delay(700)}
          style={styles.label}
        >
          Vainqueur
        </Animated.Text>

        {/* Name blast — ZoomIn exagéré */}
        <Animated.Text
          entering={ZoomIn.delay(800).duration(700)}
          style={[styles.name, { color: winner.color }]}
        >
          {winner.username}
        </Animated.Text>

        <Animated.Text
          entering={SlideInDown.delay(1000).duration(400)}
          style={styles.score}
        >
          Score <Text style={styles.scoreNum}>{winner.score}</Text>
        </Animated.Text>

        <Animated.View entering={SlideInDown.delay(1700).duration(400)}>
          <TouchableOpacity style={styles.replayBtn} onPress={onReplay}>
            <Text style={styles.replayText}>✦ Rejouer</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>

      {/* Confetti Canvas */}
      <ConfettiOverlay />
    </View>
  )
}
```

> **Note Reanimated v4 layout animations :** `entering={ZoomIn.delay(500).springify()}` est la syntaxe v4. Ne pas utiliser l'ancienne syntaxe `entering={ZoomIn.delay(500)}` sans `.springify()` pour les effets spring.

---

### 6.6 Profile Screen

**Layout :**
```
┌────────────────────────────────────┐
│  ← Retour          [✏️ Modifier]   │
│                                    │
│         ╭──────────╮               │
│         │  Avatar  │  🦉           │
│         │  (120px) │               │
│         ╰──────────╯               │
│         [Username]                 │
│         Niveau 12 • ⭐ 1450 pts    │
│                                    │
│  ┌─────┬────────┬──────┬────────┐  │
│  │ 42  │  18    │  24  │  73%   │  │
│  │Jeux │Victoires│Défaites│ W/R │  │
│  └─────┴────────┴──────┴────────┘  │
│                                    │
│  ─── Achievements récents ───      │
│  🏆 Premier sang  🔥 10 victoires  │
│                                    │
│  ─── Statistiques ───              │
│  Mot le + trouvé : "poisson"       │
│  Meilleur score  : 110 pts         │
│  Streak actuelle : 🔥 3 jours      │
└────────────────────────────────────┘
```

**Avatars disponibles :**
- 🦉 Hibou (défaut, gratuit)
- 🐺 Loup (gratuit)
- 🦊 Renard (100 gemmes)
- 🐉 Dragon (250 gemmes)
- 🧙 Mage (300 gemmes)
- 🦁 Lion (200 gemmes)
- 🐧 Manchot (150 gemmes)
- 🦋 Papillon (180 gemmes)

---

### 6.7 Achievements Screen

**Référence design :** Cards avec icône, titre, description, barre de progression, état (locked/unlocked)

**Liste des achievements :**

```typescript
// data/achievements.ts
export const ACHIEVEMENTS = [
  // VICTOIRES
  { id: 'first_win',     icon: '🏆', title: 'Premier sang',     desc: 'Gagner ta première partie',          target: 1,   reward: { coins: 50 } },
  { id: 'win_10',        icon: '🥇', title: '10 Victoires',     desc: 'Gagner 10 parties',                  target: 10,  reward: { coins: 200 } },
  { id: 'win_50',        icon: '👑', title: 'Maître des mots',  desc: 'Gagner 50 parties',                  target: 50,  reward: { gems: 20 } },
  { id: 'win_streak_5',  icon: '🔥', title: 'En feu !',         desc: '5 victoires consécutives',           target: 5,   reward: { gems: 10 } },

  // MOTS
  { id: 'words_100',     icon: '📝', title: 'Vocabulaire',      desc: 'Trouver 100 mots au total',          target: 100, reward: { coins: 100 } },
  { id: 'words_1000',    icon: '📚', title: 'Encyclopédie',     desc: 'Trouver 1000 mots au total',         target: 1000,reward: { gems: 30 } },
  { id: 'score_100',     icon: '⚡', title: 'Centenaire',       desc: 'Scorer 100 pts en une partie',       target: 100, reward: { coins: 150 } },
  { id: 'perfect_round', icon: '💎', title: 'Parfait',          desc: 'Trouver tous les mots d\'une déf',   target: 1,   reward: { gems: 15 } },
  { id: 'first_word',    icon: '🚀', title: 'Premier mot',      desc: 'Être le 1er à trouver un mot',       target: 1,   reward: { coins: 30 } },

  // SOCIAL
  { id: 'play_10',       icon: '🎮', title: 'Habitué',          desc: 'Jouer 10 parties',                   target: 10,  reward: { coins: 80 } },
  { id: 'play_100',      icon: '🎯', title: 'Compétiteur',      desc: 'Jouer 100 parties',                  target: 100, reward: { gems: 25 } },
  { id: 'daily_7',       icon: '📅', title: 'Semaine complète', desc: 'Jouer 7 jours consécutifs',          target: 7,   reward: { gems: 20 } },
  { id: 'add_friend',    icon: '🤝', title: 'Ami',              desc: 'Ajouter un ami',                     target: 1,   reward: { coins: 50 } },

  // SKINS
  { id: 'first_skin',    icon: '🎨', title: 'Styliste',         desc: 'Débloquer ton premier skin',         target: 1,   reward: { coins: 100 } },
  { id: 'all_skins',     icon: '✨', title: 'Collectionneur',   desc: 'Débloquer tous les skins',           target: 8,   reward: { gems: 50 } },
]
```

**AchievementCard component :**
```tsx
const AchievementCard = ({ achievement, progress, unlocked }: Props) => (
  <MotiView
    animate={{ opacity: unlocked ? 1 : 0.5 }}
    style={[styles.card, unlocked && styles.cardUnlocked]}
  >
    <Text style={styles.icon}>{achievement.icon}</Text>
    <View style={styles.info}>
      <Text style={styles.title}>{achievement.title}</Text>
      <Text style={styles.desc}>{achievement.desc}</Text>
      <ProgressBar value={progress} max={achievement.target} />
    </View>
    {unlocked ? (
      <View style={styles.check}><Text>✓</Text></View>
    ) : (
      <Text style={styles.reward}>+{achievement.reward.coins ?? ''}{achievement.reward.gems ?? ''}💎</Text>
    )}
  </MotiView>
)
```

---

### 6.8 Quests Screen

Les quêtes sont des objectifs journaliers/hebdomadaires qui se renouvellent.

```typescript
// data/quests.ts
export const DAILY_QUESTS = [
  { id: 'daily_3_wins',    icon: '⚔️', title: 'Triomphe du jour',  desc: 'Gagner 3 parties aujourd\'hui',      target: 3,  reward: { coins: 100 } },
  { id: 'daily_20_words',  icon: '📝', title: 'Logorrhée',         desc: 'Trouver 20 mots aujourd\'hui',       target: 20, reward: { coins: 60 } },
  { id: 'daily_login',     icon: '☀️', title: 'Bonne journée',     desc: 'Se connecter aujourd\'hui',          target: 1,  reward: { coins: 30 } },
  { id: 'daily_5_games',   icon: '🎮', title: 'Marathon',          desc: 'Jouer 5 parties aujourd\'hui',       target: 5,  reward: { coins: 80 } },
]

export const WEEKLY_QUESTS = [
  { id: 'weekly_50_words', icon: '🏅', title: 'Bibliothèque',      desc: 'Trouver 50 mots cette semaine',      target: 50,  reward: { gems: 10 } },
  { id: 'weekly_10_wins',  icon: '🌟', title: 'Semaine parfaite',  desc: 'Gagner 10 parties cette semaine',     target: 10,  reward: { gems: 15 } },
  { id: 'weekly_7_days',   icon: '🔥', title: 'Dédication',        desc: 'Jouer 7 jours cette semaine',        target: 7,   reward: { gems: 20 } },
]
```

**Layout quêtes :**
```
┌────────────────────────────────────┐
│  📋 Quêtes              [📅 Resets dans 14h] │
│                                    │
│  ─── Journalières ──────────────── │
│  ☀️ Bonne journée                  │
│  Se connecter aujourd'hui          │
│  [████████████████████] 1/1 ✓      │
│  +30 🍬                            │
│                                    │
│  📝 Logorrhée                      │
│  Trouver 20 mots aujourd'hui       │
│  [████████░░░░░░░░░░░░] 14/20      │
│  +60 🍬                            │
│                                    │
│  ─── Hebdomadaires ─────────────── │
│  🌟 Semaine parfaite               │
│  Gagner 10 parties                 │
│  [█████░░░░░░░░░░░░░░░] 5/10       │
│  +15 💎                            │
└────────────────────────────────────┘
```

---

### 6.9 Shop Screen (Skins)

**Skins de la boule de cristal :**

```typescript
// data/skins.ts
export const SKINS: Skin[] = [
  {
    id: 'crystal',
    name: 'Boule de Cristal',
    icon: '🔮',
    locked: false,
    price: 0,
    // Couleurs
    background: ['#1a0a3d', '#2d1060', '#0d0828'],
    orbGradient: ['rgba(180,140,255,0.12)', 'rgba(90,50,180,0.3)', 'rgba(15,8,40,0.92)'],
    orbGlow: 'rgba(120,70,255,0.3)',
    wordAppear: 'fade-scale',
    particleColor: 'rgba(180,140,255,0.4)',
  },
  {
    id: 'ocean',
    name: 'Abysses',
    icon: '🌊',
    locked: false,
    price: 0,
    background: ['#051520', '#0a2a40', '#041018'],
    orbGradient: ['rgba(56,189,248,0.12)', 'rgba(14,116,144,0.3)', 'rgba(3,22,35,0.92)'],
    orbGlow: 'rgba(14,165,233,0.3)',
    wordAppear: 'bubble-up',
    particleColor: 'rgba(56,189,248,0.4)',
  },
  {
    id: 'lava',
    name: 'Cœur de Lave',
    icon: '🌋',
    locked: true,
    price: 199, // centimes → 1.99€
    background: ['#1a0800', '#3a1000', '#100500'],
    orbGradient: ['rgba(251,146,60,0.15)', 'rgba(194,65,12,0.4)', 'rgba(20,5,0,0.95)'],
    orbGlow: 'rgba(239,68,68,0.4)',
    wordAppear: 'flame-burst',
    particleColor: 'rgba(251,146,60,0.5)',
  },
  {
    id: 'galaxy',
    name: 'Galaxie',
    icon: '🌌',
    locked: true,
    price: 199,
    background: ['#050010', '#0a0025', '#030008'],
    orbGradient: ['rgba(139,92,246,0.1)', 'rgba(30,15,80,0.4)', 'rgba(5,0,20,0.95)'],
    orbGlow: 'rgba(139,92,246,0.35)',
    wordAppear: 'crystallize',
    particleColor: 'rgba(196,181,253,0.4)',
  },
  {
    id: 'neon',
    name: 'Neon Arcade',
    icon: '⚡',
    locked: true,
    price: 149,
    background: ['#000508', '#00100c', '#000308'],
    orbGradient: ['rgba(0,255,200,0.1)', 'rgba(0,80,60,0.3)', 'rgba(0,10,8,0.95)'],
    orbGlow: 'rgba(0,255,170,0.4)',
    wordAppear: 'fade-scale',
    particleColor: 'rgba(0,255,200,0.5)',
  },
  {
    id: 'frozen',
    name: 'Cristal de Glace',
    icon: '🧊',
    locked: true,
    price: 149,
    background: ['#050d1a', '#0a1a2e', '#030810'],
    orbGradient: ['rgba(186,230,253,0.12)', 'rgba(56,130,180,0.25)', 'rgba(3,15,30,0.95)'],
    orbGlow: 'rgba(125,211,252,0.3)',
    wordAppear: 'crystallize',
    particleColor: 'rgba(186,230,253,0.5)',
  },
]
```

**Layout Shop :**
```
Grille 2 colonnes
Carte skin :
┌──────────────────┐
│  🌋              │
│  [PREVIEW ORB]   │  ← mini orbe animée
│  Cœur de Lave    │
│  1.99€           │
│  [Acheter]       │
└──────────────────┘
```

Skin actif → border glow + badge "Actif".
Skin non possédé → overlay lock semi-transparent.

---

### 6.10 Leaderboard Screen

Le leaderboard est accessible depuis l'onglet **Social** de la bottom nav. Il combine classement global, classement d'amis, et historique des parties récentes.

#### Layout général

```
┌────────────────────────────────────┐
│  🏆 Classement                     │
│                                    │
│  [Global] [Amis] [Hebdo] [Alltime] │
│   ──────                           │
│                                    │
│  🥇 ┌──────────────────────────┐   │
│     │ 🦁 DragonMaster_69       │   │
│     │ ⭐ 12,450 pts  • 234 wins │   │
│     └──────────────────────────┘   │
│  🥈 ┌──────────────────────────┐   │
│     │ 🐺 WordWolf              │   │
│     │ ⭐ 11,200 pts  • 198 wins │   │
│     └──────────────────────────┘   │
│  🥉 ...                            │
│                                    │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│  📍 #47 🦉 Toi                     │
│     ⭐ 1,450 pts  • 42 wins         │
│                                    │
└────────────────────────────────────┘
```

**Position du joueur courant** épinglée en bas de l'écran, toujours visible même si il est classé 47ème.

#### Onglets du leaderboard

| Onglet | Description | Période |
|--------|-------------|---------|
| **Global** | Tous les joueurs, trié par score total | Depuis toujours |
| **Amis** | Seulement les amis ajoutés | Depuis toujours |
| **Hebdo** | Tous les joueurs, score de la semaine | Reset chaque lundi 00h00 UTC |
| **Alltime** | Top scores d'une seule partie | Meilleur score absolu |

#### Schéma Supabase — leaderboard

```sql
-- Vue matérialisée pour performance (recalculée toutes les heures)
CREATE MATERIALIZED VIEW leaderboard_global AS
SELECT
  p.id,
  p.username,
  p.avatar_id,
  p.total_score,
  p.games_won,
  p.games_played,
  RANK() OVER (ORDER BY p.total_score DESC) AS rank
FROM profiles p
WHERE p.games_played > 0;

-- Index pour refresh rapide
CREATE UNIQUE INDEX ON leaderboard_global(id);

-- Leaderboard hebdomadaire (basé sur les parties de la semaine)
CREATE MATERIALIZED VIEW leaderboard_weekly AS
SELECT
  rp.player_id AS id,
  p.username,
  p.avatar_id,
  SUM(rp.score) AS weekly_score,
  COUNT(CASE WHEN rp.score = MAX(rp.score) OVER (PARTITION BY gr.id) THEN 1 END) AS weekly_wins,
  RANK() OVER (ORDER BY SUM(rp.score) DESC) AS rank
FROM room_players rp
JOIN profiles p ON p.id = rp.player_id
JOIN game_rooms gr ON gr.id = rp.room_id
WHERE gr.created_at >= date_trunc('week', NOW())
  AND gr.status = 'finished'
GROUP BY rp.player_id, p.username, p.avatar_id;

-- Table amis
CREATE TABLE friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES profiles,
  friend_id UUID REFERENCES profiles,
  status TEXT DEFAULT 'pending',  -- pending | accepted
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(player_id, friend_id)
);

-- Meilleur score d'une partie (alltime)
CREATE MATERIALIZED VIEW leaderboard_alltime AS
SELECT
  rp.player_id AS id,
  p.username,
  p.avatar_id,
  MAX(rp.score) AS best_score,
  RANK() OVER (ORDER BY MAX(rp.score) DESC) AS rank
FROM room_players rp
JOIN profiles p ON p.id = rp.player_id
WHERE rp.score > 0
GROUP BY rp.player_id, p.username, p.avatar_id;
```

#### Queries Supabase

```typescript
// lib/leaderboard.ts

// Top 50 global
export const fetchGlobalLeaderboard = async () => {
  const { data } = await supabase
    .from('leaderboard_global')
    .select('*')
    .order('rank', { ascending: true })
    .limit(50)
  return data
}

// Rang du joueur courant
export const fetchMyRank = async (playerId: string, type: LeaderboardType) => {
  const view = {
    global: 'leaderboard_global',
    weekly: 'leaderboard_weekly',
    alltime: 'leaderboard_alltime',
  }[type]

  const { data } = await supabase
    .from(view)
    .select('rank, total_score, games_won')
    .eq('id', playerId)
    .single()
  return data
}

// Leaderboard amis
export const fetchFriendsLeaderboard = async (playerId: string) => {
  // 1. Récupérer les IDs des amis
  const { data: friends } = await supabase
    .from('friendships')
    .select('friend_id')
    .eq('player_id', playerId)
    .eq('status', 'accepted')

  const friendIds = [playerId, ...(friends?.map(f => f.friend_id) ?? [])]

  // 2. Leaderboard filtré
  const { data } = await supabase
    .from('leaderboard_global')
    .select('*')
    .in('id', friendIds)
    .order('total_score', { ascending: false })

  return data
}
```

#### Composant LeaderboardRow

```tsx
// components/leaderboard/LeaderboardRow.tsx
import Animated, { FadeInDown } from 'react-native-reanimated'
import { MaterialCommunityIcons } from '@expo/vector-icons'

interface LeaderboardRowProps {
  entry: LeaderboardEntry
  rank: number
  isCurrentPlayer: boolean
  index: number  // pour le délai d'animation
}

const MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }

const LeaderboardRow = ({ entry, rank, isCurrentPlayer, index }: LeaderboardRowProps) => (
  <Animated.View
    entering={FadeInDown.delay(index * 60).springify().damping(14)}
    style={[
      styles.row,
      isCurrentPlayer && styles.rowHighlighted,
      rank <= 3 && styles.rowTop,
    ]}
  >
    {/* Rang */}
    <View style={styles.rankCol}>
      {rank <= 3
        ? <Text style={styles.medal}>{MEDAL[rank]}</Text>
        : <Text style={[styles.rankNum, isCurrentPlayer && styles.rankNumMe]}>#{rank}</Text>
      }
    </View>

    {/* Avatar */}
    <Text style={styles.avatar}>{AVATARS[entry.avatar_id]}</Text>

    {/* Infos */}
    <View style={styles.info}>
      <Text style={[styles.username, isCurrentPlayer && styles.usernameMe]}>
        {entry.username}
        {isCurrentPlayer && <Text style={styles.youBadge}> (toi)</Text>}
      </Text>
      <View style={styles.stats}>
        <MaterialCommunityIcons name="star" size={12} color="#fbbf24" />
        <Text style={styles.score}>{entry.total_score.toLocaleString()} pts</Text>
        <Text style={styles.dot}>·</Text>
        <MaterialCommunityIcons name="trophy" size={12} color="#a78bfa" />
        <Text style={styles.wins}>{entry.games_won} wins</Text>
      </View>
    </View>

    {/* Glow pour le top 3 */}
    {rank === 1 && <View style={styles.goldGlow} />}
  </Animated.View>
)

// Rang épinglé en bas (joueur courant)
const PinnedMyRank = ({ rank, score, wins }: MyRankProps) => (
  <Animated.View
    entering={FadeInDown.springify()}
    style={styles.pinnedRow}
  >
    <View style={styles.pinnedDivider} />
    <View style={styles.pinnedContent}>
      <Text style={styles.pinnedLabel}>📍 Ma position</Text>
      <Text style={styles.pinnedRank}>#{rank}</Text>
      <Text style={styles.pinnedScore}>{score.toLocaleString()} pts • {wins} wins</Text>
    </View>
  </Animated.View>
)
```

#### Rafraîchissement des données

```typescript
// hooks/useLeaderboard.ts
export const useLeaderboard = (type: LeaderboardType) => {
  const [data, setData] = useState<LeaderboardEntry[]>([])
  const [myRank, setMyRank] = useState<MyRankData | null>(null)
  const [loading, setLoading] = useState(true)
  const { profile } = usePlayerStore()

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const [entries, rank] = await Promise.all([
        type === 'friends'
          ? fetchFriendsLeaderboard(profile!.id)
          : fetchLeaderboard(type),
        fetchMyRank(profile!.id, type),
      ])
      setData(entries ?? [])
      setMyRank(rank)
      setLoading(false)
    }
    load()
  }, [type])

  // Realtime — mise à jour du score après une partie
  useEffect(() => {
    const channel = supabase
      .channel('leaderboard-updates')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${profile?.id}`,
      }, () => load())  // refetch si mon profil change
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  return { data, myRank, loading }
}
```

#### Système d'amis

```
┌────────────────────────────────────┐
│  👥 Amis                 [+ Ajouter]│
│                                    │
│  ┌──────────────────────────────┐  │
│  │ 🦊 RenardFuté               │  │
│  │ En ligne • Score: 8,200     │  │
│  │ [Défier]  [Voir profil]     │  │
│  └──────────────────────────────┘  │
│                                    │
│  ┌──────────────────────────────┐  │
│  │ 🐧 Manchot42                │  │
│  │ Hors ligne • Il y a 2h      │  │
│  └──────────────────────────────┘  │
│                                    │
│  ─── Demandes reçues (2) ───       │
│  🐉 DragonMaster_69  [✓] [✗]      │
│  🦁 LionFierce       [✓] [✗]      │
└────────────────────────────────────┘
```

**Ajouter un ami** — via code joueur unique (ex: `RDH#4721`) ou via recherche username.

```typescript
// Générer un code unique par joueur à la création du profil
const generatePlayerCode = (username: string) => {
  const suffix = Math.floor(1000 + Math.random() * 9000)
  return `${username}#${suffix}`
}

// Champ à ajouter dans la table profiles :
// player_code TEXT UNIQUE  (ex: "RDH#4721")
```

#### States du leaderboard dans Zustand

```typescript
// stores/leaderboardStore.ts
interface LeaderboardState {
  activeTab: 'global' | 'friends' | 'weekly' | 'alltime'
  globalData: LeaderboardEntry[]
  friendsData: LeaderboardEntry[]
  weeklyData: LeaderboardEntry[]
  alltimeData: LeaderboardEntry[]
  myRanks: Record<string, MyRankData>
  friends: Friend[]
  pendingRequests: FriendRequest[]

  // Actions
  setActiveTab: (tab: LeaderboardTab) => void
  loadLeaderboard: (tab: LeaderboardTab) => Promise<void>
  loadFriends: () => Promise<void>
  sendFriendRequest: (playerCode: string) => Promise<void>
  acceptFriendRequest: (requestId: string) => Promise<void>
  declineFriendRequest: (requestId: string) => Promise<void>
}
```

---

```typescript
// data/questions.ts
export interface Question {
  id: number
  definition: string
  answers: string[]     // mots acceptés (avec variantes)
  bonus: string[]       // mots rares = x2 points
  difficulty: 1 | 2 | 3
  category: string
}

export const QUESTIONS: Question[] = [
  {
    id: 1,
    definition: "Animaux qui vivent dans l'eau",
    answers: ["poisson","poissons","baleine","baleines","requin","requins",
              "dauphin","dauphins","pieuvre","pieuvres","méduse","méduses",
              "thon","saumon","anguille","tortue","homard","crabe","crevette",
              "raie","espadon","phoque","narval","orca","murène","langouste"],
    bonus: ["narval","murène","lamproie"],
    difficulty: 1,
    category: "nature",
  },
  {
    id: 2,
    definition: "Fruits que l'on mange",
    answers: ["pomme","poire","banane","orange","citron","fraise","cerise",
              "raisin","mangue","ananas","kiwi","pastèque","melon","pêche",
              "abricot","prune","figue","grenade","papaye","litchi","coco"],
    bonus: ["litchi","carambole","durian"],
    difficulty: 1,
    category: "nature",
  },
  {
    id: 3,
    definition: "Métiers qui soignent",
    answers: ["médecin","docteur","infirmier","infirmière","chirurgien",
              "dentiste","kiné","kinésithérapeute","pharmacien","vétérinaire",
              "cardiologue","pédiatre","urgentiste","radiologue"],
    bonus: ["orthodontiste","ophtalmologue"],
    difficulty: 2,
    category: "metiers",
  },
  {
    id: 4,
    definition: "Choses qui volent dans le ciel",
    answers: ["avion","oiseau","papillon","hélicoptère","drone","fusée",
              "cerf-volant","ballon","nuage","abeille","mouche","libellule",
              "chauve-souris","satellite","étoile","comète"],
    bonus: ["zeppelin","deltaplane"],
    difficulty: 1,
    category: "nature",
  },
  {
    id: 5,
    definition: "Sports pratiqués en équipe",
    answers: ["football","basketball","volleyball","rugby","handball","hockey",
              "baseball","cricket","polo","waterpolo","pelote"],
    bonus: ["ultimate","tchoukball"],
    difficulty: 2,
    category: "sport",
  },
  // ... +50 questions minimum pour le MVP
]
```

---

## 8. Couleurs des joueurs

```typescript
export const PLAYER_COLORS = [
  '#a78bfa', // violet (joueur 1 = toi)
  '#f87171', // rouge
  '#34d399', // vert
  '#fbbf24', // or
  '#60a5fa', // bleu
  '#f472b6', // rose
]
```

Attribution automatique à la création de la room — index = ordre de rejoindre.

---

## 9. Flows utilisateur

### 9.1 Premier lancement
```
Splash → Home → Tutorial auto (si tutorial_done = false)
Tutorial step 1→4 → Home → Banner "COMBATTRE" → Lobby → Game
```

### 9.2 Partie normale
```
Home → tap COMBATTRE → Lobby (matchmaking 30s max)
→ Countdown 3-2-1 → Game (60s)
→ Timer end → Winner Reveal (5s)
→ Résultats + récompenses → Home
```

### 9.3 Matchmaking
```typescript
// Logique simple pour MVP
async function findOrCreateRoom(playerId: string) {
  // 1. Chercher une room en attente avec < 4 joueurs
  const { data: room } = await supabase
    .from('game_rooms')
    .select('*, room_players(*)')
    .eq('status', 'waiting')
    .lt('room_players.count', 4)
    .single()

  if (room) {
    // Rejoindre la room existante
    await joinRoom(room.id, playerId)
    return room.id
  } else {
    // Créer une nouvelle room
    const newRoom = await createRoom(playerId)
    return newRoom.id
  }
}
```

### 9.4 Synchronisation du timer
```typescript
// CRITIQUE : le timer se base sur le timestamp serveur
// Pas sur le temps local du device

const syncTimer = (timerStart: string, duration: number) => {
  const startMs = new Date(timerStart).getTime()
  const nowMs = Date.now()
  const elapsed = (nowMs - startMs) / 1000
  const remaining = Math.max(0, duration - elapsed)
  return remaining
}
```

---

## 10. Monétisation

### Currency
- **Pièces 🍬** : monnaie soft, gagnée en jouant, utilisée pour des items cosmétiques mineurs
- **Gemmes 💎** : monnaie premium, achetée ou gagnée via achievements, utilisée pour skins/avatars
- **Vies 🩷** : système optionnel, 5 vies max, se rechargent (30min/vie)

### Prix des skins
- Crystal Ball : GRATUIT
- Ocean Abyss : GRATUIT
- Neon Arcade : 149 gems (≈1.49€ si 100 gems = 1€)
- Frozen : 149 gems
- Lava Core : 199 gems
- Galaxy : 199 gems
- Pack Cosmos (Galaxy + Frozen) : 299 gems (-25%)
- Pack Elements (Lava + Ocean premium) : 299 gems (-25%)
- Tous les skins : 599 gems (-35%)

### Packs de gemmes
- 80 gems : 0.99€
- 200 gems : 1.99€
- 500 gems : 4.99€
- 1200 gems : 9.99€

---

## 11. Internationalisation (i18n) — Français + Anglais

### Setup

```bash
pnpm add i18next react-i18next
pnpm expo install expo-localization
```

### Structure des fichiers de traduction

```
src/
└── i18n/
    ├── index.ts            ← config i18next
    ├── fr.ts               ← traductions françaises (langue par défaut)
    └── en.ts               ← traductions anglaises
```

### Configuration i18next

```typescript
// src/i18n/index.ts
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import * as Localization from 'expo-localization'
import { fr } from './fr'
import { en } from './en'

const languageTag = Localization.getLocales()[0]?.languageTag ?? 'fr'
// Supporter 'fr' et 'en', fallback sur 'en'
const lng = languageTag.startsWith('fr') ? 'fr' : 'en'

i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v4',
    resources: { fr: { translation: fr }, en: { translation: en } },
    lng,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  })

export default i18n
```

### Fichier de traduction — Exemple complet

```typescript
// src/i18n/fr.ts
export const fr = {
  // ── SPLASH ──
  splash: {
    tagline: 'Duel de mots en temps réel',
    tap: 'Appuie pour commencer',
  },

  // ── HOME ──
  home: {
    fight: 'COMBATTRE',
    stage: 'Étape {{n}}',
    quests: 'QUÊTES',
    tutorial: {
      title: 'Progression du tutoriel',
      step: 'Étape {{current}} / {{total}}',
    },
  },

  // ── NAVIGATION ──
  nav: {
    home: 'Accueil',
    profile: 'Profil',
    friends: 'Amis',
    shop: 'Shop',
    items: 'Objets',
  },

  // ── GAME ──
  game: {
    definition_label: 'Définition',
    placeholder: 'Tape un mot...',
    already_used: 'Déjà trouvé !',
    invalid: 'Mot invalide',
    time_up: 'Temps écoulé !',
  },

  // ── WINNER ──
  winner: {
    label: 'Vainqueur',
    score: 'Score',
    words_found_one: '{{count}} mot trouvé',
    words_found_other: '{{count}} mots trouvés',
    replay: '✦ Rejouer',
    quit: 'Quitter',
  },

  // ── TUTORIAL ──
  tutorial: {
    skip: 'Passer',
    next: 'Suivant →',
    play_now: 'Jouer maintenant ! ✦',
    steps: {
      orb: {
        title: 'La Boule de Cristal',
        sub: 'Étape 1 sur 4',
        desc: 'La **boule de cristal** est le cœur du jeu ! C\'est là que tous les mots apparaissent — les tiens et ceux de tes adversaires, chacun avec sa **couleur**.',
      },
      words: {
        title: 'Trouver des mots',
        sub: 'Étape 2 sur 4',
        desc: 'Une **définition** s\'affiche en haut. Tape le maximum de mots qui correspondent avant la fin du chrono !',
      },
      timer: {
        title: 'Le Chrono Racing',
        sub: 'Étape 3 sur 4',
        desc: '**60 secondes**, chaque mot = **+10 points**. Les adversaires jouent en même temps — sois plus rapide et plus inventif !',
      },
      winner: {
        title: 'Le Vainqueur',
        sub: 'Étape 4 sur 4',
        desc: 'À la fin du chrono, le plus de points gagne ! Remporte des **pièces 🍬** et des **gemmes 💎** pour débloquer de nouveaux skins.',
      },
    },
  },

  // ── ACHIEVEMENTS ──
  achievements: {
    title: 'Achievements',
    locked: 'Verrouillé',
    unlocked: 'Débloqué',
    progress: '{{current}} / {{total}}',
    reward: '+{{amount}}',
  },

  // ── QUESTS ──
  quests: {
    title: 'Quêtes',
    daily: 'Journalières',
    weekly: 'Hebdomadaires',
    resets_in: 'Renouvellement dans {{time}}',
    claim: 'Réclamer',
    completed: 'Terminée ✓',
  },

  // ── SHOP ──
  shop: {
    title: 'Boutique',
    skins: 'Skins',
    avatars: 'Avatars',
    active: 'Actif',
    buy: 'Acheter',
    unlock: 'Débloquer',
    free: 'Gratuit',
    gems_required: '{{amount}} 💎',
  },

  // ── ADS ──
  ads: {
    watch_for_coins: 'Regarder une pub\npour +50 🍬',
    watch_for_life: 'Regarder une pub\npour 1 vie 🩷',
    watch_for_continue: 'Regarder une pub\npour continuer',
    loading: 'Chargement...',
    not_available: 'Pub non disponible',
    thanks: 'Merci ! Voici ta récompense',
  },

  // ── SETTINGS ──
  settings: {
    title: 'Paramètres',
    language: 'Langue',
    sound: 'Sons',
    music: 'Musique',
    notifications: 'Notifications',
    privacy: 'Politique de confidentialité',
    terms: 'Conditions d\'utilisation',
    version: 'Version {{v}}',
  },

  // ── ERRORS ──
  errors: {
    connection: 'Problème de connexion',
    retry: 'Réessayer',
    matchmaking_timeout: 'Aucun adversaire trouvé, un bot te remplace...',
  },
}
```

```typescript
// src/i18n/en.ts
export const en = {
  splash: {
    tagline: 'Real-time word duel',
    tap: 'Tap to start',
  },
  home: {
    fight: 'BATTLE',
    stage: 'Stage {{n}}',
    quests: 'QUESTS',
    tutorial: {
      title: 'Tutorial progress',
      step: 'Step {{current}} / {{total}}',
    },
  },
  nav: {
    home: 'Home',
    profile: 'Profile',
    friends: 'Friends',
    shop: 'Shop',
    items: 'Items',
  },
  game: {
    definition_label: 'Definition',
    placeholder: 'Type a word...',
    already_used: 'Already found!',
    invalid: 'Invalid word',
    time_up: 'Time\'s up!',
  },
  winner: {
    label: 'Winner',
    score: 'Score',
    words_found_one: '{{count}} word found',
    words_found_other: '{{count}} words found',
    replay: '✦ Play again',
    quit: 'Quit',
  },
  tutorial: {
    skip: 'Skip',
    next: 'Next →',
    play_now: 'Play now! ✦',
    steps: {
      orb: {
        title: 'The Crystal Ball',
        sub: 'Step 1 of 4',
        desc: 'The **crystal ball** is the heart of the game! All words appear here in real time — yours and your opponents\', each with their own **color**.',
      },
      words: {
        title: 'Find words',
        sub: 'Step 2 of 4',
        desc: 'A **definition** appears at the top. Type as many matching words as you can before time runs out!',
      },
      timer: {
        title: 'Racing Timer',
        sub: 'Step 3 of 4',
        desc: '**60 seconds**, each word = **+10 points**. Opponents play simultaneously — be faster and more creative!',
      },
      winner: {
        title: 'The Winner',
        sub: 'Step 4 of 4',
        desc: 'When time runs out, the player with the most points wins! Earn **coins 🍬** and **gems 💎** to unlock new skins.',
      },
    },
  },
  achievements: {
    title: 'Achievements',
    locked: 'Locked',
    unlocked: 'Unlocked',
    progress: '{{current}} / {{total}}',
    reward: '+{{amount}}',
  },
  quests: {
    title: 'Quests',
    daily: 'Daily',
    weekly: 'Weekly',
    resets_in: 'Resets in {{time}}',
    claim: 'Claim',
    completed: 'Done ✓',
  },
  shop: {
    title: 'Shop',
    skins: 'Skins',
    avatars: 'Avatars',
    active: 'Active',
    buy: 'Buy',
    unlock: 'Unlock',
    free: 'Free',
    gems_required: '{{amount}} 💎',
  },
  ads: {
    watch_for_coins: 'Watch an ad\nfor +50 🍬',
    watch_for_life: 'Watch an ad\nfor 1 life 🩷',
    watch_for_continue: 'Watch an ad\nto continue',
    loading: 'Loading...',
    not_available: 'Ad not available',
    thanks: 'Thanks! Here\'s your reward',
  },
  settings: {
    title: 'Settings',
    language: 'Language',
    sound: 'Sound',
    music: 'Music',
    notifications: 'Notifications',
    privacy: 'Privacy policy',
    terms: 'Terms of service',
    version: 'Version {{v}}',
  },
  errors: {
    connection: 'Connection issue',
    retry: 'Retry',
    matchmaking_timeout: 'No opponent found, adding a bot...',
  },
}
```

### Utilisation dans les composants

```tsx
import { useTranslation } from 'react-i18next'

const HomeScreen = () => {
  const { t } = useTranslation()

  return (
    <TouchableOpacity onPress={startGame}>
      <Text>{t('home.fight')}</Text>      {/* "COMBATTRE" ou "BATTLE" */}
    </TouchableOpacity>
  )
}

// Avec interpolation
t('home.stage', { n: 3 })              // "Étape 3" ou "Stage 3"
t('winner.words_found', { count: 5 })  // "5 mots trouvés" ou "5 words found"
```

### Sélecteur de langue dans Settings

```tsx
// Sauvegarder le choix dans AsyncStorage + playerStore
const LanguageSelector = () => {
  const { i18n } = useTranslation()

  const toggle = async () => {
    const next = i18n.language === 'fr' ? 'en' : 'fr'
    await i18n.changeLanguage(next)
    await AsyncStorage.setItem('language', next)
  }

  return (
    <TouchableOpacity onPress={toggle}>
      <Text>{i18n.language === 'fr' ? '🇫🇷 Français' : '🇬🇧 English'}</Text>
    </TouchableOpacity>
  )
}
```

> **Note :** Les **questions** (définitions + réponses) doivent exister en version FR et EN dans `data/questions.ts`. La langue active détermine quelle liste est utilisée pendant la partie.

---

## 12. Rewarded Ads (AdMob)

### Package

```
react-native-google-mobile-ads
```

⚠️ **NE PAS utiliser `expo-ads-admob`** — supprimé depuis SDK 46. Le seul package correct pour Expo EAS Build est `react-native-google-mobile-ads` par Invertase.

### Configuration app.json

```json
{
  "expo": {
    "plugins": [
      [
        "expo-build-properties",
        {
          "ios": { "useFrameworks": "static" },
          "android": {
            "extraProguardRules": "-keep class com.google.android.gms.internal.consent_sdk.** { *; }"
          }
        }
      ],
      [
        "react-native-google-mobile-ads",
        {
          "androidAppId": "ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX",
          "iosAppId": "ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX",
          "delayAppMeasurementInit": true
        }
      ]
    ]
  }
}
```

### Initialisation (une seule fois au démarrage)

```typescript
// app/_layout.tsx
import mobileAds from 'react-native-google-mobile-ads'
import { requestTrackingPermissionsAsync } from 'expo-tracking-transparency'

export default function RootLayout() {
  useEffect(() => {
    const initAds = async () => {
      // iOS : demander ATT consent
      if (Platform.OS === 'ios') {
        await requestTrackingPermissionsAsync()
      }
      // Initialiser AdMob
      await mobileAds().initialize()
    }
    initAds()
  }, [])

  return <Stack />
}
```

### Hook useRewardedAd

```typescript
// hooks/useRewardedAd.ts
import { useEffect, useState, useCallback } from 'react'
import {
  RewardedAd,
  RewardedAdEventType,
  TestIds,
} from 'react-native-google-mobile-ads'
import { Platform } from 'react-native'

const AD_UNIT_ID = __DEV__
  ? TestIds.REWARDED
  : Platform.select({
      ios: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX',
      android: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX',
    })!

export function useRewardedAd(onReward: (type: string, amount: number) => void) {
  const [loaded, setLoaded] = useState(false)
  const [ad, setAd] = useState<RewardedAd | null>(null)

  const loadAd = useCallback(() => {
    const rewardedAd = RewardedAd.createForAdRequest(AD_UNIT_ID, {
      keywords: ['game', 'word', 'puzzle'],
    })

    const unsubLoaded = rewardedAd.addAdEventListener(
      RewardedAdEventType.LOADED,
      () => setLoaded(true)
    )

    const unsubEarned = rewardedAd.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      (reward) => {
        onReward(reward.type, reward.amount)
      }
    )

    // Recharger automatiquement après affichage
    const unsubClosed = rewardedAd.addAdEventListener(
      'closed' as any,
      () => {
        setLoaded(false)
        loadAd() // précharger la suivante
      }
    )

    rewardedAd.load()
    setAd(rewardedAd)

    return () => {
      unsubLoaded()
      unsubEarned()
      unsubClosed()
    }
  }, [onReward])

  useEffect(() => {
    const cleanup = loadAd()
    return cleanup
  }, [])

  const show = useCallback(() => {
    if (loaded && ad) {
      ad.show()
    }
  }, [loaded, ad])

  return { loaded, show }
}
```

### Points de déclenchement des rewarded ads

Voici les **4 moments** où les rewarded ads apparaissent dans le jeu :

#### 1 — Gagner des pièces (Home Screen)

```tsx
// Bouton sur la HomeScreen : "Regarder une pub pour +50 🍬"
const CoinAdButton = () => {
  const { addCoins } = usePlayerStore()
  const { loaded, show } = useRewardedAd((type, amount) => {
    addCoins(50)
    showToast(t('ads.thanks') + ' +50 🍬')
  })

  return (
    <TouchableOpacity
      onPress={show}
      disabled={!loaded}
      style={[styles.adBtn, !loaded && styles.adBtnDisabled]}
    >
      <MaterialCommunityIcons name="video-plus" size={18} color="#fbbf24" />
      <Text style={styles.adBtnText}>
        {loaded ? t('ads.watch_for_coins') : t('ads.loading')}
      </Text>
    </TouchableOpacity>
  )
}
```

#### 2 — Regagner une vie (quand vies = 0)

```tsx
// Modal qui s'affiche quand le joueur n'a plus de vies
const NoLivesModal = ({ visible, onClose }: Props) => {
  const { addHearts } = usePlayerStore()
  const { loaded, show } = useRewardedAd(() => {
    addHearts(1)
    onClose()
  })

  return (
    <Modal visible={visible} transparent>
      <View style={styles.modal}>
        <Text style={styles.title}>🩷 Plus de vies !</Text>
        <Text style={styles.desc}>Regarde une pub pour obtenir 1 vie</Text>
        <TouchableOpacity onPress={show} disabled={!loaded} style={styles.btn}>
          <Text>{loaded ? t('ads.watch_for_life') : t('ads.loading')}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onClose} style={styles.skip}>
          <Text>Attendre (30min)</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  )
}
```

#### 3 — Continuer après une défaite (Game Over Screen)

```tsx
// Après avoir perdu, avant le résultat final
// Offre 15 secondes supplémentaires en échange d'une pub
const ContinueAdModal = ({ visible, onContinue, onDecline }: Props) => {
  const { loaded, show } = useRewardedAd(() => {
    onContinue() // ajoute 15s au timer, relance la partie
  })

  return (
    <Modal visible={visible} transparent>
      <View style={styles.modal}>
        <Text style={styles.title}>⏱️ +15 secondes ?</Text>
        <TouchableOpacity onPress={show} disabled={!loaded} style={styles.btn}>
          <Text>{loaded ? t('ads.watch_for_continue') : t('ads.loading')}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onDecline}>
          <Text>Non merci</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  )
}
```

#### 4 — Débloquer un skin temporairement (Shop)

```tsx
// Option "Essayer gratuitement 24h" sur un skin verrouillé
const SkinTrialButton = ({ skinId }: { skinId: string }) => {
  const { setTemporarySkin } = useSkinStore()
  const { loaded, show } = useRewardedAd(() => {
    setTemporarySkin(skinId, 24 * 60 * 60 * 1000) // 24h en ms
    showToast(`Skin actif pour 24h ! 🎉`)
  })

  return (
    <TouchableOpacity onPress={show} disabled={!loaded}>
      <Text>🎬 Essayer 24h</Text>
    </TouchableOpacity>
  )
}
```

### Règles UX importantes

- **Jamais forcer une pub** — toujours optionnel et récompensé
- **Cooldown** : max 1 pub toutes les 5 minutes par type (stocker `lastAdTime` dans Zustand)
- **Précharger** l'ad au démarrage de la HomeScreen pour éviter le délai au moment du tap
- **Fallback** : si la pub ne charge pas (`!loaded`), griser le bouton avec message "Pub non disponible"
- **iOS ATT** : demander le consentement au 1er lancement avant tout (déjà géré dans `_layout.tsx`)

### Zustand — Ad cooldown store

```typescript
// stores/adsStore.ts
interface AdsState {
  lastCoinAd: number    // timestamp
  lastLifeAd: number
  canShowCoinAd: () => boolean
  canShowLifeAd: () => boolean
  recordCoinAd: () => void
  recordLifeAd: () => void
}

const AD_COOLDOWN = 5 * 60 * 1000 // 5 minutes

export const useAdsStore = create<AdsState>((set, get) => ({
  lastCoinAd: 0,
  lastLifeAd: 0,
  canShowCoinAd: () => Date.now() - get().lastCoinAd > AD_COOLDOWN,
  canShowLifeAd: () => Date.now() - get().lastLifeAd > AD_COOLDOWN,
  recordCoinAd: () => set({ lastCoinAd: Date.now() }),
  recordLifeAd: () => set({ lastLifeAd: Date.now() }),
}))
```

1. **Validation des mots** : côté client d'abord (UX fluide), puis confirmé par l'insert en DB
2. **Premier à soumettre un mot** = ce mot est compté pour tous (pas de blocage exclusif)
3. **Mots bonus** (rares) = +20 pts au lieu de +10
4. **Doublons** : si tu envoies un mot déjà soumis par toi → erreur silencieuse
5. **Timer** : synchronisé via timestamp serveur au démarrage de la room
6. **Déconnexion** : si un joueur se déconnecte, il est marqué `offline` mais ses mots restent visibles
7. **Bots** : si < 2 joueurs après 30s de matchmaking → ajouter 1-2 bots (mots soumis via Supabase comme un vrai joueur)

---

## 14. Polices

```typescript
// app.json
{
  "expo": {
    "plugins": [
      ["expo-font", {
        "fonts": [
          "./assets/fonts/FredokaOne-Regular.ttf",
          "./assets/fonts/Nunito-Regular.ttf",
          "./assets/fonts/Nunito-Bold.ttf",
          "./assets/fonts/Nunito-ExtraBold.ttf"
        ]
      }]
    ]
  }
}
```

Utilisation :
- **Fredoka One** → titres, boutons principaux, logo, noms de skins
- **Nunito Bold/ExtraBold** → scores, labels, currency
- **Nunito Regular** → descriptions, tutoriel, textes secondaires

---

## 15. Notes importantes pour Claude Code

1. **La boule de cristal** est le composant le plus critique. Elle doit être faite avec `react-native-skia` pour les effets visuels (gradient radial, glow, blur). Le word feed est une `View` positionnée en `absoluteFill` par-dessus le `Canvas` Skia.

2. **NE PAS utiliser Moti** — Moti 0.30.0 est cassé avec Reanimated v4 + Expo 54. Utiliser **Reanimated v4 directement** : `useSharedValue`, `useAnimatedStyle`, `withSpring`, `withTiming`, `withSequence`, `withDelay`, et les **Layout Animations** (`entering={ZoomIn.delay(x).springify()}`).

3. **Reanimated v4 layout animations** pour les entrées de composants — syntaxe : `<Animated.View entering={FadeIn.delay(300)}>`. Activer dans `app.json` : `"newArchEnabled": true` (déjà par défaut sur Expo 54).

4. **NativeWind** sert pour les layouts des screens (home, profile, shop, quests) mais **pas** pour la boule et les animations de jeu — utiliser `StyleSheet.create` pour celles-ci.

5. **expo-audio** remplace expo-av (supprimé en SDK 54). API hooks : `useAudioPlayer(source)`. **Important :** appeler `seekTo(0)` avant chaque `play()` car expo-audio ne reset pas la position automatiquement après la fin du son.

6. **Le timer doit être côté serveur** — ne jamais faire confiance au timestamp local pour la fin de partie.

7. **Les skins sont un système de thème** — le composant `CrystalBall` reçoit un objet `skin` et applique les couleurs/animations correspondantes. Un seul composant, pas un composant par skin.

8. **Les prototypes HTML** (`racing-word-v2.html`, `racing-word-home.html`) sont la référence visuelle exacte. Tout ce qui est dans ces fichiers doit être reproduit sur mobile avec les équivalents React Native.

9. **Supabase Realtime** — utiliser les `postgres_changes` sur `game_words` pour recevoir les mots en temps réel. Ne pas utiliser `broadcast` pour les mots validés (seulement pour les états éphémères si besoin).

10. **Performance** — le word feed peut accumuler beaucoup d'éléments. Garder max 8 items visibles dans le feed, supprimer les plus anciens de la liste rendue (pas de la DB).

11. **pnpm** — utiliser pnpm exclusivement. Toutes les commandes d'installation sont `pnpm expo install` ou `pnpm add`. Ne pas mixer avec npm ou yarn.

12. **Template SDK 55** — `pnpm create expo-app RacingWord -- --template default@sdk-55`. Structure `/src/app`, Native Tabs API, React 19.2, RN 0.83.1. Le flag `newArchEnabled` n'existe plus dans `app.json` — New Architecture only.

13. **Ne pas activer Hermes v1** — disponible en opt-in SDK 55 mais augmente drastiquement les temps de build natif. Rester sur Hermes standard.

13. **i18n** — `i18next` + `react-i18next` + `expo-localization`. Langue détectée depuis le device, fallback anglais. Voir section 11 pour les fichiers de traduction complets. Les **questions** (définitions + réponses) doivent exister en version FR et EN.

14. **Rewarded Ads** — `react-native-google-mobile-ads`. NE PAS utiliser `expo-ads-admob` (supprimé SDK 46). Toujours précharger la pub au démarrage de la HomeScreen. Respecter le cooldown de 5 minutes entre pubs du même type. Voir section 12.

