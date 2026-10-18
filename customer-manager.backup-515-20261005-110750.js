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

      const phoneNumber = customer.botNumber.replace(/\D/g, "");

      if (phoneNumber.length < 10) {
        console.log("❌ Nomor bot tidak valid.");
        rl.close();
        return;
      }

      try {
        fs.mkdirSync(SESSION_DIR, { recursive: true });

        const sessionPath =
          `${SESSION_DIR}/${customer.customerId}`;

        console.log("\nMENGAMBIL VERSI WA WEB...");

        const { version } =
          await fetchLatestWaWebVersion();

        console.log(
          "VERSI:",
          version.join(".")
        );

        const { state, saveCreds } =
          await useMultiFileAuthState(sessionPath);

        const sock = makeWASocket({
          version,
          browser: Browsers.macOS("Chrome"),
          auth: state,
          logger: pino({ level: "silent" })
        });

        sock.ev.on("creds.update", saveCreds);

        let pairingRequested = false;
        let sessionReset = false;

        sock.ev.on(
          "connection.update",
          async ({ connection, lastDisconnect }) => {

            console.log("KONEKSI:", connection);

            const statusCode =
              lastDisconnect?.error?.output?.statusCode;

            if (statusCode === 401 && !sessionReset) {
              sessionReset = true;

              console.log(
                "\n⚠️ SESSION CUSTOMER TIDAK VALID (401)."
              );

              const backupPath =
                `${sessionPath}.backup-401-${new Date()
                  .toISOString()
                  .replace(/[:.]/g, "-")}`;

              try {
                fs.cpSync(
                  sessionPath,
                  backupPath,
                  { recursive: true }
                );

                console.log(
                  "💾 BACKUP SESSION:",
                  backupPath
                );

                fs.rmSync(
                  sessionPath,
                  { recursive: true, force: true }
                );

                console.log(
                  "♻️ SESSION LAMA DIRESET."
                );
                console.log(
                  "🔐 Silakan jalankan Menu 8 sekali lagi untuk pairing baru."
                );
              } catch (error) {
                console.log(
                  "❌ GAGAL RESET SESSION:",
                  error.message
                );
              }

              return;
            }

            if (
              connection === "connecting" &&
              !pairingRequested &&
              !state.creds.registered
            ) {
              pairingRequested = true;

              try {
                console.log(
                  "MENUNGGU KONEKSI WA..."
                );

                await new Promise(resolve =>
                  setTimeout(resolve, 1500)
                );

                if (state.creds.registered) {
                  console.log(
                    "SESSION SUDAH TERDAFTAR."
                  );
                  return;
                }

                console.log(
                  "MEMINTA PAIRING CODE..."
                );

                const code =
                  await sock.requestPairingCode(
                    phoneNumber
                  );

                console.log(
                  "\n================================"
                );
                console.log(
                  "🔐 KODE PAIRING:",
                  code
                );
                console.log(
                  "================================"
                );
                console.log(
                  `👤 Customer: ${customer.customerId}`
                );
                console.log(
                  `📱 Nomor: ${customer.botNumber}`
                );
                console.log(
                  "\nMasukkan kode tersebut di WhatsApp."
                );
              } catch (error) {
                console.log(
                  "ERROR PAIRING:",
                  error.message
                );
              }
            }

            if (
              statusCode &&
              statusCode !== 401
            ) {
              console.log(
                "ERROR:",
                JSON.stringify(
                  lastDisconnect.error,
                  null,
                  2
                )
              );
            }

            if (connection === "open") {
              console.log(
                "BERHASIL TERHUBUNG 🟢"
              );
            }
          }
        );

      } catch (error) {
        console.log(
          "❌ GAGAL MEMULAI PAIRING:",
          error.message
        );
        rl.close();
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
