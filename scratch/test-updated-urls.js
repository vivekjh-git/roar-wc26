const testUrls = async () => {
  const ids = {
    "Lionel Messi": "45843",
    "Kylian Mbappé": "295513",
    "Ousmane Dembélé": "232490",
    "Erling Haaland": "261564",
    "Vinícius Júnior": "238717",
    "Deniz Undav": "268688",
    "Brian Brobbey": "265814",
    "Ismaïla Sarr": "233044",
    "Harry Kane": "208333",
    "Cristiano Ronaldo": "22774",
    "Kevin De Bruyne": "172969",
    "Neymar": "132923",
    "Jude Bellingham": "296726",
    "Bukayo Saka": "241857",
    "Antoine Griezmann": "125795",
    "Cody Gakpo": "263595",
    "Jamal Musiala": "296547",
    "Kai Havertz": "238711",
    "Lautaro Martínez": "237699",
    "Christian Pulisic": "214478",
    "Santiago Giménez": "257497",
    "Alphonso Davies": "238744",
    "Ollie Watkins": "214953",
    "Crysencio Summerville": "261074"
  };

  console.log("Checking updated ESPN IDs...");
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
