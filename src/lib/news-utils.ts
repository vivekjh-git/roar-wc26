import type { Game, Team } from "@/lib/api";
import { formatMatchDateNPT } from "@/lib/date-utils";

export function generateLiveBulletins(games: Game[], teams: Team[]): string[] {
  const teamMap = Object.fromEntries(teams.map((t) => [t.id, t]));
  const bulletins: string[] = [];

  // Helper to get team name
  const getTeamName = (id: string, defaultName?: string) => {
    return teamMap[id]?.name_en || defaultName || "TBD";
  };

  // 1. Live Matches
  const liveGames = games.filter(
    (g) => g.time_elapsed !== "notstarted" && g.finished !== "TRUE" && g.time_elapsed !== "finished"
  );
  liveGames.forEach((g) => {
    const home = getTeamName(g.home_team_id, g.home_team_name_en);
    const away = getTeamName(g.away_team_id, g.away_team_name_en);
    const elapsed = g.time_elapsed.replace(/live/i, "").trim();
    bulletins.push(`🔴 LIVE: ${home} ${g.home_score} - ${g.away_score} ${away} (${elapsed}')`);
  });

  // 2. Recent Results (FT)
  const finishedGames = games
    .filter((g) => g.finished === "TRUE" || g.time_elapsed === "finished")
    .sort((a, b) => new Date(b.local_date).getTime() - new Date(a.local_date).getTime());
  
  finishedGames.slice(0, 2).forEach((g) => {
    const home = getTeamName(g.home_team_id, g.home_team_name_en);
    const away = getTeamName(g.away_team_id, g.away_team_name_en);
    bulletins.push(`🏁 RESULT: ${home} ${g.home_score} - ${g.away_score} ${away} (FULL TIME)`);
  });

  // 3. Upcoming Match
  const upcomingGames = games
    .filter((g) => g.time_elapsed === "notstarted" && g.finished !== "TRUE")
    .sort((a, b) => new Date(a.local_date).getTime() - new Date(b.local_date).getTime());
  
  if (upcomingGames.length > 0) {
    const nextGame = upcomingGames[0];
    const home = getTeamName(nextGame.home_team_id, nextGame.home_team_name_en);
    const away = getTeamName(nextGame.away_team_id, nextGame.away_team_name_en);
    const nptTime = formatMatchDateNPT(nextGame.local_date, nextGame.stadium_id);
    bulletins.push(`⏳ UPCOMING: ${home} vs ${away} kicks off on ${nptTime} NST`);
  }

  // 4. Highest scoring match of the tournament
  if (finishedGames.length > 0) {
    const highestScoring = [...finishedGames].sort((a, b) => {
      const sumA = (parseInt(a.home_score) || 0) + (parseInt(a.away_score) || 0);
      const sumB = (parseInt(b.home_score) || 0) + (parseInt(b.away_score) || 0);
      return sumB - sumA;
    })[0];
    const home = getTeamName(highestScoring.home_team_id, highestScoring.home_team_name_en);
    const away = getTeamName(highestScoring.away_team_id, highestScoring.away_team_name_en);
    bulletins.push(
      `🏆 GOAL FEST: Highest scoring match so far: ${home} vs ${away} finished ${highestScoring.home_score}-${highestScoring.away_score}!`
    );
  }

  // 5. Total Tournament stats
  const totalGoals = finishedGames.reduce(
    (acc, g) => acc + (parseInt(g.home_score) || 0) + (parseInt(g.away_score) || 0),
    0
  );
  if (finishedGames.length > 0) {
    bulletins.push(
      `📊 TOURNAMENT STATS: Total of ${totalGoals} goals scored across ${finishedGames.length} completed matches so far!`
    );
  }

  // Fallback bulletins if we don't have enough data
  if (bulletins.length < 5) {
    const fallbacks = [
      "📢 NEWS: Welcome to ROAR FIFA World Cup 2026 Live Dashboard!",
      "⚽ STATS: Live groups standings and records update automatically every minute.",
      "🏆 HISTORICAL: 30+ World Cup records are tracked live against current tournament data!",
    ];
    while (bulletins.length < 5 && fallbacks.length > 0) {
      bulletins.push(fallbacks.shift() as string);
    }
  }

  return bulletins;
}
