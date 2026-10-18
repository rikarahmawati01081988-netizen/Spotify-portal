// --- MODULE KING MARKET ---
const fs = require('fs');

const marketData = {
    products: [
        { id: 'am', name: 'Alight Motion Pro', price: 10000, stock: 5 },
        { id: 'cc', name: 'CapCut Pro', price: 15000, stock: 3 },
        { id: 'nf', name: 'Netflix Premium 1 Bulan', price: 35000, stock: 2 }
    ]
};

function getCatalog() {
    let text = "🛒 *KING MARKET - DIGITAL STORE* 🛒\n\n";
    marketData.products.forEach(p => {
        text += `• *${p.name}* (${p.id})\n  Harga: Rp${p.price.toLocaleString('id-ID')}\n  Stok: ${p.stock}\n\n`;
    });
    text += "_Ketik .beli <id_produk> untuk melakukan pemesanan._";
    return text;
}

module.exports = { marketData, getCatalog };
