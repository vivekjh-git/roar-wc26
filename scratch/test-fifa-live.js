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
  const firstMatch = cal.Results[0];
  if (!firstMatch) return;

  const liveUrl = `${FIFA_BASE}/live/football/${FIFA_COMPETITION_ID}/${FIFA_SEASON_ID}/${firstMatch.IdStage}/${firstMatch.IdMatch}?language=en`;
  const liveRes = await fetch(liveUrl);
  if (!liveRes.ok) return;
  const liveData = await liveRes.json();
  if (liveData.HomeTeam) {
    console.log("HomeTeam Coaches Details:");
    liveData.HomeTeam.Coaches.forEach((c, idx) => {
      console.log(`Coach ${idx}: Name=${JSON.stringify(c.Name)}, Role=${c.Role}, SpecialStatus=${c.SpecialStatus}`);
    });

    console.log("\nHomeTeam Players (First 5):");
    liveData.HomeTeam.Players.slice(0, 5).forEach((p) => {
      console.log(`Player: Number=${p.ShirtNumber}, Name=${p.PlayerName[0]?.Description}, Position=${p.Position}, LineupX=${p.LineupX}, LineupY=${p.LineupY}, FieldStatus=${p.FieldStatus}`);
    });

    const hasLineupCoords = liveData.HomeTeam.Players.some(p => p.LineupX !== null || p.LineupY !== null);
    console.log(`\nDo any players have lineup coordinates? ${hasLineupCoords}`);

    const fieldStatuses = [...new Set(liveData.HomeTeam.Players.map(p => p.FieldStatus))];
    console.log("All unique FieldStatuses in players list:", fieldStatuses);
  }
}

run();
