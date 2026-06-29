export const PLAYER_IMAGES: { [name: string]: string } = {
  "Lionel Messi": "https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/45843.png",
  "Kylian Mbappé": "https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/235777.png",
  "Ousmane Dembélé": "https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/233049.png",
  "Erling Haaland": "https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/246077.png",
  "Vinícius Júnior": "https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/243265.png",
  "Deniz Undav": "https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/296719.png",
  "Brian Brobbey": "https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/279862.png",
  "Ismaïla Sarr": "https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/232470.png",
  "Harry Kane": "https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/208638.png",
  "Cristiano Ronaldo": "https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/22774.png",
  "Kevin De Bruyne": "https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/156688.png",
  "Neymar": "https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/132205.png",
  "Jude Bellingham": "https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/304221.png",
  "Bukayo Saka": "https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/233075.png",
  "Antoine Griezmann": "https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/182513.png",
  "Cody Gakpo": "https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/296766.png",
  "Jamal Musiala": "https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/317377.png",
  "Kai Havertz": "https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/234796.png",
  "Lautaro Martínez": "https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/240751.png",
  "Christian Pulisic": "https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/222168.png",
  "Santiago Giménez": "https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/296531.png",
  "Alphonso Davies": "https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/238712.png",
  "Ollie Watkins": "https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/234731.png",
  "Crysencio Summerville": "https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/279822.png"
};

export function getPlayerImageUrl(name: string): string {
  // Try to match exact alias or common parts of the name
  const cleaned = name.trim();
  if (PLAYER_IMAGES[cleaned]) return PLAYER_IMAGES[cleaned];
  
  // Try case-insensitive matching
  const key = Object.keys(PLAYER_IMAGES).find(
    k => k.toLowerCase() === cleaned.toLowerCase() || 
         k.toLowerCase().includes(cleaned.toLowerCase()) ||
         cleaned.toLowerCase().includes(k.toLowerCase())
  );
  if (key) return PLAYER_IMAGES[key];

  // Fallback to stylized SVG avatar generator
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleaned)}&backgroundColor=0d1526&textColor=ff5e00`;
}
