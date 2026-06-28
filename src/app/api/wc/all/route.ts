import { NextResponse } from "next/server";
import {
  getTeams,
  getGroups,
  getGames,
  getStadiums,
  buildTeamMap,
  computeTopScorers,
  computePopularity,
  getWorldCupRecords,
  computeOwnGoals,
  computeGoalsPerGame,
  computeMaxGoalsInMatch,
  computeCleanSheets,
  computeGoalsConceded,
  computePenaltyGoals,
  computeKeyContributors,
  computeFullTeamStats,
  computeRecordLiveData,
} from "@/lib/api";
import RECORDS from "@/lib/records-data";

export const revalidate = 60;

export async function GET() {
  try {
    const [teams, groups, games, stadiums] = await Promise.all([
      getTeams(),
      getGroups(),
      getGames(),
      getStadiums(),
    ]);

    const teamMap = buildTeamMap(teams);
    
    // Existing data
    const topScorers = computeTopScorers(games, teamMap);
    const popularity = computePopularity(games, teamMap);
    const records = getWorldCupRecords(games, teamMap);

    // New Data Layer
    const ownGoals = computeOwnGoals(games, teamMap);
    const goalsPerGame = computeGoalsPerGame(games, teamMap);
    const maxGoalsMatch = computeMaxGoalsInMatch(games, teamMap);
    const cleanSheets = computeCleanSheets(games, teamMap);
    const goalsConceded = computeGoalsConceded(games, teamMap);
    const penaltyGoals = computePenaltyGoals(games, teamMap);
    const keyContributors = computeKeyContributors(games, teamMap);
    const fullTeamStats = computeFullTeamStats(games, teamMap);

    // Live Records Data for 30+ Historical Records
    const liveData = computeRecordLiveData(games, teamMap);
    const expandedRecords = RECORDS.map(record => ({
      ...record,
      status: record.compare(liveData)
    }));

    return NextResponse.json({
      teams,
      groups,
      games,
      stadiums,
      topScorers,
      popularity,
      records, // legacy 8-item array
      ownGoals,
      goalsPerGame,
      maxGoalsMatch,
      cleanSheets,
      goalsConceded,
      penaltyGoals,
      keyContributors,
      fullTeamStats,
      expandedRecords,
    });
  } catch (error) {
    console.error("Error fetching WC data:", error);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}
