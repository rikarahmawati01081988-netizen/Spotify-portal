const https = require("https");

function searchSongs(query) {
  return new Promise((resolve, reject) => {
    const url =
      "https://itunes.apple.com/search?term=" +
      encodeURIComponent(query) +
      "&media=music&entity=song&limit=5";

    const req = https.get(url, { family: 4, timeout: 10000 }, res => {
      let data = "";

      res.on("data", chunk => {
        data += chunk;
      });

      res.on("end", () => {
        try {
          const json = JSON.parse(data);

          const songs = (json.results || []).map(song => ({
            title: song.trackName,
            artist: song.artistName,
            album: song.collectionName || "-",
            duration: song.trackTimeMillis
              ? Math.floor(song.trackTimeMillis / 60000) +
                ":" +
                String(
                  Math.floor((song.trackTimeMillis % 60000) / 1000)
                ).padStart(2, "0")
              : "-",
            artwork: song.artworkUrl100
              ? song.artworkUrl100.replace(
                  "100x100",
                  "600x600"
                )
              : null,
            preview: song.previewUrl || null,
            url: song.trackViewUrl || null
          }));

          resolve(songs);
        } catch (err) {
          reject(err);
        }
      });
    });

    req.on("timeout", () => {
      req.destroy(new Error("Request timeout"));
    });

    req.on("error", reject);
  });
}

function formatSearchResult(query, songs) {
  if (!songs.length) {
    return `🎵 Tidak menemukan lagu untuk: "${query}"`;
  }

  let text = `🎵 *HASIL PENCARIAN LAGU*\n`;
  text += `🔎 "${query}"\n\n`;

  songs.forEach((song, index) => {
    text += `${index + 1}. *${song.title}*\n`;
    text += `   👤 ${song.artist}\n`;
    text += `   💿 ${song.album}\n`;
    text += `   ⏱️ ${song.duration}\n\n`;
  });

  text += `Ketik nomor 1-${songs.length} untuk melihat detail.`;

  return text;
}

module.exports = {
  searchSongs,
  formatSearchResult
};
