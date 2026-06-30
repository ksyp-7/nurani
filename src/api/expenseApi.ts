import { supabase } from '../lib/supabase'
import type { Category, LedgerEntry, LedgerWithBalance, DailyReport, SalesEntry, SalesInsert, SalesUpdate, PaginatedResult, FixedExpense, FixedExpenseInsert, PLResult, PLBreakdown, PLSalesRow, PLMaterialRow } from '../types'

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

export async function getSales(
  page = 0,
  pageSize = 15
): Promise<PaginatedResult<SalesEntry>> {
  const from = page * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await supabase
    .from('sales_master')
    .select('*', { count: 'exact' })
    .order('date', { ascending: false })
    .order('id', { ascending: false })
    .range(from, to)

  if (error) throw error
  return { data: data as unknown as SalesEntry[], count: count ?? 0 }
}

export async function createSalesEntry(entry: SalesInsert): Promise<SalesEntry> {
  const { data, error } = await supabase
    .from('sales_master')
    .insert([entry])
    .select()
    .single()
  if (error) throw error
  return data as unknown as SalesEntry
}

export async function updateSalesEntry(
  id: number,
  updates: SalesUpdate
): Promise<SalesEntry> {
  const { data, error } = await supabase
    .from('sales_master')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as unknown as SalesEntry
}

export async function deleteSalesEntry(id: number): Promise<void> {
  const { error } = await supabase
    .from('sales_master')
    .delete()
    .eq('id', id)
  if (error) throw error
}

export async function getFixedExpenses(): Promise<FixedExpense[]> {
  const { data, error } = await supabase
    .from('fixed_expenses')
    .select('*')
    .order('expense_name')
  if (error) throw error
  return data as unknown as FixedExpense[]
}

export async function createFixedExpense(entry: FixedExpenseInsert): Promise<FixedExpense> {
  const { data, error } = await supabase
    .from('fixed_expenses')
    .insert([entry])
    .select()
    .single()
  if (error) throw error
  return data as unknown as FixedExpense
}

export async function updateFixedExpense(id: number, entry: FixedExpenseInsert): Promise<FixedExpense> {
  const { data, error } = await supabase
    .from('fixed_expenses')
    .update(entry)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as unknown as FixedExpense
}

export async function deleteFixedExpense(id: number): Promise<void> {
  const { error } = await supabase
    .from('fixed_expenses')
    .delete()
    .eq('id', id)
  if (error) throw error
}

export async function getPL(startDate: string, endDate: string): Promise<PLResult> {
  const [{ data: salesData }, { data: materialData }, { data: fixedData }] = await Promise.all([
    supabase.from('sales_master').select('sales').gte('date', startDate).lte('date', endDate),
    supabase.from('category_ledger').select('amount').eq('txn_type', 'DEBIT').gte('date', startDate).lte('date', endDate),
    supabase.from('fixed_expenses').select('amount'),
  ])

  const totalSales = (salesData ?? []).reduce((s: number, r: Record<string, unknown>) => s + Number(r.sales), 0)
  const totalMaterial = (materialData ?? []).reduce((s: number, r: Record<string, unknown>) => s + Number(r.amount), 0)
  const dailyFixedCost = (fixedData ?? []).reduce((s: number, r: Record<string, unknown>) => s + Number(r.amount), 0)

  const start = new Date(startDate)
  const end = new Date(endDate)
  const numDays = Math.max(1, Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1)
  const totalFixedCost = dailyFixedCost * numDays
  const profitLoss = totalSales - totalMaterial - totalFixedCost

  return { total_sales: totalSales, total_material: totalMaterial, daily_fixed_cost: dailyFixedCost, num_days: numDays, total_fixed_cost: totalFixedCost, profit_loss: profitLoss }
}

export async function getPLBreakdown(startDate: string, endDate: string): Promise<PLBreakdown> {
  const [salesRes, materialRes, categoriesRes, fixedRes] = await Promise.all([
    supabase.from('sales_master').select('date, sales').gte('date', startDate).lte('date', endDate).order('date'),
    supabase.from('category_ledger').select('date, category_id, amount').eq('txn_type', 'DEBIT').gte('date', startDate).lte('date', endDate).order('date'),
    supabase.from('category_master').select('category_id, category_name'),
    supabase.from('fixed_expenses').select('amount'),
  ])

  const catMap = new Map<number, string>()
  for (const c of (categoriesRes.data ?? []) as Record<string, unknown>[]) {
    catMap.set(c.category_id as number, c.category_name as string)
  }

  const sales: PLSalesRow[] = ((salesRes.data ?? []) as Record<string, unknown>[]).map((r) => ({
    date: r.date as string,
    amount: Number(r.sales),
  }))

  const material: PLMaterialRow[] = ((materialRes.data ?? []) as Record<string, unknown>[]).map((r) => ({
    date: r.date as string,
    category_name: catMap.get(r.category_id as number) ?? 'Unknown',
    amount: Number(r.amount),
  }))

  const dailyFixedCost = ((fixedRes.data ?? []) as Record<string, unknown>[]).reduce((s: number, r) => s + Number(r.amount), 0)
  const start = new Date(startDate)
  const end = new Date(endDate)
  const numDays = Math.max(1, Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1)

  return { sales, material, daily_fixed_cost: dailyFixedCost, num_days: numDays, total_fixed_cost: dailyFixedCost * numDays }
}
