export const PLAYER_IMAGES: { [name: string]: string } = {
  "Lionel Messi": "https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/45843.png",
  "Kylian Mbappé": "https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/231353.png",
  "Ousmane Dembélé": "https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/228122.png",
  "Erling Haaland": "https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/249150.png",
  "Vinícius Júnior": "https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/238214.png",
  "Deniz Undav": "https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/271165.png",
  "Brian Brobbey": "https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/274955.png",
  "Ismaïla Sarr": "https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/245842.png",
  "Harry Kane": "https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/159670.png",
  "Cristiano Ronaldo": "https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/27472.png",
  "Kevin De Bruyne": "https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/132840.png",
  "Neymar": "https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/128127.png",
  "Jude Bellingham": "https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/285223.png",
  "Bukayo Saka": "https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/264259.png",
  "Antoine Griezmann": "https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/127118.png",
  "Cody Gakpo": "https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/258288.png",
  "Jamal Musiala": "https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/284341.png",
  "Kai Havertz": "https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/249129.png",
  "Lautaro Martínez": "https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/240212.png",
  "Christian Pulisic": "https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/225156.png",
  "Santiago Giménez": "https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/257321.png",
  "Alphonso Davies": "https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/238940.png",
  "Ollie Watkins": "https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/188440.png",
  "Crysencio Summerville": "https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/281682.png"
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
