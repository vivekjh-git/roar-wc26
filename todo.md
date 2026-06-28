# 🏆 FIFA World Cup 2026 PWA — TODO

> All times must display in **Nepal Standard Time (NPT, UTC+5:45)**

---

## Phase 1: Foundation & Bug Fixes

- [ ] **Install `date-fns-tz`** — `npm install date-fns-tz`
- [ ] **Create `src/lib/date-utils.ts`** — centralized date parsing + NPT conversion
  - [ ] `parseMatchDate(localDate: string): Date` — parse `"MM/dd/yyyy HH:mm"` format
  - [ ] `formatMatchDateNPT(localDate: string): string` — format as "Jun 14, 7:15 AM NPT"
  - [ ] `formatMatchDateShortNPT(localDate: string): string` — format as "Jun 14"
  - [ ] `formatTimeNPT(localDate: string): string` — format as "7:15 AM NPT"
  - [ ] `getCurrentNPTTime(): string` — for header clock display
  - [ ] `getNextMatchCountdown(games: Game[]): { days, hours, mins, secs }` — countdown in NPT
- [ ] **Fix BracketTab date bug** — replace `new Date(game.local_date.replace(" ", "T"))` with `formatMatchDateNPT()`
- [ ] **Fix TeamModal date bug** — same date fix for fixture dates
- [ ] **Update Header clock** — show Nepal time instead of browser local time

---

## Phase 2: Data Layer — New Stat Functions

- [ ] **Create `src/lib/records-data.ts`** — 30+ hardcoded historical WC records
  - [ ] Goals records (8 entries)
  - [ ] Team records (5 entries)
  - [ ] Individual records (5 entries)
  - [ ] Tournament records (8 entries)
  - [ ] GK/Defensive records (2 entries)
  - [ ] Attendance records (2 entries)
  - [ ] Each record has `compare()` function for live 2026 comparison
- [ ] **Expand `src/lib/api.ts`** with new stat computation functions:
  - [ ] `computeOwnGoals(games, teamMap)` — parse `(OG)` entries
  - [ ] `computeGoalsPerGame(games, teamMap)` — goals/games ratio per scorer
  - [ ] `computeMaxGoalsInMatch(games, teamMap)` — max goals in one game per scorer
  - [ ] `computeCleanSheets(games, teamMap)` — per-team clean sheet rankings
  - [ ] `computeGoalsConceded(games, teamMap)` — per-team goals conceded rankings
  - [ ] `computePenaltyGoals(games, teamMap)` — parse `(p)` entries
  - [ ] `computeKeyContributors(games, teamMap)` — engagement score ranking
  - [ ] `computeFullTeamStats(games, teamMap)` — all 48 teams sortable table
  - [ ] `getExpandedRecords(games, teamMap)` — 30+ records with live 2026 data
  - [ ] Add all new TypeScript interfaces
- [ ] **Update `src/app/api/wc/all/route.ts`** — serve new computed data in API response

---

## Phase 3: Enhanced Components

### ScorersTab → Multi-Category Stats Dashboard
- [ ] **Rewrite `ScorersTab.tsx`** with 6 stat sub-tabs:
  - [ ] ⚽ Goal Scorers — top scorers with large #1 card
  - [ ] 🎯 Key Contributors — engagement score ranking
  - [ ] 📊 Goals per Game — ratio leaderboard
  - [ ] 🧤 Clean Sheets — team-level rankings
  - [ ] 🔴 Own Goals — own goal entries
  - [ ] 🎯 Penalty Goals — penalty scorer list
  - [ ] "Show full list" expandable button
  - [ ] Each category has unique color accent

### RecordsTab → 30+ Records
- [ ] **Rewrite `RecordsTab.tsx`** with expanded records:
  - [ ] Category filter pills (Goals, Team, Individual, Tournament, GK, Attendance)
  - [ ] "Records Broken" animated counter at top
  - [ ] "Records Nearing" counter with pulse effect
  - [ ] Each card: title, historical holder, 2026 value, progress bar, status badge
  - [ ] Confetti animation for broken records
  - [ ] Progress bar shows percentage toward record

### BracketTab Enhancements
- [ ] **Enhance `BracketTab.tsx`**:
  - [ ] Fix dates → Nepal Time with "NPT" label
  - [ ] Show goal scorers on finished match cards (e.g., "Messi 38', 76'")
  - [ ] Show stadium name
  - [ ] Show match number
  - [ ] "Today's Matches" highlight section
  - [ ] Framer Motion staggered entrance animations

### GroupsTab Enhancements
- [ ] **Enhance `GroupsTab.tsx`**:
  - [ ] Add GF/GA/GD columns to standings
  - [ ] Framer Motion stagger animations
  - [ ] View toggle support

### PopularityTab Enhancements
- [ ] **Enhance `PopularityTab.tsx`**:
  - [ ] Animated podium with Framer Motion bounce-in
  - [ ] "Most Entertaining Match" highlight card
  - [ ] "Most Goals in a Game" highlight

### TeamModal Enhancements
- [ ] **Enhance `TeamModal.tsx`**:
  - [ ] Framer Motion slide-up + fade entrance
  - [ ] Fix fixture dates → Nepal Time
  - [ ] Goal timeline visualization
  - [ ] Animated stat boxes

---

## Phase 4: New Components

- [ ] **Create `src/components/LiveTicker.tsx`**
  - [ ] Auto-scrolling horizontal strip
  - [ ] Latest results with flags
  - [ ] Upcoming matches with NPT times
  - [ ] Record alerts
  - [ ] CSS ticker-scroll animation

- [ ] **Create `src/components/FunFacts.tsx`**
  - [ ] 15+ historical World Cup fun facts
  - [ ] Auto-rotate every 8 seconds
  - [ ] Click/tap to skip
  - [ ] Framer Motion AnimatePresence transitions

- [ ] **Create `src/components/CountdownWidget.tsx`**
  - [ ] Countdown to next match in Nepal Time
  - [ ] Animated flip-clock style numbers (days/hours/mins/secs)

- [ ] **Create `src/components/ViewToggle.tsx`**
  - [ ] Cards vs List view toggle
  - [ ] Active state highlight

---

## Phase 5: Styling & Animations

- [ ] **Update `globals.css`** — add animations:
  - [ ] `@keyframes float-particle`
  - [ ] `@keyframes slide-up-fade`
  - [ ] `@keyframes goal-flash`
  - [ ] `@keyframes confetti`
  - [ ] `@keyframes gradient-shift`
  - [ ] `@keyframes count-up`
  - [ ] `@keyframes ticker-scroll`

- [ ] **Update `layout.tsx`**:
  - [ ] Add Google Fonts (Inter + Outfit)
  - [ ] Subtle gradient background pattern

- [ ] **Update `page.tsx`**:
  - [ ] Framer Motion `AnimatePresence` for tab transitions
  - [ ] Integrate LiveTicker below header
  - [ ] Integrate CountdownWidget
  - [ ] Pass new stat data to components

- [ ] **Update `Header.tsx`**:
  - [ ] Nepal time clock display
  - [ ] Animated gradient tab underline
  - [ ] Glowing LIVE badge with pulse ring
  - [ ] Next match countdown

---

## Phase 6: Verification

- [ ] `npm run typecheck` — no TypeScript errors
- [ ] `npm run build` — production build succeeds
- [ ] All dates show Nepal Time (NPT) — no "Invalid Date"
- [ ] Times show "NPT" label
- [ ] Header clock shows current Nepal time
- [ ] 6 stat categories render correctly
- [ ] 30+ records with broken/nearing/standing states
- [ ] Tab transitions animate smoothly
- [ ] Live ticker scrolls
- [ ] Countdown timer works
- [ ] Team modal animations work
- [ ] Mobile responsive
- [ ] Auto-refresh every 90s works
