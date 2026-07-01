import { NextRequest, NextResponse } from "next/server";

// Historical FIFA World Cup match data (1930-2022), public domain, no key required.
// Source: https://github.com/openfootball/worldcup.json
const WC_YEARS = [
  1930, 1934, 1938, 1950, 1954, 1958, 1962, 1966, 1970, 1974, 1978, 1982,
  1986, 1990, 1994, 1998, 2002, 2006, 2010, 2014, 2018, 2022,
];

// A few team names differ between our current squad list and this historical dataset.
const NAME_ALIASES: Record<string, string> = {
  "United States": "USA",
  "Ivory Coast": "Côte d'Ivoire",
};

function historicalName(name: string): string {
  return NAME_ALIASES[name] ?? name;
}

interface WcScore {
  ft?: [number, number];
  et?: [number, number];
  p?: [number, number];
}

interface WcRawMatch {
  round: string;
  date: string;
  team1: string;
  team2: string;
  score?: WcScore;
}

async function fetchYear(year: number): Promise<Array<WcRawMatch & { year: number }>> {
  try {
    const res = await fetch(
      `https://raw.githubusercontent.com/openfootball/worldcup.json/master/${year}/worldcup.json`,
      { next: { revalidate: 60 * 60 * 24 * 30 } } // historical results never change
    );
    if (!res.ok) return [];
    const data = (await res.json()) as { matches?: WcRawMatch[] };
    return (data.matches ?? []).map((m) => ({ ...m, year }));
  } catch {
    return [];
  }
}

export async function GET(req: NextRequest) {
  const home = req.nextUrl.searchParams.get("home");
  const away = req.nextUrl.searchParams.get("away");
  if (!home || !away) {
    return NextResponse.json({ matched: false }, { status: 400 });
  }

  const homeAlias = historicalName(home);
  const awayAlias = historicalName(away);

  const allYears = await Promise.all(WC_YEARS.map(fetchYear));
  const allMatches = allYears.flat();

  const meetings = allMatches
    .filter(
      (m) =>
        (m.team1 === homeAlias && m.team2 === awayAlias) ||
        (m.team1 === awayAlias && m.team2 === homeAlias)
    )
    .filter((m) => m.score?.ft)
    .sort((a, b) => a.year - b.year)
    .map((m) => {
      const isHomeFirst = m.team1 === homeAlias;
      // Extra-time score reflects the goals actually scored in play; penalties (if any) only
      // decided who advanced, so they're kept separate rather than folded into the scoreline.
      const [g1, g2] = m.score!.et ?? m.score!.ft!;
      const homeGoals = isHomeFirst ? g1 : g2;
      const awayGoals = isHomeFirst ? g2 : g1;

      let penaltyWinner: "home" | "away" | null = null;
      if (m.score!.p) {
        const [p1, p2] = m.score!.p;
        const homePens = isHomeFirst ? p1 : p2;
        const awayPens = isHomeFirst ? p2 : p1;
        penaltyWinner = homePens > awayPens ? "home" : "away";
      }

      return { year: m.year, round: m.round, homeGoals, awayGoals, penaltyWinner };
    });

  let homeWins = 0;
  let awayWins = 0;
  let draws = 0;
  for (const m of meetings) {
    if (m.homeGoals > m.awayGoals) homeWins++;
    else if (m.awayGoals > m.homeGoals) awayWins++;
    else draws++;
  }

  return NextResponse.json({
    matched: true,
    totalMeetings: meetings.length,
    homeWins,
    awayWins,
    draws,
    meetings,
  });
}
