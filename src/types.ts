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
