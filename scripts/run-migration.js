import mysql from 'mysql2/promise';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Konfigurasi koneksi database
const dbConfig = {
	host: 'localhost',
	user: 'root',
	password: '',
	database: 'pos_kasir',
	multipleStatements: true
};

async function runMigration() {
	const connection = await mysql.createConnection(dbConfig);

	try {
		console.log('🔄 Running migration...');

		// Baca file migration
		const migrationSQL = readFileSync(
			join(__dirname, '../database/migrations/001_add_kasir_advanced_features.sql'),
			'utf-8'
		);

		// Jalankan migration
		await connection.query(migrationSQL);

		console.log('✅ Migration completed successfully!');
		console.log('');
		console.log('Added features:');
		console.log('  - Member fields to pelanggan table');
		console.log('  - hold_bills and hold_bill_details tables');
		console.log('  - Discount fields to transaksi_detail table');
		console.log('  - member_poin_history table');
		console.log('  - Member & split payment fields to transaksi table');
		console.log('');

	} catch (error) {
		console.error('❌ Migration failed:', error.message);

		// Check if it's just duplicate columns
		if (error.message.includes('Duplicate column')) {
			console.log('');
			console.log('⚠️  Some columns already exist. This is normal if you run the migration multiple times.');
			console.log('The migration is partially complete.');
		}
	} finally {
		await connection.end();
	}
}

runMigration();
