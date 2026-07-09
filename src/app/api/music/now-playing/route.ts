import { NextResponse } from "next/server";
import { getRecentTracks } from "@/lib/lastfm";
import { getYTMusicVideoId } from "@/lib/ytmusic";

// Force dynamic fetch, no static optimization
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const tracks = await getRecentTracks(1);
    
    if (tracks && tracks.length > 0 && tracks[0].nowPlaying) {
      const track = tracks[0];
      const videoId = await getYTMusicVideoId(`${track.artist} - ${track.name}`);
      
      return NextResponse.json({
        playing: true,
        title: track.name,
        artist: track.artist,
        videoId: videoId,
        image: track.image
      });
    }

    return NextResponse.json({ playing: false });
  } catch (error) {
    console.error("Error in now-playing API:", error);
    return NextResponse.json({ playing: false, error: "Internal Server Error" }, { status: 500 });
  }
}
