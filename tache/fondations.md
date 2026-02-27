# Racing Word — Taches Fondations

> 36 taches pour construire toute l'infrastructure de l'app avant les ecrans UI.

---

## Layer 0 — Types & Constants (aucune dependance)

### T-07: `src/types/game.ts`
- `Question`: id, definition (fr/en), answers[], bonus_words[], difficulty (1/2/3), category
- `WordEntry`: id, room_id, player_id, word, points, submitted_at, player_color
- `RoomPlayer`: id, room_id, player_id, color, score, is_ready, joined_at, username, avatar_id
- `GameRoom`: id, created_by, code, status, question_id, timer_start, timer_duration, created_at
- `GameStatus`: `'waiting' | 'playing' | 'finished'`
- `WordValidationResult`: `'valid' | 'already_used' | 'invalid'`

### T-08: `src/types/player.ts`
- `Profile`: id, username, player_code, avatar_id, skin_id, coins, gems, hearts, total_score, games_played, games_won, current_stage, tutorial_done, created_at
- `Friend`: profile + online status
- `FriendRequest`: id, player_id, friend_id, status, created_at
- `FriendshipStatus`: `'pending' | 'accepted'`
- `Achievement`: id, category, title, description, icon, target, reward_type, reward_amount
- `PlayerAchievement`: player_id, achievement_id, unlocked_at, progress
- `Quest`: id, type, title, description, icon, target, reward_type, reward_amount
- `PlayerQuest`: player_id, quest_id, progress, completed, completed_at

### T-09: `src/types/shop.ts`
- `Skin`: id, name, price_gems, orbGradient, orbGlow, background, particleColor, wordAppearAnimation
- `Avatar`: id, name, emoji, price_gems, unlocked_by_default
- `SkinId`, `AvatarId`: union types

### T-10: `src/types/leaderboard.ts`
- `LeaderboardEntry`: rank, player_id, username, avatar_id, total_score, games_won
- `LeaderboardTab`: `'global' | 'friends' | 'weekly' | 'alltime'`
- `MyRankData`: rank par tab

### T-11: `src/types/navigation.ts`
- Route params pour game/[roomId] et autres routes parametrees

### T-12: `src/constants/theme.ts` (mise a jour)
- Ajouter game colors: orb-purple, orb-blue, gold, game-dark
- Ajouter player colors array (6 couleurs)
- Ajouter font families Fredoka + Nunito

### T-13: `src/constants/config.ts` (nouveau)
- SUPABASE_URL, SUPABASE_ANON_KEY (placeholders)
- GAME_DURATION: 60s, MATCHMAKING_TIMEOUT: 30s
- MAX_VISIBLE_WORDS: 8, WORD_POINTS: 10, BONUS_WORD_POINTS: 20
- MAX_HEARTS: 5, HEART_RECHARGE_MS: 30min
- AD_COOLDOWN_MS: 5min, AD_COIN_REWARD: 50
- MAX_PLAYERS_PER_ROOM: 4, MIN_PLAYERS_TO_START: 2

### T-21: `src/i18n/` (nouveau)
- Installer i18next + react-i18next + expo-localization
- `index.ts`: config i18next, detection langue device, fallback EN
- `fr.ts`: traductions FR (toutes les cles UI)
- `en.ts`: traductions EN

---

## Layer 1 — Donnees statiques

### T-14: `src/data/playerColors.ts` ← bloque par T-12
- PLAYER_COLORS: 6 couleurs ['#a78bfa', '#f87171', '#34d399', '#fbbf24', '#60a5fa', '#f472b6']
- getPlayerColor(joinOrder): string

### T-15: `src/data/skins.ts` ← bloque par T-09
6 skins:
1. Crystal Ball (free) — purple, fade-scale
2. Ocean Abyss (free) — blue, bubble-up
3. Lava Core (199 gems) — red/orange, flame-burst
4. Galaxy (199 gems) — deep purple, crystallize
5. Neon Arcade (149 gems) — green neon, fade-scale
6. Frozen (149 gems) — ice blue, crystallize

### T-16: `src/data/avatars.ts` ← bloque par T-09
8 avatars: Owl (free), Wolf (free), Fox (100), Dragon (250), Mage (300), Lion (200), Penguin (150), Butterfly (180)

### T-17: `src/data/achievements.ts` ← bloque par T-08
16 achievements en 4 categories: Victories (4), Words (5), Social (4), Skins (2)

### T-18: `src/data/quests.ts` ← bloque par T-08
4 daily + 3 weekly quests avec rewards coins/gems

### T-19: `src/data/questions.ts` ← bloque par T-07
50+ questions MVP: id, definition (fr/en), answers[], bonus_words[], difficulty, category

### T-42: `supabase/migrations/` ← bloque par T-07, T-08
8 fichiers SQL + seed:
1. 001_profiles.sql
2. 002_game_rooms.sql
3. 003_game_words.sql
4. 004_friendships.sql
5. 005_achievements.sql
6. 006_quests.sql
7. 007_leaderboard_views.sql (3 materialized views)
8. 008_realtime.sql
9. seed.sql

---

## Layer 2 — Supabase Client + Fonts

### T-20: `src/lib/supabase.ts` ← bloque par T-13
- Singleton createClient avec AsyncStorage pour auth
- autoRefreshToken, persistSession, detectSessionInUrl: false

### T-39: Fonts ← bloque par T-12
- @expo-google-fonts/fredoka-one + @expo-google-fonts/nunito
- useFonts dans root _layout.tsx
- Splash screen visible jusqu'au chargement

---

## Layer 3 — Zustand Stores (6 stores)

### T-22: `src/stores/gameStore.ts` ← bloque par T-07
- State: roomId, status, question, wordFeed[], players[], myScore, timeLeft, winner
- Actions: setRoom, addWordToFeed, updatePlayerScore, setTimeLeft, setWinner, resetGame

### T-23: `src/stores/playerStore.ts` ← bloque par T-08, T-09
- State: profile, coins, gems, hearts, avatar, stage, isLoading, isAuthenticated
- Actions: setProfile, updateCoins/Gems/Hearts, setAvatar, setStage, setTutorialDone, logout

### T-24: `src/stores/questStore.ts` ← bloque par T-08
- State: dailyQuests, weeklyQuests, achievements, isLoading
- Actions: loadQuests, loadAchievements, updateQuestProgress, completeQuest, unlockAchievement

### T-25: `src/stores/skinStore.ts` ← bloque par T-09
- State: activeSkin, unlockedSkins[], tempSkin, tempExpiry
- Actions: setActiveSkin, unlockSkin, setTempSkin, clearTempSkin, getEffectiveSkin

### T-26: `src/stores/leaderboardStore.ts` ← bloque par T-08, T-10
- State: activeTab, data (4 tabs), myRanks, friends[], pendingRequests[]
- Actions: setActiveTab, loadLeaderboard, loadFriends, sendFriendRequest, accept/decline

### T-27: `src/stores/adsStore.ts` ← bloque par T-13
- State: lastCoinAd, lastLifeAd, lastContinueAd, lastSkinTrialAd
- Actions: recordAdWatch, canShowAd, getTimeUntilAvailable

---

## Layer 4 — Lib Utilities (5 modules)

### T-28: `src/lib/wordValidator.ts` ← bloque par T-07
- normalizeWord(): lowercase, NFD, strip diacritics, trim
- validateWord(): returns 'valid' | 'already_used' | 'invalid'
- isBonusWord(): check si mot rare

### T-29: `src/lib/gameTimer.ts` ← bloque par T-13
- calculateTimeLeft(timerStart, duration): secondes restantes
- isGameOver(): boolean
- CRITIQUE: jamais utiliser l'horloge locale

### T-30: `src/lib/matchmaking.ts` ← bloque par T-07, T-20
- findOrCreateRoom(): cherche room waiting ou cree nouvelle
- joinRoom(), setPlayerReady()

### T-31: `src/lib/leaderboard.ts` ← bloque par T-10, T-20
- fetchLeaderboard(tab): query materialized views
- fetchMyRank(), fetchFriendsLeaderboard()

### T-32: `src/lib/playerCode.ts` ← bloque par T-08, T-20
- generatePlayerCode(): format USERNAME#XXXX
- parsePlayerCode(), searchByPlayerCode()

---

## Layer 5 — Custom Hooks (6 hooks)

### T-33: `src/hooks/useGameRoom.ts` ← bloque par T-20, T-22
- Subscribe Realtime: game_words INSERT, room_players INSERT/UPDATE, game_rooms UPDATE
- Cleanup on unmount

### T-34: `src/hooks/useTimer.ts` ← bloque par T-22, T-29
- Timer synchronise serveur (setInterval 1s)
- Returns: timeLeft, isExpired, progress (0-1)

### T-35: `src/hooks/useWordFeed.ts` ← bloque par T-22, T-13
- Max 8 mots visibles (slice(-8))
- Opacite decroissante apres le 4e mot

### T-36: `src/hooks/useMatchmaking.ts` ← bloque par T-30, T-22, T-23
- Status: idle -> searching -> found -> countdown -> playing
- Timeout 30s -> injection bots

### T-37: `src/hooks/useLeaderboard.ts` ← bloque par T-26, T-31
- Fetch data par tab, loading state, refresh

### T-38: `src/hooks/useRewardedAd.ts` ← bloque par T-27
- Stub pour AdMob (integration reelle avec EAS build)
- Preload, cooldown check, show()

---

## Layer 6 — Navigation + UI

### T-40: Navigation skeleton ← bloque par T-21, T-39
13 ecrans stub:
- `(tabs)/_layout.tsx`: 5 tabs (Profile, Social, Home centre, Shop, Quests)
- `(tabs)/home.tsx`, `profile.tsx`, `shop.tsx`, `social.tsx`, `quests.tsx`
- `game/lobby.tsx`, `game/[roomId].tsx`
- `tutorial.tsx`, `achievements.tsx`, `settings.tsx`
- Supprimer explore.tsx du template

### T-41: `src/components/ui/` ← bloque par T-12
- ProgressBar.tsx: barre animee reusable
- Toast.tsx: notification in-game

---

## Graphe de dependances

```
Layer 0 (immediat):  T-07, T-08, T-09, T-10, T-11, T-12, T-13, T-21
        |
Layer 1 (data):      T-14, T-15, T-16, T-17, T-18, T-19, T-42
        |
Layer 2 (infra):     T-20, T-39
        |
Layer 3 (stores):    T-22, T-23, T-24, T-25, T-26, T-27
        |
Layer 4 (lib):       T-28, T-29, T-30, T-31, T-32
        |
Layer 5 (hooks):     T-33, T-34, T-35, T-36, T-37, T-38
        |
Layer 6 (nav+ui):    T-40, T-41
```
