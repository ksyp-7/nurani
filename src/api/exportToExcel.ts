import { supabase } from '../lib/supabase'
import * as XLSX from 'xlsx'

export async function exportToExcel() {
  const { data: categories, error: catErr } = await supabase
    .from('category_master')
    .select('*')
    .order('category_name')

  if (catErr) throw catErr

  const { data: ledger, error: ledErr } = await supabase
    .from('category_ledger')
    .select('*')
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })

  if (ledErr) throw ledErr

  const catMap = new Map<number, string>()
  for (const c of categories ?? []) {
    catMap.set(c.category_id, c.category_name)
  }

  const catSheetData = (categories ?? []).map((c: Record<string, unknown>) => ({
    'Category Name': c.category_name,
    'Balance (₹)': Number(c.amount).toFixed(2),
  }))

  const ledSheetData = (ledger ?? []).map((e: Record<string, unknown>) => ({
    Date: e.date,
    Category: catMap.get(e.category_id as number) ?? '',
    Type: e.txn_type,
    'Amount (₹)': Number(e.amount).toFixed(2),
    Wastage: e.is_wastage ? 'Yes' : 'No',
    'Reference Note': e.ref_note ?? '',
    'Created At': e.created_at,
  }))

  const catSheet = XLSX.utils.json_to_sheet(catSheetData)
  const ledSheet = XLSX.utils.json_to_sheet(ledSheetData)

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, catSheet, 'Categories')
  XLSX.utils.book_append_sheet(wb, ledSheet, 'Ledger')

  XLSX.writeFile(wb, `nurani-cafe-export-${new Date().toISOString().split('T')[0]}.xlsx`)
}
