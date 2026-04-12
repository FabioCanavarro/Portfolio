import { NextRequest, NextResponse } from "next/server";
import { getYTMusicImage } from "@/lib/ytmusic";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const q = searchParams.get("q");
  const type = searchParams.get("type") as "ARTIST" | "ALBUM" | "SONG" | null;

  if (!q || !type) {
    return NextResponse.json({ error: "Missing 'q' or 'type' query parameters" }, { status: 400 });
  }

  try {
    const imageUrl = await getYTMusicImage(q, type);
    return NextResponse.json({ imageUrl });
  } catch (_error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
