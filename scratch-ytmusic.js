const YTMusic = require("ytmusic-api");

async function run() {
  const ytmusic = new YTMusic();
  await ytmusic.initialize();

  // Test artist search
  const artists = await ytmusic.search("Porter Robinson", "ARTIST");
  console.log("Artist image:", artists[0]?.thumbnails);

  // Test album search
  const albums = await ytmusic.search("Nurture Porter Robinson", "ALBUM");
  console.log("Album image:", albums[0]?.thumbnails);

  // Test song search
  const songs = await ytmusic.search("Look at the Sky Porter Robinson", "SONG");
  console.log("Song image:", songs[0]?.thumbnails);
}
run();
