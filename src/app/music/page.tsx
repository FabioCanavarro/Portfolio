import {
  getRecentTracks,
  getTopAlbums,
  getTopArtists,
  getTopTags,
  getUserInfo,
  getTopTracks,
} from "@/lib/lastfm";
import {
  Disc,
  Music2,
  Play,
  Activity,
  Mic2,
  Tag,
  Calendar,
  AlertCircle,
  ArrowLeft,
  Flame,
  Clock,
  Headphones,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "Music | Fabio Canavarro",
  description: "A dynamic showcase of what I'm listening to right now.",
};

export const revalidate = 30; // Revalidate the page every 30 seconds

export default async function MusicPage() {
  const userInfo = await getUserInfo();
  const recentTracks = await getRecentTracks(12);
  const topTracks = await getTopTracks(6);
  const topAlbums = await getTopAlbums(6);
  const topArtists = await getTopArtists(6);
  const topTags = await getTopTags(6);

  const nowPlaying = recentTracks.find((t) => t.nowPlaying);

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      {/* Back Link */}
      <Link
        href="/"
        className="inline-flex items-center text-xs font-semibold text-subtext0 hover:text-mauve transition-colors mb-6 group"
      >
        <ArrowLeft className="w-4 h-4 mr-1.5 transition-transform group-hover:-translate-x-1" />
        Back to Overview
      </Link>

      <div className="mb-12 border-b border-surface0/60 pb-8 text-center md:text-left flex flex-col md:flex-row items-center md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold text-mauve mb-4 flex items-center justify-center md:justify-start">
            <Music2 className="w-8 h-8 mr-3" /> Music Activity
          </h1>
          <p className="text-subtext0 text-lg">
            A live feed of my listening habits sourced directly from Last.fm.
          </p>

          {/* Obsidian Admonition Callout */}
          <div className="mt-6 p-4 rounded-xl bg-crust/70 border border-surface0/80 border-l-4 border-l-mauve shadow-lg backdrop-blur-md flex items-start gap-3 max-w-xl text-left">
            <AlertCircle className="w-4 h-4 text-mauve shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-mauve block mb-0.5">
                Notice / Audio Feed
              </span>
              <p className="text-xs text-subtext0 leading-relaxed font-medium">
                Live listening feed powered by Last.fm and YouTube. Songs and stats sync automatically!
              </p>
            </div>
          </div>
        </div>

        {nowPlaying && (
          <div className="flex items-center space-x-4 bg-crust/80 backdrop-blur-md p-4 rounded-2xl border border-surface1 shadow-lg shadow-green/5 max-w-sm w-full">
            <div className="relative w-16 h-16 rounded-xl overflow-hidden shadow-md shrink-0 border border-surface0">
              <Image 
                src={nowPlaying.image || "/images/placeholder-music.jpg"} 
                alt={nowPlaying.album} 
                layout="fill"
                objectFit="cover"
              />
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <div className="flex items-center space-x-2 text-green mb-1">
                <Activity className="w-4 h-4 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider">Now Playing</span>
              </div>
              <p className="text-text font-bold text-sm truncate">{nowPlaying.name}</p>
              <p className="text-subtext0 text-xs truncate">{nowPlaying.artist}</p>
            </div>
          </div>
        )}
      </div>

      {/* User Stats Card Banner */}
      {userInfo && (
        <section className="mb-16">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-crust/60 border border-surface0/80 rounded-2xl p-4 backdrop-blur-md flex flex-col items-center justify-center text-center hover:border-mauve/40 transition-colors">
              <Headphones className="w-6 h-6 text-mauve mb-2" />
              <span className="text-2xl font-extrabold text-text">
                {userInfo.playcount.toLocaleString()}
              </span>
              <span className="text-xs text-subtext0 font-medium mt-1">
                Total Scrobbles
              </span>
            </div>

            <div className="bg-crust/60 border border-surface0/80 rounded-2xl p-4 backdrop-blur-md flex flex-col items-center justify-center text-center hover:border-sapphire/40 transition-colors">
              <Clock className="w-6 h-6 text-sapphire mb-2" />
              <span className="text-2xl font-extrabold text-text">
                {userInfo.estimatedMinutes.toLocaleString()}
              </span>
              <span className="text-xs text-subtext0 font-medium mt-1">
                Minutes Listened (~{userInfo.estimatedHours.toLocaleString()} hrs)
              </span>
            </div>

            <div className="bg-crust/60 border border-surface0/80 rounded-2xl p-4 backdrop-blur-md flex flex-col items-center justify-center text-center hover:border-flamingo/40 transition-colors">
              <Calendar className="w-6 h-6 text-flamingo mb-2" />
              <span className="text-lg font-bold text-text">
                {userInfo.registeredDate || "Active"}
              </span>
              <span className="text-xs text-subtext0 font-medium mt-1">
                Scrobbling Since
              </span>
            </div>

            <a
              href={userInfo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-crust/60 border border-surface0/80 rounded-2xl p-4 backdrop-blur-md flex flex-col items-center justify-center text-center hover:border-green/40 hover:bg-surface0/30 transition-all group"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden mb-1 border border-surface1 relative">
                {userInfo.image ? (
                  <Image
                    src={userInfo.image}
                    alt={userInfo.username}
                    layout="fill"
                    objectFit="cover"
                  />
                ) : (
                  <Music2 className="w-4 h-4 m-2 text-green" />
                )}
              </div>
              <span className="text-sm font-bold text-text group-hover:text-green transition-colors">
                @{userInfo.username}
              </span>
              <span className="text-xs text-subtext0 font-medium mt-1">
                View Last.fm Profile ↗
              </span>
            </a>
          </div>
        </section>
      )}

      {!recentTracks.length && !topAlbums.length && !userInfo && (
        <div className="note-block mt-8">
          <p>Configure your Last.fm API Key and Username in your environment variables to see live music data!</p>
        </div>
      )}

      {/* Top Songs Section */}
      {topTracks.length > 0 && (
        <section className="mb-20">
          <h2 className="text-2xl font-bold mb-8 text-rosewater flex items-center">
            <Flame className="w-6 h-6 mr-3" />
            Top Songs
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {topTracks.map((track, idx) => (
              <a
                key={idx}
                href={track.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center space-x-4 bg-crust/40 rounded-xl p-3.5 border border-surface0 hover:border-rosewater/50 transition-all hover:bg-surface0/20"
              >
                <span className="text-lg font-black text-surface2 group-hover:text-rosewater transition-colors w-6 text-center shrink-0">
                  #{idx + 1}
                </span>
                <div className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0 border border-surface0/50 shadow-md">
                  <Image
                    src={track.image || "/images/placeholder-music.jpg"}
                    alt={track.name}
                    layout="fill"
                    objectFit="cover"
                    className="group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-text truncate group-hover:text-rosewater transition-colors">
                    {track.name}
                  </p>
                  <p className="text-xs text-subtext0 truncate mt-0.5">
                    {track.artist}
                  </p>
                  <span className="text-[10px] font-semibold text-rosewater/80 bg-rosewater/10 px-2 py-0.5 rounded-full inline-block mt-1">
                    {track.playcount} plays
                  </span>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Top Albums Grid */}
      {topAlbums.length > 0 && (
        <section className="mb-20">
          <h2 className="text-2xl font-bold mb-8 text-sapphire flex items-center">
            <Disc className="w-6 h-6 mr-3" />
            Top Albums
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {topAlbums.map((album, idx) => (
              <a
                key={idx}
                href={album.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col items-center bg-crust/30 rounded-xl p-3 border border-surface0 hover:border-sapphire/50 transition-colors"
              >
                <div className="relative w-full aspect-square rounded-lg overflow-hidden mb-3 shadow-md border border-surface0/50">
                  <Image
                    src={album.image}
                    alt={album.name}
                    layout="fill"
                    objectFit="cover"
                    className="group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <p className="text-sm font-semibold text-text text-center line-clamp-1 w-full">
                  {album.name}
                </p>
                <p className="text-xs text-subtext0 text-center line-clamp-1 w-full mt-1">
                  {album.artist}
                </p>
                <p className="text-xs text-subtext1 text-center line-clamp-1 w-full mt-1">
                  {album.playcount} plays
                </p>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Top Artists Grid */}
      {topArtists.length > 0 && (
        <section className="mb-20">
          <h2 className="text-2xl font-bold mb-8 text-green flex items-center">
            <Mic2 className="w-6 h-6 mr-3" />
            Top Artists
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {topArtists.map((artist, idx) => (
              <a
                key={idx}
                href={artist.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col items-center bg-crust/30 rounded-xl p-3 border border-surface0 hover:border-green/50 transition-colors"
              >
                <div className="relative w-full aspect-square rounded-full overflow-hidden mb-3 shadow-md border border-surface0/50">
                  <Image
                    src={artist.image || "/images/placeholder-music.jpg"}
                    alt={artist.name}
                    layout="fill"
                    objectFit="cover"
                    className="group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <p className="text-sm font-semibold text-text text-center line-clamp-1 w-full">
                  {artist.name}
                </p>
                <p className="text-xs text-subtext0 text-center line-clamp-1 w-full mt-1">
                  {artist.playcount} plays
                </p>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Recent Tracks List */}
      {recentTracks.length > 0 && (
        <section className="mb-20">
          <h2 className="text-2xl font-bold mb-8 text-flamingo flex items-center">
            <Play className="w-6 h-6 mr-3" />
            Recently Played
          </h2>
          <div className="bg-crust/50 border border-surface0 rounded-2xl overflow-hidden backdrop-blur-sm transform-gpu relative z-10">
            <ul className="divide-y divide-surface0">
              {recentTracks.filter(t => !t.nowPlaying).map((track, idx) => (
                <li key={idx} className="hover:bg-surface0/30 transition-colors group">
                  <a
                    href={track.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center p-4 sm:p-5 gap-4 sm:gap-6"
                  >
                    <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden shadow-sm shrink-0">
                      <Image
                        src={track.image || "/images/placeholder-music.jpg"}
                        alt={track.album}
                        layout="fill"
                        objectFit="cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
                      <div className="flex flex-col min-w-0">
                        <p className="text-mauve group-hover:text-sapphire transition-colors font-semibold text-sm sm:text-[1rem] sm:leading-6 truncate relative z-10 antialiased transform-gpu">
                          {track.name}
                        </p>
                        <p className="text-subtext0 text-xs sm:text-sm truncate">
                          {track.artist}
                        </p>
                      </div>
                      <div className="hidden sm:block text-subtext1 text-xs text-right max-w-[200px] truncate">
                        {track.album}
                      </div>
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Top Genres Section */}
      {topTags.length > 0 && (
        <section className="mb-20">
          <h2 className="text-2xl font-bold mb-6 text-mauve flex items-center">
            <Tag className="w-6 h-6 mr-3" />
            Favorite Genres
          </h2>
          <div className="flex flex-wrap gap-3">
            {topTags.map((tag, idx) => (
              <a
                key={idx}
                href={tag.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-crust/50 border border-surface0 hover:border-mauve/50 text-text hover:text-mauve text-sm font-semibold rounded-full backdrop-blur-sm transition-all duration-300 flex items-center gap-2"
              >
                <span>#{tag.name}</span>
                <span className="text-xs bg-surface1 px-2 py-0.5 rounded-full text-subtext0 font-normal">
                  {tag.count} plays
                </span>
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
