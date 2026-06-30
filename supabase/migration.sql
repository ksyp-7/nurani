CREATE TABLE category_master (
  category_id   SERIAL PRIMARY KEY,
  category_name VARCHAR(100) NOT NULL UNIQUE,
  amount        NUMERIC(12,2) NOT NULL DEFAULT 0
);

CREATE TABLE category_ledger (
  id           SERIAL PRIMARY KEY,
  category_id  INTEGER NOT NULL REFERENCES category_master(category_id) ON DELETE RESTRICT,
  date         DATE NOT NULL DEFAULT CURRENT_DATE,
  txn_type     VARCHAR(10) NOT NULL CHECK (txn_type IN ('CREDIT', 'DEBIT')),
  amount       NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  ref_note     TEXT,
  is_wastage   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ledger_category_date ON category_ledger(category_id, date);

CREATE OR REPLACE FUNCTION update_category_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.txn_type = 'CREDIT' THEN
    UPDATE category_master SET amount = amount + NEW.amount WHERE category_id = NEW.category_id;
  ELSE
    UPDATE category_master SET amount = amount - NEW.amount WHERE category_id = NEW.category_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_balance
AFTER INSERT ON category_ledger
FOR EACH ROW EXECUTE FUNCTION update_category_balance();

CREATE OR REPLACE FUNCTION prevent_ledger_update_delete()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'UPDATE and DELETE are not allowed on category_ledger. Use offsetting entries instead.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_update
BEFORE UPDATE ON category_ledger
FOR EACH ROW EXECUTE FUNCTION prevent_ledger_update_delete();

CREATE TRIGGER trg_prevent_delete
BEFORE DELETE ON category_ledger
FOR EACH ROW EXECUTE FUNCTION prevent_ledger_update_delete();

CREATE TABLE sales_master (
  id    SERIAL PRIMARY KEY,
  date  DATE NOT NULL DEFAULT CURRENT_DATE,
  sales NUMERIC(12,2) NOT NULL CHECK (sales >= 0)
);

CREATE INDEX idx_sales_date ON sales_master(date);

CREATE TABLE fixed_expenses (
  id            SERIAL PRIMARY KEY,
  expense_name  VARCHAR(200) NOT NULL,
  amount        NUMERIC(12,2) NOT NULL CHECK (amount > 0)
);
