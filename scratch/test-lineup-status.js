const FIFA_COMPETITION_ID = "17";
const FIFA_SEASON_ID = "285023";
const FIFA_BASE = "https://api.fifa.com/api/v3";

async function run() {
  // Let's check Match 79: MEX vs ECU (IdStage: '289307', IdMatch: '400021481' or similar, let's find it from calendar)
  const calRes = await fetch(`${FIFA_BASE}/calendar/matches?idseason=${FIFA_SEASON_ID}&idcompetition=${FIFA_COMPETITION_ID}&count=500&language=en`);
  if (!calRes.ok) return;
  const cal = await calRes.json();
  const match79 = cal.Results.find(m => m.MatchNumber === 79);
  if (!match79) {
    console.log("Match 79 not found in calendar");
    return;
  }
  console.log(`Found Match 79: Stage=${match79.IdStage}, Match=${match79.IdMatch}`);

  const liveUrl = `${FIFA_BASE}/live/football/${FIFA_COMPETITION_ID}/${FIFA_SEASON_ID}/${match79.IdStage}/${match79.IdMatch}?language=en`;
  const liveRes = await fetch(liveUrl);
  if (!liveRes.ok) return;
  const liveData = await liveRes.json();
  
  if (liveData.HomeTeam && liveData.HomeTeam.Players) {
    console.log("Home Team Players status distribution:");
    const stats = liveData.HomeTeam.Players.map(p => ({
      name: p.PlayerName[0]?.Description,
      Status: p.Status,
      FieldStatus: p.FieldStatus,
      ShirtNumber: p.ShirtNumber
    }));
    
    // Group by FieldStatus and Status
    const groups = {};
    stats.forEach(s => {
      const key = `Status:${s.Status}_FieldStatus:${s.FieldStatus}`;
      groups[key] = (groups[key] || 0) + 1;
    });
    console.log("Grouping count:", groups);
    
    console.log("\nSample players from each group:");
    const uniqueKeys = Object.keys(groups);
    uniqueKeys.forEach(k => {
      const match = stats.find(s => `Status:${s.Status}_FieldStatus:${s.FieldStatus}` === k);
      console.log(`Group ${k}: e.g. ${match.name} (#${match.ShirtNumber})`);
    });
  }
}

run();
