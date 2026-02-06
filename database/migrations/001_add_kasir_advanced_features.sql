-- ============================================
-- MIGRATION: Advanced Kasir Features
-- Date: 2024-01-08
-- Description: Menambahkan fitur member, hold bill, diskon per item, split payment
-- ============================================

-- ============================================
-- 1. UPDATE TABLE pelanggan - Tambah Kolom Member
-- ============================================
ALTER TABLE pelanggan
ADD COLUMN IF NOT EXISTS diskon_default DECIMAL(5,2) DEFAULT 0 COMMENT 'Diskon default member (%)',
ADD COLUMN IF NOT EXISTS poin_balance INT DEFAULT 0 COMMENT 'Saldo poin member',
ADD COLUMN IF NOT EXISTS poin_total INT DEFAULT 0 COMMENT 'Total poin yang pernah didapat',
ADD COLUMN IF NOT EXISTS membership_tier VARCHAR(20) DEFAULT 'regular' COMMENT 'Tier: regular, silver, gold, platinum',
ADD COLUMN IF NOT EXISTS tanggal_lahir DATE COMMENT 'Untuk diskon ulang tahun',
ADD COLUMN IF NOT EXISTS no_hp VARCHAR(20) COMMENT 'Nomor HP untuk notifikasi',
ADD COLUMN IF NOT EXISTS last_purchase_date DATE COMMENT 'Tanggal belanja terakhir',
ADD COLUMN IF NOT EXISTS total_spent DECIMAL(15,2) DEFAULT 0 COMMENT 'Total belanja sepanjang waktu';

-- ============================================
-- 2. CREATE TABLE hold_bills
-- ============================================
CREATE TABLE IF NOT EXISTS hold_bills (
    id INT PRIMARY KEY AUTO_INCREMENT,
    pelanggan_id INT NOT NULL COMMENT 'Tenant/Owner ID',
    user_id INT COMMENT 'ID kasir yang menahan',
    no_hold VARCHAR(50) UNIQUE COMMENT 'Nomor hold bill',
    customer_name VARCHAR(255) COMMENT 'Nama customer (jika ada)',
    customer_member_id INT COMMENT 'ID member (jika ada)',
    subtotal DECIMAL(15,2) DEFAULT 0,
    diskon DECIMAL(15,2) DEFAULT 0,
    pajak DECIMAL(15,2) DEFAULT 0,
    total DECIMAL(15,2) DEFAULT 0,
    notes TEXT COMMENT 'Catatan transaksi',
    status ENUM('active', 'completed', 'cancelled') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (pelanggan_id) REFERENCES pelanggan(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_status (status),
    INDEX idx_pelanggan (pelanggan_id),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 3. CREATE TABLE hold_bill_details
-- ============================================
CREATE TABLE IF NOT EXISTS hold_bill_details (
    id INT PRIMARY KEY AUTO_INCREMENT,
    hold_bill_id INT NOT NULL,
    produk_id INT,
    kode_produk VARCHAR(50),
    nama_produk VARCHAR(255),
    qty INT DEFAULT 1,
    harga DECIMAL(15,2),
    diskon_item DECIMAL(15,2) DEFAULT 0,
    diskon_persen DECIMAL(5,2) DEFAULT 0,
    subtotal DECIMAL(15,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (hold_bill_id) REFERENCES hold_bills(id) ON DELETE CASCADE,
    INDEX idx_hold_bill (hold_bill_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 4. UPDATE TABLE transaksi_detail - Tambah Diskon per Item
-- ============================================
ALTER TABLE transaksi_detail
ADD COLUMN IF NOT EXISTS diskon_persen DECIMAL(5,2) DEFAULT 0 COMMENT 'Diskon persentase per item',
ADD COLUMN IF NOT EXISTS diskon_nominal DECIMAL(15,2) DEFAULT 0 COMMENT 'Diskon nominal per item',
ADD COLUMN IF NOT EXISTS harga_setelah_diskon DECIMAL(15,2) COMMENT 'Harga final setelah diskon';

-- ============================================
-- 5. CREATE TABLE member_poin_history
-- ============================================
CREATE TABLE IF NOT EXISTS member_poin_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    pelanggan_id INT NOT NULL,
    transaksi_id INT,
    poin_earned INT DEFAULT 0,
    poin_used INT DEFAULT 0,
    saldo_akhir INT DEFAULT 0,
    keterangan VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pelanggan_id) REFERENCES pelanggan(id),
    FOREIGN KEY (transaksi_id) REFERENCES transaksi(id),
    INDEX idx_pelanggan (pelanggan_id),
    INDEX idx_transaksi (transaksi_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 6. UPDATE TABLE transaksi - Tambah kolom untuk member & split payment
-- ============================================
ALTER TABLE transaksi
ADD COLUMN IF NOT EXISTS member_id INT COMMENT 'ID member/pelanggan jika ada',
ADD COLUMN IF NOT EXISTS diskon_member DECIMAL(15,2) DEFAULT 0 COMMENT 'Diskon dari member',
ADD COLUMN IF NOT EXISTS poin_earned INT DEFAULT 0 COMMENT 'Poin yang didapat member ini',
ADD COLUMN IF NOT EXISTS split_payment BOOLEAN DEFAULT FALSE COMMENT 'Apakah menggunakan split payment',
ADD COLUMN IF NOT EXISTS payment_details JSON COMMENT 'Detail pembayaran split (array of {method, amount})';

-- Add foreign key for member_id
ALTER TABLE transaksi
ADD FOREIGN KEY (member_id) REFERENCES pelanggan(id);

-- ============================================
-- 7. SEED DATA: Default membership tiers
-- ============================================
-- Update existing pelanggan to have default values
UPDATE pelanggan
SET
    membership_tier = 'regular',
    diskon_default = 0,
    poin_balance = 0,
    poin_total = 0
WHERE membership_tier IS NULL OR membership_tier = '';

-- ============================================
-- END OF MIGRATION
-- ============================================
