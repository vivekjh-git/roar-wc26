import { NextResponse } from 'next/server';

export const revalidate = 300; // Cache for 5 minutes

export async function GET() {
  try {
    // Fetch global soccer/world cup news from ESPN public API
    const res = await fetch("https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/news", {
      next: { revalidate: 300 }
    });
    
    if (!res.ok) {
      throw new Error("Failed to fetch external news");
    }
    
    const data = await res.json();
    const articles = data.articles || [];
    
    const headlines = articles.slice(0, 8).map((a: any) => a.headline);
    return NextResponse.json({ success: true, news: headlines });
  } catch (error) {
    console.error("News API Error:", error);
    return NextResponse.json({ success: false, news: [] }, { status: 500 });
  }
}
