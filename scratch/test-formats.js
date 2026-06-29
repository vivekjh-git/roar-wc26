const testFormats = async () => {
  const players = [
    { name: "Kylian Mbappé", id: "235777" },
    { name: "Ousmane Dembélé", id: "233049" },
    { name: "Erling Haaland", id: "246077" },
    { name: "Vinícius Júnior", id: "243265" }
  ];

  for (const p of players) {
    const combinerUrl = `https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/${p.id}.png`;
    const directUrl = `https://a.espncdn.com/i/headshots/soccer/players/full/${p.id}.png`;
    
    try {
      const resC = await fetch(combinerUrl, { method: 'HEAD' });
      const resD = await fetch(directUrl, { method: 'HEAD' });
      console.log(`${p.name} (${p.id}): Combiner = ${resC.status}, Direct = ${resD.status}`);
    } catch (err) {
      console.log(`${p.name}: Error = ${err.message}`);
    }
  }
};

testFormats();
