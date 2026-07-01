export interface PlayerMetadata {
  espnId: string;
  fifaId: string;
}

export const PLAYER_METADATA: { [name: string]: PlayerMetadata } = {
  // ── Argentina ──────────────────────────────────────────────────────────────
  "Lionel Messi":         { espnId: "45843",  fifaId: "158023" },
  "Lautaro Martínez":     { espnId: "237699", fifaId: "231478" },
  "Julián Álvarez":       { espnId: "265543", fifaId: "258028" },
  "Enzo Fernández":       { espnId: "272048", fifaId: "246095" },
  "Alexis Mac Allister":  { espnId: "240283", fifaId: "239516" },
  "Rodrigo De Paul":      { espnId: "230697", fifaId: "224455" },
  "Cristian Romero":      { espnId: "248395", fifaId: "233519" },
  "Emiliano Martínez":    { espnId: "162524", fifaId: "194026" },
  "Nicolás Otamendi":     { espnId: "167062", fifaId: "178123" },
  "Giovani Lo Celso":     { espnId: "226555", fifaId: "226555" },

  // ── France ─────────────────────────────────────────────────────────────────
  "Kylian Mbappé":        { espnId: "295513", fifaId: "231747" },
  "Antoine Griezmann":    { espnId: "125795", fifaId: "194765" },
  "Ousmane Dembélé":      { espnId: "232490", fifaId: "231677" },
  "Bradley Barcola":      { espnId: "259073", fifaId: "262681" },
  "Aurélien Tchouaméni":  { espnId: "273659", fifaId: "258034" },
  "Eduardo Camavinga":    { espnId: "274026", fifaId: "261593" },
  "Theo Hernández":       { espnId: "247082", fifaId: "240267" },
  "William Saliba":       { espnId: "277434", fifaId: "258011" },
  "Dayot Upamecano":      { espnId: "257430", fifaId: "247365" },
  "Jules Koundé":         { espnId: "259064", fifaId: "248905" },
  "Mike Maignan":         { espnId: "207617", fifaId: "199212" },

  // ── England ────────────────────────────────────────────────────────────────
  "Harry Kane":           { espnId: "208333", fifaId: "202126" },
  "Jude Bellingham":      { espnId: "296726", fifaId: "252324" },
  "Bukayo Saka":          { espnId: "241857", fifaId: "246781" },
  "Phil Foden":           { espnId: "210731", fifaId: "231271" },
  "Declan Rice":          { espnId: "228128", fifaId: "245006" },
  "Cole Palmer":          { espnId: "274056", fifaId: "258217" },
  "Kyle Walker":          { espnId: "148498", fifaId: "190528" },
  "John Stones":          { espnId: "189591", fifaId: "201399" },
  "Jordan Pickford":      { espnId: "213047", fifaId: "233437" },
  "Ollie Watkins":        { espnId: "214953", fifaId: "223848" },

  // ── Germany ────────────────────────────────────────────────────────────────
  "Jamal Musiala":        { espnId: "296547", fifaId: "256790" },
  "Kai Havertz":          { espnId: "238711", fifaId: "235790" },
  "Florian Wirtz":        { espnId: "268747", fifaId: "261447" },
  "İlkay Gündoğan":      { espnId: "134497", fifaId: "182521" },
  "Leroy Sané":           { espnId: "223369", fifaId: "211257" },
  "Joshua Kimmich":       { espnId: "197455", fifaId: "217000" },
  "Antonio Rüdiger":      { espnId: "195648", fifaId: "201324" },
  "Manuel Neuer":         { espnId: "60386",  fifaId: "167495" },
  "Niclas Füllkrug":      { espnId: "247381", fifaId: "202918" },
  "Deniz Undav":          { espnId: "268688", fifaId: "254425" },

  // ── Brazil ─────────────────────────────────────────────────────────────────
  "Vinícius Júnior":      { espnId: "238717", fifaId: "238794" },
  "Neymar":               { espnId: "132923", fifaId: "190871" },
  "Rodrygo":              { espnId: "264038", fifaId: "248669" },
  "Raphinha":             { espnId: "263597", fifaId: "247803" },
  "Bruno Guimarães":      { espnId: "265511", fifaId: "252305" },
  "Lucas Paquetá":        { espnId: "240567", fifaId: "222849" },
  "Marquinhos":           { espnId: "181990", fifaId: "203380" },
  "Éder Militão":         { espnId: "243408", fifaId: "247702" },
  "Alisson":              { espnId: "198783", fifaId: "221442" },

  // ── Netherlands ────────────────────────────────────────────────────────────
  "Cody Gakpo":           { espnId: "263595", fifaId: "240481" },
  "Memphis Depay":        { espnId: "186829", fifaId: "205600" },
  "Xavi Simons":          { espnId: "272780", fifaId: "262921" },
  "Frenkie de Jong":      { espnId: "231729", fifaId: "247580" },
  "Virgil van Dijk":      { espnId: "198776", fifaId: "200645" },
  "Nathan Aké":           { espnId: "214513", fifaId: "215064" },
  "Brian Brobbey":        { espnId: "265814", fifaId: "252988" },
  "Crysencio Summerville":{ espnId: "261074", fifaId: "248679" },

  // ── Spain ──────────────────────────────────────────────────────────────────
  "Álvaro Morata":        { espnId: "167472", fifaId: "201503" },
  "Lamine Yamal":         { espnId: "277439", fifaId: "272793" },
  "Nico Williams":        { espnId: "274007", fifaId: "264289" },
  "Dani Olmo":            { espnId: "237665", fifaId: "238854" },
  "Pedri":                { espnId: "277388", fifaId: "261666" },
  "Rodri":                { espnId: "218479", fifaId: "231866" },
  "Dani Carvajal":        { espnId: "167664", fifaId: "167664" },
  "Unai Simón":           { espnId: "255290", fifaId: "255290" },
  "Aymeric Laporte":      { espnId: "222035", fifaId: "222035" },

  // ── Portugal ───────────────────────────────────────────────────────────────
  "Cristiano Ronaldo":    { espnId: "22774",  fifaId: "20801"  },
  "Bruno Fernandes":      { espnId: "211066", fifaId: "212831" },
  "Bernardo Silva":       { espnId: "217607", fifaId: "209331" },
  "Rafael Leão":          { espnId: "265575", fifaId: "248558" },
  "Diogo Jota":           { espnId: "234073", fifaId: "230674" },
  "Vitinha":              { espnId: "268813", fifaId: "254116" },
  "Rúben Dias":           { espnId: "250996", fifaId: "237036" },
  "João Cancelo":         { espnId: "218791", fifaId: "215946" },
  "Diogo Costa":          { espnId: "255990", fifaId: "255990" },

  // ── Belgium ────────────────────────────────────────────────────────────────
  "Kevin De Bruyne":      { espnId: "172969", fifaId: "192985" },
  "Romelu Lukaku":        { espnId: "155559", fifaId: "184941" },
  "Leandro Trossard":     { espnId: "221700", fifaId: "234101" },

  // ── Morocco ────────────────────────────────────────────────────────────────
  "Achraf Hakimi":        { espnId: "250936", fifaId: "248908" },
  "Hakim Ziyech":         { espnId: "229564", fifaId: "237673" },
  "Youssef En-Nesyri":    { espnId: "246991", fifaId: "248024" },
  "Sofyan Amrabat":       { espnId: "242020", fifaId: "239706" },
  "Brahim Díaz":          { espnId: "259065", fifaId: "247104" },
  "Yassine Bounou":       { espnId: "228126", fifaId: "250038" },
  "Ismaïla Sarr":         { espnId: "233044", fifaId: "237692" },

  // ── Colombia ───────────────────────────────────────────────────────────────
  "Luis Díaz":            { espnId: "265543", fifaId: "241084" },
  "James Rodríguez":      { espnId: "130408", fifaId: "181360" },

  // ── USA ────────────────────────────────────────────────────────────────────
  "Christian Pulisic":    { espnId: "214478", fifaId: "227796" },
  "Folarin Balogun":      { espnId: "274055", fifaId: "248459" },
  "Gio Reyna":            { espnId: "266862", fifaId: "261598" },
  "Weston McKennie":      { espnId: "238614", fifaId: "231580" },
  "Tyler Adams":          { espnId: "244834", fifaId: "239981" },
  "Antonee Robinson":     { espnId: "264985", fifaId: "264985" },
  "Matt Turner":          { espnId: "248174", fifaId: "248174" },

  // ── Canada ─────────────────────────────────────────────────────────────────
  "Alphonso Davies":      { espnId: "238744", fifaId: "234396" },
  "Jonathan David":       { espnId: "257497", fifaId: "254295" },
  "Stephen Eustáquio":    { espnId: "246823", fifaId: "246823" },

  // ── Mexico ─────────────────────────────────────────────────────────────────
  "Santiago Giménez":     { espnId: "257497", fifaId: "255530" },
  "Raúl Jiménez":         { espnId: "195948", fifaId: "207862" },
  "Edson Álvarez":        { espnId: "238093", fifaId: "240527" },
  "Julián Quiñones":      { espnId: "256278", fifaId: "248466" },

  // ── Norway ─────────────────────────────────────────────────────────────────
  "Erling Haaland":       { espnId: "261564", fifaId: "239085" },
};

export function getPlayerImageUrl(name: string): string {
  const sources = getPlayerImageSources(name);
  return sources[0];
}

export function getPlayerImageSources(name: string): string[] {
  const cleaned = name.trim();
  let meta = PLAYER_METADATA[cleaned];

  if (!meta) {
    const key = Object.keys(PLAYER_METADATA).find(
      k => k.toLowerCase() === cleaned.toLowerCase() ||
           k.toLowerCase().includes(cleaned.toLowerCase()) ||
           cleaned.toLowerCase().includes(k.toLowerCase())
    );
    if (key) meta = PLAYER_METADATA[key];
  }

  const sources: string[] = [];

  if (meta) {
    sources.push(
      `https://cdn.futbin.com/content/fifa24/img/players/${meta.fifaId}.png`,
      `https://cdn.futbin.com/content/fifa23/img/players/${meta.fifaId}.png`,
      `https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/${meta.espnId}.png`,
      `https://www.fifaindex.com/static/FIFA23/images/players/10/${meta.fifaId}.png`,
    );
  }

  // Generic silhouette — still shows "no real photo" rather than confusing initials
  sources.push(`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleaned)}&backgroundColor=0d1526&textColor=ff5e00`);

  return sources;
}
