const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestWaWebVersion,
  Browsers,
  DisconnectReason
} = require("@whiskeysockets/baileys");

const pino = require("pino");
const fs = require("fs");

const customerId = process.argv[2];

if (!customerId) {
  console.log("❌ Contoh: node customer-worker.js \"customer 002\"");
  process.exit(1);
}


const customerFile = `./customers/${customerId}.json`;

if (!fs.existsSync(customerFile)) {
  console.log(`❌ Data customer tidak ditemukan: ${customerFile}`);
  process.exit(1);
}

const customer = JSON.parse(
  fs.readFileSync(customerFile, "utf8")
);

if (customer.active !== true) {
  console.log("🔴 CUSTOMER NONAKTIF.");
  process.exit(0);
}

if (customer.endDate) {
  const today = new Date();
  const todayDate = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  const end = new Date(customer.endDate + "T23:59:59");

  if (todayDate > end) {
    console.log(`⏰ MASA AKTIF HABIS: ${customer.endDate}`);
    process.exit(0);
  }

  console.log(`📅 MASA AKTIF SAMPAI: ${customer.endDate}`);
}

const sessionPath = `./customer-sessions/${customerId}`;

if (!fs.existsSync(sessionPath)) {
  console.log(`❌ Session tidak ditemukan: ${sessionPath}`);
  process.exit(1);
}

let restarting = false;

async function startCustomerBot() {
  console.log(`\n👤 CUSTOMER: ${customerId}`);
  console.log("🔄 Menghubungkan session...");

  const { version } = await fetchLatestWaWebVersion();

  const { state, saveCreds } =
    await useMultiFileAuthState(sessionPath);

  if (!state.creds.registered) {
    console.log("❌ Session belum terdaftar.");
    console.log("Gunakan menu 8 di customer-manager.js terlebih dahulu.");
    process.exit(1);
  }

  const sock = makeWASocket({
    version,
    browser: Browsers.macOS("Chrome"),
    auth: state,
    logger: pino({ level: "silent" })
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("messages.upsert", async ({ messages }) => {
    for (const msg of messages) {
      if (!msg?.message) continue;
      if (msg.key?.fromMe) continue;

      const text =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        "";

      // AUTO FAQ — PERTANYAAN ADMIN
      const faqText = text.trim().toLowerCase();
      const adminFaq =
        /\b(admin|adminnya|admin dimana|admin di mana|cari admin|ada admin)\b/i.test(faqText);

      if (adminFaq && msg.key.remoteJid.endsWith("@g.us")) {
        await sock.sendMessage(
          msg.key.remoteJid,
          { text: "👑 Admin sedang tidur. Silakan hubungi lagi nanti." }
        );
        continue;
      }

      if (text.trim().toLowerCase() === "ping") {
        await sock.sendMessage(
          msg.key.remoteJid,
          { text: "pong 🟢" }
        );
      }
    }
  });

  sock.ev.on(
    "connection.update",
    async ({ connection, lastDisconnect }) => {
      console.log("KONEKSI:", connection);

      if (connection === "open") {
        console.log(`🤖 CUSTOMER BOT AKTIF: ${customerId} 🟢`);
      }

      if (connection === "close") {
        const statusCode =
          lastDisconnect?.error?.output?.statusCode;

        console.log("DISCONNECT CODE:", statusCode ?? "unknown");

        if (
          statusCode === DisconnectReason.loggedOut ||
          statusCode === 401
        ) {
          console.log("❌ Session customer logout/unauthorized.");
          return;
        }

        if (!restarting) {
          restarting = true;

          if (statusCode === DisconnectReason.restartRequired) {
            console.log("🔄 515: restart socket dengan session baru...");
          } else {
            console.log("🔄 Session terputus. Restart 3 detik lagi...");
          }

          const delay = statusCode === DisconnectReason.restartRequired ? 0 : 3000;

          setTimeout(() => {
            restarting = false;
            startCustomerBot().catch(err =>
              console.log("ERROR RESTART:", err.message)
            );
          }, delay);
        }
      }
    }
  );
}

startCustomerBot().catch(err => {
  console.log("❌ ERROR CUSTOMER WORKER:", err.message);
});
