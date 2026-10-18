const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 8787;
const file = path.join(__dirname, "index.html");

const server = http.createServer((req, res) => {
  if (req.url === "/" || req.url === "/index.html") {
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

  res.writeHead(404, {
    "Content-Type": "text/plain; charset=utf-8"
  });

  res.end("Not Found");
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`KING BOT MUSIC PLAYER: http://127.0.0.1:${PORT}`);
});
