-- ================================================================
-- Vinay's Kitchen — Full Database Schema (v3)
-- Run this against: vinay_db
-- ================================================================

DROP TABLE IF EXISTS vendor_bill_items CASCADE;
DROP TABLE IF EXISTS vendor_bills CASCADE;
DROP TABLE IF EXISTS vendor_payments CASCADE;
DROP TABLE IF EXISTS settings CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS salary_payments CASCADE;
DROP TABLE IF EXISTS sales CASCADE;
DROP TABLE IF EXISTS material_usage CASCADE;
DROP TABLE IF EXISTS purchases CASCADE;
DROP TABLE IF EXISTS materials CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS workers CASCADE;
DROP TABLE IF EXISTS vendors CASCADE;

-- Vendors (Suppliers)
CREATE TABLE IF NOT EXISTS vendors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Workers
CREATE TABLE IF NOT EXISTS workers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    salary_per_day DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    joining_date DATE DEFAULT CURRENT_DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Attendance
CREATE TABLE IF NOT EXISTS attendance (
    id SERIAL PRIMARY KEY,
    worker_id INTEGER REFERENCES workers(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('Present', 'Absent', 'Half-day')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(worker_id, date)
);

-- Materials (Inventory Items)
CREATE TABLE IF NOT EXISTS materials (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    unit VARCHAR(50) NOT NULL,
    min_stock DECIMAL(10, 2) DEFAULT 0.00,
    current_stock DECIMAL(10, 2) DEFAULT 0.00,
    conversion_factor DECIMAL(10, 4) DEFAULT NULL,
    base_unit VARCHAR(50) DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Vendor Bills
CREATE TABLE IF NOT EXISTS vendor_bills (
    id SERIAL PRIMARY KEY,
    vendor_id INTEGER REFERENCES vendors(id) ON DELETE CASCADE,
    bill_date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    paid_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    payment_mode VARCHAR(50) DEFAULT 'cash',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Vendor Bill Items
CREATE TABLE IF NOT EXISTS vendor_bill_items (
    id SERIAL PRIMARY KEY,
    bill_id INTEGER REFERENCES vendor_bills(id) ON DELETE CASCADE,
    material_id INTEGER REFERENCES materials(id) ON DELETE SET NULL,
    quantity NUMERIC(10,2) NOT NULL,
    price_per_unit NUMERIC(10,2) NOT NULL,
    total_amount NUMERIC(12,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Vendor Payments (standalone payments not tied to a specific bill)
CREATE TABLE IF NOT EXISTS vendor_payments (
    id SERIAL PRIMARY KEY,
    vendor_id INTEGER REFERENCES vendors(id) ON DELETE CASCADE,
    amount NUMERIC(12,2) NOT NULL,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_mode VARCHAR(50) DEFAULT 'cash',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Purchases (Stock Intake from Vendor)
CREATE TABLE IF NOT EXISTS purchases (
    id SERIAL PRIMARY KEY,
    material_id INTEGER REFERENCES materials(id) ON DELETE CASCADE,
    vendor_id INTEGER REFERENCES vendors(id) ON DELETE SET NULL,
    bill_id INTEGER REFERENCES vendor_bills(id) ON DELETE CASCADE,
    quantity DECIMAL(10, 2) NOT NULL,
    price_per_unit DECIMAL(10, 2) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    purchase_date DATE DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Material Usage (Daily consumption log)
CREATE TABLE IF NOT EXISTS material_usage (
    id SERIAL PRIMARY KEY,
    material_id INTEGER REFERENCES materials(id) ON DELETE CASCADE,
    quantity_used DECIMAL(10, 2) NOT NULL,
    usage_date DATE DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Daily Counter Sales
CREATE TABLE IF NOT EXISTS sales (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    cash_amount NUMERIC(12,2) DEFAULT 0,
    upi_amount NUMERIC(12,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Salary Payments
CREATE TABLE IF NOT EXISTS salary_payments (
    id SERIAL PRIMARY KEY,
    worker_id INTEGER REFERENCES workers(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Expenses (Rent, Electricity, Misc)
CREATE TABLE IF NOT EXISTS expenses (
    id SERIAL PRIMARY KEY,
    category VARCHAR(100) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Users (Auth)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Settings
CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(255) UNIQUE NOT NULL,
    value TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ================================================================
-- Indexes
-- ================================================================

-- Attendance: filter by date (dashboard), by worker+date (upsert), by month
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_worker_date ON attendance(worker_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_year_month ON attendance(EXTRACT(YEAR FROM date), EXTRACT(MONTH FROM date));

-- Sales: date range queries, monthly aggregations
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(date);
CREATE INDEX IF NOT EXISTS idx_sales_year_month ON sales(EXTRACT(YEAR FROM date), EXTRACT(MONTH FROM date));

-- Purchases: joins on material + vendor, date filters
CREATE INDEX IF NOT EXISTS idx_purchases_material_id ON purchases(material_id);
CREATE INDEX IF NOT EXISTS idx_purchases_vendor_id ON purchases(vendor_id);
CREATE INDEX IF NOT EXISTS idx_purchases_date ON purchases(purchase_date);
CREATE INDEX IF NOT EXISTS idx_purchases_bill_id ON purchases(bill_id);

-- Material usage: daily lookup by material
CREATE INDEX IF NOT EXISTS idx_material_usage_material_id ON material_usage(material_id);
CREATE INDEX IF NOT EXISTS idx_material_usage_date ON material_usage(usage_date);

-- Salary payments: monthly totals per worker (used in workers dashboard)
CREATE INDEX IF NOT EXISTS idx_salary_payments_worker_id ON salary_payments(worker_id);
CREATE INDEX IF NOT EXISTS idx_salary_payments_date ON salary_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_salary_payments_worker_month ON salary_payments(worker_id, EXTRACT(YEAR FROM payment_date), EXTRACT(MONTH FROM payment_date));

-- Expenses: date range and category filters
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_category_date ON expenses(category, expense_date);

-- Workers: active filter used on every page load
CREATE INDEX IF NOT EXISTS idx_workers_is_active ON workers(is_active);

-- Vendor bills: vendor ledger queries
CREATE INDEX IF NOT EXISTS idx_vendor_bills_vendor_id ON vendor_bills(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_bills_date ON vendor_bills(bill_date);
CREATE INDEX IF NOT EXISTS idx_vendor_bills_vendor_date ON vendor_bills(vendor_id, bill_date);

-- Vendor bill items: bill lookup
CREATE INDEX IF NOT EXISTS idx_vendor_bill_items_bill_id ON vendor_bill_items(bill_id);
CREATE INDEX IF NOT EXISTS idx_vendor_bill_items_material_id ON vendor_bill_items(material_id);

-- Vendor payments: vendor ledger queries
CREATE INDEX IF NOT EXISTS idx_vendor_payments_vendor_id ON vendor_payments(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_payments_date ON vendor_payments(payment_date);

-- ================================================================
-- Default Data
-- ================================================================

INSERT INTO users (email, password_hash, name)
VALUES ('admin@vinayskitchen.com', 'admin123', 'Vinay Admin')
ON CONFLICT (email) DO NOTHING;
