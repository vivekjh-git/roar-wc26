const fs = require('fs');
let c = fs.readFileSync('src/components/BracketTab.tsx', 'utf8');

c = c.replace(/homeWin \? ['"]text-yellow-400['"]/g, 'homeWin ? "text-green-400"');
c = c.replace(/awayWin \? ['"]text-yellow-400['"]/g, 'awayWin ? "text-green-400"');
c = c.replace(/homeWin \? ['"]ring-2 ring-yellow-400['"]/g, 'homeWin ? "ring-2 ring-green-400"');
c = c.replace(/awayWin \? ['"]ring-2 ring-yellow-400['"]/g, 'awayWin ? "ring-2 ring-green-400"');

fs.writeFileSync('src/components/BracketTab.tsx', c);
