CREATE TABLE IF NOT EXISTS orders(
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 customer_name TEXT NOT NULL,
 customer_email TEXT NOT NULL,
 amount_paise INTEGER NOT NULL,
 status TEXT DEFAULT 'created',
 razorpay_order_id TEXT UNIQUE,
 razorpay_payment_id TEXT,
 created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS webhook_events(
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 event_id TEXT UNIQUE NOT NULL,
 event_type TEXT,
 created_at TEXT DEFAULT CURRENT_TIMESTAMP
);