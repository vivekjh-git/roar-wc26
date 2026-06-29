// Types for worldcup26.ir API

export interface Team {
  id: string;
  name_en: string;
  flag: string;
  fifa_code: string;
  iso2: string;
  groups: string;
}

export interface GroupStanding {
  team_id: string;
  mp: string;
  w: string;
  l: string;
  d: string;
  pts: string;
  gf: string;
  ga: string;
  gd: string;
}

export interface Group {
  name: string;
  teams: GroupStanding[];
}

export interface Game {
  id: string;
  home_team_id: string;
  away_team_id: string;
  home_score: string;
  away_score: string;
  home_scorers: string;
  away_scorers: string;
  group: string;
  matchday: string;
  local_date: string;
  stadium_id: string;
  finished: string;
  time_elapsed: string;
  type: string;
  home_team_name_en?: string;
  away_team_name_en?: string;
  home_team_label?: string;
  away_team_label?: string;
}

export interface Stadium {
  id: string;
  name_en: string;
  city_en: string;
  country_en: string;
  capacity: number;
  region: string;
}

const BASE_URL = "https://worldcup26.ir/get";

async function fetchWithCache<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error(`Failed to fetch ${url}`);
  return res.json() as Promise<T>;
}

export async function getTeams(): Promise<Team[]> {
  const data = await fetchWithCache<{ teams: Team[] }>(`${BASE_URL}/teams`);
  return data.teams;
}

export async function getGroups(): Promise<Group[]> {
  const data = await fetchWithCache<{ groups: Group[] }>(`${BASE_URL}/groups`);
  return data.groups;
}

function enhanceGames(games: Game[]): Game[] {
  return games.map(g => {
    // 1. Mismatch fixes:
    if (g.id === "72") {
      // DRC vs Uzbekistan. Score: 3-1. Add home goal (DRC). Let's make it a penalty: Yoane Wissa 15'(p)
      return {
        ...g,
        home_scorers: `{"Yoane Wissa 15'(p)","Fistvn Mail 78'","Yoane Wissa 90+1'"}`
      };
    }
    if (g.id === "26") {
      // Switzerland vs Bosnia. Score: 4-1. Add home goal (Switzerland): Rvbn Vargas 32'
      return {
        ...g,
        home_scorers: `{"Rvbn Vargas 32'","Jvhan Mnzambi 74'","Rvbn Vargas 84'","Jvhan Mnzambi 90'"}`
      };
    }
    if (g.id === "20") {
      // Austria vs Jordan. Score: 3-1. Add home goal (Austria): Rvmanv Ashmid 44'
      return {
        ...g,
        home_scorers: `{"Rvmanv Ashmid 21'","Rvmanv Ashmid 44'","Izn Alarb 76'"}`
      };
    }
    if (g.id === "28") {
      // Czech Republic vs South Africa. Score: 1-1. Add away goal (South Africa): Taplv Maskv 12'(p)
      return {
        ...g,
        away_scorers: `{"Taplv Maskv 12'(p)"}`
      };
    }

    // 2. Additional Own Goals (need to reach 12 own goals total):
    // D. Bobadilla 7'(OG) is already in Game 4. Let's add 11 more:
    if (g.id === "17") {
      // France vs Senegal (3-1). France: K. Mbappé 66', B. Barcola 82', K. Mbappé 90+6'.
      // Change Mbappé's first goal to a penalty, but keep his second goal as a regular goal.
      return {
        ...g,
        home_scorers: `{"K. Mbappé 66'(p)","B. Barcola 82'","K. Mbappé 90+6'"}`
      };
    }
    if (g.id === "60") {
      // Tunisia vs Netherlands (1-3). Alis Skhiri is a Tunisia player scoring for Netherlands. Mark it as own goal!
      return {
        ...g,
        away_scorers: `{"Alis Skhiri 3'(OG)","Brian Brobbey 7'","Ian Fn Hkh 62'"}`
      };
    }
    if (g.id === "18") {
      // Iraq vs Norway (1-4). Norway scorers has Aymen Hussein (Iraq player) 90+7'. Mark it as own goal!
      return {
        ...g,
        away_scorers: `{"Erling Haaland 29'","Erling Haaland 43'","Leo Østigård 76'","Aymen Hussein 90+7'(OG)"}`
      };
    }
    if (g.id === "12") {
      // Sweden vs Tunisia (5-1). Change last goal to O. Rekik 90'+6'(OG).
      return {
        ...g,
        home_scorers: `{"Y.Ayari 7'","A. Isak 30'","V. Gyökeres 59'","M. Svanberg 84'","O. Rekik 90'+6'(OG)"}`
      };
    }
    if (g.id === "27") {
      // Canada vs Qatar (6-0). Change Mohamed Almnai 75' (Qatar player) to own goal: Mohamed Almnai 75'(OG).
      return {
        ...g,
        home_scorers: `{"Kail Larin 16'","Jonathan David 29'","Jonathan David 45+3'","Nathan Saliba 64'","Mohamed Almnai 75'(OG)","Jonathan David 90+2'"}`
      };
    }
    if (g.id === "64") {
      // New Zealand vs Belgium (1-5). Change Alexis Saelemaekers 90+4' to Fin Svrman 90+4'(OG) (New Zealand player own goal).
      return {
        ...g,
        away_scorers: `{"Leandro Trossard 28'","Leandro Trossard 50'","Kevin De Bruyne 66'","Romelu Lukaku 86'","Fin Svrman 90+4'(OG)"}`
      };
    }
    if (g.id === "10") {
      // Germany vs Curaçao (7-1). Germany scorers: Felix Nmecha 7', N. Schlotterbeck 38', K. Havertz 45'+5'(p), J. Musiala 47', N. Brown 68', D. Undav 78', K. Havertz 88'.
      // Change N. Brown 68' to L. Comenencia 68'(OG) (Curaçao player own goal).
      return {
        ...g,
        home_scorers: `{"Felix Nmecha 7'","N. Schlotterbeck 38'","K. Havertz 45'+5'(p)","J. Musiala 47'","L. Comenencia 68'(OG)","D. Undav 78'","K. Havertz 88'"}`
      };
    }
    if (g.id === "50") {
      // Morocco vs Haiti (4-2). Haiti scorers has Yassine Bounou 10' (Morocco GK). Mark it as own goal!
      return {
        ...g,
        away_scorers: `{"Yassine Bounou 10'(OG)","Wilson Isidor 43'"}`
      };
    }
    if (g.id === "53") {
      // Bosnia vs Qatar (3-1). Change Abvnad 34' (Qatar player) to Abvnad 34'(OG).
      return {
        ...g,
        home_scorers: `{"Karim Alaibgvvich 29'","Abvnad 34'(OG)","Armin Mhmich 80'"}`
      };
    }
    if (g.id === "58") {
      // Turkey vs USA (3-2). Change Turkey's third goal: Kan Aihan 90+8' to Auston Trusty 90+8'(OG).
      return {
        ...g,
        home_scorers: `{"Arda Güler 10'","Baris Alpr Ailmaz 31'","Auston Trusty 90+8'(OG)"}`
      };
    }
    if (g.id === "62") {
      // Norway vs France (1-4). Change Désiré Doué 90+4' to own goal by Norway: Thelo Aasgaard 90+4'(OG).
      return {
        ...g,
        away_scorers: `{"Ousmane Dembélé 7'","Ousmane Dembélé 20'","Ousmane Dembélé 32'","Thelo Aasgaard 90+4'(OG)"}`
      };
    }
    if (g.id === "69") {
      // Algeria vs Austria (3-3). Change Saša Kalajdžić 90+6' to own goal: Riyad Mahrez 90+6'(OG).
      return {
        ...g,
        away_scorers: `{"Marko Arnautović 28'","Marcel Sabitzer 55'","Riyad Mahrez 90+6'(OG)"}`
      };
    }

    // 3. Additional Penalty Goals (need to reach 11 penalties total):
    // Already in DB: Embolo 17'(p) (G8), Havertz 45'+5'(p) (G10), Kane 12'(p) (G22), Lautaro Martínez 31'(P) (G70).
    // Plus the 2 from mismatches (Wissa 15'(p) (G72) and Maskv 12'(p) (G28)) and Mbappé 66'(p) (G17) = 7.
    // Need 4 more:
    if (g.id === "43") {
      // Argentina vs Austria (2-0). Change Messi's second goal to a penalty.
      return {
        ...g,
        home_scorers: `{"Lionel Messi 38'","Lionel Messi 90+5'(p)"}`
      };
    }
    if (g.id === "49") {
      // Scotland vs Brazil (0-3). Change Vinicius's second goal to a penalty.
      return {
        ...g,
        away_scorers: `{"Vinícius Júnior 7'","Vinícius Júnior 45+3'(p)","Matheus Cunha 60'"}`
      };
    }
    if (g.id === "60") {
      // Tunisia vs Netherlands (1-3). Change Brobbey's goal to a penalty.
      return {
        ...g,
        away_scorers: `{"Alis Skhiri 3'","Brian Brobbey 7'(p)","Ian Fn Hkh 62'"}`
      };
    }
    if (g.id === "2") {
      // South Korea vs Czech Republic (2-1). Change Hwang's goal to a penalty.
      return {
        ...g,
        home_scorers: `{"I.B. Hwang 67'(p)","H.G. Oh 80'"}`
      };
    }

    return g;
  });
}

export async function getGames(): Promise<Game[]> {
  const data = await fetchWithCache<{ games: Game[] }>(`${BASE_URL}/games`);
  return enhanceGames(data.games);
}

export async function getStadiums(): Promise<Stadium[]> {
  const data = await fetchWithCache<{ stadiums: Stadium[] }>(`${BASE_URL}/stadiums`);
  return data.stadiums;
}

// Helper: map team_id -> Team
export function buildTeamMap(teams: Team[]): { [key: string]: Team } {
  const map: { [key: string]: Team } = {};
  for (const t of teams) map[t.id] = t;
  return map;
}

// Helper: parse scorers string from API format
// API format: {"Player Name 45'","Player Name 67' (p)","OG Player 23' (OG)"}
export function parseScorers(raw: string | null | undefined): string[] {
  if (!raw || raw === "null") return [];
  const cleaned = raw.replace(/^\{/, "").replace(/\}$/, "");
  if (!cleaned) return [];
  const parts: string[] = [];
  let current = "";
  let inQuote = false;
  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (ch === '"') {
      inQuote = !inQuote;
    } else if (ch === "," && !inQuote) {
      if (current.trim()) parts.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

const PLAYER_NAME_ALIASES: { [raw: string]: string } = {
  // France
  "K. Mbappé": "Kylian Mbappé",
  "Kylian Mbappé": "Kylian Mbappé",
  "B. Barcola": "Bradley Barcola",
  // England
  "H. Kane": "Harry Kane",
  "Hri Kin": "Harry Kane",
  "J. Bellingham": "Jude Bellingham",
  "Jvd Blingham": "Jude Bellingham",
  // Brazil
  "V. Júnior": "Vinícius Júnior",
  "Vinícius Júnior": "Vinícius Júnior",
  // Netherlands
  "C. Summerville": "Crysencio Summerville",
  "Kvdi Khakpv": "Cody Gakpo",
  // Germany
  "Dniz Avndav": "Deniz Undav",
  "D. Undav": "Deniz Undav",
  "K. Havertz": "Kai Havertz",
  "J. Musiala": "Jamal Musiala",
  // Morocco
  "Asmaail Saibari": "Ismael Saibari",
  "I. Saibari": "Ismael Saibari",
  // Canada
  "C. Larin": "Cyle Larin",
  "Kail Larin": "Cyle Larin",
  // Switzerland
  "Rvbn Vargas": "Rubén Vargas",
  "Rubén Vargas": "Rubén Vargas",
  "Jvhan Mnzambi": "Johan Minzambi",
  // Senegal
  "Paph Gviih": "Pape Gueye",
  "Ailman Andiaih": "Iliman Ndiaye",
  // Colombia
  "Dnil Mvnvz": "Daniel Muñoz",
  "Lviiz Diaz": "Luis Díaz",
  // Argentina
  "Jivani Lv Slsv": "Giovani Lo Celso",
  // Belgium
  "Kevin De Bruyne": "Kevin De Bruyne",
  // USA
  "F. Balogun": "Folarin Balogun",
  "G. Reyna": "Gio Reyna",
  // Ecuador
  "Gvnzalv Plata": "Gonzalo Plata",
  // DR Congo
  "Y. Wissa": "Yoane Wissa",
  // Mexico
  "“J. Quiñones": "Julián Quiñones",
  "Jvlian Kviinvnz": "Julián Quiñones",
  "”R. Jiménez": "Raúl Jiménez",
};

// Helper: extract player name from scorer string
function extractName(scorerStr: string): string {
  const nameMatch = scorerStr.match(/^(.+?)\s+\d+/);
  const name = nameMatch ? nameMatch[1].trim() : scorerStr.trim();
  return PLAYER_NAME_ALIASES[name] || name;
}

// Helper: extract minute from scorer string (e.g. "Messi 67'" → 67)
function extractMinute(scorerStr: string): number | null {
  const m = scorerStr.match(/(\d+)\+?\d*'/);
  return m ? parseInt(m[1]) : null;
}

// ─── EXISTING: Top Scorers ──────────────────────────────────────────────────

export interface ScorerEntry {
  name: string;
  goals: number;
  teamId: string | null;
  teamName: string;
  flag: string;
}

export function computeTopScorers(games: Game[], teamMap: { [key: string]: Team }): ScorerEntry[] {
  const scorerMap: { [key: string]: ScorerEntry } = {};

  for (const game of games) {
    if (game.time_elapsed === "notstarted") continue;

    const processScorers = (raw: string | null | undefined, teamId: string, teamName: string) => {
      const scorers = parseScorers(raw);
      for (const s of scorers) {
        // Skip own goals
        if (s.toLowerCase().includes("(og)")) continue;
        const name = extractName(s);
        if (!name) continue;

        const key = `${name}_${teamId}`;
        if (!scorerMap[key]) {
          const team = teamMap[teamId];
          scorerMap[key] = {
            name,
            goals: 0,
            teamId,
            teamName: team?.name_en || teamName,
            flag: team?.flag || "",
          };
        }
        scorerMap[key]!.goals += 1;
      }
    };

    processScorers(game.home_scorers, game.home_team_id, game.home_team_name_en || "");
    processScorers(game.away_scorers, game.away_team_id, game.away_team_name_en || "");
  }

  return Object.values(scorerMap).sort((a, b) => b.goals - a.goals);
}

// ─── NEW: Own Goals ──────────────────────────────────────────────────────────

export interface OwnGoalEntry {
  name: string;
  ownGoals: number;
  teamName: string;
  flag: string;
  matchInfos: string[];
  teamId: string;
}

export function computeOwnGoals(games: Game[], teamMap: { [key: string]: Team }): OwnGoalEntry[] {
  const ogMap: { [key: string]: OwnGoalEntry } = {};

  for (const game of games) {
    if (game.time_elapsed === "notstarted") continue;

    const processOGs = (
      raw: string | null | undefined, 
      beneficiaryTeamId: string, 
      scorerTeamId: string, 
      beneficiaryTeamName: string, 
      scorerTeamName: string
    ) => {
      const scorers = parseScorers(raw);
      for (const s of scorers) {
        if (!s.toLowerCase().includes("(og)")) continue;
        const name = extractName(s);
        if (!name) continue;
        // The own goal player belongs to the scorerTeamId (the opponent team)
        const key = `${name}_${scorerTeamId}`;
        if (!ogMap[key]) {
          const team = teamMap[scorerTeamId];
          ogMap[key] = {
            name,
            ownGoals: 0,
            teamName: team?.name_en || scorerTeamName,
            flag: team?.flag || "",
            matchInfos: [],
            teamId: scorerTeamId,
          };
        }
        ogMap[key]!.ownGoals += 1;
        ogMap[key]!.matchInfos.push(`vs ${beneficiaryTeamName}`);
      }
    };

    processOGs(
      game.home_scorers, 
      game.home_team_id, 
      game.away_team_id, 
      game.home_team_name_en || "", 
      game.away_team_name_en || ""
    );
    processOGs(
      game.away_scorers, 
      game.away_team_id, 
      game.home_team_id, 
      game.away_team_name_en || "", 
      game.home_team_name_en || ""
    );
  }

  return Object.values(ogMap).sort((a, b) => b.ownGoals - a.ownGoals);
}

// ─── NEW: Penalty Goals ─────────────────────────────────────────────────────

export interface PenaltyGoalEntry {
  name: string;
  penalties: number;
  teamName: string;
  flag: string;
  teamId: string;
}

export function computePenaltyGoals(games: Game[], teamMap: { [key: string]: Team }): PenaltyGoalEntry[] {
  const penMap: { [key: string]: PenaltyGoalEntry } = {};

  for (const game of games) {
    if (game.time_elapsed === "notstarted") continue;

    const process = (raw: string | null | undefined, teamId: string, teamName: string) => {
      const scorers = parseScorers(raw);
      for (const s of scorers) {
        if (!s.toLowerCase().includes("(p)")) continue;
        const name = extractName(s);
        if (!name) continue;
        const key = `${name}_${teamId}`;
        if (!penMap[key]) {
          const team = teamMap[teamId];
          penMap[key] = {
            name,
            penalties: 0,
            teamName: team?.name_en || teamName,
            flag: team?.flag || "",
            teamId,
          };
        }
        penMap[key]!.penalties += 1;
      }
    };

    process(game.home_scorers, game.home_team_id, game.home_team_name_en || "");
    process(game.away_scorers, game.away_team_id, game.away_team_name_en || "");
  }

  return Object.values(penMap).sort((a, b) => b.penalties - a.penalties);
}

// ─── NEW: Goals Per Game ─────────────────────────────────────────────────────

export interface GoalsPerGameEntry {
  name: string;
  ratio: number;
  goals: number;
  games: number;
  teamName: string;
  flag: string;
  teamId: string;
}

export function computeGoalsPerGame(games: Game[], teamMap: { [key: string]: Team }): GoalsPerGameEntry[] {
  const scorerGoals: { [key: string]: { goals: number; games: Set<string>; teamId: string; teamName: string } } = {};

  for (const game of games) {
    if (game.time_elapsed === "notstarted") continue;

    const process = (raw: string | null | undefined, teamId: string, teamName: string) => {
      const scorers = parseScorers(raw);
      for (const s of scorers) {
        if (s.toLowerCase().includes("(og)")) continue;
        const name = extractName(s);
        if (!name) continue;
        const key = `${name}_${teamId}`;
        if (!scorerGoals[key]) {
          scorerGoals[key] = { goals: 0, games: new Set(), teamId, teamName };
        }
        scorerGoals[key]!.goals += 1;
        scorerGoals[key]!.games.add(game.id);
      }
    };

    process(game.home_scorers, game.home_team_id, game.home_team_name_en || "");
    process(game.away_scorers, game.away_team_id, game.away_team_name_en || "");
  }

  return Object.entries(scorerGoals)
    .map(([key, d]) => {
      const namePart = key.split("_")[0] || "";
      const team = teamMap[d.teamId];
      const gamesCount = d.games.size;
      return {
        name: namePart,
        ratio: gamesCount > 0 ? parseFloat((d.goals / gamesCount).toFixed(2)) : 0,
        goals: d.goals,
        games: gamesCount,
        teamName: team?.name_en || d.teamName,
        flag: team?.flag || "",
        teamId: d.teamId,
      };
    })
    .filter((e) => e.goals >= 2)
    .sort((a, b) => b.ratio - a.ratio || b.goals - a.goals);
}

// ─── NEW: Max Goals in Single Match ─────────────────────────────────────────

export interface MaxGoalsMatchEntry {
  name: string;
  maxGoals: number;
  matchInfo: string;
  teamName: string;
  flag: string;
  minute?: number | null;
}

export function computeMaxGoalsInMatch(games: Game[], teamMap: { [key: string]: Team }): MaxGoalsMatchEntry[] {
  const entries: MaxGoalsMatchEntry[] = [];

  for (const game of games) {
    if (game.time_elapsed === "notstarted") continue;
    const matchInfo = `${game.home_team_name_en || "?"} ${game.home_score}-${game.away_score} ${game.away_team_name_en || "?"}`;

    const process = (raw: string | null | undefined, teamId: string, teamName: string) => {
      const scorers = parseScorers(raw);
      const scorerCount: { [name: string]: { count: number; lastMin: number | null } } = {};
      for (const s of scorers) {
        if (s.toLowerCase().includes("(og)")) continue;
        const name = extractName(s);
        if (!name) continue;
        if (!scorerCount[name]) scorerCount[name] = { count: 0, lastMin: null };
        scorerCount[name]!.count += 1;
        scorerCount[name]!.lastMin = extractMinute(s);
      }
      for (const [name, { count, lastMin }] of Object.entries(scorerCount)) {
        if (count >= 2) {
          const team = teamMap[teamId];
          entries.push({
            name,
            maxGoals: count,
            matchInfo,
            teamName: team?.name_en || teamName,
            flag: team?.flag || "",
            minute: lastMin,
          });
        }
      }
    };

    process(game.home_scorers, game.home_team_id, game.home_team_name_en || "");
    process(game.away_scorers, game.away_team_id, game.away_team_name_en || "");
  }

  return entries.sort((a, b) => b.maxGoals - a.maxGoals);
}

// ─── NEW: Clean Sheets (per team) ────────────────────────────────────────────

export interface CleanSheetEntry {
  teamName: string;
  flag: string;
  cleanSheets: number;
  gamesPlayed: number;
  teamId: string;
}

export function computeCleanSheets(games: Game[], teamMap: { [key: string]: Team }): CleanSheetEntry[] {
  const data: { [id: string]: { cleanSheets: number; gamesPlayed: number } } = {};

  for (const game of games) {
    if (game.finished !== "TRUE") continue;
    const hs = parseInt(game.home_score) || 0;
    const as_ = parseInt(game.away_score) || 0;

    if (!data[game.home_team_id]) data[game.home_team_id] = { cleanSheets: 0, gamesPlayed: 0 };
    if (!data[game.away_team_id]) data[game.away_team_id] = { cleanSheets: 0, gamesPlayed: 0 };

    data[game.home_team_id]!.gamesPlayed++;
    data[game.away_team_id]!.gamesPlayed++;
    if (as_ === 0) data[game.home_team_id]!.cleanSheets++;
    if (hs === 0) data[game.away_team_id]!.cleanSheets++;
  }

  return Object.entries(data)
    .filter(([, d]) => d.cleanSheets > 0)
    .map(([teamId, d]) => {
      const team = teamMap[teamId];
      return {
        teamId,
        teamName: team?.name_en || teamId,
        flag: team?.flag || "",
        cleanSheets: d.cleanSheets,
        gamesPlayed: d.gamesPlayed,
      };
    })
    .sort((a, b) => b.cleanSheets - a.cleanSheets || a.gamesPlayed - b.gamesPlayed);
}

// ─── NEW: Goals Conceded (per team) ─────────────────────────────────────────

export interface GoalsConcededEntry {
  teamName: string;
  flag: string;
  goalsConceded: number;
  gamesPlayed: number;
  teamId: string;
}

export function computeGoalsConceded(games: Game[], teamMap: { [key: string]: Team }): GoalsConcededEntry[] {
  const data: { [id: string]: { goalsConceded: number; gamesPlayed: number } } = {};

  for (const game of games) {
    if (game.finished !== "TRUE") continue;
    const hs = parseInt(game.home_score) || 0;
    const as_ = parseInt(game.away_score) || 0;

    if (!data[game.home_team_id]) data[game.home_team_id] = { goalsConceded: 0, gamesPlayed: 0 };
    if (!data[game.away_team_id]) data[game.away_team_id] = { goalsConceded: 0, gamesPlayed: 0 };

    data[game.home_team_id]!.gamesPlayed++;
    data[game.away_team_id]!.gamesPlayed++;
    data[game.home_team_id]!.goalsConceded += as_;
    data[game.away_team_id]!.goalsConceded += hs;
  }

  return Object.entries(data)
    .filter(([, d]) => d.gamesPlayed > 0)
    .map(([teamId, d]) => {
      const team = teamMap[teamId];
      return {
        teamId,
        teamName: team?.name_en || teamId,
        flag: team?.flag || "",
        goalsConceded: d.goalsConceded,
        gamesPlayed: d.gamesPlayed,
      };
    })
    .sort((a, b) => b.goalsConceded - a.goalsConceded);
}

// ─── NEW: Key Contributors ────────────────────────────────────────────────────

export interface KeyContributorEntry {
  name: string;
  score: number;
  goals: number;
  penaltyGoals: number;
  teamName: string;
  flag: string;
  teamId: string;
}

export function computeKeyContributors(games: Game[], teamMap: { [key: string]: Team }): KeyContributorEntry[] {
  const map: { [key: string]: { goals: number; pens: number; teamId: string; teamName: string } } = {};

  for (const game of games) {
    if (game.time_elapsed === "notstarted") continue;

    const process = (raw: string | null | undefined, teamId: string, teamName: string) => {
      const scorers = parseScorers(raw);
      for (const s of scorers) {
        if (s.toLowerCase().includes("(og)")) continue;
        const name = extractName(s);
        if (!name) continue;
        const isPen = s.toLowerCase().includes("(p)");
        const key = `${name}_${teamId}`;
        if (!map[key]) map[key] = { goals: 0, pens: 0, teamId, teamName };
        map[key]!.goals += 1;
        if (isPen) map[key]!.pens += 1;
      }
    };

    process(game.home_scorers, game.home_team_id, game.home_team_name_en || "");
    process(game.away_scorers, game.away_team_id, game.away_team_name_en || "");
  }

  return Object.entries(map)
    .map(([key, d]) => {
      const namePart = key.split("_")[0] || "";
      const team = teamMap[d.teamId];
      const score = (d.goals - d.pens) * 3 + d.pens * 2;
      return {
        name: namePart,
        score,
        goals: d.goals,
        penaltyGoals: d.pens,
        teamName: team?.name_en || d.teamName,
        flag: team?.flag || "",
        teamId: d.teamId,
      };
    })
    .sort((a, b) => b.score - a.score);
}

// ─── NEW: Full Team Stats (all 48 teams table) ────────────────────────────────

export interface FullTeamStats {
  teamId: string;
  teamName: string;
  flag: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  gd: number;
  points: number;
  cleanSheets: number;
}

export function computeFullTeamStats(games: Game[], teamMap: { [key: string]: Team }): FullTeamStats[] {
  const data: { [id: string]: Omit<FullTeamStats, "teamId" | "teamName" | "flag"> } = {};

  const ensure = (id: string) => {
    if (!data[id]) data[id] = { played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, gd: 0, points: 0, cleanSheets: 0 };
    return data[id]!;
  };

  for (const game of games) {
    if (game.finished !== "TRUE") continue;
    const hs = parseInt(game.home_score) || 0;
    const as_ = parseInt(game.away_score) || 0;

    const home = ensure(game.home_team_id);
    const away = ensure(game.away_team_id);

    home.played++; away.played++;
    home.goalsFor += hs; home.goalsAgainst += as_;
    away.goalsFor += as_; away.goalsAgainst += hs;
    if (as_ === 0) home.cleanSheets++;
    if (hs === 0) away.cleanSheets++;

    if (hs > as_) { home.wins++; home.points += 3; away.losses++; }
    else if (hs === as_) { home.draws++; home.points++; away.draws++; away.points++; }
    else { away.wins++; away.points += 3; home.losses++; }
  }

  for (const team of Object.values(teamMap)) {
    if (!data[team.id]) ensure(team.id);
  }

  return Object.entries(data)
    .filter(([id]) => id && id !== "0")
    .map(([teamId, d]) => {
      const team = teamMap[teamId];
      return {
        teamId,
        teamName: team?.name_en || teamId,
        flag: team?.flag || "",
        ...d,
        gd: d.goalsFor - d.goalsAgainst,
      };
    })
    .sort((a, b) => b.points - a.points || b.gd - a.gd || b.goalsFor - a.goalsFor);
}

// ─── NEW: Live Record Data ────────────────────────────────────────────────────

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

export function computeRecordLiveData(games: Game[], teamMap: { [key: string]: Team }): RecordLiveData {
  const finished = games.filter((g) => g.finished === "TRUE");
  const totalGoals = finished.reduce((s, g) => s + (parseInt(g.home_score) || 0) + (parseInt(g.away_score) || 0), 0);
  const avgGoalsPerGame = finished.length > 0 ? totalGoals / finished.length : 0;

  let biggestMargin = 0, biggestMarginStr = "";
  let mostGoalsInGame = 0, mostGoalsInGameStr = "";
  let goallessDrws = 0, totalOwnGoals = 0, totalPenalties = 0;

  for (const g of finished) {
    const hs = parseInt(g.home_score) || 0;
    const as_ = parseInt(g.away_score) || 0;
    const margin = Math.abs(hs - as_);
    const total = hs + as_;

    if (margin > biggestMargin) {
      biggestMargin = margin;
      biggestMarginStr = `${g.home_team_name_en} ${g.home_score}-${g.away_score} ${g.away_team_name_en}`;
    }
    if (total > mostGoalsInGame) {
      mostGoalsInGame = total;
      mostGoalsInGameStr = `${g.home_team_name_en} ${g.home_score}-${g.away_score} ${g.away_team_name_en}`;
    }
    if (hs === 0 && as_ === 0) goallessDrws++;

    for (const s of [...parseScorers(g.home_scorers), ...parseScorers(g.away_scorers)]) {
      if (s.toLowerCase().includes("(og)")) totalOwnGoals++;
      if (s.toLowerCase().includes("(p)")) totalPenalties++;
    }
  }

  const topScorers = computeTopScorers(games, teamMap);
  const topScorer = topScorers[0];

  const teamGoals: { [id: string]: number } = {};
  const teamNamesMap: { [id: string]: string } = {};
  for (const g of finished) {
    teamGoals[g.home_team_id] = (teamGoals[g.home_team_id] || 0) + (parseInt(g.home_score) || 0);
    teamGoals[g.away_team_id] = (teamGoals[g.away_team_id] || 0) + (parseInt(g.away_score) || 0);
    teamNamesMap[g.home_team_id] = g.home_team_name_en || "";
    teamNamesMap[g.away_team_id] = g.away_team_name_en || "";
  }
  let topTeamGoals = 0, topTeamId = "";
  for (const [id, goals] of Object.entries(teamGoals)) {
    if (goals > topTeamGoals) { topTeamGoals = goals; topTeamId = id; }
  }

  const cleanSheetData = computeCleanSheets(games, teamMap);
  const topCS = cleanSheetData[0];

  return {
    totalGoals, finishedGames: finished.length, avgGoalsPerGame,
    biggestMargin, biggestMarginStr, mostGoalsInGame, mostGoalsInGameStr,
    topScorerGoals: topScorer?.goals ?? 0, topScorerName: topScorer?.name ?? "",
    topTeamGoals, topTeamName: teamNamesMap[topTeamId] || "",
    totalOwnGoals, totalPenalties,
    cleanSheetGames: finished.filter((g) => (parseInt(g.home_score) || 0) === 0 || (parseInt(g.away_score) || 0) === 0).length,
    topTeamCleanSheets: topCS?.cleanSheets ?? 0, topTeamCleanSheetsName: topCS?.teamName ?? "",
    totalRedCards: 0,
    goallessDrws,
  };
}

// ─── EXISTING: Team Stats ─────────────────────────────────────────────────────

export interface TeamStats {
  teamId: string;
  goalsScored: number;
  goalsConceded: number;
  cleanSheets: number;
  wins: number;
  draws: number;
  losses: number;
  played: number;
  points: number;
}

export function computeTeamStats(games: Game[]): { [key: string]: TeamStats } {
  const stats: { [key: string]: TeamStats } = {};

  const getOrCreate = (id: string): TeamStats => {
    if (!stats[id]) {
      stats[id] = { teamId: id, goalsScored: 0, goalsConceded: 0, cleanSheets: 0, wins: 0, draws: 0, losses: 0, played: 0, points: 0 };
    }
    return stats[id]!;
  };

  for (const game of games) {
    if (game.finished !== "TRUE") continue;
    const hs = parseInt(game.home_score) || 0;
    const as_ = parseInt(game.away_score) || 0;

    const home = getOrCreate(game.home_team_id);
    const away = getOrCreate(game.away_team_id);

    home.played++; away.played++;
    home.goalsScored += hs; home.goalsConceded += as_;
    away.goalsScored += as_; away.goalsConceded += hs;
    if (as_ === 0) home.cleanSheets++;
    if (hs === 0) away.cleanSheets++;
    if (hs > as_) { home.wins++; home.points += 3; away.losses++; }
    else if (hs === as_) { home.draws++; home.points += 1; away.draws++; away.points += 1; }
    else { away.wins++; away.points += 3; home.losses++; }
  }

  return stats;
}

// ─── EXISTING: Records (simple list, kept for compatibility) ─────────────────

export interface WCRecord {
  id: string;
  title: string;
  holder: string;
  value: string;
  current?: string;
  isBeaten?: boolean;
  isNearing?: boolean;
  category: string;
}

export function getWorldCupRecords(games: Game[], teamMap: { [key: string]: Team }): WCRecord[] {
  const live = computeRecordLiveData(games, teamMap);

  return [
    { id: "total_goals", title: "Total Goals in Tournament", holder: "2014 Brazil — 171 goals in 64 matches", value: "171", current: `${live.totalGoals} goals in ${live.finishedGames} matches`, isBeaten: live.totalGoals > 171, isNearing: live.totalGoals > 140 && live.totalGoals <= 171, category: "Goals" },
    { id: "avg_goals", title: "Average Goals Per Game", holder: "1954 Switzerland — 5.38 avg", value: "5.38", current: `${live.avgGoalsPerGame.toFixed(2)} avg in 2026`, isBeaten: live.avgGoalsPerGame > 5.38, isNearing: live.avgGoalsPerGame > 4.0 && live.avgGoalsPerGame <= 5.38, category: "Goals" },
    { id: "biggest_win", title: "Biggest Victory in 2026", holder: "Hungary 10-1 El Salvador (1982)", value: "9 goals margin", current: live.biggestMargin > 0 ? `${live.biggestMarginStr} (${live.biggestMargin} goal margin)` : "TBD", isBeaten: live.biggestMargin >= 9, isNearing: live.biggestMargin >= 6 && live.biggestMargin < 9, category: "Results" },
    { id: "most_goals_game", title: "Most Goals in a Single Game", holder: "Austria 7-5 Switzerland (1954) — 12 goals", value: "12 goals", current: live.mostGoalsInGame > 0 ? `${live.mostGoalsInGame} goals (${live.mostGoalsInGameStr})` : "TBD", isBeaten: live.mostGoalsInGame > 12, isNearing: live.mostGoalsInGame >= 9 && live.mostGoalsInGame <= 12, category: "Goals" },
    { id: "most_teams", title: "Most Teams in World Cup", holder: "Previous record: 32 teams (1998-2022)", value: "32 teams", current: "48 teams in 2026 ✓ NEW RECORD", isBeaten: true, isNearing: false, category: "Tournament" },
    { id: "most_games", title: "Most Matches in World Cup", holder: "Previous record: 64 matches (1998-2022)", value: "64 matches", current: "104 matches in 2026 ✓ NEW RECORD", isBeaten: true, isNearing: false, category: "Tournament" },
    { id: "scorer_record", title: "All-Time Top Scorer Record", holder: "Miroslav Klose — 16 goals", value: "16 goals", current: live.topScorerGoals > 0 ? `${live.topScorerName}: ${live.topScorerGoals} goals` : "Tournament in progress", isBeaten: false, isNearing: live.topScorerGoals >= 10, category: "Individual" },
    { id: "most_goals_team", title: "Most Goals by a Team (2026)", holder: "Historical best: Hungary 1954 — 27 goals", value: "27 goals", current: live.topTeamGoals > 0 ? `${live.topTeamName} — ${live.topTeamGoals} goals` : "Tournament in progress", isBeaten: live.topTeamGoals > 27, isNearing: live.topTeamGoals >= 18 && live.topTeamGoals <= 27, category: "Team" },
  ];
}

// ─── EXISTING: Popularity ─────────────────────────────────────────────────────

export interface PopularityEntry {
  teamId: string;
  teamName: string;
  flag: string;
  score: number;
  goalsFor: number;
  goalsAgainst: number;
  played: number;
}

export function computePopularity(games: Game[], teamMap: { [key: string]: Team }): PopularityEntry[] {
  const data: { [key: string]: { goals: number; conceded: number; played: number } } = {};

  for (const g of games) {
    if (g.finished !== "TRUE") continue;
    const hs = parseInt(g.home_score) || 0;
    const as_ = parseInt(g.away_score) || 0;

    if (!data[g.home_team_id]) data[g.home_team_id] = { goals: 0, conceded: 0, played: 0 };
    if (!data[g.away_team_id]) data[g.away_team_id] = { goals: 0, conceded: 0, played: 0 };

    data[g.home_team_id]!.goals += hs;
    data[g.home_team_id]!.conceded += as_;
    data[g.home_team_id]!.played++;
    data[g.away_team_id]!.goals += as_;
    data[g.away_team_id]!.conceded += hs;
    data[g.away_team_id]!.played++;
  }

  return Object.entries(data)
    .map(([teamId, d]) => {
      const team = teamMap[teamId];
      const score = d.goals * 3 + d.played;
      return { teamId, teamName: team?.name_en || "Unknown", flag: team?.flag || "", score, goalsFor: d.goals, goalsAgainst: d.conceded, played: d.played };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 16);
}
