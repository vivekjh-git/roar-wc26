# 🏆 FIFA World Cup 2026 PWA — Upgrade Plan

## Overview

Major upgrade to add rich stats, fix bugs, expand records, add animations, and create an engaging/entertaining experience.

> ⚠️ **CRITICAL: All times in Nepal Standard Time (NPT, UTC+5:45)**
> Every date/time displayed anywhere in the app — match times, header clock,
> countdown timer, live ticker, team modal fixtures — must be in **Asia/Kathmandu**
> timezone. We'll use `date-fns-tz` with `{ timeZone: 'Asia/Kathmandu' }` for all
> conversions. The API returns US local times; we convert them to NPT for display.

---

## 1. API Strategy — Fast & Reliable

### Primary: `worldcup26.ir` (current — keep it)
- **Endpoints**: `/get/teams`, `/get/groups`, `/get/games`, `/get/stadiums`
- **Speed**: Free REST, no API key, JSON, ~200ms response
- **Data**: Scores, scorers with minute markers, group standings, match dates
- **Revalidate**: Already set to 60s server-side cache — keep this

### Derived Stats (computed from existing API data)
The API returns scorer strings like `"Lionel Messi 38'"` and `"D. Bobadilla 7'(OG)"`.
We'll parse these to compute:
- **Goal scorers leaderboard** — already done, enhance it
- **Own goals list** — parse `(OG)` entries
- **Goals per game** — goals ÷ matches_played per scorer
- **Max goals in a single match** — per scorer per game
- **Clean sheets** — per team (already computed)
- **Goals conceded** — per team leaderboard
- **Assists** — derive from team contribution (API doesn't track assists directly — use "key contributors" metric: goals×3 + clean_sheet_bonus)
- **Penalty goals** — parse `(p)` entries

### Historical Records — Hardcoded Reference Data
Records data will be **hardcoded as a static JSON constant** in the codebase.
No API needed — this is historical fact data that never changes:

```typescript
// src/lib/records-data.ts — static historical records
const HISTORICAL_RECORDS = [
  { id: "wc_top_scorer_tournament", title: "Most Goals in a Single World Cup",
    holder: "Just Fontaine", country: "France", year: 1958, value: 13, unit: "goals" },
  // ... 30+ records
];
```

**Sources for records data**: FIFA.com, Wikipedia World Cup records, Guinness World Records

### Date Format Fix + Nepal Time Conversion
The API returns dates as `"06/13/2026 21:00"` (MM/DD/YYYY HH:mm — US local time).
Current code does `new Date(game.local_date.replace(" ", "T"))` → produces **Invalid Date**.

**Fix**: 
1. Install `date-fns-tz` for timezone support
2. Parse with `date-fns` `parse()` format `"MM/dd/yyyy HH:mm"`
3. Treat the raw time as US venue local time, convert to UTC, then to NPT
4. Display all times in **Nepal Standard Time (UTC+5:45)** using:
```typescript
import { parse, format } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

// Parse the API date, convert to NPT display
export function formatMatchDateNPT(localDate: string): string {
  const parsed = parse(localDate, "MM/dd/yyyy HH:mm", new Date());
  return formatInTimeZone(parsed, "Asia/Kathmandu", "MMM d, h:mm a");
  // → "Jun 14, 7:15 AM NPT" 
}
```
5. Show "NPT" label next to all times so users know the timezone
6. Header clock also shows Nepal time

---

## 2. Proposed Changes — File by File

---

### Component: Data Layer

#### [MODIFY] `src/lib/api.ts`

Add new stat computation functions:

| Function | Description |
|----------|-------------|
| `computeOwnGoals()` | Parse `(OG)` from scorer strings → own goal leaderboard |
| `computeGoalsPerGame()` | Goals ÷ games_played per scorer |
| `computeMaxGoalsInMatch()` | Track max goals per scorer in a single game |
| `computeCleanSheets()` | Per-team clean sheet rankings |
| `computeGoalsConceded()` | Per-team goals conceded rankings |
| `computePenaltyGoals()` | Parse `(p)` from scorer strings |
| `computeKeyContributors()` | "Key Contributor" score: goals×3 + games_played for engagement |
| `computeFullTeamStats()` | All 48 teams: P/W/D/L/GF/GA/GD/Pts — sortable table data |
| `parseMatchDate()` | Fix date parsing + convert to Nepal Time (UTC+5:45) via `date-fns-tz` |
| `formatMatchDateNPT()` | Format any match date as Nepal Standard Time with "NPT" label |

Add new types:
```typescript
interface OwnGoalEntry { name: string; ownGoals: number; teamName: string; flag: string; matchInfo: string; }
interface GoalsPerGameEntry { name: string; ratio: number; goals: number; games: number; teamName: string; flag: string; }
interface MaxGoalsMatchEntry { name: string; maxGoals: number; matchInfo: string; teamName: string; flag: string; }
interface CleanSheetEntry { teamName: string; cleanSheets: number; gamesPlayed: number; flag: string; }
interface GoalsConcededEntry { teamName: string; goalsConceded: number; gamesPlayed: number; flag: string; }
interface PenaltyGoalEntry { name: string; penalties: number; teamName: string; flag: string; }
interface FullTeamStats { teamId: string; teamName: string; flag: string; played: number; wins: number; draws: number; losses: number; goalsFor: number; goalsAgainst: number; gd: number; points: number; cleanSheets: number; }
```

#### [NEW] `src/lib/records-data.ts`

Static historical World Cup records — **30+ entries** across 7 categories:

**Goals Records:**
| Record | Holder | Value |
|--------|--------|-------|
| Most goals in a single WC | Just Fontaine (France, 1958) | 13 goals |
| Most WC goals all-time | Miroslav Klose (Germany, 2002-2014) | 16 goals |
| Fastest goal in WC history | Hakan Şükür (Turkey, 2002) | 11 seconds |
| Most penalties scored in a WC tournament | 2018 Russia | 29 penalties |
| Most hat-tricks in a WC | 1954 Switzerland | 8 hat-tricks |
| Most own goals in a WC tournament | 2018 Russia | 12 own goals |
| Highest scoring game ever | Austria 7-5 Switzerland (1954) | 12 goals |
| Lowest scoring WC (per game) | 1990 Italy | 2.21 avg |

**Team Records:**
| Record | Holder | Value |
|--------|--------|-------|
| Most goals by a team in one WC | Hungary (1954) | 27 goals |
| Fewest goals conceded by champions | Italy (2006) | 2 goals |
| Largest winning margin | Hungary 10-1 El Salvador (1982) | 9 goals |
| Most consecutive wins | Brazil (2002-2006) | 11 wins |
| Most consecutive clean sheets | Italy (2006) | 5 matches |

**Individual Records:**
| Record | Holder | Value |
|--------|--------|-------|
| Youngest goalscorer | Pelé (1958) | 17y 239d |
| Oldest goalscorer | Roger Milla (1994) | 42y 39d |
| Most WC appearances (matches) | Lionel Messi | 26 matches |
| Most WC tournaments played | Carbajal, Matthäus, Buffon, Márquez, Messi | 5 tournaments |
| Most saves in a WC match | Tim Howard (USA, 2014) | 16 saves |

**Tournament Records:**
| Record | Holder | Value |
|--------|--------|-------|
| Most teams | 1998-2022 | 32 teams |
| Most matches | 1998-2022 | 64 matches |
| Total goals in a WC | 2014 Brazil | 171 goals |
| Highest average attendance | 1994 USA | 68,991 |
| Most red cards in a WC | 2006 Germany | 28 cards |
| Most goalless draws | 2022 Qatar | 5 draws |
| First tri-nation host | — | — |
| First 48-team format | — | — |

**GK/Defensive Records:**
| Record | Holder | Value |
|--------|--------|-------|
| Most clean sheets in one WC | Fabien Barthez (France, 1998) | 6 |

**Attendance Records:**
| Record | Holder | Value |
|--------|--------|-------|
| Highest single-match attendance | 1950 Brazil vs Uruguay | 173,850 |
| Highest tournament total attendance | 1994 USA | 3,587,538 |

Each record includes a `compare` function that takes current 2026 data and computes if the record is broken/nearing/standing with progress percentage.

---

### Component: Bug Fixes

#### [MODIFY] `src/components/BracketTab.tsx`

**Date Fix + Nepal Time**: Replace broken date parsing with NPT conversion:
```typescript
// BEFORE (broken):
new Date(game.local_date.replace(" ", "T"))

// AFTER (working — Nepal Time):
import { formatMatchDateNPT } from "@/lib/api";
formatMatchDateNPT(game.local_date) // → "Jun 14, 7:15 AM NPT"
```
All match dates/times throughout the app display in **Nepal Standard Time (UTC+5:45)**.

**Also add:**
- Goal scorers displayed on finished match cards (e.g., "Messi 38', 76'")
- Stadium name for completed matches
- Match number label (e.g., "Match 19")
- Framer Motion `motion.div` with staggered entrance animations

---

### Component: Stats Dashboard

#### [MODIFY] `src/components/ScorersTab.tsx`

Complete rewrite into a **multi-category stats dashboard** with horizontal sub-tabs:

**6 Stat Panels:**

| Tab | Icon | Data Source | Display |
|-----|------|-------------|---------|
| Goal Scorers | ⚽ | `topScorers` | Large card with rank #1, flag, name, goals |
| Key Contributors | 🎯 | `computeKeyContributors()` | Contribution score ranking |
| Goals per Game | 📊 | `computeGoalsPerGame()` | Best ratio shown |
| Clean Sheets | 🧤 | `computeCleanSheets()` | Team-level ranking |
| Own Goals | 🔴 | `computeOwnGoals()` | Own goal entries |
| Penalty Goals | 🎯 | `computePenaltyGoals()` | Penalty scorer list |

**Design (inspired by reference screenshots):**
- #1 ranked entry gets a large featured card with big stat number
- Entries #2-10 in compact list with rank, mini flag, name, team/games, stat value
- "Show full list" expandable button
- Animated entry with Framer Motion `staggerChildren`
- Each stat category has its own color accent

---

### Component: Records Section

#### [MODIFY] `src/components/RecordsTab.tsx`

Expand from 8 to **30+ records**:

**UI Changes:**
- Category filter pills at top (Goals, Team, Individual, Tournament, GK, Attendance)
- Each record card shows:
  - 📜 Record title
  - 🏅 Historical holder + year + flag emoji
  - 📊 Current 2026 live comparison value
  - Progress bar (percentage toward beating the record)
  - Status badge: `✓ BROKEN` (green), `⚡ NEARING` (orange pulse), `STANDING` (gray)
  - 🎉 Confetti particles animation when `isBeaten === true`
- "Records Broken" counter at top with animated number
- "Records Nearing" counter with pulse effect

---

### Component: Animations & Engagement

#### [MODIFY] `src/app/globals.css`

Add new CSS animations:
- `float-particle` — floating background particles
- `slide-up-fade` — card entrance
- `goal-flash` — goal celebration highlight
- `confetti` — confetti particles for broken records
- `gradient-shift` — animated gradient for headers
- `count-up` — number counter animation
- `ticker-scroll` — live ticker horizontal scroll

#### [MODIFY] `src/app/layout.tsx`

- Import Google Fonts: **Inter** (body) + **Outfit** (headings)
- Add subtle gradient background pattern

#### [MODIFY] `src/app/page.tsx`

- Add `AnimatePresence` + `motion.div` for tab transitions (fade + slide)
- Add `LiveTicker` component below header
- Add `CountdownWidget` for next match
- Pass new stat data to ScorersTab and RecordsTab

#### [MODIFY] `src/components/Header.tsx`

- Animated gradient underline on active tab
- Glowing LIVE badge with pulse ring effect
- Countdown to next match in header bar
- Smoother tab switching animations

#### [NEW] `src/components/LiveTicker.tsx`

Auto-scrolling horizontal strip showing:
- Latest results: "🇫🇷 France 4-1 Norway 🇳🇴 — FT"
- Next matches: "🇧🇷 Brazil vs Japan 🇯🇵 — Jun 29"
- Record alerts: "🔥 NEW RECORD: 48 teams for the first time!"
- CSS `@keyframes ticker-scroll` animation

#### [NEW] `src/components/FunFacts.tsx`

Auto-rotating trivia widget:
- Cycles through 15+ fun World Cup facts
- Fades in/out every 8 seconds
- Click/tap to skip to next fact
- Uses Framer Motion `AnimatePresence` for smooth transitions

#### [NEW] `src/components/CountdownWidget.tsx`

Next match countdown with animated numbers (days/hours/minutes/seconds).

---

### Component: View Styles

#### [NEW] `src/components/ViewToggle.tsx`

Toggle between visual modes:
- **Cards** (default) — current glass-card style
- **List** — compact table/list for stat-heavy views
- Two icon buttons with active state highlight

---

### Component: Enhanced Popularity

#### [MODIFY] `src/components/PopularityTab.tsx`

- Framer Motion animated podium (bounce-in effect)
- "Most Entertaining Match" highlight card
- Add "Most Goals in a Game" highlight
- Market-style data: "Most Searched" proxy based on goals + wins

---

### Component: Team Modal

#### [MODIFY] `src/components/TeamModal.tsx`

- Framer Motion slide-up + fade entrance
- Goal timeline visualization
- Fix date display in fixtures using `date-fns`
- Richer stat boxes with animation

---

### Component: Groups

#### [MODIFY] `src/components/GroupsTab.tsx`

- Add GF/GA/GD columns to standings table
- Add Framer Motion stagger animations for group cards
- View toggle support (cards vs compact list)

---

### Component: API Route

#### [MODIFY] `src/app/api/wc/all/route.ts`

Add new computed data to response:
```typescript
return NextResponse.json({
  teams, groups, games, stadiums,
  topScorers, popularity, records,
  // NEW:
  ownGoals, goalsPerGame, maxGoalsMatch,
  cleanSheets, goalsConceded, penaltyGoals,
  fullTeamStats, expandedRecords,
});
```

---

## 3. File Summary

### New Files (5)
| File | Purpose |
|------|---------|
| `src/lib/records-data.ts` | 30+ hardcoded historical World Cup records |
| `src/components/LiveTicker.tsx` | Auto-scrolling results ticker strip |
| `src/components/FunFacts.tsx` | Rotating trivia/facts widget |
| `src/components/CountdownWidget.tsx` | Next match countdown timer |
| `src/components/ViewToggle.tsx` | Card/List view mode switcher |

### Modified Files (12)
| File | Key Changes |
|------|-------------|
| `src/lib/api.ts` | 8 new stat functions, fixed date parser, new types |
| `src/app/api/wc/all/route.ts` | Serve new computed data |
| `src/app/globals.css` | 7 new animations, Google Fonts, design tokens |
| `src/app/layout.tsx` | Font imports, background pattern |
| `src/app/page.tsx` | AnimatePresence, LiveTicker, CountdownWidget, new data flow |
| `src/components/Header.tsx` | Animated tabs, countdown, glow effects |
| `src/components/BracketTab.tsx` | **Date fix**, scorer details, stadium, animations |
| `src/components/ScorersTab.tsx` | **Rewrite** → 6-category stats dashboard |
| `src/components/RecordsTab.tsx` | 30+ records, category filters, confetti, progress bars |
| `src/components/PopularityTab.tsx` | Animated podium, highlights |
| `src/components/GroupsTab.tsx` | GF/GA/GD columns, animations |
| `src/components/TeamModal.tsx` | Framer Motion, goal timeline, date fix |

---

## 4. Verification Plan

### Build Checks
```bash
npm run typecheck   # TypeScript compilation
npm run build       # Next.js production build
```

### Manual Verification
- All dates display correctly in **Nepal Time (NPT)** — no "Invalid Date"
- Times show "NPT" label (e.g., "Jun 14, 7:15 AM NPT")
- Header clock shows current Nepal time
- Countdown timer counts down in Nepal timezone
- 6 stat categories render with real data
- 30+ records show with broken/nearing/standing states
- Tab transitions animate smoothly
- Live ticker scrolls with latest results and NPT times
- Team modal fixtures show NPT dates
- Mobile responsive layout works
- Loading/error states still work
- Auto-refresh every 90s still works

### Dependencies to Add
```bash
npm install date-fns-tz
```
