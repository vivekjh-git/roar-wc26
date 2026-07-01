// Stable lookup of real FIFA 25 ratings for known World Cup 2026 players.
// Only players in this table are considered to have a "real" rating.
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
  "Adrien Rabiot": 82,
  "Lucas Digne": 78,

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
  "Pedro Neto": 84,

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
  "Trent Alexander-Arnold": 84,

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
  "Nico Schlotterbeck": 81,
  "Felix Nmecha": 79,

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
  "Matheus Cunha": 82,

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
  "Tijjani Reijnders": 82,

  // Spain
  "Álvaro Morata": 83,
  "Lamine Yamal": 82,
  "Nico Williams": 82,
  "Dani Olmo": 83,
  "Pedri": 86,
  "Rodri": 89,
  "Dani Carvajal": 84,
  "Aymeric Laporte": 84,
  "Unai Simón": 84,
  "Mikel Merino": 82,

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

  // DR Congo
  "Yoane Wissa": 77,

  // Switzerland
  "Rubén Vargas": 75,
  "Johan Minzambi": 68,
  "Breel Embolo": 80,
  "Granit Xhaka": 83,
  "Manuel Akanji": 85,
  "Yann Sommer": 85,

  // Senegal
  "Pape Gueye": 74,
  "Iliman Ndiaye": 75,
  "Ismaïla Sarr": 77,
  "Sadio Mané": 83,
  "Kalidou Koulibaly": 84,

  // Sweden
  "Alexander Isak": 84,
  "Viktor Gyökeres": 85,
  "Anthony Elanga": 79,
  "Victor Lindelöf": 80,
  "Emil Krafth": 74,
  "Lucas Bergvall": 76,
  "Dejan Kulusevski": 81,
  "Emil Forsberg": 79,
  "Robin Quaison": 75,
  "Zlatan Ibrahimović": 81,

  // Norway
  "Erling Haaland": 91,
  "Martin Ødegaard": 88,
  "Alexander Sørloth": 81,
  "Sander Berge": 80,
  "Leo Østigård": 76,

  // Japan
  "Takumi Minamino": 80,
  "Kaoru Mitoma": 82,
  "Ritsu Doan": 80,
  "Wataru Endō": 81,
  "Daichi Kamada": 82,

  // South Korea
  "Heung-min Son": 87,
  "Lee Kang-in": 82,
  "Kim Min-jae": 86,

  // Australia
  "Mathew Leckie": 77,
  "Ajdin Hrustic": 75,

  // Ecuador
  "Gonzalo Plata": 77,
  "Enner Valencia": 78,

  // Turkey
  "Arda Güler": 82,
  "Hakan Çalhanoğlu": 86,
  "Kerem Aktürkoğlu": 80,

  // Iran
  "Mehdi Taremi": 82,

  // Saudi Arabia
  "Salem Al-Dawsari": 78,

  // Qatar
  "Akram Afif": 77,

  // Algeria
  "Riyad Mahrez": 82,
  "Islam Slimani": 76,

  // Austria
  "Marko Arnautović": 78,
  "Marcel Sabitzer": 82,
  "David Alaba": 86,

  // Bosnia
  "Edin Džeko": 79,
  "Miralem Pjanić": 80,
  "Armin Hodžić": 74,

  // New Zealand
  "Chris Wood": 77,

  // Iraq
  "Mohanad Ali": 72,

  // Haiti
  "Frantzdy Pierrot": 72,

  // Scotland
  "Andrew Robertson": 84,
  "Scott McTominay": 82,
  "Che Adams": 75,
};

// Returns true only when we have a real FIFA 25 rating in the table.
// Use this to decide whether to show or hide a rating badge.
export function hasRealFifaRating(name: string): boolean {
  const cleaned = name.trim();
  if (FIFA_RATINGS_LOOKUP[cleaned] !== undefined) return true;
  return Object.keys(FIFA_RATINGS_LOOKUP).some(
    k => k.toLowerCase() === cleaned.toLowerCase()
  );
}

// Helper: stable string hash code
export function stringHashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (str.codePointAt(i) ?? 0) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

// Returns the real FIFA 25 rating, or null if the player is not in the lookup.
// Never generates a fake hash-based number.
export function getPlayerFifaRating(name: string): number | null {
  const cleaned = name.trim();
  if (FIFA_RATINGS_LOOKUP[cleaned] !== undefined) return FIFA_RATINGS_LOOKUP[cleaned];
  const key = Object.keys(FIFA_RATINGS_LOOKUP).find(
    k => k.toLowerCase() === cleaned.toLowerCase()
  );
  if (key === undefined) return null;
  return FIFA_RATINGS_LOOKUP[key];
}

// Tournament rating — hash-based, kept for internal use only.
// Do NOT display this to users — it is not real performance data.
export function getPlayerTournamentRating(name: string, totalGoals = 0, _matchesPlayed = 0): number {
  const hash = stringHashCode(name);
  let baseRating = 6.4 + ((hash % 100) / 200);
  if (totalGoals > 0) {
    baseRating += Math.min(2.5, totalGoals * 0.5);
  }
  return Number.parseFloat(Math.max(6, Math.min(9.8, baseRating)).toFixed(2));
}
