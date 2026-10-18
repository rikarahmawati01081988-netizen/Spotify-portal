const http = require("http");
const https = require("https");
const dns = require("dns");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const PORT = 8787;
const file = path.join(__dirname, "index.html");

function searchITunes(term) {
  return new Promise((resolve, reject) => {
    dns.resolve4("itunes.apple.com", (dnsError, addresses) => {
      if (dnsError || !addresses?.length) {
        return reject(dnsError || new Error("DNS iTunes gagal"));
      }

      const target = new URL(
        "https://itunes.apple.com/search?term=" +
        encodeURIComponent(term) +
        "&media=music&entity=song&limit=25"
      );

      const req = https.get(
        {
          hostname: addresses[0],
          port: 443,
          path: target.pathname + target.search,
          family: 4,
          headers: {
            Host: "itunes.apple.com",
            "User-Agent": "KING-BOT-MUSIC-PLAYER/1.0"
          },
          timeout: 10000
        },
        (response) => {
          let data = "";

          response.setEncoding("utf8");

          response.on("data", chunk => {
            data += chunk;
          });

          response.on("end", () => {
            try {
              const json = JSON.parse(data);

              const songs = (json.results || [])
                .filter(song => song.trackName && song.previewUrl)
                .map(song => ({
                  title: song.trackName,
                  artist: song.artistName || "-",
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
                    : "",
                  preview: song.previewUrl,
                  url: song.trackViewUrl || ""
                }));

              resolve(songs);
            } catch (error) {
              reject(error);
            }
          });
        }
      );

      req.on("error", reject);
      req.on("timeout", () => {
        req.destroy(new Error("Request iTunes timeout"));
      });
    });
  });
}

const server = http.createServer(async (req, res) => {
  const parsed = new URL(req.url, `http://127.0.0.1:${PORT}`);

  if (parsed.pathname === "/" || parsed.pathname === "/index.html") {
    try {
      const html = fs.readFileSync(file);

      res.writeHead(200, {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store"
      });

      res.end(html);
    } catch (error) {
      res.writeHead(500, {
        "Content-Type": "text/plain; charset=utf-8"
      });

      res.end("Music Player Error");
    }

    return;
  }

  if (parsed.pathname === "/api/artwork") {
    const imageUrl = parsed.searchParams.get("url");

    if (!imageUrl) {
      res.writeHead(400, {
        "Content-Type": "text/plain; charset=utf-8"
      });
      res.end("Artwork URL kosong");
      return;
    }

    try {
      const target = new URL(imageUrl);

      const request = https.get(
        {
          hostname: target.hostname,
          port: 443,
          path: target.pathname + target.search,
          family: 4,
          headers: {
            "User-Agent": "KING-BOT-MUSIC-PLAYER/1.0"
          },
          timeout: 10000
        },
        (response) => {
          if (response.statusCode < 200 || response.statusCode >= 300) {
            res.writeHead(response.statusCode || 502);
            res.end();
            return;
          }

          res.writeHead(200, {
            "Content-Type":
              response.headers["content-type"] || "image/jpeg",
            "Cache-Control": "public, max-age=3600"
          });

          response.pipe(res);
        }
      );

      request.on("error", () => {
        if (!res.headersSent) {
          res.writeHead(502);
        }
        res.end();
      });

      request.on("timeout", () => {
        request.destroy();
      });

    } catch (error) {
      res.writeHead(400);
      res.end("Artwork URL tidak valid");
    }

    return;
  }

  if (parsed.pathname === "/api/search") {
    const query = parsed.searchParams.get("q")?.trim();

    if (!query) {
      res.writeHead(400, {
        "Content-Type": "application/json; charset=utf-8"
      });

      res.end(JSON.stringify({
        error: "Masukkan judul lagu"
      }));

      return;
    }

    try {
      console.log("MUSIC PLAYER SEARCH:", query);

      const songs = await searchITunes(query);

      res.writeHead(200, {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        "Access-Control-Allow-Origin": "*"
      });

      res.end(JSON.stringify(songs));
    } catch (error) {
      console.error("MUSIC PLAYER ERROR:", error.message);

      res.writeHead(500, {
        "Content-Type": "application/json; charset=utf-8"
      });

      res.end(JSON.stringify({
        error: "Gagal mengambil lagu dari iTunes"
      }));
    }

    return;
  }

  res.writeHead(404, {
    "Content-Type": "text/plain; charset=utf-8"
  });

  res.end("Not Found");
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`KING BOT MUSIC PLAYER: http://127.0.0.1:${PORT}`);
});
