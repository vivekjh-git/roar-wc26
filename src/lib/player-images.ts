export interface PlayerMetadata {
  espnId: string;
  fifaId: string;
}

export const PLAYER_METADATA: { [name: string]: PlayerMetadata } = {
  "Lionel Messi": { espnId: "45843", fifaId: "158023" },
  "Kylian Mbappé": { espnId: "295513", fifaId: "231747" },
  "Ousmane Dembélé": { espnId: "232490", fifaId: "231677" },
  "Erling Haaland": { espnId: "261564", fifaId: "239085" },
  "Vinícius Júnior": { espnId: "238717", fifaId: "238794" },
  "Deniz Undav": { espnId: "268688", fifaId: "254425" },
  "Brian Brobbey": { espnId: "265814", fifaId: "252988" },
  "Ismaïla Sarr": { espnId: "233044", fifaId: "237692" },
  "Harry Kane": { espnId: "208333", fifaId: "202126" },
  "Cristiano Ronaldo": { espnId: "22774", fifaId: "20801" },
  "Kevin De Bruyne": { espnId: "172969", fifaId: "192985" },
  "Neymar": { espnId: "132923", fifaId: "190871" },
  "Jude Bellingham": { espnId: "296726", fifaId: "252324" },
  "Bukayo Saka": { espnId: "241857", fifaId: "246781" },
  "Antoine Griezmann": { espnId: "125795", fifaId: "194765" },
  "Cody Gakpo": { espnId: "263595", fifaId: "240481" },
  "Jamal Musiala": { espnId: "296547", fifaId: "256790" },
  "Kai Havertz": { espnId: "238711", fifaId: "235790" },
  "Lautaro Martínez": { espnId: "237699", fifaId: "231478" },
  "Christian Pulisic": { espnId: "214478", fifaId: "227796" },
  "Santiago Giménez": { espnId: "257497", fifaId: "255530" },
  "Alphonso Davies": { espnId: "238744", fifaId: "234396" },
  "Ollie Watkins": { espnId: "214953", fifaId: "223848" },
  "Crysencio Summerville": { espnId: "261074", fifaId: "248679" }
};

export function getPlayerImageUrl(name: string): string {
  // Legacy support
  const sources = getPlayerImageSources(name);
  return sources[0];
}

export function getPlayerImageSources(name: string): string[] {
  const cleaned = name.trim();
  let meta = PLAYER_METADATA[cleaned];
  
  if (!meta) {
    // Try case-insensitive matching
    const key = Object.keys(PLAYER_METADATA).find(
      k => k.toLowerCase() === cleaned.toLowerCase() || 
           k.toLowerCase().includes(cleaned.toLowerCase()) ||
           cleaned.toLowerCase().includes(k.toLowerCase())
    );
    if (key) meta = PLAYER_METADATA[key];
  }

  const sources: string[] = [];
  
  if (meta) {
    // 1. Futbin FIFA 24 (EA FC 24)
    sources.push(`https://cdn.futbin.com/content/fifa24/img/players/${meta.fifaId}.png`);
    // 2. Futbin FIFA 23
    sources.push(`https://cdn.futbin.com/content/fifa23/img/players/${meta.fifaId}.png`);
    // 3. ESPN Combiner (updated active profile IDs)
    sources.push(`https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/${meta.espnId}.png`);
    // 4. FifaIndex
    sources.push(`https://www.fifaindex.com/static/FIFA23/images/players/10/${meta.fifaId}.png`);
  }

  // 5. Fallback SVG avatar generator
  sources.push(`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleaned)}&backgroundColor=0d1526&textColor=ff5e00`);
  
  return sources;
}
