from pathlib import Path

file = Path("bot.development.js")
text = file.read_text()

old1 = '''text: `${group.members[participantJid].name || participantJid.split("@")[0]} sudah online.`,'''

new1 = '''text: `╭━━━『 🟢 MEMBER RETURN 』
┃
┃ 👤 Nama:
┃ ${group.members[participantJid].name || participantJid.split("@")[0]}
┃
┃ 🟢 Status:
┃ Online kembali
┃
┃ 🤖 KING BOT mendeteksi
┃ anggota sudah aktif lagi.
╰━━━━━━━━━━━━`,'''

old2 = '''text: `👤 *${presenceData.name || mentionedName || "Anggota"}*\n\n🟡 Status: Sedang ${presenceData.reason || "pergi"}\n📝 Alasan: ${presenceData.reason || "Tidak ada alasan"}\n⏰ Update: ${new Date(presenceData.updatedAt).toLocaleString("id-ID")}`,'''

new2 = '''text: `╭━━━『 👤 MEMBER STATUS 』
┃
┃ 👤 Nama:
┃ ${presenceData.name || mentionedName || "Anggota"}
┃
┃ 🔴 Status:
┃ Sedang pergi
┃
┃ 📝 Alasan:
┃ ${presenceData.reason || "Tidak ada alasan"}
┃
┃ ⏰ Update:
┃ ${new Date(presenceData.updatedAt).toLocaleString("id-ID")}
╰━━━━━━━━━━━━`,'''

changes = 0

for old, new in [(old1,new1),(old2,new2)]:
    if old in text:
        text = text.replace(old,new)
        changes += 1

if changes:
    file.write_text(text)
    print(f"BERHASIL: {changes} bagian Auto FAQ diperbarui")
else:
    print("TIDAK ADA PERUBAHAN")
