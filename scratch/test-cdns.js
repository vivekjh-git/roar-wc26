const testCDNs = async () => {
  const players = [
    { name: "Deniz Undav", fifaId: "254425" },
    { name: "Brian Brobbey", fifaId: "252988" },
    { name: "Ismaïla Sarr", fifaId: "237692" },
    { name: "Santiago Giménez", fifaId: "255530" },
    { name: "Crysencio Summerville", fifaId: "248679" }
  ];

  console.log("Testing Futbin CDN URLs for Undav, Brobbey, Sarr, Gimenez, Summerville...");
  for (const p of players) {
    const futbinUrl = `https://cdn.futbin.com/content/fifa24/img/players/${p.fifaId}.png`;
    try {
      const res = await fetch(futbinUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      console.log(`Futbin - ${p.name} (${p.fifaId}): Status = ${res.status}`);
    } catch (err) {
      console.log(`Futbin - ${p.name}: Error = ${err.message}`);
    }
  }
};

testCDNs();
