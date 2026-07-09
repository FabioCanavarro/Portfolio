import YTMusic from "ytmusic-api";

// Global in-memory cache to prevent spamming YouTube endpoints and ensure instant loads
const ytImageCache = new Map<string, string | null>();
let ytmusicPromise: Promise<YTMusic> | null = null;

async function getYTMusicClient() {
  if (!ytmusicPromise) {
    ytmusicPromise = (async () => {
      const client = new YTMusic();
      await client.initialize();
      return client;
    })();
  }
  return ytmusicPromise;
}

export async function getYTMusicImage(
  query: string,
  type: "ARTIST" | "ALBUM" | "SONG",
): Promise<string | null> {
  const cacheKey = `${type}:${query.toLowerCase()}`;
  if (ytImageCache.has(cacheKey)) {
    return ytImageCache.get(cacheKey) || null;
  }

  try {
    const client = await getYTMusicClient();
    const results = await client.search(query);

    if (results && results.length > 0) {
      // Filter by result type (SONG → "SONG", ARTIST → "ARTIST", ALBUM → "ALBUM")
      // Fall back to the first result if no match is found
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const typed = (results as any[]).find(
        (r) => r.resultType?.toUpperCase() === type,
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const item = (typed ?? results[0]) as any;
      const thumbnails = item.thumbnails;

      if (thumbnails && thumbnails.length > 0) {
        // Some URLs come back with "=w120-h120..." which can be small, we can strip the sizing parameter
        // to get the raw image, but YT usually returns good enough sizes natively on the last index.
        const imageUrl = thumbnails[thumbnails.length - 1].url;

        // Enhance resolution by rewriting Google's proxy URL sizes if present
        const highResUrl = imageUrl.replace(
          /=w\d+-h\d+.*$/,
          "=w600-h600-l90-rj",
        );

        ytImageCache.set(cacheKey, highResUrl);
        return highResUrl;
      }
    }
  } catch (_error) {
    console.warn(`[YTMusic] Failed to fetch image for: ${query}`);
  }

  ytImageCache.set(cacheKey, null);
  return null;
}

export async function getYTMusicVideoId(
  query: string,
): Promise<string | null> {
  try {
    const client = await getYTMusicClient();
    const results = await client.search(query);

    if (results && results.length > 0) {
      // Prioritize SONG type results that have a videoId, fallback to any result with videoId
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const songResult = (results as any[]).find(
        (r) => r.resultType?.toUpperCase() === "SONG" && r.videoId,
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const item = (songResult ?? results.find((r: any) => r.videoId) ?? results[0]) as any;

      if (item && item.videoId) {
        return item.videoId;
      }
    }
  } catch (_error) {
    console.warn(`[YTMusic] Failed to fetch videoId for: ${query}`);
  }
  return null;
}
