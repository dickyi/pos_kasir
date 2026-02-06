import mysql from 'mysql2/promise';

// Konfigurasi koneksi database
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'pos_kasir'
};

// Fungsi untuk get koneksi
export async function getConnection() {
    const connection = await mysql.createConnection(dbConfig);
    return connection;
}

// Fungsi untuk query
export async function query(sql, params = []) {
    const connection = await getConnection();
    try {
        const [results] = await connection.execute(sql, params);
        return results;
    } finally {
        await connection.end();
    }
}