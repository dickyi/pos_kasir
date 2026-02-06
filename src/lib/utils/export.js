/**
 * ============================================
 * EXPORT UTILITIES
 * ============================================
 * Helper functions untuk export PDF dan Excel
 * ============================================
 */
import { formatRupiah, formatDate, formatTime } from './format.js';

/**
 * Generate PDF using jsPDF
 * @param {object} data - Report data
 * @param {object} options - Export options
 * @returns {Promise<Blob>} - PDF blob
 */
export async function generatePDF(data, options = {}) {
	const { jsPDF } = await import('jspdf');
	const { title, subtitle, date, summary, tableData } = options;

	const doc = new jsPDF();
	let yPos = 20;

	// Title
	doc.setFontSize(18);
	doc.setFont('helvetica', 'bold');
	doc.text(title, 20, yPos);
	yPos += 10;

	// Subtitle
	if (subtitle) {
		doc.setFontSize(10);
		doc.setFont('helvetica', 'normal');
		doc.text(subtitle, 20, yPos);
		yPos += 7;
	}

	// Date
	if (date) {
		doc.setFontSize(9);
		doc.setTextColor(100);
		doc.text(`Dicetak: ${new Date().toLocaleString('id-ID')}`, 20, yPos);
		if (date.start && date.end) {
			yPos += 5;
			doc.text(
				`Periode: ${formatDate(date.start)} - ${formatDate(date.end)}`,
				20,
				yPos
			);
		}
		yPos += 10;
	}

	doc.setTextColor(0);

	// Summary section
	if (summary && summary.length > 0) {
		doc.setFontSize(12);
		doc.setFont('helvetica', 'bold');
		doc.text('Ringkasan', 20, yPos);
		yPos += 8;

		doc.setFontSize(10);
		doc.setFont('helvetica', 'normal');

		const summaryData = summary.map((item) => ({
			label: item.label,
			value: formatRupiah(item.value)
		}));

		summaryData.forEach((item) => {
			doc.text(`${item.label}:`, 25, yPos);
			doc.text(item.value, 60, yPos);
			yPos += 6;
		});

		yPos += 10;
	}

	// Table section
	if (tableData && tableData.length > 0) {
		// Check if we need a new page
		if (yPos > 250) {
			doc.addPage();
			yPos = 20;
		}

		doc.setFontSize(12);
		doc.setFont('helvetica', 'bold');
		doc.text('Detail Data', 20, yPos);
		yPos += 8;

		// Table headers
		const headers = Object.keys(tableData[0]);
		doc.setFontSize(9);
		doc.setFont('helvetica', 'bold');

		let xPos = 20;
		const colWidth = 170 / headers.length;

		headers.forEach((header) => {
			doc.text(header, xPos, yPos);
			xPos += colWidth;
		});

		yPos += 6;

		// Table data
		doc.setFont('helvetica', 'normal');
		doc.setFontSize(8);

		const maxRows = yPos > 100 ? 20 : 35; // Adjust based on current position
		let rowCount = 0;

		tableData.forEach((row) => {
			// Check if we need a new page
			if (yPos > 280 || rowCount >= maxRows) {
				doc.addPage();
				yPos = 20;
				rowCount = 0;

				// Reprint headers on new page
				doc.setFont('helvetica', 'bold');
				xPos = 20;
				headers.forEach((header) => {
					doc.text(header, xPos, yPos);
					xPos += colWidth;
				});
				yPos += 6;
				doc.setFont('helvetica', 'normal');
			}

			xPos = 20;
			headers.forEach((header) => {
				const value = row[header];
				const formattedValue =
					typeof value === 'number' && header.toLowerCase().includes('total')
						? formatRupiah(value)
						: value || '-';
				doc.text(String(formattedValue).substring(0, 20), xPos, yPos);
				xPos += colWidth;
			});

			yPos += 5;
			rowCount++;
		});
	}

	// Footer
	const totalPages = doc.internal.getNumberOfPages();
	for (let i = 1; i <= totalPages; i++) {
		doc.setPage(i);
		doc.setFontSize(8);
		doc.setFont('helvetica', 'normal');
		doc.setTextColor(150);
		doc.text(`Halaman ${i} dari ${totalPages}`, 105, 290, { align: 'center' });
	}

	return doc.output('blob');
}

/**
 * Generate Excel using ExcelJS
 * @param {object} data - Report data
 * @param {object} options - Export options
 * @returns {Promise<Blob>} - Excel blob
 */
export async function generateExcel(data, options = {}) {
	const ExcelJS = await import('exceljs');
	const workbook = new ExcelJS.Workbook();
	const { title, date, summary, tableData, chartData } = options;

	// Create main sheet
	const worksheet = workbook.addWorksheet('Laporan');

	// Title row
	worksheet.mergeCells('A1:E1');
	const titleCell = worksheet.getCell('A1');
	titleCell.value = title;
	titleCell.font = { size: 16, bold: true };
	titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

	let rowIndex = 2;

	// Metadata rows
	if (date) {
		if (date.start && date.end) {
			const dateCell = worksheet.getCell(`A${rowIndex}`);
			dateCell.value = `Periode: ${formatDate(date.start)} - ${formatDate(date.end)}`;
			dateCell.font = { size: 10 };
			rowIndex++;
		}

		const printedCell = worksheet.getCell(`A${rowIndex}`);
		printedCell.value = `Dicetak: ${new Date().toLocaleString('id-ID')}`;
		printedCell.font = { size: 10, color: { argb: 'FF666666' } };
		rowIndex += 2;
	}

	// Summary section
	if (summary && summary.length > 0) {
		const summaryHeader = worksheet.getCell(`A${rowIndex}`);
		summaryHeader.value = 'Ringkasan';
		summaryHeader.font = { size: 12, bold: true };
		rowIndex++;

		summary.forEach((item) => {
			const labelCell = worksheet.getCell(`A${rowIndex}`);
			const valueCell = worksheet.getCell(`B${rowIndex}`);

			labelCell.value = item.label;
			valueCell.value = item.value;
			valueCell.numFmt = item.format === 'currency' ? '"Rp"#,##0' : '#,##0';

			rowIndex++;
		});

		rowIndex++;
	}

	// Table data section
	if (tableData && tableData.length > 0) {
		const tableHeader = worksheet.getCell(`A${rowIndex}`);
		tableHeader.value = 'Detail Data';
		tableHeader.font = { size: 12, bold: true };
		rowIndex++;

		// Headers
		const headers = Object.keys(tableData[0]);
		headers.forEach((header, colIndex) => {
			const cell = worksheet.getCell(String.fromCharCode(65 + colIndex) + rowIndex);
			cell.value = header;
			cell.font = { bold: true };
			cell.fill = {
				type: 'pattern',
				pattern: 'solid',
				fgColor: { argb: 'FFE0E0E0' }
			};
			cell.border = {
				top: { style: 'thin' },
				left: { style: 'thin' },
				bottom: { style: 'thin' },
				right: { style: 'thin' }
			};
		});

		rowIndex++;

		// Data rows
		tableData.forEach((row) => {
			headers.forEach((header, colIndex) => {
				const cell = worksheet.getCell(String.fromCharCode(65 + colIndex) + rowIndex);
				const value = row[header];

				cell.value = value;
				cell.border = {
					top: { style: 'thin' },
					left: { style: 'thin' },
					bottom: { style: 'thin' },
					right: { style: 'thin' }
				};

				// Format currency columns
				if (typeof value === 'number' && header.toLowerCase().includes('total')) {
					cell.numFmt = '"Rp"#,##0';
				}
			});

			rowIndex++;
		});
	}

	// Auto-fit columns
	worksheet.columns.forEach((column) => {
		let maxLength = 0;
		column.eachCell({ includeEmpty: true }, (cell) => {
			const length = cell.value ? cell.value.toString().length : 10;
			if (length > maxLength) {
				maxLength = length;
			}
		});
		column.width = maxLength < 10 ? 10 : maxLength + 2;
	});

	// Generate buffer
	const buffer = await workbook.xlsx.writeBuffer();
	return new Blob([buffer], {
		type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
	});
}

/**
 * Download file
 * @param {Blob} blob - File blob
 * @param {string} filename - Filename with extension
 */
export function downloadFile(blob, filename) {
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}

/**
 * Generate filename with timestamp
 * @param {string} prefix - Filename prefix
 * @param {string} extension - File extension (pdf or xlsx)
 * @returns {string} - Generated filename
 */
export function generateFilename(prefix, extension) {
	const date = new Date();
	const dateStr = date.toISOString().split('T')[0];
	const timeStr = date.toTimeString().split(' ')[0].replace(/:/g, '-');
	return `${prefix}_${dateStr}_${timeStr}.${extension}`;
}
