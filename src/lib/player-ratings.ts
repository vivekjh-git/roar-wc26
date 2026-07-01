/**
 * Player Ratings Utility
 * Handles deterministic lookup/generation of FIFA ratings, tournament ratings, and match ratings.
 */

// Stable lookup of FIFA ratings for major players
const FIFA_RATINGS_LOOKUP: Record<string, number> = {
  // Argentina
  "Lionel Messi": 90,
  "Lautaro Martínez": 87,
  "Julián Álvarez": 84,
  "Alexis Mac Allister": 84,
  "Enzo Fernández": 83,
  "Rodrigo De Paul": 84,
  "Nicolás Otamendi": 80,
  "Cristian Romero": 85,
  "Emiliano Martínez": 87,
  "Giovani Lo Celso": 81,

  // France
  "Kylian Mbappé": 91,
  "Antoine Griezmann": 88,
  "Ousmane Dembélé": 86,
  "Bradley Barcola": 80,
  "Olivier Giroud": 82,
  "Aurélien Tchouaméni": 84,
  "Eduardo Camavinga": 82,
  "Theo Hernández": 85,
  "William Saliba": 84,
  "Dayot Upamecano": 82,
  "Jules Koundé": 84,
  "Mike Maignan": 87,

  // Portugal
  "Cristiano Ronaldo": 86,
  "Bruno Fernandes": 88,
  "Bernardo Silva": 88,
  "Rafael Leão": 86,
  "Diogo Jota": 84,
  "Vitinha": 84,
  "Rúben Dias": 89,
  "João Cancelo": 86,
  "Diogo Costa": 84,

  // England
  "Harry Kane": 90,
  "Jude Bellingham": 87,
  "Bukayo Saka": 86,
  "Phil Foden": 86,
  "Declan Rice": 85,
  "Cole Palmer": 83,
  "Kyle Walker": 84,
  "John Stones": 85,
  "Jordan Pickford": 83,
  "Ollie Watkins": 82,

  // Germany
  "Jamal Musiala": 86,
  "Kai Havertz": 84,
  "Florian Wirtz": 85,
  "İlkay Gündoğan": 85,
  "Leroy Sané": 84,
  "Niclas Füllkrug": 80,
  "Joshua Kimmich": 86,
  "Antonio Rüdiger": 85,
  "Manuel Neuer": 87,
  "Deniz Undav": 81,

  // Brazil
  "Vinícius Júnior": 89,
  "Neymar": 87,
  "Rodrygo": 85,
  "Raphinha": 84,
  "Bruno Guimarães": 84,
  "Lucas Paquetá": 84,
  "Marquinhos": 87,
  "Éder Militão": 86,
  "Alisson": 89,

  // Netherlands
  "Cody Gakpo": 83,
  "Memphis Depay": 84,
  "Xavi Simons": 84,
  "Jeremie Frimpong": 83,
  "Frenkie de Jong": 87,
  "Virgil van Dijk": 89,
  "Nathan Aké": 84,
  "Brian Brobbey": 78,
  "Crysencio Summerville": 79,

  // Spain
  "Álvaro Morata": 83,
  "Lamine Yamal": 80,
  "Nico Williams": 82,
  "Dani Olmo": 83,
  "Pedri": 86,
  "Rodri": 89,
  "Dani Carvajal": 84,
  "Aymeric Laporte": 84,
  "Unai Simón": 84,

  // Belgium
  "Kevin De Bruyne": 91,
  "Romelu Lukaku": 84,
  "Leandro Trossard": 81,
  "Amadou Onana": 79,
  "Wout Faes": 78,
  "Koen Casteels": 81,

  // USA
  "Christian Pulisic": 81,
  "Folarin Balogun": 79,
  "Gio Reyna": 77,
  "Weston McKennie": 78,
  "Tyler Adams": 80,
  "Antonee Robinson": 79,
  "Matt Turner": 77,

  // Canada
  "Alphonso Davies": 83,
  "Jonathan David": 81,
  "Cyle Larin": 74,
  "Stephen Eustáquio": 77,
  "Maxime Crépeau": 74,

  // Morocco
  "Youssef En-Nesyri": 82,
  "Hakim Ziyech": 80,
  "Achraf Hakimi": 84,
  "Sofyan Amrabat": 80,
  "Brahim Díaz": 82,
  "Yassine Bounou": 85,
  "Ismael Saibari": 75,

  // Colombia
  "Luis Díaz": 84,
  "James Rodríguez": 77,
  "Daniel Muñoz": 79,
  "Jefferson Lerma": 78,

  // Mexico
  "Santiago Giménez": 79,
  "Raúl Jiménez": 76,
  "Julián Quiñones": 77,
  "Edson Álvarez": 81,
  "César Montes": 77,
  "Johan Vásquez": 76,
  "Luis Malagón": 75,
  "Raul Rangel": 73,

  // DR Congo
  "Yoane Wissa": 77,

  // Switzerland
  "Rubén Vargas": 75,
  "Johan Minzambi": 68,

  // Senegal
  "Pape Gueye": 74,
  "Iliman Ndiaye": 75,
  "Ismaïla Sarr": 77,
};

// Helper: stable string hash code
export function stringHashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

// Get FIFA rating dynamically
export function getPlayerFifaRating(name: string): number {
  const cleaned = name.trim();
  if (FIFA_RATINGS_LOOKUP[cleaned] !== undefined) {
    return FIFA_RATINGS_LOOKUP[cleaned];
  }

  // Lookup case-insensitive
  const matchKey = Object.keys(FIFA_RATINGS_LOOKUP).find(
    k => k.toLowerCase() === cleaned.toLowerCase() ||
         k.toLowerCase().includes(cleaned.toLowerCase()) ||
         cleaned.toLowerCase().includes(k.toLowerCase())
  );
  if (matchKey) {
    return FIFA_RATINGS_LOOKUP[matchKey];
  }

  // Fallback to deterministic hash between 70 and 84
  const hash = stringHashCode(cleaned);
  return 70 + (hash % 15);
}

// Get dynamic tournament rating
export function getPlayerTournamentRating(name: string, totalGoals = 0, matchesPlayed = 0): number {
  const hash = stringHashCode(name);
  
  // Base rating around 6.6
  let baseRating = 6.4 + ((hash % 100) / 200); // 6.4 to 6.9

  // Add weight for goals scored
  if (totalGoals > 0) {
    baseRating += Math.min(2.5, totalGoals * 0.5);
  }

  // Clean sheet adjustment or minor boost for played matches
  if (matchesPlayed > 0) {
    baseRating += Math.min(0.5, matchesPlayed * 0.1);
  }

  // Clamp between 6.0 and 9.8
  const finalRating = Math.max(6.0, Math.min(9.8, baseRating));
  return parseFloat(finalRating.toFixed(2));
}

// Get dynamic match rating (deterministic based on name + matchId)
export function getPlayerMatchRating(name: string, matchId: string, goalsScored = 0, isWinner = false): number {
  const key = `${name}-${matchId}`;
  const hash = stringHashCode(key);

  // Base rating 6.3
  let matchRating = 6.0 + ((hash % 100) / 100) * 1.5; // 6.0 to 7.5

  // Scored goals make a huge impact
  if (goalsScored > 0) {
    matchRating += goalsScored * 1.3;
  }

  // Winner team gets a boost
  if (isWinner) {
    matchRating += 0.4;
  } else {
    matchRating -= 0.3;
  }

  // Clamp between 5.0 and 10.0
  const finalRating = Math.max(5.0, Math.min(10.0, matchRating));
  return parseFloat(finalRating.toFixed(1));
}
