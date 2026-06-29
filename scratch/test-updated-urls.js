const testUrls = async () => {
  const ids = {
    "Lionel Messi": "45843",
    "Kylian Mbappé": "235777",
    "Ousmane Dembélé": "233049",
    "Erling Haaland": "246077",
    "Vinícius Júnior": "243265",
    "Deniz Undav": "296719",
    "Brian Brobbey": "279862",
    "Ismaïla Sarr": "232470",
    "Harry Kane": "208638",
    "Cristiano Ronaldo": "22774",
    "Kevin De Bruyne": "156688",
    "Neymar": "132205",
    "Jude Bellingham": "304221",
    "Bukayo Saka": "233075",
    "Antoine Griezmann": "182513",
    "Cody Gakpo": "296766",
    "Kai Havertz": "234796",
    "Jamal Musiala": "317377",
    "Lautaro Martínez": "240751",
    "Christian Pulisic": "222168",
    "Santiago Giménez": "296531",
    "Alphonso Davies": "238712",
    "Ollie Watkins": "234731",
    "Crysencio Summerville": "279822"
  };

  console.log("Starting HEAD check for all updated player IDs...");
  for (const [name, id] of Object.entries(ids)) {
    const url = `https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/${id}.png`;
    try {
      const res = await fetch(url, { method: 'HEAD' });
      console.log(`${name} (${id}): Status = ${res.status}`);
    } catch (err) {
      console.log(`${name} (${id}): Error = ${err.message}`);
    }
  }
};

testUrls();
