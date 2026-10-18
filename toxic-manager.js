const fs = require("fs");
const readline = require("readline");

const BADWORD_FILE = "./badwords.json";

function loadWords() {
  if (!fs.existsSync(BADWORD_FILE)) {
    fs.writeFileSync(BADWORD_FILE, "[]");
  }

  return JSON.parse(fs.readFileSync(BADWORD_FILE, "utf8"));
}

function saveWords(words) {
  fs.writeFileSync(
    BADWORD_FILE,
    JSON.stringify([...new Set(words)], null, 2)
  );
}

module.exports = function toxicManager() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  function menu() {
    const words = loadWords();

    console.log(`
╔══════════════════════╗
║ 🛡️ ANTI TOXIC MANAGER ║
╚══════════════════════╝

Jumlah kata : ${words.length}

1. Lihat kata kasar
2. Tambah kata
3. Hapus kata
4. Cari kata
5. Bersihkan duplikat
0. Kembali
`);

    rl.question("Pilih: ", answer => {

      if (answer === "0") {
        rl.close();
        return;
      }

      if (answer === "1") {
        console.log("\n📋 DAFTAR KATA:");
        words.forEach((w, i) => {
          console.log(`${i + 1}. ${w}`);
        });
        return menu();
      }

      if (answer === "2") {
        rl.question("Tambah kata: ", word => {

          if (!word.trim()) {
            console.log("❌ Kata kosong");
            return menu();
          }

          words.push(word.trim().toLowerCase());
          saveWords(words);

          console.log("✅ Kata berhasil ditambahkan");
          menu();
        });
        return;
      }

      if (answer === "3") {
        words.forEach((w, i)=>{
          console.log(`${i+1}. ${w}`);
        });

        rl.question("Nomor hapus: ", num => {
          const index = Number(num) - 1;

          if (words[index]) {
            const removed = words.splice(index,1);
            saveWords(words);
            console.log(`✅ ${removed[0]} dihapus`);
          }

          menu();
        });

        return;
      }

      if (answer === "4") {
        rl.question("Cari kata: ", q => {
          const result = words.filter(w =>
            w.includes(q.toLowerCase())
          );

          console.log(result.length
            ? result
            : "Tidak ditemukan"
          );

          menu();
        });

        return;
      }

      if (answer === "5") {
        saveWords(words);
        console.log("✅ Duplikat dibersihkan");
        menu();
        return;
      }

      console.log("Menu tidak tersedia");
      menu();

    });
  }

  menu();
};
