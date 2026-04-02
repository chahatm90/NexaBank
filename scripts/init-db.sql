-- Create schemas
CREATE SCHEMA IF NOT EXISTS users;
CREATE SCHEMA IF NOT EXISTS accounts;
CREATE SCHEMA IF NOT EXISTS transactions;
CREATE SCHEMA IF NOT EXISTS notifications;

-- ─── Users Schema ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    date_of_birth DATE,
    address TEXT,
    national_id VARCHAR(50) UNIQUE,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ─── Accounts Schema ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS accounts.bank_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_number VARCHAR(20) UNIQUE NOT NULL,
    customer_id UUID NOT NULL,
    account_type VARCHAR(20) NOT NULL,
    balance DECIMAL(19,4) DEFAULT 0.0000,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ─── Transactions Schema ──────────────────────────────────
CREATE TABLE IF NOT EXISTS transactions.transaction_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_ref VARCHAR(50) UNIQUE NOT NULL,
    account_id UUID NOT NULL,
    transaction_type VARCHAR(20) NOT NULL,
    amount DECIMAL(19,4) NOT NULL,
    balance_before DECIMAL(19,4),
    balance_after DECIMAL(19,4),
    currency VARCHAR(3) DEFAULT 'USD',
    description TEXT,
    destination_account_id UUID,
    status VARCHAR(20) DEFAULT 'COMPLETED',
    created_at TIMESTAMP DEFAULT NOW()
);

-- ─── Notifications Schema ─────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications.notification_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID NOT NULL,
    type VARCHAR(50) NOT NULL,
    subject VARCHAR(255),
    message TEXT,
    channel VARCHAR(20) DEFAULT 'EMAIL',
    status VARCHAR(20) DEFAULT 'SENT',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insert seed data
INSERT INTO users.customers (id, first_name, last_name, email, phone, address, status)
VALUES
    ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'John', 'Doe', 'john.doe@example.com', '+1-555-0101', '123 Main St, New York, NY', 'ACTIVE'),
    ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Jane', 'Smith', 'jane.smith@example.com', '+1-555-0102', '456 Oak Ave, Los Angeles, CA', 'ACTIVE'),
    ('c3d4e5f6-a7b8-9012-cdef-123456789012', 'Michael', 'Johnson', 'michael.j@example.com', '+1-555-0103', '789 Pine Rd, Chicago, IL', 'ACTIVE')
ON CONFLICT DO NOTHING;

INSERT INTO accounts.bank_accounts (id, account_number, customer_id, account_type, balance, currency)
VALUES
    ('d4e5f6a7-b8c9-0123-defa-234567890123', 'ACC-0000000001', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'CHECKING', 15000.00, 'USD'),
    ('e5f6a7b8-c9d0-1234-efab-345678901234', 'ACC-0000000002', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'SAVINGS', 50000.00, 'USD'),
    ('f6a7b8c9-d0e1-2345-fabc-456789012345', 'ACC-0000000003', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'CHECKING', 8500.00, 'USD'),
    ('a7b8c9d0-e1f2-3456-abcd-567890123456', 'ACC-0000000004', 'c3d4e5f6-a7b8-9012-cdef-123456789012', 'SAVINGS', 125000.00, 'USD')
ON CONFLICT DO NOTHING;

INSERT INTO transactions.transaction_records (transaction_ref, account_id, transaction_type, amount, balance_before, balance_after, description)
VALUES
    ('TXN-20240101-001', 'd4e5f6a7-b8c9-0123-defa-234567890123', 'DEPOSIT', 5000.00, 10000.00, 15000.00, 'Initial deposit'),
    ('TXN-20240102-001', 'd4e5f6a7-b8c9-0123-defa-234567890123', 'WITHDRAWAL', 500.00, 15000.00, 14500.00, 'ATM withdrawal'),
    ('TXN-20240103-001', 'e5f6a7b8-c9d0-1234-efab-345678901234', 'DEPOSIT', 10000.00, 40000.00, 50000.00, 'Salary credit'),
    ('TXN-20240104-001', 'f6a7b8c9-d0e1-2345-fabc-456789012345', 'DEPOSIT', 8500.00, 0.00, 8500.00, 'Opening balance')
ON CONFLICT DO NOTHING;

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA users TO banking;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA accounts TO banking;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA transactions TO banking;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA notifications TO banking;
GRANT USAGE ON SCHEMA users TO banking;
GRANT USAGE ON SCHEMA accounts TO banking;
GRANT USAGE ON SCHEMA transactions TO banking;
GRANT USAGE ON SCHEMA notifications TO banking;
