const testSofifa = async () => {
  const players = [
    { name: "Lionel Messi", id: "158023" },
    { name: "Kylian Mbappé", id: "231747" },
    { name: "Ousmane Dembélé", id: "231677" },
    { name: "Erling Haaland", id: "239085" },
    { name: "Vinícius Júnior", id: "238794" },
    { name: "Deniz Undav", id: "254425" },
    { name: "Brian Brobbey", id: "252988" },
    { name: "Ismaïla Sarr", id: "237692" },
    { name: "Harry Kane", id: "202126" },
    { name: "Cristiano Ronaldo", id: "20801" },
    { name: "Kevin De Bruyne", id: "192985" },
    { name: "Neymar", id: "190871" },
    { name: "Jude Bellingham", id: "252324" },
    { name: "Bukayo Saka", id: "246781" },
    { name: "Antoine Griezmann", id: "194765" },
    { name: "Cody Gakpo", id: "240481" },
    { name: "Jamal Musiala", id: "256790" },
    { name: "Kai Havertz", id: "235790" },
    { name: "Lautaro Martínez", id: "231478" },
    { name: "Christian Pulisic", id: "227796" },
    { name: "Santiago Giménez", id: "255530" },
    { name: "Alphonso Davies", id: "234396" },
    { name: "Ollie Watkins", id: "223848" },
    { name: "Crysencio Summerville", id: "248679" }
  ];

  console.log("Testing SoFIFA CDN URLs...");
  for (const p of players) {
    // SoFIFA net serves them at: https://cdn.sofifa.net/players/10/23/231747.png or similar,
    // or sometimes at https://cdn.sofifa.net/players/231747.png
    const url1 = `https://cdn.sofifa.net/players/${p.id}.png`;
    
    try {
      const res = await fetch(url1, { method: 'HEAD' });
      console.log(`SoFIFA - ${p.name} (${p.id}): Status = ${res.status}`);
    } catch (err) {
      console.log(`SoFIFA - ${p.name}: Error = ${err.message}`);
    }
  }
};

testSofifa();
