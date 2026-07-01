const FIFA_COMPETITION_ID = "17";
const FIFA_SEASON_ID = "285023";
const FIFA_BASE = "https://api.fifa.com/api/v3";

async function fetchFifaCalendar() {
  const url = `${FIFA_BASE}/calendar/matches?idseason=${FIFA_SEASON_ID}&idcompetition=${FIFA_COMPETITION_ID}&count=500&language=en`;
  const res = await fetch(url);
  if (!res.ok) return null;
  return await res.json();
}

async function run() {
  const cal = await fetchFifaCalendar();
  if (!cal || !cal.Results) return;
  
  // Find matches with some status or just search multiple matches
  console.log("Checking some matches in calendar...");
  for (let i = 0; i < Math.min(cal.Results.length, 104); i++) {
    const match = cal.Results[i];
    const liveUrl = `${FIFA_BASE}/live/football/${FIFA_COMPETITION_ID}/${FIFA_SEASON_ID}/${match.IdStage}/${match.IdMatch}?language=en`;
    try {
      const liveRes = await fetch(liveUrl);
      if (!liveRes.ok) continue;
      const liveData = await liveRes.json();
      
      const hasHomePlayers = liveData.HomeTeam?.Players?.length > 0;
      const hasLineupCoords = liveData.HomeTeam?.Players?.some(p => p.LineupX !== null || p.LineupY !== null);
      
      if (hasHomePlayers) {
        console.log(`Match ${match.MatchNumber} (${match.Home?.Abbreviation} vs ${match.Away?.Abbreviation}): hasPlayers=${hasHomePlayers}, hasCoords=${hasLineupCoords}, period=${liveData.Period}`);
        if (hasLineupCoords) {
          // Found a match with coordinates!
          console.log("Found match with coordinates:", match.MatchNumber);
          const p = liveData.HomeTeam.Players.find(p => p.LineupX !== null);
          console.log("Sample player coordinates:", {
            name: p.PlayerName[0]?.Description,
            LineupX: p.LineupX,
            LineupY: p.LineupY,
            position: p.Position
          });
          break;
        }
      }
    } catch (e) {
      // Ignore
    }
  }
}

run();
