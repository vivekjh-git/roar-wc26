/**
 * FIFA World Cup Historical Records
 * Static data — sourced from FIFA.com, Wikipedia, Guinness World Records
 * These are definitive historical facts that never change.
 *
 * Each record includes a `compare` function that takes live 2026 data
 * and returns { current, progress (0-100), isBeaten, isNearing }
 */

export interface HistoricalRecord {
  id: string;
  category: "Goals" | "Team" | "Individual" | "Tournament" | "Goalkeeper" | "Attendance" | "Milestones";
  emoji: string;
  title: string;
  holder: string;
  holderFlag?: string; // emoji flag
  year: number | string;
  value: number;
  unit: string;
  description: string;
  funFact?: string;
  compare: (liveData: RecordLiveData) => RecordStatus;
}

export interface RecordStatus {
  current: string;
  progress: number; // 0-100
  isBeaten: boolean;
  isNearing: boolean;
}

export interface RecordLiveData {
  totalGoals: number;
  finishedGames: number;
  avgGoalsPerGame: number;
  biggestMargin: number;
  biggestMarginStr: string;
  mostGoalsInGame: number;
  mostGoalsInGameStr: string;
  topScorerGoals: number;
  topScorerName: string;
  topTeamGoals: number;
  topTeamName: string;
  totalOwnGoals: number;
  totalPenalties: number;
  cleanSheetGames: number;
  topTeamCleanSheets: number;
  topTeamCleanSheetsName: string;
  totalRedCards: number;
  goallessDrws: number;
}

const RECORDS: HistoricalRecord[] = [
  // ─── GOALS ────────────────────────────────────────────────────────────────
  {
    id: "most_goals_single_wc",
    category: "Goals",
    emoji: "⚽",
    title: "Most Goals by a Player in One World Cup",
    holder: "Just Fontaine",
    holderFlag: "🇫🇷",
    year: 1958,
    value: 13,
    unit: "goals",
    description: "Just Fontaine (France) scored 13 goals at the 1958 World Cup in Sweden — a record that has stood for 67 years and counting.",
    funFact: "Fontaine scored in every single match he played at the 1958 WC, averaging 2.17 goals per game.",
    compare: ({ topScorerGoals, topScorerName }) => ({
      current: `${topScorerName || "Current leader"}: ${topScorerGoals} goal${topScorerGoals !== 1 ? "s" : ""}`,
      progress: Math.min(100, (topScorerGoals / 13) * 100),
      isBeaten: topScorerGoals > 13,
      isNearing: topScorerGoals >= 9 && topScorerGoals <= 13,
    }),
  },
  {
    id: "most_goals_all_time_player",
    category: "Goals",
    emoji: "👑",
    title: "Most Career World Cup Goals",
    holder: "Miroslav Klose",
    holderFlag: "🇩🇪",
    year: "2002–2014",
    value: 16,
    unit: "goals",
    description: "Miroslav Klose scored 16 World Cup goals across four tournaments — the all-time record for any player in WC history.",
    funFact: "Klose scored in 4 consecutive World Cups (2002, 2006, 2010, 2014), the only player to do so.",
    compare: ({ topScorerGoals, topScorerName }) => {
      let careerGoals = topScorerGoals;
      let note = "(single-tournament count)";
      if (topScorerName?.includes("Messi")) { careerGoals = 13 + topScorerGoals; note = "(career total)"; }
      else if (topScorerName?.includes("Mbappé") || topScorerName?.includes("Mbappe")) { careerGoals = 12 + topScorerGoals; note = "(career total)"; }
      
      return {
        current: `${topScorerName || "Leader"}: ${careerGoals} total ${note}`,
        progress: Math.min(100, (careerGoals / 16) * 100),
        isBeaten: careerGoals > 16,
        isNearing: careerGoals >= 13 && careerGoals <= 16,
      };
    },
  },
  {
    id: "fastest_goal_ever",
    category: "Goals",
    emoji: "⚡",
    title: "Fastest Goal in World Cup History",
    holder: "Hakan Şükür",
    holderFlag: "🇹🇷",
    year: 2002,
    value: 11,
    unit: "seconds",
    description: "Hakan Şükür (Turkey) scored against South Korea in the 3rd-place playoff at the 2002 World Cup — just 11 seconds after kickoff.",
    funFact: "South Korea kicked off and Turkey won the ball almost immediately. Şükür's shot was unstoppable.",
    compare: () => ({
      current: "Live tracking not available — check match reports",
      progress: 0,
      isBeaten: false,
      isNearing: false,
    }),
  },
  {
    id: "most_penalties_wc",
    category: "Goals",
    emoji: "🎯",
    title: "Most Penalties Scored in One World Cup",
    holder: "Russia 2018 Tournament",
    holderFlag: "🇷🇺",
    year: 2018,
    value: 22,
    unit: "penalties scored",
    description: "The 2018 World Cup in Russia saw 22 penalty kicks converted — the most in any World Cup tournament.",
    funFact: "VAR was introduced at the 2018 WC, which contributed to the high number of penalties awarded.",
    compare: ({ totalPenalties }) => ({
      current: `${totalPenalties} penalties scored in 2026 so far`,
      progress: Math.min(100, (totalPenalties / 22) * 100),
      isBeaten: totalPenalties > 22,
      isNearing: totalPenalties >= 15 && totalPenalties <= 22,
    }),
  },
  {
    id: "most_own_goals_wc",
    category: "Goals",
    emoji: "🔴",
    title: "Most Own Goals in One World Cup",
    holder: "Russia 2018 Tournament",
    holderFlag: "🇷🇺",
    year: 2018,
    value: 12,
    unit: "own goals",
    description: "The 2018 World Cup set a record with 12 own goals — more than double the previous high.",
    funFact: "The 2018 WC produced more own goals (12) than the combined total of all previous WCs.",
    compare: ({ totalOwnGoals }) => ({
      current: `${totalOwnGoals} own goals in 2026 so far`,
      progress: Math.min(100, (totalOwnGoals / 12) * 100),
      isBeaten: totalOwnGoals > 12,
      isNearing: totalOwnGoals >= 8 && totalOwnGoals <= 12,
    }),
  },
  {
    id: "highest_scoring_game",
    category: "Goals",
    emoji: "💥",
    title: "Highest Scoring Match in World Cup History",
    holder: "Austria 7-5 Switzerland",
    holderFlag: "🇦🇹",
    year: 1954,
    value: 12,
    unit: "total goals",
    description: "The 1954 quarterfinal between Austria and Switzerland ended 7-5 — 12 goals in one match, the most ever in a single World Cup game.",
    funFact: "This match is known as the 'Battle of Lausanne'. Austria were 3-0 down but came back to win 7-5.",
    compare: ({ mostGoalsInGame, mostGoalsInGameStr }) => ({
      current: mostGoalsInGame > 0 ? `${mostGoalsInGameStr} (${mostGoalsInGame} goals)` : "TBD",
      progress: Math.min(100, (mostGoalsInGame / 12) * 100),
      isBeaten: mostGoalsInGame > 12,
      isNearing: mostGoalsInGame >= 9 && mostGoalsInGame <= 12,
    }),
  },
  {
    id: "total_goals_tournament",
    category: "Goals",
    emoji: "📊",
    title: "Most Total Goals in a World Cup",
    holder: "France 2014",
    holderFlag: "🇧🇷",
    year: 2014,
    value: 171,
    unit: "goals in 64 matches",
    description: "The 2014 World Cup in Brazil produced 171 goals across 64 matches — the most ever scored in a single tournament.",
    funFact: "That's 2.67 goals per game on average. 2026 has 104 matches, so the record should easily be surpassed.",
    compare: ({ totalGoals, finishedGames }) => ({
      current: `${totalGoals} goals in ${finishedGames} matches`,
      progress: Math.min(100, (totalGoals / 171) * 100),
      isBeaten: totalGoals > 171,
      isNearing: totalGoals > 130 && totalGoals <= 171,
    }),
  },
  {
    id: "most_goals_group_stage",
    category: "Goals",
    emoji: "🏟️",
    title: "Most Goals in World Cup Group Stage",
    holder: "France 2014",
    holderFlag: "🇧🇷",
    year: 2014,
    value: 136,
    unit: "goals",
    description: "The 2014 group stage produced 136 goals across 48 matches — 2.83 goals per game.",
    funFact: "Germany's 7-1 win vs Brazil in the semifinals was not in the group stage but exemplified 2014's high-scoring nature.",
    compare: ({ totalGoals, finishedGames }) => ({
      current: `~${totalGoals} goals in ${finishedGames} finished matches (all stages)`,
      progress: Math.min(100, (totalGoals / 136) * 100),
      isBeaten: totalGoals > 136,
      isNearing: totalGoals > 100 && totalGoals <= 136,
    }),
  },

  // ─── TEAM ─────────────────────────────────────────────────────────────────
  {
    id: "most_goals_team_one_wc",
    category: "Team",
    emoji: "🔥",
    title: "Most Goals by One Team in a Single World Cup",
    holder: "Hungary",
    holderFlag: "🇭🇺",
    year: 1954,
    value: 27,
    unit: "goals",
    description: "Hungary scored an incredible 27 goals in just 5 matches at the 1954 World Cup — including a 10-1 and 8-3 win.",
    funFact: "Despite scoring 27 goals, Hungary lost the final to West Germany 3-2 in one of sport's greatest upsets.",
    compare: ({ topTeamGoals, topTeamName }) => ({
      current: `${topTeamName}: ${topTeamGoals} goals`,
      progress: Math.min(100, (topTeamGoals / 27) * 100),
      isBeaten: topTeamGoals > 27,
      isNearing: topTeamGoals >= 18 && topTeamGoals <= 27,
    }),
  },
  {
    id: "biggest_winning_margin",
    category: "Team",
    emoji: "💪",
    title: "Biggest Victory Margin in World Cup History",
    holder: "Hungary 10-1 El Salvador",
    holderFlag: "🇭🇺",
    year: 1982,
    value: 9,
    unit: "goals margin",
    description: "Hungary beat El Salvador 10-1 at the 1982 World Cup — a margin of 9 goals that has never been equaled.",
    funFact: "László Kiss became the first substitute to score a hat-trick in WC history in this game.",
    compare: ({ biggestMargin, biggestMarginStr }) => ({
      current: biggestMargin > 0 ? `${biggestMarginStr} (${biggestMargin} goal margin)` : "TBD",
      progress: Math.min(100, (biggestMargin / 9) * 100),
      isBeaten: biggestMargin >= 10,
      isNearing: biggestMargin >= 6 && biggestMargin < 10,
    }),
  },
  {
    id: "fewest_goals_conceded_champions",
    category: "Team",
    emoji: "🛡️",
    title: "Fewest Goals Conceded by World Cup Winners",
    holder: "Italy 2006",
    holderFlag: "🇮🇹",
    year: 2006,
    value: 2,
    unit: "goals conceded",
    description: "Italy conceded only 2 goals throughout the entire 2006 World Cup on their way to winning the title.",
    funFact: "One of Italy's 2 goals conceded was an own goal by Cristian Zaccardo — so opponents only scored once past Italy.",
    compare: () => ({
      current: "Track tournament winner's defensive record",
      progress: 0,
      isBeaten: false,
      isNearing: false,
    }),
  },
  {
    id: "most_consecutive_wins",
    category: "Team",
    emoji: "🏆",
    title: "Most Consecutive World Cup Match Wins",
    holder: "Brazil",
    holderFlag: "🇧🇷",
    year: "2002–2006",
    value: 11,
    unit: "consecutive wins",
    description: "Brazil won 11 consecutive World Cup matches spanning from 2002 to 2006 — an all-time record across tournaments.",
    funFact: "Brazil's 11-game run ended when they lost to France in the 2006 quarterfinals.",
    compare: () => ({
      current: "Multi-tournament record — cannot be broken in 2026",
      progress: 0,
      isBeaten: false,
      isNearing: false,
    }),
  },
  {
    id: "most_clean_sheets_team_one_wc",
    category: "Team",
    emoji: "🧤",
    title: "Most Clean Sheets by One Team in One World Cup",
    holder: "Fabien Barthez / France 1998",
    holderFlag: "🇫🇷",
    year: 1998,
    value: 6,
    unit: "clean sheets",
    description: "France kept 6 clean sheets at the 1998 World Cup — only conceding 2 goals (both in the semifinal) on their way to glory.",
    funFact: "France didn't concede a single goal in their first 4 matches of the 1998 tournament.",
    compare: ({ topTeamCleanSheets, topTeamCleanSheetsName }) => ({
      current: `${topTeamCleanSheetsName}: ${topTeamCleanSheets} clean sheets`,
      progress: Math.min(100, (topTeamCleanSheets / 6) * 100),
      isBeaten: topTeamCleanSheets > 6,
      isNearing: topTeamCleanSheets >= 4 && topTeamCleanSheets <= 6,
    }),
  },

  // ─── INDIVIDUAL ───────────────────────────────────────────────────────────
  {
    id: "youngest_goalscorer",
    category: "Individual",
    emoji: "🌟",
    title: "Youngest Goalscorer in World Cup History",
    holder: "Pelé",
    holderFlag: "🇧🇷",
    year: 1958,
    value: 17,
    unit: "years old (17y 239d)",
    description: "Pelé scored at the 1958 World Cup aged just 17 years and 239 days — still the youngest goalscorer in WC history.",
    funFact: "Pelé scored 6 goals at that tournament including a hat-trick in the semifinal and a brace in the final.",
    compare: () => ({
      current: "Live age tracking not available",
      progress: 0,
      isBeaten: false,
      isNearing: false,
    }),
  },
  {
    id: "oldest_goalscorer",
    category: "Individual",
    emoji: "👴",
    title: "Oldest Goalscorer in World Cup History",
    holder: "Roger Milla",
    holderFlag: "🇨🇲",
    year: 1994,
    value: 42,
    unit: "years old (42y 39d)",
    description: "Roger Milla scored for Cameroon at the 1994 World Cup aged 42 years and 39 days — the oldest goalscorer ever.",
    funFact: "Milla came out of retirement twice to play in the 1990 and 1994 World Cups.",
    compare: () => ({
      current: "Live age tracking not available",
      progress: 0,
      isBeaten: false,
      isNearing: false,
    }),
  },
  {
    id: "most_wc_appearances",
    category: "Individual",
    emoji: "🎖️",
    title: "Most World Cup Match Appearances",
    holder: "Lionel Messi",
    holderFlag: "🇦🇷",
    year: "2006–2022",
    value: 26,
    unit: "matches",
    description: "Lionel Messi holds the record for most World Cup matches played with 26 appearances across five tournaments.",
    funFact: "Messi is also the first player to win a WC medal as both a finalist (2014, lost) and a champion (2022).",
    compare: () => ({
      current: "Messi playing in 2026 would extend this record",
      progress: 0,
      isBeaten: false,
      isNearing: false,
    }),
  },
  {
    id: "most_wc_tournaments",
    category: "Individual",
    emoji: "📅",
    title: "Most World Cup Tournaments Played",
    holder: "Carbajal, Matthäus, Buffon, Márquez, Messi",
    holderFlag: "🏅",
    year: "Various",
    value: 5,
    unit: "tournaments",
    description: "Five players have each played at 5 World Cups: Carbajal (1950–66), Matthäus (1982–98), Buffon (1998–2014), Márquez (2002–18), and Messi (2006–22).",
    funFact: "Rafael Márquez became the first player to captain a team at 5 World Cups in 2018.",
    compare: () => ({
      current: "Generational record — requires 5 consecutive WCs",
      progress: 0,
      isBeaten: false,
      isNearing: false,
    }),
  },
  {
    id: "most_saves_single_match",
    category: "Individual",
    emoji: "🧤",
    title: "Most Saves by a Goalkeeper in One World Cup Match",
    holder: "Tim Howard (USA)",
    holderFlag: "🇺🇸",
    year: 2014,
    value: 16,
    unit: "saves",
    description: "Tim Howard made 16 saves for the USA against Belgium in the 2014 round of 16 — a WC single-match record.",
    funFact: "Despite Howard's heroics, Belgium won 2-1 in extra time.",
    compare: () => ({
      current: "Live save tracking not available from this API",
      progress: 0,
      isBeaten: false,
      isNearing: false,
    }),
  },
  {
    id: "most_hat_tricks_wc",
    category: "Individual",
    emoji: "⚽⚽⚽",
    title: "Most Hat-Tricks in a Single World Cup Tournament",
    holder: "1954 Switzerland",
    holderFlag: "🇨🇭",
    year: 1954,
    value: 7,
    unit: "hat-tricks",
    description: "The 1954 World Cup had 7 hat-tricks — more than any other edition. A result of incredibly open, attacking play.",
    funFact: "The 1954 WC averaged 5.38 goals per game — still the highest ever in World Cup history.",
    compare: () => ({
      current: "Hat-trick tracking via live API in 2026",
      progress: 0,
      isBeaten: false,
      isNearing: false,
    }),
  },

  // ─── TOURNAMENT ───────────────────────────────────────────────────────────
  {
    id: "most_teams",
    category: "Tournament",
    emoji: "🌍",
    title: "Most Teams in a World Cup",
    holder: "32-team format (1998–2022)",
    holderFlag: "🏆",
    year: "1998–2022",
    value: 32,
    unit: "teams",
    description: "From 1998 to 2022, the World Cup featured 32 national teams. The 2026 edition expanded to 48 — a new record.",
    funFact: "The original 1930 World Cup had just 13 teams. The expansion has been gradual over nearly a century.",
    compare: () => ({
      current: "48 teams in 2026 ✓ NEW RECORD SET",
      progress: 100,
      isBeaten: true,
      isNearing: false,
    }),
  },
  {
    id: "most_matches",
    category: "Tournament",
    emoji: "📋",
    title: "Most Matches in a World Cup",
    holder: "32-team format (1998–2022)",
    holderFlag: "🏆",
    year: "1998–2022",
    value: 64,
    unit: "matches",
    description: "The 32-team format produced 64 matches per tournament. The 2026 edition will have 104 matches — a massive leap.",
    funFact: "104 matches means fans get 40 more matches of football compared to any previous World Cup.",
    compare: ({ finishedGames }) => ({
      current: `${finishedGames} of 104 matches completed. Record already set ✓`,
      progress: 100,
      isBeaten: true,
      isNearing: false,
    }),
  },
  {
    id: "highest_avg_attendance",
    category: "Tournament",
    emoji: "👥",
    title: "Highest Average Match Attendance",
    holder: "USA 1994",
    holderFlag: "🇺🇸",
    year: 1994,
    value: 68991,
    unit: "avg fans per game",
    description: "The 1994 World Cup in USA averaged 68,991 fans per match — still the highest average attendance ever recorded.",
    funFact: "The USA hosted the WC despite not qualifying for a WC themselves since 1950 until 1990.",
    compare: () => ({
      current: "2026 hosted in USA/Canada/Mexico — record attendance expected",
      progress: 90,
      isBeaten: false,
      isNearing: true,
    }),
  },
  {
    id: "most_red_cards",
    category: "Tournament",
    emoji: "🟥",
    title: "Most Red Cards in One World Cup",
    holder: "Germany 2006",
    holderFlag: "🇩🇪",
    year: 2006,
    value: 28,
    unit: "red cards",
    description: "The 2006 World Cup in Germany set an unwanted record with 28 red cards — the most disciplinary dismissals ever.",
    funFact: "In contrast, the 2010 WC had just 17 red cards. FIFA's crackdown on simulation was a factor in 2006.",
    compare: ({ totalRedCards }) => ({
      current: `${totalRedCards} red cards in 2026 so far`,
      progress: Math.min(100, (totalRedCards / 28) * 100),
      isBeaten: totalRedCards > 28,
      isNearing: totalRedCards >= 20 && totalRedCards <= 28,
    }),
  },
  {
    id: "most_goalless_draws",
    category: "Tournament",
    emoji: "0️⃣",
    title: "Most Goalless Draws in One World Cup",
    holder: "Qatar 2022",
    holderFlag: "🇶🇦",
    year: 2022,
    value: 5,
    unit: "goalless draws (0-0)",
    description: "The 2022 World Cup in Qatar had 5 goalless draws — the most ever recorded in a single WC tournament.",
    funFact: "The very first World Cup match (1930) ended 1-0 — there have been 0-0 draws in every WC since then.",
    compare: ({ goallessDrws }) => ({
      current: `${goallessDrws} goalless draws in 2026 so far`,
      progress: Math.min(100, (goallessDrws / 5) * 100),
      isBeaten: goallessDrws > 5,
      isNearing: goallessDrws >= 4 && goallessDrws <= 5,
    }),
  },
  {
    id: "lowest_avg_goals",
    category: "Tournament",
    emoji: "📉",
    title: "Lowest Average Goals Per Game in a World Cup",
    holder: "Italy 1990",
    holderFlag: "🇮🇹",
    year: 1990,
    value: 2.21,
    unit: "goals per game",
    description: "The 1990 World Cup was notorious for defensive play — averaging just 2.21 goals per game across 52 matches.",
    funFact: "As a result of 1990's tedium, FIFA introduced rule changes encouraging attacking play, including no back-passes to goalkeepers.",
    compare: ({ avgGoalsPerGame }) => ({
      current: `${avgGoalsPerGame.toFixed(2)} goals per game in 2026`,
      progress: Math.min(100, ((5.38 - avgGoalsPerGame) / (5.38 - 2.21)) * 100),
      isBeaten: avgGoalsPerGame < 2.21,
      isNearing: avgGoalsPerGame < 2.5 && avgGoalsPerGame >= 2.21,
    }),
  },
  {
    id: "highest_avg_goals",
    category: "Tournament",
    emoji: "📈",
    title: "Highest Average Goals Per Game in a World Cup",
    holder: "Switzerland 1954",
    holderFlag: "🇨🇭",
    year: 1954,
    value: 5.38,
    unit: "goals per game",
    description: "The 1954 World Cup in Switzerland averaged 5.38 goals per game — the highest-scoring edition ever. 140 goals in 26 matches.",
    funFact: "The tournament lacked a group stage and played straight knockout with replays — teams scored freely.",
    compare: ({ avgGoalsPerGame }) => ({
      current: `${avgGoalsPerGame.toFixed(2)} avg goals/game in 2026`,
      progress: Math.min(100, (avgGoalsPerGame / 5.38) * 100),
      isBeaten: avgGoalsPerGame > 5.38,
      isNearing: avgGoalsPerGame > 4.0 && avgGoalsPerGame <= 5.38,
    }),
  },

  // ─── MILESTONES ────────────────────────────────────────────────────────────
  {
    id: "first_trinational_host",
    category: "Milestones",
    emoji: "🌎",
    title: "First World Cup Hosted by Three Nations",
    holder: "Previously: Two nations max (2002 Japan/South Korea)",
    holderFlag: "🌍",
    year: 2026,
    value: 3,
    unit: "host nations",
    description: "2026 is the first World Cup ever co-hosted by three nations — USA, Canada, and Mexico — spanning an entire continent.",
    funFact: "Mexico is the first country to co-host three World Cups (1970, 1986, 2026).",
    compare: () => ({
      current: "USA 🇺🇸 + Canada 🇨🇦 + Mexico 🇲🇽 — HISTORIC FIRST ✓",
      progress: 100,
      isBeaten: true,
      isNearing: false,
    }),
  },
  {
    id: "first_48_teams",
    category: "Milestones",
    emoji: "🔢",
    title: "First 48-Team World Cup",
    holder: "Previous max: 32 teams (1998–2022)",
    holderFlag: "🏆",
    year: 2026,
    value: 48,
    unit: "teams",
    description: "2026 marks the first World Cup with 48 participating nations — expanding global football representation.",
    funFact: "16 new nations get to debut or return to the World Cup stage thanks to the expanded format.",
    compare: () => ({
      current: "48 nations competing — HISTORIC FIRST ✓",
      progress: 100,
      isBeaten: true,
      isNearing: false,
    }),
  },
  {
    id: "most_matches_format",
    category: "Milestones",
    emoji: "📅",
    title: "Most Matches in World Cup History",
    holder: "32-team format — 64 matches (1998–2022)",
    holderFlag: "🏆",
    year: 2026,
    value: 104,
    unit: "total matches",
    description: "2026 features 104 matches — 40 more than any previous World Cup. The introduction of the Round of 32 adds an extra knockout stage.",
    funFact: "The 104-match schedule makes 2026 the longest World Cup ever by number of games.",
    compare: ({ finishedGames }) => ({
      current: `${finishedGames} of 104 matches completed — RECORD SET ✓`,
      progress: 100,
      isBeaten: true,
      isNearing: false,
    }),
  },

  // ─── ATTENDANCE ────────────────────────────────────────────────────────────
  {
    id: "highest_single_match_attendance",
    category: "Attendance",
    emoji: "🏟️",
    title: "Highest Attendance at a World Cup Match",
    holder: "Brazil vs Uruguay — Maracanã Final",
    holderFlag: "🇧🇷",
    year: 1950,
    value: 173850,
    unit: "spectators",
    description: "The 1950 World Cup final (effectively the 'final pool' decisive match) between Brazil and Uruguay drew an estimated 173,850 fans — the largest crowd ever at a football match.",
    funFact: "Estimates vary (up to 200,000), but FIFA officially records 173,850. Uruguay's win is known as the 'Maracanazo'.",
    compare: () => ({
      current: "2026 matches at MetLife Stadium (82,500 cap) could challenge this",
      progress: 50,
      isBeaten: false,
      isNearing: false,
    }),
  },
  {
    id: "highest_total_attendance",
    category: "Attendance",
    emoji: "👨‍👩‍👧‍👦",
    title: "Highest Total Tournament Attendance",
    holder: "USA 1994",
    holderFlag: "🇺🇸",
    year: 1994,
    value: 3587538,
    unit: "total fans",
    description: "The 1994 World Cup attracted 3,587,538 fans across 52 matches — the highest total attendance in WC history. With 104 matches in 2026, this record is expected to fall.",
    funFact: "1994's total still stands after 30+ years — no host since has matched the sheer scale of the US market.",
    compare: () => ({
      current: "2026 with 104 matches across USA/Canada/Mexico — record expected to fall",
      progress: 75,
      isBeaten: false,
      isNearing: true,
    }),
  },
];

export default RECORDS;
export { RECORDS };

export const RECORD_CATEGORIES = [
  "All",
  "Goals",
  "Team",
  "Individual",
  "Tournament",
  "Milestones",
  "Goalkeeper",
  "Attendance",
] as const;

export type RecordCategory = typeof RECORD_CATEGORIES[number];
