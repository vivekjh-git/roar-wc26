const checkHtml = async () => {
  const url = "https://www.espn.com/soccer/player/_/id/235777/kylian-mbappe";
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    console.log("Status:", res.status);
    const html = await res.text();
    console.log("Length:", html.length);
    console.log("Snippet:", html.slice(0, 1000));
  } catch (err) {
    console.log("Error:", err.message);
  }
};

checkHtml();
