const testUrls = async () => {
  const urls = {
    "Lionel Messi": "https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/45843.png",
    "Kylian Mbappé": "https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/231353.png",
    "Ousmane Dembélé": "https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/228122.png",
    "Erling Haaland": "https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/249150.png",
    "Vinícius Júnior": "https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/238214.png"
  };

  for (const [name, url] of Object.entries(urls)) {
    try {
      const res = await fetch(url, { method: 'HEAD' });
      console.log(`${name}: Status = ${res.status}`);
    } catch (err) {
      console.log(`${name}: Error = ${err.message}`);
    }
  }
};

testUrls();
