console.log("BOT MULAI MENJALANKAN SCRIPT");

const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestWaWebVersion,
  Browsers
} = require("@whiskeysockets/baileys");

const pino = require("pino");

async function startBot() {
const { version } = await fetchLatestWaWebVersion();
console.log("VERSI WA WEB:", version.join("."));

  const { state, saveCreds } =
    await useMultiFileAuthState("./session-test-minimal");

const sock = makeWASocket({
  version,
  auth: state,
  browser: Browsers.macOS("Chrome"),
  markOnlineOnConnect: true,
  logger: pino({ level: "silent" })
});

  sock.ev.on("creds.update", saveCreds);

sock.ev.on("connection.update", ({ connection, lastDisconnect }) => {
  console.log("KONEKSI:", connection);

  if (lastDisconnect) {
    console.log(
      "ERROR:",
      JSON.stringify(lastDisconnect.error, null, 2)
    );
  }

    if (connection === "open") {
      console.log("BOT TERHUBUNG 🟢");
    }
  });

  async function getGroupAdmins(jid) {
    const metadata = await sock.groupMetadata(jid);

    return metadata.participants
      .filter(p =>
        p.admin === "admin" ||
        p.admin === "superadmin"
      )
      .map(p => p.id);
  }

  const stats = {
    messages: 0,
    commands: 0,
    joins: 0,
    toxic: 0,
    spam: 0,
    links: 0
  };

  const activityLog = [];

  function logActivity(type, detail) {
    activityLog.push(
      `[${new Date().toLocaleTimeString()}] ${type}: ${detail}`
    );

    if (activityLog.length > 100) {
      activityLog.shift();
    }
  }

  async function isGroupAdmin(jid, participant) {
    if (!jid.endsWith("@g.us")) return false;

    const admins = await getGroupAdmins(jid);
    return admins.includes(participant);
  }

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;

    for (const msg of messages) {
      if (!msg?.message) continue;
      if (msg.key.fromMe) continue;

      const jid = msg.key.remoteJid;
      const sender = msg.key.participant || msg.key.remoteJid;

      const text =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        "";

      console.log("PESAN:", text);

stats.messages++;
logActivity("MESSAGE", `${sender}: ${text}`);

if (
  text.includes("http://") ||
  text.includes("https://") ||
  text.includes("www.")
) {
  stats.links++;
  logActivity("LINK", `${sender}: ${text}`);

  await sock.sendMessage(jid, {
    text: "🚫 Link terdeteksi!"
  });

  continue;
}

const toxicWords = [
  "anjing",
  "bangsat",
  "kontol",
  "memek",
  "tolol"
];

const lowerText = text.toLowerCase();

if (toxicWords.some(word => lowerText.includes(word))) {
  stats.toxic++;
  logActivity("TOXIC", `${sender}: ${text}`);

  await sock.sendMessage(jid, {
    text: "⚠️ Jangan gunakan kata-kata kasar."
  });

  continue;
}

if (text.length > 500) {
  stats.spam++;
  logActivity("SPAM", `${sender}: pesan terlalu panjang`);

  await sock.sendMessage(jid, {
    text: "🚫 Pesan terdeteksi sebagai spam."
  });

  continue;
}

const faqText = text.trim().toLowerCase();

if (
  faqText.includes("admin dimana") ||
  faqText.includes("admin di mana") ||
  faqText.includes("admin ada") ||
  faqText.includes("mana admin") ||
  faqText.includes("admin online")
) {
  if (jid.endsWith("@g.us")) {
    try {
      const admins = await getGroupAdmins(jid);

      if (admins.length > 0) {
        await sock.sendMessage(jid, {
          text: "😴 Admin sedang tidur."
        });
      } else {
        await sock.sendMessage(jid, {
          text: "❌ Tidak ada admin yang terdeteksi."
        });
      }
    } catch (error) {
      console.log("ERROR AUTO FAQ:", error.message);
    }
  } else {
    await sock.sendMessage(jid, {
      text: "ℹ️ Auto FAQ admin hanya berlaku di grup."
    });
  }

  continue;
}

if (text.trim().toLowerCase() === "!stats") {
  await sock.sendMessage(jid, {
    text:
`📊 KING BOT STATS

💬 Pesan: ${stats.messages}
⚙️ Commands: ${stats.commands}
👋 Joins: ${stats.joins}
☠️ Toxic: ${stats.toxic}
🚫 Spam: ${stats.spam}
🔗 Links: ${stats.links}`
  });

  continue;
}

if (text.trim().toLowerCase() === "!help") {
  await sock.sendMessage(jid, {
    text:
`🤖 KING BOT — HELP

📌 PERINTAH:
!menu
!help
!ping
!status
!config
!stats
!log
!admin

👑 ADMIN:
!panel

ℹ️ Gunakan perintah sesuai kebutuhan.`
  });

  continue;
}

if (text.trim().toLowerCase() === "!log") {
  await sock.sendMessage(jid, {
    text: activityLog.length
      ? "📋 ACTIVITY LOG\n\n" + activityLog.slice(-20).join("\n")
      : "📋 Activity Log masih kosong."
  });

  continue;
}

if (text.trim().toLowerCase() === "!ping") {
  await sock.sendMessage(jid, {
    text: "🏓 Pong!"
  });
  continue;
}

if (text.trim().toLowerCase() === "!status") {
  await sock.sendMessage(jid, {
    text: "🟢 KING BOT ONLINE"
  });
  continue;
}

if (text.trim().toLowerCase() === "!config") {
  await sock.sendMessage(jid, {
    text:
`⚙️ CONFIG KING BOT

🤖 Status: ON
🛡️ Anti Toxic: ON
🔗 Anti Link: ON
🚫 Anti Spam: ON
👋 Welcome: ON`
  });
  continue;
}

if (text.trim().toLowerCase().startsWith("!toxic ")) {
  const name = text.trim().slice(7).trim();

  if (!name) {
    await sock.sendMessage(jid, {
      text: "❌ Format: !toxic Nama"
    });
    continue;
  }

  await sock.sendMessage(jid, {
    text: `⚠️ Peringatan toxic untuk ${name} dicatat.`
  });

  stats.toxic++;
  logActivity("TOXIC", name);

  continue;
}

if (text.trim().toLowerCase().startsWith("!ingatkan ")) {
  const data = text.trim().slice(10).trim();
  const parts = data.split(" ");
  const time = parts.shift();
  const message = parts.join(" ");

  if (!/^\d{2}:\d{2}$/.test(time) || !message) {
    await sock.sendMessage(jid, {
      text: "❌ Format: !ingatkan HH:MM Pesan"
    });
    continue;
  }

  await sock.sendMessage(jid, {
    text: `⏰ Pengingat dibuat untuk ${time}`
  });

  logActivity("REMINDER", `${time} - ${message}`);
  continue;
}

if (text.trim().toLowerCase() === "!pengingat") {
  await sock.sendMessage(jid, {
    text: "⏰ Gunakan !ingatkan HH:MM Pesan untuk membuat pengingat."
  });
  continue;
}

if (text.trim().toLowerCase().startsWith("!jam buka ")) {
  const hour = parseInt(text.trim().slice(10));

  if (isNaN(hour) || hour < 0 || hour > 23) {
    await sock.sendMessage(jid, {
      text: "❌ Format: !jam buka HH"
    });
    continue;
  }

  openHour = hour;

  await sock.sendMessage(jid, {
    text: `🕐 Jam buka diatur ke ${openHour}:00`
  });

  continue;
}

if (text.trim().toLowerCase().startsWith("!jam tutup ")) {
  const hour = parseInt(text.trim().slice(11));

  if (isNaN(hour) || hour < 0 || hour > 23) {
    await sock.sendMessage(jid, {
      text: "❌ Format: !jam tutup HH"
    });
    continue;
  }

  closeHour = hour;

  await sock.sendMessage(jid, {
    text: `🌙 Jam tutup diatur ke ${closeHour}:00`
  });

  continue;
}

if (text.trim().toLowerCase().startsWith("!join ")) {
  const name = text.trim().slice(6).trim();

  await sock.sendMessage(jid, {
    text: name
      ? `👋 ${name} bergabung ke grup.`
      : "❌ Format: !join Nama"
  });

  if (name) {
    stats.joins++;
    logActivity("JOIN", name);
  }

  continue;
}

if (text.trim().toLowerCase().startsWith("!leave ")) {
  const name = text.trim().slice(7).trim();

  await sock.sendMessage(jid, {
    text: name
      ? `👋 ${name} keluar dari grup.`
      : "❌ Format: !leave Nama"
  });

  if (name) {
    logActivity("LEAVE", name);
  }

  continue;
}

if (text.trim().toLowerCase() === "!menu") {
  await sock.sendMessage(jid, {
    text:
`🤖 KING MARKET BOT

📦 SEWA BOT BY KING

1. Sewa Bot 1 Hari — Rp2.000
2. Sewa Bot 1 Bulan — Rp10.000

💬 Untuk membeli:
Ketik !beli

🤖 KING BOT`
  });

  continue;
}

if (text.trim().toLowerCase() === "!panel") {
  const admin = await isGroupAdmin(jid, sender);

  if (!admin) {
    await sock.sendMessage(jid, {
      text: "❌ Kamu bukan admin grup."
    });
    continue;
  }

  await sock.sendMessage(jid, {
    text:
`👑 KING BOT ADMIN PANEL

📊 !stats
📋 !log
⚙️ !config
🔗 !antilink
🛡️ !antitoxic
🚫 !antispam`
  });

  continue;
}

if (text.trim().toLowerCase() === "!antilink on") {
  await sock.sendMessage(jid, { text: "🔗 Anti-link: ON" });
  continue;
}

if (text.trim().toLowerCase() === "!antilink off") {
  await sock.sendMessage(jid, { text: "🔗 Anti-link: OFF" });
  continue;
}

if (text.trim().toLowerCase() === "!antitoxic on") {
  await sock.sendMessage(jid, { text: "🛡️ Anti-toxic: ON" });
  continue;
}

if (text.trim().toLowerCase() === "!antitoxic off") {
  await sock.sendMessage(jid, { text: "🛡️ Anti-toxic: OFF" });
  continue;
}

if (text.trim().toLowerCase() === "!antispam on") {
  await sock.sendMessage(jid, { text: "🚫 Anti-spam: ON" });
  continue;
}

if (text.trim().toLowerCase() === "!antispam off") {
  await sock.sendMessage(jid, { text: "🚫 Anti-spam: OFF" });
  continue;
}

      if (text.trim().toLowerCase() === "!admin") {
        if (!jid.endsWith("@g.us")) {
          await sock.sendMessage(jid, {
            text: "❌ Perintah ini hanya bisa digunakan di grup."
          });
          continue;
        }

        try {
          const admin = await isGroupAdmin(jid, sender);

          if (admin) {
            await sock.sendMessage(jid, {
              text: "👑 Kamu terdeteksi sebagai ADMIN grup."
            });
          } else {
            await sock.sendMessage(jid, {
              text: "👤 Kamu bukan admin grup."
            });
          }
        } catch (error) {
          console.log("ERROR ADMIN:", error.message);

          await sock.sendMessage(jid, {
            text: "⚠️ Gagal membaca data admin grup."
          });
        }
      }
    }
  });
}

startBot();
