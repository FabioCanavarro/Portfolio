import { getRecentTracks, getTopAlbums, getTopArtists, getTopTags } from "@/lib/lastfm";
import { Disc, Music2, Play, Activity, Mic2, Tag, Calendar } from "lucide-react";
import Image from "next/image";

export const metadata = {
  title: "Music | Fabio Canavarro",
  description: "A dynamic showcase of what I'm listening to right now.",
};

export const revalidate = 30; // Revalidate the page every 30 seconds

export default async function MusicPage() {
  const recentTracks = await getRecentTracks(12);
  const topAlbums = await getTopAlbums(6);
  const topArtists = await getTopArtists(6);
  const topTags = await getTopTags(6);
  const lastYearAlbums = await getTopAlbums(6, "12month");
  const lastYearArtists = await getTopArtists(6, "12month");

  const nowPlaying = recentTracks.find((t) => t.nowPlaying);

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      <div className="mb-16 text-center md:text-left flex flex-col md:flex-row items-center md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold text-mauve mb-4 flex items-center justify-center md:justify-start">
            <Music2 className="w-8 h-8 mr-3" /> Music Activity
          </h1>
          <p className="text-subtext0 text-lg">
            A live feed of my listening habits sourced directly from Last.fm.
          </p>
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

      {!recentTracks.length && !topAlbums.length && (
        <div className="note-block mt-8">
          <p>Configure your Last.fm API Key and Username in your environment variables to see live music data!</p>
        </div>
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
        <section>
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
        <section className="mb-20 mt-20">
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

      {/* Last Year's Favorites Section */}
      {(lastYearArtists.length > 0 || lastYearAlbums.length > 0) && (
        <section className="mb-20 mt-20">
          <h2 className="text-2xl font-bold mb-8 text-pink flex items-center">
            <Calendar className="w-6 h-6 mr-3" />
            Last Year&apos;s Favorites (Past 12 Months)
          </h2>
          
          {lastYearArtists.length > 0 && (
            <div className="mb-12">
              <h3 className="text-lg font-bold mb-4 text-subtext0 flex items-center">
                <Mic2 className="w-5 h-5 mr-2" /> Top Artists of the Year
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                {lastYearArtists.map((artist, idx) => (
                  <a
                    key={idx}
                    href={artist.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex flex-col items-center bg-crust/30 rounded-xl p-3 border border-surface0 hover:border-pink/50 transition-colors"
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
            </div>
          )}

          {lastYearAlbums.length > 0 && (
            <div>
              <h3 className="text-lg font-bold mb-4 text-subtext0 flex items-center">
                <Disc className="w-5 h-5 mr-2" /> Top Albums of the Year
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                {lastYearAlbums.map((album, idx) => (
                  <a
                    key={idx}
                    href={album.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex flex-col items-center bg-crust/30 rounded-xl p-3 border border-surface0 hover:border-pink/50 transition-colors"
                  >
                    <div className="relative w-full aspect-square rounded-lg overflow-hidden mb-3 shadow-md border border-surface0/50">
                      <Image
                        src={album.image || "/images/placeholder-music.jpg"}
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
                  </a>
                ))}
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
