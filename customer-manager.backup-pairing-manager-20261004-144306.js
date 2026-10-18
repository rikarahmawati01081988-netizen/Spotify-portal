const fs = require("fs");
const readline = require("readline");
const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestWaWebVersion,
  Browsers
} = require("@whiskeysockets/baileys");
const pino = require("pino");

const CUSTOMER_DIR = "./customers";
const SESSION_DIR = "./customer-sessions";

function getCustomer(id) {
  const file = `${CUSTOMER_DIR}/${id}.json`;

  if (!fs.existsSync(file)) {
    return null;
  }

  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function saveCustomer(customer) {
  const file = `${CUSTOMER_DIR}/${customer.customerId}.json`;

  fs.copyFileSync(
    file,
    `${file}.backup-${new Date().toISOString().replace(/[:.]/g, "-")}`
  );

  fs.writeFileSync(
    file,
    JSON.stringify(customer, null, 2)
  );
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log(`
╔══════════════════════════╗
║     👑 KING BOT MANAGER  ║
╚══════════════════════════╝

1. Lihat customer
2. Ganti paket
3. Ganti nomor bot
4. Aktifkan customer
5. Nonaktifkan customer
6. Keluar
7. Tambah customer
8. Hubungkan WhatsApp
`);

rl.question("Pilih menu: ", choice => {
  if (choice === "6") {
    rl.close();
    return;
  }

  if (choice === "7") {
    rl.question("ID customer baru: ", id => {
      rl.question("Nama customer: ", name => {
        rl.question("Nomor bot: ", botNumber => {
          rl.question("Paket (basic/premium): ", pkg => {

            if (pkg !== "basic" && pkg !== "premium") {
              console.log("❌ Paket harus basic atau premium.");
              rl.close();
              return;
            }

            const file = `${CUSTOMER_DIR}/${id}.json`;

            if (fs.existsSync(file)) {
              console.log("❌ Customer tersebut sudah ada.");
              rl.close();
              return;
            }

            const customer = {
              customerId: id.trim(),
              name: name.trim(),
              botNumber: botNumber.trim(),
              package: pkg,
              active: true,
              startDate: new Date().toISOString().slice(0, 10),
              endDate: ""
            };

            fs.writeFileSync(
              file,
              JSON.stringify(customer, null, 2)
            );

            console.log(`✅ Customer ${id} berhasil dibuat.`);
            console.log(`📦 Paket: ${pkg.toUpperCase()}`);
            console.log(`📱 Nomor: ${botNumber}`);

            rl.close();
          });
        });
      });
    });
    return;
  }

  if (choice === "8") {
    rl.question("ID customer: ", async id => {
      const customer = getCustomer(id);

      if (!customer) {
        console.log("❌ Customer tidak ditemukan.");
        rl.close();
        return;
      }

      if (!customer.botNumber) {
        console.log("❌ Nomor bot belum tersedia.");
        rl.close();
        return;
      }

      const phoneNumber = customer.botNumber.replace(/\\D/g, "");

      if (!phoneNumber || phoneNumber.length < 10) {
        console.log("❌ Nomor bot tidak valid.");
        rl.close();
        return;
      }

      try {
        const fs = require("fs");
        fs.mkdirSync(SESSION_DIR, { recursive: true });

        const sessionPath = `${SESSION_DIR}/${customer.customerId}`;
        const { state, saveCreds } =
          await useMultiFileAuthState(sessionPath);

        const { version } = await fetchLatestWaWebVersion();

        const sock = makeWASocket({
          version,
          auth: state,
          browser: Browsers.macOS("Chrome"),
          logger: pino({ level: "silent" }),
          markOnlineOnConnect: false
        });

        sock.ev.on("creds.update", saveCreds);

        console.log("\n⏳ Meminta kode pairing WhatsApp...");
        const code = await sock.requestPairingCode(phoneNumber);

        console.log("\n╔══════════════════════════╗");
        console.log("║   🔐 KODE PAIRING WA     ║");
        console.log("╚══════════════════════════╝");
        console.log(`Customer : ${customer.customerId}`);
        console.log(`Nomor    : ${customer.botNumber}`);
        console.log(`Kode     : ${code}`);
        console.log("\nMasukkan kode tersebut di WhatsApp pada");
        console.log("Perangkat tertaut → Tautkan dengan nomor telepon.");

        sock.ev.on("connection.update", ({ connection }) => {
          if (connection === "open") {
            console.log("\n🟢 WhatsApp berhasil terhubung!");
          }
        });

      } catch (error) {
        console.log("❌ Gagal membuat pairing:", error.message);
      }
    });
    return;
  }

  rl.question("ID customer: ", id => {
    const customer = getCustomer(id);

    if (!customer) {
      console.log("❌ Customer tidak ditemukan.");
      rl.close();
      return;
    }

    if (choice === "1") {
      console.log("\n👤 CUSTOMER");
      console.log(JSON.stringify(customer, null, 2));
      rl.close();
      return;
    }

    if (choice === "2") {
      rl.question("Paket (basic/premium): ", pkg => {
        if (pkg !== "basic" && pkg !== "premium") {
          console.log("❌ Paket harus basic atau premium.");
          rl.close();
          return;
        }

        customer.package = pkg;
        saveCustomer(customer);

        console.log(`✅ Paket ${id} sekarang ${pkg.toUpperCase()}`);
        rl.close();
      });
      return;
    }

    if (choice === "3") {
      rl.question("Nomor bot baru: ", number => {
        customer.botNumber = number.trim();
        saveCustomer(customer);

        console.log("✅ Nomor bot berhasil disimpan.");
        rl.close();
      });
      return;
    }

    if (choice === "4" || choice === "5") {
      customer.active = choice === "4";
      saveCustomer(customer);

      console.log(
        customer.active
          ? "🟢 Customer diaktifkan."
          : "🔴 Customer dinonaktifkan."
      );

      rl.close();
      return;
    }

    console.log("❌ Menu tidak dikenal.");
    rl.close();
  });
});
