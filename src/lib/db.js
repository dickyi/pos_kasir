import mysql from 'mysql2/promise';

// Konfigurasi koneksi database
const dbConfig = {
    host: 'localhost',
    user: 'root',          // default XAMPP
    password: '',          // default XAMPP (kosong)
    database: 'pos_kasir'
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