import { supabase } from '../lib/supabase'
import type { Category, LedgerEntry, LedgerWithBalance, DailyReport } from '../types'

export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('category_master')
    .select('*')
    .order('category_name', { ascending: true })
  if (error) throw error
  return data as unknown as Category[]
}

export async function createCategory(cat: { category_name: string }): Promise<Category> {
  const { data, error } = await supabase
    .from('category_master')
    .insert([cat])
    .select()
    .single()
  if (error) throw error
  return data as unknown as Category
}

export async function updateCategory(id: number, cat: { category_name: string }): Promise<Category> {
  const { data, error } = await supabase
    .from('category_master')
    .update(cat)
    .eq('category_id', id)
    .select()
    .single()
  if (error) throw error
  return data as unknown as Category
}

export async function deleteCategory(id: number): Promise<void> {
  const { error } = await supabase
    .from('category_master')
    .delete()
    .eq('category_id', id)
  if (error) throw error
}

export async function insertLedgerEntry(entry: {
  category_id: number
  date: string
  txn_type: 'CREDIT' | 'DEBIT'
  amount: number
  ref_note?: string
  is_wastage?: boolean
}): Promise<LedgerEntry> {
  const { data, error } = await supabase
    .from('category_ledger')
    .insert([entry])
    .select()
    .single()
  if (error) throw error
  return data as unknown as LedgerEntry
}

export async function getLedgerForCategory(
  categoryId: number,
  page = 0,
  pageSize = 50
): Promise<{ data: LedgerEntry[]; count: number }> {
  const from = page * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await supabase
    .from('category_ledger')
    .select('*', { count: 'exact' })
    .eq('category_id', categoryId)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) throw error
  return { data: data as unknown as LedgerEntry[], count: count ?? 0 }
}

export async function getLedgerWithRunningBalance(categoryId: number): Promise<LedgerWithBalance[]> {
  const { data, error } = await supabase
    .from('category_ledger')
    .select('*')
    .eq('category_id', categoryId)
    .order('date', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) throw error
  let balance = 0

  const withRunning = (data as unknown as LedgerEntry[]).map((row) => {
    if (row.txn_type === 'CREDIT') balance += Number(row.amount)
    else balance -= Number(row.amount)
    return { ...row, running_balance: balance }
  })

  return withRunning.reverse()
}

export async function getDailyReport(startDate: string, endDate: string): Promise<DailyReport[]> {
  const { data, error } = await supabase
    .from('category_ledger')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true })

  if (error) throw error

  const dailyMap = new Map<string, { credits: number; debits: number }>()

  for (const row of data as unknown as LedgerEntry[]) {
    const day = dailyMap.get(row.date) ?? { credits: 0, debits: 0 }
    if (row.txn_type === 'CREDIT') day.credits += Number(row.amount)
    else day.debits += Number(row.amount)
    dailyMap.set(row.date, day)
  }

  const reports: DailyReport[] = []

  for (const [date, vals] of dailyMap) {
    reports.push({
      date,
      total_credits: vals.credits,
      total_debits: vals.debits,
      net_change: vals.credits - vals.debits,
    })
  }

  return reports.sort((a, b) => a.date.localeCompare(b.date))
}
