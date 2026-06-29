const extractHeadshot = async () => {
  const url = "https://www.espn.com/soccer/player/_/id/235777/kylian-mbappe";
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    const html = await res.text();
    
    // Search for headshot image URLs in the HTML
    const matches = html.match(/https?:\/\/[^\s"'`<>]*headshots[^\s"'`<>]*\.png[^\s"'`<>]*/gi) || [];
    console.log("Found headshot URLs:");
    console.log([...new Set(matches)]);
    
    // Search for any espncdn image URLs
    const matches2 = html.match(/https?:\/\/a\.espncdn\.com\/[^\s"'`<>]*/gi) || [];
    console.log("\nFound espncdn URLs (top 15):");
    console.log([...new Set(matches2)].slice(0, 15));
  } catch (err) {
    console.log("Error:", err.message);
  }
};

extractHeadshot();
