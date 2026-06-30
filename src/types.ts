export interface Category {
  category_id: number
  category_name: string
  amount: number
}

export interface CategoryInsert {
  category_name: string
}

export interface LedgerEntry {
  id: number
  category_id: number
  date: string
  txn_type: 'CREDIT' | 'DEBIT'
  amount: number
  ref_note: string | null
  is_wastage: boolean
  created_at: string
}

export interface LedgerInsert {
  category_id: number
  date: string
  txn_type: 'CREDIT' | 'DEBIT'
  amount: number
  ref_note?: string
  is_wastage?: boolean
}

export interface LedgerWithBalance extends LedgerEntry {
  running_balance: number
}

export interface DailyReport {
  date: string
  total_credits: number
  total_debits: number
  net_change: number
}

export interface SalesEntry {
  id: number
  date: string
  sales: number
}

export interface SalesInsert {
  date: string
  sales: number
}

export interface SalesUpdate {
  date?: string
  sales?: number
}

export interface FixedExpense {
  id: number
  expense_name: string
  amount: number
}

export interface FixedExpenseInsert {
  expense_name: string
  amount: number
}

export interface PLResult {
  total_sales: number
  total_material: number
  daily_fixed_cost: number
  num_days: number
  total_fixed_cost: number
  profit_loss: number
}

export interface PLSalesRow {
  date: string
  amount: number
}

export interface PLMaterialRow {
  date: string
  category_name: string
  amount: number
}

export interface PLBreakdown {
  sales: PLSalesRow[]
  material: PLMaterialRow[]
  daily_fixed_cost: number
  num_days: number
  total_fixed_cost: number
}

export interface PaginatedResult<T> {
  data: T[]
  count: number
}
