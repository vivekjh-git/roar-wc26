import { NextResponse } from "next/server";
import { getGames } from "@/lib/api";

export const revalidate = 0;

export async function GET() {
  try {
    const games = await getGames();
    return NextResponse.json(games);
  } catch (error) {
    return NextResponse.json({ error: "Failed to load games" }, { status: 500 });
  }
}
