/**
 * ============================================
 * THERMAL RECEIPT GENERATOR
 * File: src/lib/receipt-thermal.js
 * ============================================
 */

/**
 * Generate struk untuk thermal printer
 * @param {Object} transaction - Data transaksi
 * @param {Object} storeInfo - Info toko
 * @param {number} width - Lebar kertas (58 atau 80)
 * @returns {Object} - { html, text } untuk print
 */
export function generateThermalReceipt(transaction, storeInfo, width = 58) {
	const charWidth = width === 80 ? 48 : 32; // karakter per baris

	// Helper untuk center text
	function center(text) {
		const padding = Math.floor((charWidth - text.length) / 2);
		return ' '.repeat(Math.max(0, padding)) + text;
	}

	// Helper untuk right align
	function rightAlign(text) {
		const padding = charWidth - text.length;
		return ' '.repeat(Math.max(0, padding)) + text;
	}

	// Helper untuk garis
	function line() {
		return '='.repeat(charWidth);
	}

	// Helper untuk garis putus-putus
	function dashLine() {
		return '-'.repeat(charWidth);
	}

	// Header
	let output = '';
	output += line() + '\n';
	output += center(storeInfo.nama_bisnis || 'TOKO') + '\n';
	if (storeInfo.alamat) {
		output += center(storeInfo.alamat.substring(0, charWidth)) + '\n';
	}
	output += center(storeInfo.no_telp || '') + '\n';
	output += line() + '\n\n';

	// Invoice info
	output += `INV: ${transaction.no_invoice}\n`;
	output += `Tgl: ${transaction.tanggal}\n`;
	output += `Jam: ${transaction.waktu}\n`;
	if (transaction.kasir) {
		output += `Kasir: ${transaction.kasir}\n`;
	}
	if (transaction.member) {
		output += `Member: ${transaction.member.nama_bisnis}\n`;
	}
	output += '\n' + dashLine() + '\n';

	// Items
	output += 'Item'.padEnd(15) + 'Qty'.padEnd(5) + 'Total\n';
	output += dashLine() + '\n';

	for (const item of transaction.items) {
		const nama = item.nama_produk.substring(0, 15);
		const qty = item.qty.toString();
		const harga = (item.harga_jual * item.qty).toLocaleString('id-ID');

		output += `${nama}\n`;
		output += ' '.repeat(10) + qty.padEnd(5) + harga + '\n';

		// Tampilkan diskon jika ada
		if (item.diskonPersen > 0 || item.diskonNominal > 0) {
			const diskonText = item.diskonPersen > 0
				? `Diskon ${item.diskonPersen}%`
				: `Diskon ${item.diskonNominal.toLocaleString('id-ID')}`;
			output += ' '.repeat(20) + '-' + diskonText + '\n';
		}
	}

	output += dashLine() + '\n';

	// Totals
	output += 'Subtotal'.padEnd(20) + transaction.subtotal.toLocaleString('id-ID') + '\n';

	if (transaction.diskonMember > 0) {
		output += 'Diskon Member'.padEnd(20) + '-' + transaction.diskonMember.toLocaleString('id-ID') + '\n';
	}

	output += 'TOTAL'.padEnd(20) + transaction.total.toLocaleString('id-ID') + '\n\n';

	// Payment
	output += 'Bayar'.padEnd(20) + transaction.bayar.toLocaleString('id-ID') + '\n';
	output += 'Kembali'.padEnd(20) + transaction.kembalian.toLocaleString('id-ID') + '\n';

	if (transaction.poinEarned > 0) {
		output += '\n' + '+'.repeat(charWidth) + '\n';
		output += `Poin didapat: ${transaction.poinEarned}\n`;
		output += 'Terima kasih!'.repeat(Math.floor(charWidth / 12)) + '\n';
	}

	output += '\n' + line() + '\n';

	// Generate HTML version untuk browser print
	const html = `
		<!DOCTYPE html>
		<html>
		<head>
			<meta charset="UTF-8">
			<style>
				* { margin: 0; padding: 0; box-sizing: border-box; }
				body {
					font-family: 'Courier New', monospace;
					font-size: 12px;
					width: ${width}mm;
					padding: 5mm;
				}
				.center { text-align: center; }
				.right { text-align: right; }
				.line { border-top: 1px dashed black; margin: 5px 0; }
				.bold { font-weight: bold; }
				.header { text-align: center; margin-bottom: 10px; }
				.footer { text-align: center; margin-top: 10px; }
				.item { display: flex; justify-content: space-between; }
				.discount { color: green; font-size: 10px; }
				.total-line { display: flex; justify-content: space-between; font-weight: bold; border-top: 1px solid black; padding-top: 5px; }
				.points { background: #f0f0f0; padding: 5px; margin-top: 10px; text-align: center; }
			</style>
		</head>
		<body>
			<div class="header">
				<div class="bold">${storeInfo.nama_bisnis || 'TOKO'}</div>
				${storeInfo.alamat ? `<div>${storeInfo.alamat}</div>` : ''}
				${storeInfo.no_telp ? `<div>${storeInfo.no_telp}</div>` : ''}
			</div>

			<div class="line"></div>

			<div>INV: ${transaction.no_invoice}</div>
			<div>Tgl: ${transaction.tanggal}</div>
			<div>Jam: ${transaction.waktu}</div>
			${transaction.kasir ? `<div>Kasir: ${transaction.kasir}</div>` : ''}
			${transaction.member ? `<div>Member: ${transaction.member.nama_bisnis}</div>` : ''}

			<div class="line"></div>

			<div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
				<span style="flex:1">Item</span>
				<span style="width:30px; text-align:center">Qty</span>
				<span style="width:80px; text-align:right">Total</span>
			</div>

			<div class="line" style="margin: 5px 0;"></div>

			${transaction.items.map(item => `
				<div class="item">
					<span style="flex:1">${item.nama_produk.substring(0, 20)}</span>
				</div>
				<div class="item">
					<span style="width:30px; text-align:center">${item.qty}</span>
					<span style="width:80px; text-align:right">${((item.harga_jual - (item.diskonNominal || 0)) * item.qty).toLocaleString('id-ID')}</span>
				</div>
				${item.diskonPersen > 0 || item.diskonNominal > 0 ? `
					<div class="discount">Diskon: ${item.diskonPersen > 0 ? item.diskonPersen + '%' : item.diskonNominal.toLocaleString('id-ID')}</div>
				` : ''}
			`).join('')}

			<div class="line"></div>

			<div class="total-line">
				<span>Subtotal</span>
				<span>${transaction.subtotal.toLocaleString('id-ID')}</span>
			</div>

			${transaction.diskonMember > 0 ? `
				<div style="display: flex; justify-content: space-between; color: purple;">
					<span>Diskon Member</span>
					<span>-${transaction.diskonMember.toLocaleString('id-ID')}</span>
				</div>
			` : ''}

			<div class="total-line" style="font-size: 14px;">
				<span>TOTAL</span>
				<span style="color: green;">${transaction.total.toLocaleString('id-ID')}</span>
			</div>

			<div style="display: flex; justify-content: space-between; margin-top: 5px;">
				<span>Bayar</span>
				<span>${transaction.bayar.toLocaleString('id-ID')}</span>
			</div>

			<div class="total-line">
				<span>Kembali</span>
				<span>${transaction.kembalian.toLocaleString('id-ID')}</span>
			</div>

			${transaction.poinEarned > 0 ? `
				<div class="points">
					🎉 Poin Didapat: ${transaction.poinEarned}
				</div>
			` : ''}

			<div class="footer line"></div>
			<div class="center">Terima Kasih!</div>
			<div class="center" style="font-size: 10px; margin-top: 5px;">
				${new Date().toLocaleString('id-ID')}
			</div>
		</body>
		</html>
	`;

	return {
		text: output,
		html: html
	};
}

/**
 * Print thermal receipt langsung
 * @param {Object} transaction - Data transaksi
 * @param {Object} storeInfo - Info toko
 * @param {number} width - Lebar kertas (58 atau 80)
 */
export function printThermalReceipt(transaction, storeInfo, width = 58) {
	const { html } = generateThermalReceipt(transaction, storeInfo, width);
	const printWindow = window.open('', '_blank');
	printWindow.document.write(html);
	printWindow.document.close();
	printWindow.print();
}
