-- ============================================================================
-- Preadvice Lines Staging Table 
-- Creates the staging table for preadvice lines, which will be used to temporarily store data before it is processed and moved to the main preadvice lines table.
-- ============================================================================

CREATE TABLE IF NOT EXISTS AXL_WMS_PREADVICE_HEADER_STG (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    preadvice_header_id TEXT NOT NULL,
    client_id TEXT NOT NULL,
    address TEXT NOT NULL,
    postcode TEXT NOT NULL,
    country TEXT DEFAULT 'United Kingdom',
    phone_number TEXT NOT NULL,
    status TEXT DEFAULT 'NEW',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)

CREATE TABLE IF NOT EXISTS AXL_WMS_PREADVICE_LINE_STG (
    id INTEGER PRIMARY KEY AUTOINCREMENT,,
    preadvice_line_id TEXT NOT NULL,
    client_id TEXT NOT NULL,
    address TEXT NOT NULL,
    postcode TEXT NOT NULL,
    tag_id TEXT UNIQUE NOT NULL,
    sku TEXT NOT NULL,
    quantity_due INTEGER DEFAULT 1,
    country TEXT DEFAULT 'United Kingdom',
    phone_number TEXT NOT NULL,
    status TEXT DEFAULT 'NEW',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)


