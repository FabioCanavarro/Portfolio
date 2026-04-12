import { getYTMusicImage } from "./ytmusic";

const API_BASE = "https://ws.audioscrobbler.com/2.0/";
const API_KEY = (process.env.NEXT_PUBLIC_LASTFM_API_KEY || "").trim();
const USERNAME = (process.env.NEXT_PUBLIC_LASTFM_USERNAME || "").trim();

export type LastFmTrack = {
  name: string;
  artist: string;
  album: string;
  url: string;
  image: string;
  nowPlaying: boolean;
};

export type LastFmAlbum = {
  name: string;
  artist: string;
  playcount: string;
  url: string;
  image: string;
};

export type LastFmArtist = {
  name: string;
  playcount: string;
  url: string;
  image: string;
};

export async function getRecentTracks(limit: number = 10): Promise<LastFmTrack[]> {
  console.log("Last.fm Debug (Recent Tracks) - Env Vars:", { 
    hasApiKey: !!API_KEY, 
    username: USERNAME 
  });

  if (!API_KEY || !USERNAME) return [];

  const url = `${API_BASE}?method=user.getrecenttracks&user=${USERNAME}&api_key=${API_KEY}&format=json&limit=${limit}`;
  console.log("Last.fm Debug (Recent Tracks) - Fetch URL:", url.replace(API_KEY, "HIDDEN_API_KEY"));

  try {
    const res = await fetch(url, { next: { revalidate: 30 } }); // revalidate every 30 seconds
    const data = await res.json();
    console.log("Last.fm Debug (Recent Tracks) - Response:", { status: res.status, data });
    
    if (!data.recenttracks) return [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tracks = data.recenttracks.track.map((track: Record<string, any>) => ({
      name: track.name,
      artist: track.artist["#text"],
      album: track.album["#text"],
      url: track.url,
      image: track.image[3]["#text"] || track.image[2]["#text"], // large or extralarge
      nowPlaying: track["@attr"]?.nowplaying === "true",
    }));

    const enrichedTracks = await Promise.all(tracks.map(async (track: LastFmTrack) => {
      const ytImage = await getYTMusicImage(`${track.artist} ${track.name}`, "SONG");
      return { ...track, image: ytImage || track.image };
    }));

    return enrichedTracks;
  } catch (error) {
    console.error("Error fetching Last.fm recent tracks:", error);
    return [];
  }
}

export async function getTopAlbums(limit: number = 6): Promise<LastFmAlbum[]> {
  console.log("Last.fm Debug (Top Albums) - Env Vars:", { 
    hasApiKey: !!API_KEY, 
    username: USERNAME 
  });

  if (!API_KEY || !USERNAME) return [];

  const url = `${API_BASE}?method=user.gettopalbums&user=${USERNAME}&api_key=${API_KEY}&format=json&limit=${limit}`;

  try {
    const res = await fetch(url, { next: { revalidate: 3600 } }); // revalidate hourly
    const data = await res.json();
    console.log("Last.fm Debug (Top Albums) - Response:", { status: res.status, data });
    
    if (!data.topalbums) return [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const albums = data.topalbums.album.map((album: Record<string, any>) => ({
      name: album.name,
      artist: album.artist.name,
      playcount: album.playcount,
      url: album.url,
      image: album.image[3]["#text"] || album.image[2]["#text"],
    }));

    const enrichedAlbums = await Promise.all(albums.map(async (album: LastFmAlbum) => {
      const ytImage = await getYTMusicImage(`${album.artist} ${album.name}`, "ALBUM");
      return { ...album, image: ytImage || album.image };
    }));

    return enrichedAlbums;
  } catch (error) {
    console.error("Error fetching Last.fm top albums:", error);
    return [];
  }
}

export async function getTopArtists(limit: number = 6): Promise<LastFmArtist[]> {
  console.log("Last.fm Debug (Top Artists) - Env Vars:", { 
    hasApiKey: !!API_KEY, 
    username: USERNAME 
  });

  if (!API_KEY || !USERNAME) return [];

  const url = `${API_BASE}?method=user.gettopartists&user=${USERNAME}&api_key=${API_KEY}&format=json&limit=${limit}`;

  try {
    const res = await fetch(url, { next: { revalidate: 3600 } }); // revalidate hourly
    const data = await res.json();
    console.log("Last.fm Debug (Top Artists) - Response:", { status: res.status, data });
    
    if (!data.topartists) return [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const artists = data.topartists.artist.map((artist: Record<string, any>) => ({
      name: artist.name,
      playcount: artist.playcount,
      url: artist.url,
      // Last.fm's artist API sometimes doesn't provide great images in modern times
      // due to a licensing change, but we will grab what they offer.
      image: artist.image[3]["#text"] || artist.image[2]["#text"],
    }));

    const enrichedArtists = await Promise.all(artists.map(async (artist: LastFmArtist) => {
      const ytImage = await getYTMusicImage(artist.name, "ARTIST");
      return { ...artist, image: ytImage || artist.image };
    }));

    return enrichedArtists;
  } catch (error) {
    console.error("Error fetching Last.fm top artists:", error);
    return [];
  }
}
