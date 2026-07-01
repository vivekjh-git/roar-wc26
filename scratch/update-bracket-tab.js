const fs = require('fs');
let c = fs.readFileSync('src/components/BracketTab.tsx', 'utf8');

c = c.replace(/<BracketNode gameId=/g, '<BracketNode onMatchClick={setSelectedMatch} gameId=');

c = c.replace(/const \[activeTab, setActiveTab\] = useState\<'previous' \| 'today' \| 'tomorrow' \| 'upcoming'\>\('today'\);/m, 
  `const [activeTab, setActiveTab] = useState<'previous' | 'today' | 'tomorrow' | 'upcoming'>('today');\n  const [selectedMatch, setSelectedMatch] = useState<Game | null>(null);`
);

c = c.replace(/return \(\n    <div className=\"flex flex-col h-full bg-transparent overflow-hidden relative\">\n/m, 
  `return (\n    <>\n      {selectedMatch && (\n        <MatchDetailsModal \n          game={selectedMatch} \n          teamMap={teamMap} \n          stadiumMap={stadiumMap} \n          onClose={() => setSelectedMatch(null)} \n        />\n      )}\n      <div className=\"flex flex-col h-full bg-transparent overflow-hidden relative\">\n`
);
c = c.replace(/<\/div>\n  \);\n}/m, `<\/div>\n    </>\n  );\n}`);

fs.writeFileSync('src/components/BracketTab.tsx', c);
