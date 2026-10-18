const autoStatus = require("./auto-status");
console.log("BOT MULAI MENJALANKAN SCRIPT");

const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestWaWebVersion,
  Browsers
} = require("@whiskeysockets/baileys");

const pino = require("pino");
const fs = require("fs");
const config = require("./config.json");
const { loadCustomer } = require("./package-manager");
const { searchSongs, formatSearchResult } = require("./music-feature");
const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");

// MUSIC PLAYER PUBLIC URL
const MUSIC_PLAYER_PUBLIC_URL = "https://kpvbi-114-12-31-224.free.pinggy.net";

const { generateWAMessageFromContent, WAProto, generateMessageIDV2 } = require("@whiskeysockets/baileys");

// MUSIC SELECTION — pilihan lagu interaktif
const songSelections = new Map();

async function startBot() {
  const customerId = process.argv[2] || "customer-001";
  const customer = loadCustomer(customerId);

  if (!customer) {
    console.log("CUSTOMER: TIDAK DITEMUKAN");
    return;
  }

  if (customer.active !== true) {
    console.log("STATUS: CUSTOMER NONAKTIF");
    return;
  }

  if (
    customer.endDate &&
    new Date(customer.endDate + "T23:59:59") < new Date()
  ) {
    console.log("STATUS: MASA AKTIF HABIS");
    return;
  }

  console.log("CUSTOMER:", customer.customerId);
  console.log("PACKAGE:", customer.package);
  // ===== SM FEATURE SYSTEM =====
  const packageName = (customer?.package || "basic").toLowerCase();

  const SM_FEATURES = {
    basic: [
      "ping",
      "menu",
      "owner",
      "info",
      "rules",
      "help",
      "status",
      "admin",
      "faq_admin"
    ],
    premium: [
      "ping",
      "menu",
      "owner",
      "info",
      "rules",
      "help",
      "status",
      "admin",
      "faq_admin",
      "botadmin",
      "panel",
      "antiLink",
      "antiToxic",
      "antiSpam",
      "welcome",
      "reminder",
      "stats",
      "log",
      "jam",
      "join",
      "leave",
      "autoReason",
      "music"
    ]
  };

  function hasFeature(feature) {
    return (SM_FEATURES[packageName] || SM_FEATURES.basic)
      .includes(feature);
  }

  console.log("SM PACKAGE:", packageName);
  console.log(
    "SM FEATURES:",
    (SM_FEATURES[packageName] || SM_FEATURES.basic).join(", ")
  );

const { version } = await fetchLatestWaWebVersion();
console.log("VERSI WA WEB:", version.join("."));

  const { state, saveCreds } =
    await useMultiFileAuthState(process.env.DEV_SESSION_DIR || `./development-sessions/${customerId}`);

const sock = makeWASocket({
  version,
  auth: state,
  browser: Browsers.macOS("Chrome"),
  markOnlineOnConnect: true,
  logger: pino({ level: "silent" })
});

  sock.ev.on("creds.update", saveCreds);

let pairingRequested = false;

sock.ev.on("connection.update", async ({ connection, lastDisconnect, qr }) => {

  if (
    !state.creds.registered &&
    !pairingRequested &&
    (connection === "connecting" || qr)
  ) {
    pairingRequested = true;

    const pairingNumber = process.env.DEV_PAIRING_NUMBER;

    if (!pairingNumber) {
      console.log("⚠️ DEV_PAIRING_NUMBER belum diisi.");
      console.log("Contoh: DEV_PAIRING_NUMBER=628xxxx node bot.development.js \"customer 002\"");
    } else {
      try {
        console.log("MEMINTA PAIRING CODE DEVELOPMENT...");
        const code = await sock.requestPairingCode(pairingNumber);

        console.log("================================");
        console.log("PAIRING CODE DEVELOPMENT:", code);
        console.log("================================");
      } catch (error) {
        console.log("ERROR PAIRING DEVELOPMENT:", error.message);
        pairingRequested = false;
      }
    }
  }
  console.log("KONEKSI:", connection);

  if (lastDisconnect) {
    console.log(
      "ERROR:",
      JSON.stringify(lastDisconnect.error, null, 2)
    );
  }

    if (connection === "open") {
      console.log("BOT TERHUBUNG 🟢");
      console.log("DEBUG IDENTITAS BOT:", sock.user?.id, sock.user?.lid);
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

  async function getParticipantName(jid, participantId) {
    const metadata = await sock.groupMetadata(jid);

    const participant = metadata.participants.find(
      p => p.id === participantId
    );

    return participant?.name || participant?.notify || participant?.verifiedName || "";
  }

  let openHour = 7;
  let closeHour = 23;
  const warningsFile = "./warnings.json";
  const warnings = fs.existsSync(warningsFile)
    ? JSON.parse(fs.readFileSync(warningsFile, "utf8"))
    : {};

  const warningTimesFile = "./warning-times.json";
  const warningTimes = fs.existsSync(warningTimesFile)
    ? JSON.parse(fs.readFileSync(warningTimesFile, "utf8"))
    : {};

  function saveWarnings() {
    fs.writeFileSync(
      warningsFile,
      JSON.stringify(warnings, null, 2)
    );

    fs.writeFileSync(
      warningTimesFile,
      JSON.stringify(warningTimes, null, 2)
    );
  }

  function addWarning(sender) {
    const now = Date.now();
    const lastWarning = warningTimes[sender] || 0;

    if (lastWarning && now - lastWarning >= 24 * 60 * 60 * 1000) {
      warnings[sender] = 0;
    }

    warnings[sender] = (warnings[sender] || 0) + 1;
    warningTimes[sender] = now;

    saveWarnings();
    return warnings[sender];
  }

  function clearWarning(sender) {
    delete warnings[sender];
    delete warningTimes[sender];
    saveWarnings();
  }
  const spamTracker = {};

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

  async function isBotAdmin(jid) {
    if (!jid.endsWith("@g.us")) return false;

    const metadata = await sock.groupMetadata(jid);

    function normalizeJid(id) {
      if (!id) return "";
      return id.replace(/:\d+(?=@)/, "");
    }

    const botIds = [
      sock.user?.id,
      sock.user?.lid,
      state.creds?.me?.id,
      state.creds?.me?.lid
    ]
      .filter(Boolean)
      .map(normalizeJid);

    const botParticipant = metadata.participants.find(
      p => botIds.includes(normalizeJid(p.id))
    );

    return !!botParticipant &&
      (
        botParticipant.admin === "admin" ||
        botParticipant.admin === "superadmin"
      );
  }

  sock.ev.on("messages.update", async (updates) => {
  for (const update of updates) {
    if (update.key?.fromMe) {
      console.log(
        "DEBUG MESSAGE UPDATE:",
        JSON.stringify(update, null, 2)
      );
    }
  }
});

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

      // TEST INTERACTIVE MESSAGE
      if (text.trim().toLowerCase() === "!testinteractive") {
        try {
          const interactiveMessage = WAProto.Message.fromObject({
            interactiveMessage: {
              body: {
                text: "🎵 TEST INTERACTIVE KING BOT"
              },
              footer: {
                text: "Pilih salah satu:"
              },
              nativeFlowMessage: {
                buttons: [
                  {
                    name: "quick_reply",
                    buttonParamsJson: JSON.stringify({
                      display_text: "🎵 Lagu Pertama",
                      id: "interactive_test_1"
                    })
                  },
                  {
                    name: "quick_reply",
                    buttonParamsJson: JSON.stringify({
                      display_text: "🎵 Lagu Kedua",
                      id: "interactive_test_2"
                    })
                  }
                ]
              }
            }
          });

          const interactiveGenerated = generateWAMessageFromContent(
            jid,
            interactiveMessage,
            {
              userJid: sock.user?.id,
              messageId: generateMessageIDV2(sock.user?.id)
            }
          );

          await sock.relayMessage(
            jid,
            interactiveGenerated.message,
            {
              messageId: interactiveGenerated.key.id
            }
          );

          console.log("TEST INTERACTIVE: RELAY SELESAI");
        } catch (error) {
          console.error("TEST INTERACTIVE ERROR:", error);
        }

        continue;
      }

      // TEST LIST MESSAGE
      if (text.trim().toLowerCase() === "!testlist") {
        try {
          const testList = WAProto.Message.ListMessage.fromObject({
            title: "🎵 TEST KING BOT",
            description: "Tes menu pilihan",
            buttonText: "PILIH",
            footerText: "KING BOT",
            sections: [
              {
                title: "Pilihan",
                rows: [
                  {
                    title: "Lagu Pertama",
                    description: "Tes pilihan nomor satu",
                    rowId: "test_1"
                  },
                  {
                    title: "Lagu Kedua",
                    description: "Tes pilihan nomor dua",
                    rowId: "test_2"
                  }
                ]
              }
            ]
          });

          const testMessage = WAProto.Message.fromObject({
            listMessage: testList
          });

          const testGenerated = generateWAMessageFromContent(
            jid,
            testMessage,
            {
              userJid: sock.user?.id,
              messageId: generateMessageIDV2(sock.user?.id)
            }
          );

          await sock.relayMessage(
            jid,
            testGenerated.message,
            {
              messageId: testGenerated.key.id
            }
          );

          console.log("TEST LIST: RELAY SELESAI");
        } catch (error) {
          console.error("TEST LIST ERROR:", error);
        }

        continue;
      }

      // MUSIC UI TEST — TEMPLATE BUTTONS
      if (text.trim().toLowerCase() === "!testtap") {
        try {
          const testSongs = await searchSongs("faded");
          const testCover = testSongs[0]?.artwork || null;

          if (!testCover) {
            throw new Error("Cover lagu untuk UI test tidak tersedia");
          }

          await sock.sendMessage(jid, {
            image: {
              url: testCover
            },
            caption:
              "👑 KING BOT\n\n" +
              "🎵 CARI LAGU\n\n" +
              "▶️ MUSIC PLAYER\n\n" +
              "Pilih lagu yang ingin kamu buka:",
            footer: "KING BOT MUSIC",
            templateButtons: [
              {
                index: 1,
                quickReplyButton: {
                  displayText: "🎵 Faded",
                  id: "song_select_0"
                }
              },
              {
                index: 2,
                quickReplyButton: {
                  displayText: "🎵 Alone",
                  id: "song_select_1"
                }
              },
              {
                index: 3,
                quickReplyButton: {
                  displayText: "🎵 The Spectre",
                  id: "song_select_2"
                }
              }
            ]
          });

          console.log("DEBUG MUSIC UI TEST: TERKIRIM");
        } catch (uiError) {
          console.error("DEBUG MUSIC UI TEST ERROR:", uiError);
        }

        continue;
      }

      // MUSIC SEARCH — !lagu <judul>
      if (hasFeature("music") && text.trim().toLowerCase().startsWith("!lagu ")) {
        const query = text.trim().slice(6).trim();

        if (!query) {
          await sock.sendMessage(jid, {
            text: "🎵 Contoh: !lagu alan walker"
          });
          continue;
        }

        try {
          console.log("DEBUG MUSIC: SEARCH MULAI:", query);
          const songs = await searchSongs(query);
          console.log("DEBUG MUSIC: SEARCH SELESAI:", songs.length);

          if (!songs.length) {
            await sock.sendMessage(jid, {
              text: `🎵 Tidak menemukan lagu untuk: "${query}"`
            });
            continue;
          }

          songSelections.set(jid, songs);

          const musicPlayerUrl =
            `${MUSIC_PLAYER_PUBLIC_URL}/?q=${encodeURIComponent(query)}`;

          const spotifySearchUrl =
            `https://open.spotify.com/search/${encodeURIComponent(query)}`;

          await sock.sendMessage(jid, {
            text:
              "╭━━━━━━━━━━━━━━━━━━━━━━╮\n" +
              "│   👑 KING BOT MUSIC  │\n" +
              "╰━━━━━━━━━━━━━━━━━━━━━━╯\n\n" +
              "🎵 *HASIL PENCARIAN*\n" +
              `🔎 ${query}\n\n` +
              "🎧 *KING BOT Music Player*\n" +
              "Pilih dan putar lagu langsung di Music Player.\n" +
              "🔗 " + musicPlayerUrl + "\n\n" +
              "🎵 *SPOTIFY*\n" +
              "Cari lagu ini langsung di Spotify:\n" +
              "🔗 " + spotifySearchUrl + "\n\n" +
              "━━━━━━━━━━━━━━━━━━━━━━\n" +
              "👑 KING BOT • MUSIC"
          });

          console.log("DEBUG MUSIC: LINK MUSIC PLAYER TERKIRIM:", musicPlayerUrl);

          continue;

          const rows = songs.map((song, index) => ({
            title: song.title,
            description: `${song.artist} • ⏱️ ${song.duration}`,
            rowId: `song_select_${index}`
          }));

          console.log("DEBUG MUSIC: MENYIAPKAN HASIL TEKS");

          const resultText = [
            "🎵 HASIL PENCARIAN LAGU",
            "",
            `🔎 "${query}"`,
            "",
            ...songs.map((song, index) =>
              `${index + 1}. ${song.title}\n` +
              `   👤 ${song.artist}\n` +
              `   💿 ${song.album}\n` +
              `   ⏱️ ${song.duration}`
            ),
            "",
            "👑 KING BOT"
          ].join("\n");

          await sock.sendMessage(jid, {
            text: resultText
          });

          console.log("DEBUG MUSIC: HASIL TEKS TERKIRIM");

            // MUSIC TAP MENU — Native Flow via WAProto
            try {
              const tapRows = songs.map((song, index) => ({
                title: song.title,
                description: `${song.artist} • ⏱️ ${song.duration}`,
                id: `song_select_${index}`
              }));

              const nativeButton =
                WAProto.Message.InteractiveMessage.NativeFlowMessage.NativeFlowButton.fromObject({
                  name: "single_select",
                  buttonParamsJson: JSON.stringify({
                    title: "🎵 PILIH LAGU",
                    sections: [
                      {
                        title: `Hasil untuk "${query}"`,
                        rows: tapRows
                      }
                    ]
                  })
                });

              const interactiveMessage =
                WAProto.Message.InteractiveMessage.fromObject({
                  body: {
                    text: `🎵 PILIH LAGU\n\n🔎 "${query}"`
                  },
                  footer: {
                    text: "👑 KING BOT"
                  },
                  nativeFlowMessage: {
                    buttons: [nativeButton]
                  }
                });

              const generated = generateWAMessageFromContent(
                jid,
                {
                  viewOnceMessage: {
                    message: {
                      interactiveMessage
                    }
                  }
                },
                {
                  userJid: sock.user?.id || jid
                }
              );

              await sock.relayMessage(
                jid,
                generated.message,
                {
                  messageId: generated.key.id
                }
              );

              console.log("DEBUG MUSIC: TAP MENU TERKIRIM");
            } catch (tapError) {
              console.error("DEBUG MUSIC: TAP MENU GAGAL:", tapError);
            }

        } catch (error) {
          console.error("MUSIC ERROR:", error);
          await sock.sendMessage(jid, {
            text: "❌ Gagal mencari lagu. Coba lagi nanti."
          });
        }

        continue;
      }

      // MUSIC SELECTION — respons Native Flow / daftar lagu
      let selectedSongId =
        msg.message?.listResponseMessage?.singleSelectReply?.selectedRowId || "";

      if (!selectedSongId) {
        const paramsJson =
          msg.message?.interactiveResponseMessage
            ?.nativeFlowResponseMessage
            ?.paramsJson || "";

        if (paramsJson) {
          try {
            const params = JSON.parse(paramsJson);
            selectedSongId =
              params.id ||
              params.selectedId ||
              params.rowId ||
              params.selectedRowId ||
              "";
          } catch (responseError) {
            console.error("MUSIC RESPONSE PARSE ERROR:", responseError);
          }
        }
      }
      if (selectedSongId.startsWith("song_select_")) {
        const songs = songSelections.get(jid) || [];
        const index = Number(selectedSongId.replace("song_select_", ""));
        const song = songs[index];

        if (!song) {
          await sock.sendMessage(jid, {
            text: "❌ Pilihan lagu sudah tidak tersedia. Silakan cari lagi dengan !lagu."
          });
          continue;
        }

        let detail =
          "🎵 *DETAIL LAGU*\\n\\n" +
          `🎧 ${song.title} — ${song.artist}\\n` +
          `💿 Album: ${song.album}\\n` +
          `⏱️ Durasi: ${song.duration}`;

        if (song.url) {
          detail += `\\n🔗 ${song.url}`;
        }

        await sock.sendMessage(jid, {
          text: detail
        });

        continue;
      }

      // AUTO STATUS DINAMIS v2 — ALASAN BEBAS + MENTION
if (hasFeature("autoReason") && jid.endsWith("@g.us")) {
  const statusText = text.trim();

  // Simpan aktivitas bebas:
  // contoh: "gw lagi ngoding" -> "ngoding"
  //        "aku sedang di rumah" -> "di rumah"
  //        "saya mau makan" -> "makan"
  const statusMatch = statusText.match(
    /^(gw|gua|gue|aku|saya)\s+(?:lagi|sedang|mau)\s+(.+)$/i
  );

  if (statusMatch) {
    let activity = statusMatch[2].trim();

    if (
      activity &&
      activity.length <= 80 &&
      !/^(gw|gua|gue|aku|saya|bot)$/i.test(activity)
    ) {
      let person = await getParticipantName(jid, sender);

      if (!person || /^(gw|gua|gue|aku|saya)$/i.test(person.trim())) {
        person = msg.pushName?.trim() || "";
      }

      if (person && !/^(gw|gua|gue|aku|saya|bot)$/i.test(person)) {
        autoStatus.setStatus(person, activity);

        console.log(
          `AUTO STATUS TERSIMPAN: ${person} -> ${activity}`
        );
      }
    }
  }

  // Pertanyaan biasa:
  // "Joko mana?" / "Joko dimana?" / "Joko di mana?"
  const askStatus = statusText.match(
    /^(.+?)\s+(?:mana|dimana|di mana)\??$/i
  );

  if (askStatus) {
    const person = askStatus[1].trim();
    const data = autoStatus.getStatus(person);

    if (data) {
      await sock.sendMessage(jid, {
        text: `👑 ${data.name} sedang ${data.activity}.`
      });
      continue;
    }
  }

  // Mention/tag asli WhatsApp — FIX JID/LID
  const mentionedJid =
    msg.message?.extendedTextMessage?.contextInfo?.mentionedJid ||
    msg.message?.contextInfo?.mentionedJid ||
    [];

  if (mentionedJid.length > 0) {
    console.log("AUTO REASON MENTION:", mentionedJid);

    try {
      const metadata = await sock.groupMetadata(jid);

      for (const mentioned of mentionedJid) {
        const normalizeJid = value =>
          String(value || "").replace(/:\d+(?=@)/, "");

        const targetJid = normalizeJid(mentioned);

        const participant = metadata.participants.find(
          p => normalizeJid(p.id) === targetJid
        );

        const mentionedName =
          participant?.name ||
          participant?.notify ||
          participant?.verifiedName ||
          "";

        console.log(
          `AUTO REASON TARGET: ${mentioned} -> ${mentionedName || "nama tidak ditemukan"}`
        );

        const data =
          autoStatus.getStatus(mentionedName) ||
          autoStatus.getStatus(targetJid);

        if (data) {
          await sock.sendMessage(
            jid,
            {
              text: `👑 ${data.name} sedang ${data.activity}.`,
              mentions: [mentioned]
            },
            {
              quoted: msg
            }
          );

          console.log(
            `AUTO REASON BALAS: ${data.name} -> ${data.activity}`
          );

          break;
        }
      }
    } catch (error) {
      console.log("AUTO REASON MENTION ERROR:", error.message);
    }
  }
}

// AUTO FAQ — PERTANYAAN ADMIN
      const faqText = text.trim().toLowerCase();
      const adminFaq =
        /\b(admin|adminnya|admin dimana|admin di mana|cari admin|ada admin)\b/i.test(faqText);

      if (hasFeature("faq_admin") && adminFaq && jid.endsWith("@g.us")) {
        await sock.sendMessage(jid, {
          text: "👑 Admin sedang tidur. Silakan hubungi lagi nanti."
        });
        continue;
      }

      if (hasFeature("botadmin") && text.trim().toLowerCase() === "!botadmin") {
        if (!jid.endsWith("@g.us")) {
          await sock.sendMessage(jid, {
            text: "ℹ️ Perintah ini hanya bisa dipakai di grup."
          });
          continue;
        }

        try {
          const metadata = await sock.groupMetadata(jid);
          const botLid = sock.user?.lid?.split(":")[0] + "@lid";

          const botParticipant = metadata.participants.find(
            p => p.id === botLid ||
                 p.id.split(":")[0] === botLid.split(":")[0]
          );

          console.log("SOCK USER:", JSON.stringify(sock.user, null, 2));
          console.log(
            "SEMUA PARTICIPANT:",
            metadata.participants.map(p => ({
              id: p.id,
              admin: p.admin
            }))
          );

          const botAdmin =
            botParticipant &&
            (botParticipant.admin === "admin" ||
             botParticipant.admin === "superadmin");

          await sock.sendMessage(jid, {
            text: botAdmin
              ? "👑 Bot adalah ADMIN grup."
              : "❌ Bot bukan ADMIN grup."
          });
        } catch (error) {
          console.log("ERROR BOTADMIN:", error.message);

          await sock.sendMessage(jid, {
            text: "⚠️ Gagal mengecek status admin bot."
          });
        }

        continue;
      }

stats.messages++;
logActivity("MESSAGE", `${sender}: ${text}`);

const groupInviteLink =
  /https?:\/\/(chat\.whatsapp\.com|whatsapp\.com\/invite)\/[^\s]+/i.test(text);

if (hasFeature("antiLink") && groupInviteLink && jid.endsWith("@g.us")) {
  stats.links++;
  logActivity("GROUP_LINK", `${sender}: ${text}`);

  try {
    await sock.sendMessage(jid, {
      delete: msg.key
    });
  } catch (error) {
    console.log("GAGAL HAPUS LINK GRUP:", error.message);
  }

  await sock.sendMessage(jid, {
    text: "🚫 Link undangan grup WhatsApp tidak diperbolehkan."
  });

  continue;
}

const mentionedJid =
  msg.message.extendedTextMessage?.contextInfo?.mentionedJid || [];

const botLid = sock.user?.lid?.split(":")[0] + "@lid";

const mentionedBot = mentionedJid.some(
  id => id === botLid || id.split(":")[0] === botLid.split(":")[0]
);

if (jid.endsWith("@g.us") && mentionedBot) {
  const senderIsAdmin = await isGroupAdmin(jid, sender);

  if (!senderIsAdmin) {
    addWarning(sender);

    logActivity(
      "BOT_RULE",
      `${sender}: mention bot (${warnings[sender]}/5)`
    );

    await sock.sendMessage(jid, {
      text:
        `⚠️ @${sender.split("@")[0]} jangan chat atau mention bot.\n` +
        `📛 Pelanggaran: ${warnings[sender]}/5`,
      mentions: [sender]
    });

    continue;
  }
}

const badWords = JSON.parse(fs.readFileSync("./badwords.json", "utf8"));

function containsToxic(text) {
  return badWords.some(word => {
    const escaped = word.trim().replace(/[.*+?^${}()|[]\]/g, "\\$&");
    if (!escaped) return false;
    return new RegExp(`\\b${escaped}\\b`, "i").test(text);
  });
}

const lowerText = text.toLowerCase();

if (
  jid.endsWith("@g.us") &&
    containsToxic(lowerText)
) {
  stats.toxic++;
  addWarning(sender);

  logActivity(
    "PELANGGARAN",
    `${sender}: toxic (${warnings[sender]}/5)`
  );

  try {
    await sock.sendMessage(jid, {
      delete: msg.key
    });
  } catch (error) {
    console.log("GAGAL HAPUS TOXIC:", error.message);
  }

  await sock.sendMessage(jid, {
    text:
      `⚠️ @${sender.split("@")[0]} melakukan pelanggaran kata kasar.\\n` +
      `📛 Pelanggaran: ${warnings[sender]}/5`,
    mentions: [sender]
  });

  if (warnings[sender] >= 5) {
    try {
      const botAdmin = await isBotAdmin(jid);

      if (botAdmin) {
        await sock.groupParticipantsUpdate(
          jid,
          [sender],
          "remove"
        );

        await sock.sendMessage(jid, {
          text:
            `🚫 @${sender.split("@")[0]} dikeluarkan karena mencapai 5 pelanggaran.`,
          mentions: [sender]
        });

        clearWarning(sender);
      } else {
        await sock.sendMessage(jid, {
          text: "⚠️ Bot bukan admin, jadi tidak bisa mengeluarkan anggota."
        });
      }
    } catch (error) {
      console.log("GAGAL KICK:", error.message);

      await sock.sendMessage(jid, {
        text: "⚠️ Gagal mengeluarkan anggota. Pastikan bot adalah admin grup."
      });
    }
  }

  continue;
}

const nowMs = Date.now();
const spamKey = `${jid}:${sender}`;

if (!spamTracker[spamKey]) {
  spamTracker[spamKey] = {
    text: lowerText,
    count: 1,
    time: nowMs
  };
} else if (
  spamTracker[spamKey].text === lowerText &&
  nowMs - spamTracker[spamKey].time <= 10000
) {
  spamTracker[spamKey].count++;
  spamTracker[spamKey].time = nowMs;
} else {
  spamTracker[spamKey] = {
    text: lowerText,
    count: 1,
    time: nowMs
  };
}

if (
  jid.endsWith("@g.us") &&
  (
    text.length > 500 ||
    spamTracker[spamKey].count >= 3
  )
) {
  stats.spam++;
  addWarning(sender);

  logActivity(
    "PELANGGARAN",
    `${sender}: spam (${warnings[sender]}/5)`
  );

  try {
    await sock.sendMessage(jid, {
      delete: msg.key
    });
  } catch (error) {
    console.log("GAGAL HAPUS SPAM:", error.message);
  }

  await sock.sendMessage(jid, {
    text:
      `🚨 @${sender.split("@")[0]} terdeteksi spam.\\n` +
      `📛 Pelanggaran: ${warnings[sender]}/5`,
    mentions: [sender]
  });

  if (warnings[sender] >= 5) {
    try {
      const botAdmin = await isBotAdmin(jid);

      if (botAdmin) {
        await sock.groupParticipantsUpdate(
          jid,
          [sender],
          "remove"
        );

        await sock.sendMessage(jid, {
          text:
            `🚫 @${sender.split("@")[0]} dikeluarkan karena mencapai 5 pelanggaran.`,
          mentions: [sender]
        });

        clearWarning(sender);
      } else {
        await sock.sendMessage(jid, {
          text: "⚠️ Bot bukan admin, jadi tidak bisa mengeluarkan anggota."
        });
      }
    } catch (error) {
      console.log("GAGAL KICK:", error.message);

      await sock.sendMessage(jid, {
        text: "⚠️ Gagal mengeluarkan anggota. Pastikan bot adalah admin grup."
      });
    }
  }

  continue;
}


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

if (hasFeature("stats") && text.trim().toLowerCase() === "!stats") {
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

if (text.trim().toLowerCase() === "!owner") {
  await sock.sendMessage(jid, {
    text: `╭━━━ 👑 KING BOT ━━━╮
┃     OWNER INFO     ┃
╰━━━━━━━━━━━━━━━━━━╯

👑 Owner : ${config.ownerName}
🤖 Bot   : KING BOT
🟢 Status: Aktif

📱 WhatsApp:
${config.ownerNumber}

🛠️ Bantuan:
Ketik !help

━━━━━━━━━━━━━━━━━━
Smart • Secure • Helpful`
  });

  continue;
}

if (text.trim().toLowerCase() === "!info") {
  const uptime = process.uptime();
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);

  await sock.sendMessage(jid, {
    text: `╭━━━ 🤖 KING BOT ━━━╮
┃      BOT INFO      ┃
╰━━━━━━━━━━━━━━━━━━╯

🟢 Status : ONLINE
⏱️ Uptime : ${hours}j ${minutes}m
💬 Pesan  : ${stats.messages}
⚡ Command: ${stats.commands}
👑 Admin  : Terdeteksi

🛡️ Smart • Secure • Helpful`
  });

  continue;
}

if (text.trim().toLowerCase() === "!rules") {
  if (!jid.endsWith("@g.us")) {
    await sock.sendMessage(jid, {
      text: "⚠️ !rules hanya bisa digunakan di grup."
    });
    continue;
  }

  try {
    const metadata = await sock.groupMetadata(jid);
    const description = metadata.desc?.trim() || "Belum ada deskripsi grup.";

    await sock.sendMessage(jid, {
      text: `╭━━━ 📜 GROUP RULES ━━━╮
┃       ${metadata.subject}
╰━━━━━━━━━━━━━━━━━━━━╯

${description}

🤖 ATURAN KING BOT
• 🚫 Jangan chat/mention/call bot.
• ⚠️ Pelanggaran berulang dapat mendapat peringatan.
• 👑 Admin grup mendapat pengecualian aturan bot.

🛡️ KING BOT
Smart • Secure • Helpful`
    });
  } catch (error) {
    console.log("GAGAL AMBIL RULES:", error.message);
    await sock.sendMessage(jid, {
      text: "⚠️ Gagal mengambil deskripsi grup."
    });
  }

  continue;
}

if (text.trim().toLowerCase() === "!help") {
  await sock.sendMessage(jid, {
    text:
`╭━━━ 🤖 KING BOT ━━━╮
┃     PUSAT BANTUAN
╰━━━━━━━━━━━━━━━━━━╯

📌 PERINTAH UMUM
• !menu — Buka menu utama
• !help — Tampilkan bantuan
• !ping — Cek respons bot
• !status — Cek status bot
• !config — Lihat konfigurasi
• !stats — Lihat statistik bot
• !log — Lihat activity log
• !admin — Cek informasi admin

🛡️ MODERASI
• !antitoxic on/off — Anti-toxic
• !antilink on/off — Anti-link
• !antispam on/off — Anti-spam
• !welcome on/off — Welcome member

⏰ REMINDER
• !ingatkan HH:MM Pesan
• !pengingat — Lihat pengingat
• !hapusingat N — Hapus pengingat (admin)

👑 ADMIN
• !panel — Panel kontrol admin
• !toxic Nama — Catat pelanggaran
• !jam buka — Atur jam buka
• !jam tutup — Atur jam tutup
• !join Nama — Simulasi/fitur join
• !leave Nama — Simulasi/fitur leave

🤖 AUTO FAQ
Tanyakan hal seperti:
• admin dimana
• admin ada?
• mana admin?
• admin online?

💡 Tips:
Gunakan !menu untuk melihat menu utama.
Gunakan !help kapan saja untuk melihat daftar perintah.

👑 KING BOT
Smart • Secure • Helpful`
  });

  continue;
}

if (hasFeature("log") && text.trim().toLowerCase() === "!log") {
  await sock.sendMessage(jid, {
    text: activityLog.length
      ? "📋 ACTIVITY LOG\n\n" + activityLog.slice(-20).join("\n")
      : "📋 Activity Log masih kosong."
  });

  continue;
}

if (text.trim().toLowerCase() === "!ping") {
  console.log("DEBUG PING: MASUK HANDLER");
  console.log("DEBUG PING JID:", jid);
  console.log("DEBUG PING FROM:", msg.key.remoteJid);
  const pingResult = await sock.sendMessage(jid, {
    text: "🏓 Pong!"
  });
  console.log("DEBUG PING RESULT:", JSON.stringify(pingResult, null, 2));
  console.log("DEBUG PING: SEND SELESAI");
  continue;
}

if (text.trim().toLowerCase() === "!status") {
  await sock.sendMessage(jid, {
    text: "🟢 KING BOT ONLINE"
  });
  continue;
}

if (hasFeature("panel") && text.trim().toLowerCase() === "!config") {
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

if (hasFeature("antiToxic") && text.trim().toLowerCase().startsWith("!toxic ")) {
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

if (hasFeature("reminder") && text.trim().toLowerCase().startsWith("!ingatkan ")) {
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

  const remindersFile = "./reminders.json";
  let reminders = [];

  try {
    reminders = JSON.parse(
      require("fs").readFileSync(remindersFile, "utf8")
    );
  } catch {
    reminders = [];
  }

  reminders.push({
    jid,
    time,
    message
  });

  require("fs").writeFileSync(
    remindersFile,
    JSON.stringify(reminders, null, 2)
  );

  await sock.sendMessage(jid, {
    text: `⏰ Pengingat dibuat untuk ${time}`
  });

  logActivity("REMINDER", `${time} - ${message}`);
  continue;
}

if (hasFeature("reminder") && text.trim().toLowerCase() === "!pengingat") {
  let reminders = [];

  try {
    reminders = JSON.parse(
      require("fs").readFileSync("./reminders.json", "utf8")
    );
  } catch {
    reminders = [];
  }

  if (reminders.length === 0) {
    await sock.sendMessage(jid, {
      text: "📭 Tidak ada pengingat."
    });
    continue;
  }

  const daftar = reminders.map((r, i) =>
    `${i + 1}. ⏰ ${r.time} — ${r.message}`
  ).join("\n");

  await sock.sendMessage(jid, {
    text: "📋 DAFTAR PENGINGAT\n\n" + daftar
  });

  continue;
}

if (hasFeature("reminder") && text.trim().toLowerCase().startsWith("!hapusingat ")) {
  const admin = await isGroupAdmin(jid, sender);

  if (!admin) {
    await sock.sendMessage(jid, {
      text: "🚫 Hanya ADMIN yang bisa menghapus pengingat."
    });
    continue;
  }

  const id = parseInt(
    text.trim().slice(12).trim(),
    10
  );

  let reminders = [];

  try {
    reminders = JSON.parse(
      require("fs").readFileSync("./reminders.json", "utf8")
    );
  } catch {
    reminders = [];
  }

  if (
    isNaN(id) ||
    id < 1 ||
    id > reminders.length
  ) {
    await sock.sendMessage(jid, {
      text: "❌ ID pengingat tidak valid."
    });
    continue;
  }

  const removed = reminders.splice(id - 1, 1)[0];

  require("fs").writeFileSync(
    "./reminders.json",
    JSON.stringify(reminders, null, 2)
  );

  await sock.sendMessage(jid, {
    text: `🗑️ Pengingat ${id} dihapus.`
  });

  logActivity(
    "REMINDER DELETE",
    `${removed.time} - ${removed.message}`
  );

  continue;
}

if (hasFeature("jam") && text.trim().toLowerCase().startsWith("!jam buka ")) {
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

if (hasFeature("jam") && text.trim().toLowerCase().startsWith("!jam tutup ")) {
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

if (hasFeature("join") && text.trim().toLowerCase().startsWith("!join ")) {
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

if (hasFeature("leave") && text.trim().toLowerCase().startsWith("!leave ")) {
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

if (hasFeature("panel") && text.trim().toLowerCase() === "!panel") {
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

if (hasFeature("welcome") && text.trim().toLowerCase() === "!welcome on") {
  await sock.sendMessage(jid, {
    text: "👋 Welcome: ON"
  });
  continue;
}

if (hasFeature("welcome") && text.trim().toLowerCase() === "!welcome off") {
  await sock.sendMessage(jid, {
    text: "👋 Welcome: OFF"
  });
  continue;
}

if (hasFeature("antiLink") && text.trim().toLowerCase() === "!antilink on") {
  await sock.sendMessage(jid, { text: "🔗 Anti-link: ON" });
  continue;
}

if (hasFeature("antiLink") && text.trim().toLowerCase() === "!antilink off") {
  await sock.sendMessage(jid, { text: "🔗 Anti-link: OFF" });
  continue;
}

if (hasFeature("antiToxic") && text.trim().toLowerCase() === "!antitoxic on") {
  await sock.sendMessage(jid, { text: "🛡️ Anti-toxic: ON" });
  continue;
}

if (hasFeature("antiToxic") && text.trim().toLowerCase() === "!antitoxic off") {
  await sock.sendMessage(jid, { text: "🛡️ Anti-toxic: OFF" });
  continue;
}

if (hasFeature("antiSpam") && text.trim().toLowerCase() === "!antispam on") {
  await sock.sendMessage(jid, { text: "🚫 Anti-spam: ON" });
  continue;
}

if (hasFeature("antiSpam") && text.trim().toLowerCase() === "!antispam off") {
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

const welcomeTracker = {};
sock.ev.on("group-participants.update", async (update) => {
  if (update.action !== "add") return;

  const jid = update.id;
  const now = Date.now();

  if (!welcomeTracker[jid]) {
    welcomeTracker[jid] = [];
  }

  welcomeTracker[jid] = welcomeTracker[jid].filter(
    time => now - time <= 30 * 60 * 1000
  );

  welcomeTracker[jid].push(now);

  // 5 atau lebih member masuk dalam 30 menit = tahan welcome
  if (welcomeTracker[jid].length >= 5) {
    console.log(
      `SMART WELCOME: ${welcomeTracker[jid].length} member masuk, welcome ditahan.`
    );

    stats.joins += update.participants.length;

    for (const participant of update.participants) {
      logActivity("WELCOME_BLOCKED", participant);
    }

    return;
  }

    for (const participant of update.participants) {
      let groupRules = "Belum ada deskripsi grup."; 
      try {
        const metadata = await sock.groupMetadata(jid);
        groupRules = metadata.desc?.trim() || groupRules;
      } catch (error) {
        console.log("GAGAL AMBIL RULES WELCOME:", error.message);
      }

      await sock.sendMessage(jid, {
        text: `👋 Halo @${participant.split("@")[0]}! 🥳
Selamat datang di grup!

📜 RULES GRUP
${groupRules}

🤖 ATURAN KING BOT
• 🚫 Jangan chat/mention/call bot.
• ⚠️ Pelanggaran berulang dapat mendapat peringatan.
• 👑 Admin mendapat pengecualian aturan bot.

🛡️ KING BOT siap membantu.`,
        mentions: [participant]
      });
    stats.joins++;
    logActivity("WELCOME", participant);
   }
 });
}

startBot();

// DEVELOPMENT MODE READY
