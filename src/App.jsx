import { useState, useEffect, useMemo } from 'react'
import Papa from 'papaparse'
import {
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'
import {
  Sparkles, Table2, PieChart as PieChartIcon, BadgeDollarSign,
  Banknote, ReceiptText, ShieldCheck, ArrowUpRight, ChevronRight,
  ChevronLeft, TrendingUp, Wallet, ScrollText, Lightbulb, Upload
} from 'lucide-react'

const COLORS = ['#33ff33', '#28cc28', '#1d991d', '#146614', '#0f4d0f', '#1a8033', '#22cc44', '#117722']
const VIEWS = [
  { id: 'table', label: 'Table', icon: Table2 },
  { id: 'summary', label: 'Summary', icon: PieChartIcon },
  { id: 'salary', label: 'Salary', icon: BadgeDollarSign },
  { id: 'stock', label: 'Stock', icon: Banknote },
  { id: 'bonus', label: 'Bonus', icon: Sparkles },
  { id: 'tax', label: 'Tax', icon: ShieldCheck },
  { id: 'insights', label: 'Insights', icon: Lightbulb },
]

// CSV columns. The first name is the documented one (see README); the rest
// are accepted aliases so older exports keep working.
const COLUMNS = {
  date: ['pay_date', 'period_ending'],
  payNumber: ['pay_number'],
  salary: ['salary', 'pp_salary'],
  stock: ['stock_award'],
  cashBonus: ['cash_bonus', 'cbi'],
  shareBonus: ['share_bonus', 'shsucbon'],
  gross: ['gross_pay', 'total_gross_computed'],
  tax: ['income_tax', 'total_tax'],
  deductions: ['total_deductions'],
  net: ['net_pay', 'transfer'],
  cpp: ['cpp', 'cpp_employee'],
  ei: ['ei', 'ei_employee'],
  rrsp: ['rrsp_employee'],
  rrspEr: ['rrsp_employer'],
  espp: ['espp', 'espp_deduction'],
  ltd: ['ltd', 'ltd_fee'],
  health: ['health_dental', 'health_dental_fee'],
  fitness: ['fitness_reimbursement', 'fitness_reimburs'],
  taxRate: ['tax_rate_pct'],
}

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']

function col(row, key) {
  for (const name of COLUMNS[key]) {
    if (row[name] !== undefined && row[name] !== '') return row[name]
  }
  return ''
}

// Accepts YYYY-MM-DD or DD.MM.YYYY and returns DD.MM.YYYY, the format the
// rest of the app works in.
function normalizeDate(v) {
  const s = String(v || '').trim()
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (iso) return `${iso[3]}.${iso[2]}.${iso[1]}`
  return /^\d{2}\.\d{2}\.\d{4}$/.test(s) ? s : ''
}

function toRows(csvRows) {
  const rows = csvRows
    .map(r => ({ r, period: normalizeDate(col(r, 'date')) }))
    .filter(({ period }) => period)
    .map(({ r, period }) => {
      const row = {
        period_ending: period,
        pay_number: col(r, 'payNumber'),
        _date: formatDate(period),
        _salary: parseNum(col(r, 'salary')),
        _stock: parseNum(col(r, 'stock')),
        _cbi: parseNum(col(r, 'cashBonus')),
        _shsuc: parseNum(col(r, 'shareBonus')),
        _gross: parseNum(col(r, 'gross')),
        _tax: parseNum(col(r, 'tax')),
        _ded: parseNum(col(r, 'deductions')),
        _net: parseNum(col(r, 'net')),
        _cpp: parseNum(col(r, 'cpp')),
        _ei: parseNum(col(r, 'ei')),
        _rrsp: parseNum(col(r, 'rrsp')),
        _rrsp_er: parseNum(col(r, 'rrspEr')),
        _espp: parseNum(col(r, 'espp')),
        _ltd: parseNum(col(r, 'ltd')),
        _hlth: parseNum(col(r, 'health')),
        _fitness: parseNum(col(r, 'fitness')),
        _tax_rate: parseFloat(col(r, 'taxRate') || 0),
        _yr: formatDate(period).slice(0, 4),
      }
      if (!row._gross) row._gross = row._salary + row._stock + row._cbi + row._shsuc
      if (!row._tax_rate && row._gross) row._tax_rate = row._tax / row._gross * 100
      return row
    })
  rows.sort((a, b) => a._date.localeCompare(b._date))
  return rows
}

function parseCsv(source) {
  return new Promise((resolve, reject) => {
    Papa.parse(source, {
      download: typeof source === 'string',
      header: true,
      skipEmptyLines: true,
      complete: res => resolve(toRows(res.data)),
      error: reject,
    })
  })
}

function parseNum(v) {
  if (!v || v === '') return 0
  return parseFloat(String(v).replace(/,/g, '')) || 0
}

function formatDate(period) {
  if (!period) return ''
  const [d, m, y] = period.split('.')
  return `${y}-${m}-${d}`
}

function shortDate(period) {
  if (!period) return ''
  const [, m, y] = period.split('.')
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${months[parseInt(m, 10) - 1]} '${y.slice(2)}`
}

function fmtMoneyRaw(value) {
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function StatCard({ label, value, delta, icon: Icon, accent = 'text-[#e0e0e0]' }) {
  return (
    <div className="terminal-card px-3 py-2.5 sm:px-4 sm:py-3 animate-slide-up">
      <div className="flex items-start justify-between gap-3 sm:gap-4">
        <div>
          <p className="text-[10px] sm:text-[11px] text-[#555]" style={{ fontFamily: 'var(--font-mono)' }}>{label}</p>
          <p className={`mt-1 text-sm sm:text-lg font-mono font-semibold ${accent}`}>{value}</p>
          {delta && <p className="mt-1 text-[10px] sm:text-xs text-[#555]">{delta}</p>}
        </div>
        {Icon && (
          <div className="hidden sm:flex border border-[#1a1a1a] bg-black p-2 text-[#555]">
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
    </div>
  )
}

function SectionCard({ title, subtitle, children, className = '' }) {
  return (
    <section className={`terminal-card p-4 sm:p-5 ${className}`}>
      <div className="mb-4 sm:mb-5 flex items-end justify-between gap-3 border-b border-[#1a1a1a] pb-3">
        <div>
          <h2 className="text-sm sm:text-base font-mono font-semibold text-[#33ff33]">$ {title.toLowerCase()}</h2>
          {subtitle && <p className="mt-1 text-[11px] sm:text-xs text-[#555]">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  )
}

export default function App() {
  const [data, setData] = useState([])
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState('_date')
  const [sortDir, setSortDir] = useState('desc')
  const [page, setPage] = useState(1)
  const [view, setView] = useState('summary')
  const [masked, setMasked] = useState(false)
  const [isSample, setIsSample] = useState(false)
  const [loadError, setLoadError] = useState(null)
  const perPage = 18

  function fmtMoney(v) {
    const raw = fmtMoneyRaw(v)
    return masked ? raw.replace(/[0-9]/g, '•') : raw
  }
  function m(v) {
    return masked ? String(v).replace(/[0-9]/g, '•') : v
  }

  // Load public/payslips.csv if it exists, otherwise the bundled sample.
  // Everything is parsed in the browser; nothing is uploaded anywhere.
  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const own = await parseCsv('/payslips.csv').catch(() => [])
        const rows = own.length ? own : await parseCsv('/sample-payslips.csv')
        if (cancelled) return
        setIsSample(!own.length)
        setData(rows)
      } catch {
        if (!cancelled) setLoadError('Could not load any payslip data.')
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const rows = await parseCsv(file)
    if (!rows.length) {
      setLoadError(`No payslip rows found in ${file.name}. Check the column names in the README.`)
      return
    }
    setLoadError(null)
    setIsSample(false)
    setData(rows)
    setPage(1)
  }

  const filtered = useMemo(() => {
    if (!search) return data
    const q = search.toLowerCase()
    return data.filter(r =>
      r.period_ending.toLowerCase().includes(q) ||
      String(r.pay_number).toLowerCase().includes(q)
    )
  }, [data, search])

  const sorted = useMemo(() => {
    const f = [...filtered]
    f.sort((a, b) => {
      let va = a[sortField] ?? ''
      let vb = b[sortField] ?? ''
      if (sortField === '_date') {
        // ISO date string comparison
        if (va < vb) return sortDir === 'asc' ? -1 : 1
        if (va > vb) return sortDir === 'asc' ? 1 : -1
        return 0
      }
      if (sortField.startsWith('_')) {
        va = parseNum(va)
        vb = parseNum(vb)
      }
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return f
  }, [filtered, sortField, sortDir])

  const paged = sorted.slice(0, page * perPage)

  const monthlyAvg = useMemo(() => {
    const byM = {}
    data.forEach(r => {
      const m = formatDate(r.period_ending).slice(0, 7)
      if (!byM[m]) byM[m] = { month: m, salary: 0, stock: 0, net: 0, count: 0 }
      byM[m].salary += r._salary
      byM[m].stock += r._stock
      byM[m].net += r._net
      byM[m].count++
    })
    return Object.values(byM).sort((a, b) => a.month.localeCompare(b.month))
  }, [data])

  const bonusData = useMemo(() => {
    return data.filter(r => r._cbi > 0 || r._shsuc > 0).map(r => ({
      date: shortDate(r.period_ending),
      cbi: r._cbi,
      shsuc: r._shsuc
    }))
  }, [data])

  const summary = useMemo(() => {
    const s = { salary: 0, stock: 0, cbi: 0, shsuc: 0, tax: 0, net: 0, cpp: 0, ei: 0, rrsp_ee: 0, rrsp_er: 0, espp: 0, fitness: 0, ltd: 0, hlth: 0 }
    data.forEach(r => {
      s.salary += r._salary
      s.stock += r._stock
      s.cbi += r._cbi
      s.shsuc += r._shsuc
      s.tax += r._tax
      s.net += r._net
      s.cpp += r._cpp
      s.ei += r._ei
      s.rrsp_ee += r._rrsp
      s.rrsp_er += r._rrsp_er
      s.espp += r._espp
      s.fitness += r._fitness
      s.ltd += r._ltd
      s.hlth += r._hlth
    })
    s.totalGross = s.salary + s.stock + s.cbi + s.shsuc
    s.taxRate = s.totalGross > 0 ? (s.tax / s.totalGross * 100) : 0
    return s
  }, [data])

  const stats = [
    { label: 'Total Gross', value: fmtMoney(summary.totalGross), icon: Wallet, accent: 'text-[#33ff33]' },
    { label: 'Net Pay', value: fmtMoney(summary.net), icon: ArrowUpRight, accent: 'text-[#e0e0e0]' },
    { label: 'Tax Withheld', value: fmtMoney(summary.tax), icon: ReceiptText, accent: 'text-[#33ff33]' },
    { label: 'Stock Awards', value: fmtMoney(summary.stock), icon: Banknote, accent: 'text-[#33ff33]' },
    { label: 'RRSP Total', value: fmtMoney(summary.rrsp_ee + summary.rrsp_er), icon: TrendingUp, accent: 'text-[#33ff33]' },
    { label: 'Tax Rate', value: `${masked ? '••.•' : summary.taxRate.toFixed(1)}%`, icon: ShieldCheck, accent: 'text-[#33ff33]' },
  ]

  const insights = useMemo(() => {
    if (!data.length) return []
    const mask = v => masked ? String(v).replace(/[0-9]/g, '•') : v
    const money = v => mask(Math.round(v).toLocaleString())
    const result = []
    const totalMonths = data.length

    // Years with close to a full set of payslips, so partial first and last
    // years don't skew year-over-year comparisons.
    const countByYear = {}
    data.forEach(r => { countByYear[r._yr] = (countByYear[r._yr] || 0) + 1 })
    const maxCount = Math.max(...Object.values(countByYear))
    const fullYears = Object.keys(countByYear).sort().filter(y => countByYear[y] >= maxCount * 0.75)
    const totalFor = yr => data.filter(r => r._yr === yr).reduce((s, r) => s + r._salary + r._stock + r._cbi + r._shsuc, 0)

    // Bonus trajectory
    const bonusByYear = {}
    data.forEach(r => {
      if (r._cbi + r._shsuc > 0) bonusByYear[r._yr] = (bonusByYear[r._yr] || 0) + r._cbi + r._shsuc
    })
    const bonusYears = Object.keys(bonusByYear).sort()
    if (bonusYears.length >= 2) {
      const first = bonusYears[0]
      const last = bonusYears[bonusYears.length - 1]
      const growth = (bonusByYear[last] - bonusByYear[first]) / bonusByYear[first] * 100
      result.push({
        title: `Bonus: $${money(bonusByYear[first])} in ${first}, $${money(bonusByYear[last])} in ${last}`,
        body: `That's a ${mask(growth.toFixed(0))}% change across ${bonusYears.length} years with bonus payouts. Bonuses are usually discretionary, so they can move faster than base salary in both directions.`,
        accent: 'emerald',
      })
    }

    // Biggest stock year
    if (summary.stock > 0) {
      const stockByYear = {}
      data.forEach(r => { stockByYear[r._yr] = (stockByYear[r._yr] || 0) + r._stock })
      const [topYear, topStock] = Object.entries(stockByYear).sort(([, a], [, b]) => b - a)[0]
      result.push({
        title: `${topYear} was your biggest stock year`,
        body: `$${money(topStock)} vested, ${mask((topStock / summary.stock * 100).toFixed(0))}% of all stock in this file. Stock that vests in large chunks can push those payslips into higher withholding.`,
        accent: 'purple',
      })
    }

    // Effective tax rate
    result.push({
      title: `Your effective tax rate is ${mask(summary.taxRate.toFixed(1))}%`,
      body: `That's total tax withheld divided by total gross pay across every payslip. Your marginal rate on regular pay is higher; bonuses and stock are often withheld at flat rates, which pulls the blended number around.`,
      accent: 'amber',
    })

    // RRSP coverage
    const rrspMonths = data.filter(r => r._rrsp > 0).length
    if (rrspMonths > 0 && rrspMonths < totalMonths * 0.8) {
      result.push({
        title: `RRSP contributions on ${rrspMonths} of ${totalMonths} payslips`,
        body: `You put in $${money(summary.rrsp_ee)}${summary.rrsp_er ? ` and your employer added $${money(summary.rrsp_er)}` : ''}. If your employer matches, payslips without a contribution can mean match left unclaimed.`,
        accent: 'blue',
      })
    }

    // Highest-paid month of the year
    const grossByMonth = Array(12).fill(0)
    data.forEach(r => { grossByMonth[parseInt(r._date.slice(5, 7), 10) - 1] += r._gross })
    const activeMonths = grossByMonth.filter(v => v > 0)
    if (activeMonths.length >= 6) {
      const top = grossByMonth.indexOf(Math.max(...grossByMonth))
      const avg = activeMonths.reduce((a, b) => a + b, 0) / activeMonths.length
      result.push({
        title: `${MONTH_NAMES[top]} is your highest-paid month`,
        body: `Gross pay on ${MONTH_NAMES[top]} payslips totals $${money(grossByMonth[top])} across the file, ${mask(((grossByMonth[top] / avg - 1) * 100).toFixed(0))}% above an average month. Worth planning big purchases and RRSP top-ups around it.`,
        accent: 'rose',
      })
    }

    // ESPP
    const esppMonths = data.filter(r => r._espp > 0).length
    if (summary.espp > 0) {
      result.push({
        title: `ESPP: $${money(summary.espp)} contributed across ${esppMonths} payslips`,
        body: `That's about $${money(summary.espp / esppMonths)} each time. Employee stock plans often buy at a discount, so check your plan's discount and contribution limit before deciding whether to put in more.`,
        accent: 'cyan',
      })
    }

    // Total comp growth across full years
    if (fullYears.length >= 2) {
      const first = fullYears[0]
      const last = fullYears[fullYears.length - 1]
      const y1 = totalFor(first)
      const yN = totalFor(last)
      const cagr = (Math.pow(yN / y1, 1 / (fullYears.length - 1)) - 1) * 100
      const salaryFirst = data.filter(r => r._yr === first).reduce((s, r) => s + r._salary, 0)
      const salaryLast = data.filter(r => r._yr === last).reduce((s, r) => s + r._salary, 0)
      const salaryCagr = (Math.pow(salaryLast / salaryFirst, 1 / (fullYears.length - 1)) - 1) * 100
      result.push({
        title: `Total pay grew ~${mask(cagr.toFixed(1))}% a year since ${first}`,
        body: `From $${money(y1)} in ${first} to $${money(yN)} in ${last}. Base salary alone grew ~${mask(salaryCagr.toFixed(1))}% a year, so the rest came from bonus and stock.`,
        accent: 'indigo',
      })
    }

    return result
  }, [data, summary, masked])

  if (!data.length) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-[#a0a0a0]">
        <div className="card-elevated flex flex-col items-center gap-4 px-8 py-10 text-center">
          {!loadError && <div className="h-10 w-10 animate-spin  border-2 border-[#333] border-t-[#33ff33]" />}
          <p className="text-sm text-[#888]">{loadError || 'Loading payslip data…'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-[#b0b0b0]" style={{ fontFamily: 'var(--font-mono)' }}>
      <header className="terminal-header sticky top-0 z-20">
        <div className="mx-auto max-w-7xl px-3 py-2 sm:px-6 lg:px-8">
          {/* Top line: brand + key metrics */}
          <div className="flex items-center justify-between gap-3 mb-1.5">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setMasked(m => !m)}
                className="text-[11px] whitespace-nowrap shrink-0 transition cursor-pointer select-none"
                style={{ color: masked ? '#ff3333' : '#33ff33' }}
                title={masked ? 'Click to reveal numbers' : 'Click to mask numbers'}
              >
                <span className="text-[#555]">~/</span>payslip-explorer<span className="animate-blink">_</span>
              </button>
              <span className="text-[10px] text-[#444] hidden sm:inline">{data.length} records · {shortDate(data[0]?.period_ending)} → {shortDate(data[data.length - 1]?.period_ending)}</span>
            </div>
            <div className="flex items-center gap-3 text-[11px] sm:text-xs whitespace-nowrap">
              <span className="text-[#444]">gross</span>
              <span className="font-semibold text-[#e0e0e0] tabular-nums">{fmtMoney(summary.totalGross)}</span>
              <span className="text-[#222]">|</span>
              <span className="text-[#444] hidden sm:inline">net</span>
              <span className="font-semibold text-[#e0e0e0] tabular-nums hidden sm:inline">{fmtMoney(summary.net)}</span>
              <span className="text-[#222] hidden sm:inline">|</span>
              <span className="text-[#444]">avg</span>
              <span className="font-semibold text-[#e0e0e0] tabular-nums">{fmtMoney(summary.net / Math.max(data.length, 1))}</span>
            </div>
          </div>

          {/* Bottom line: search + tabs */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 min-w-0">
              <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-[#33ff33]">$</span>
              <input
                type="text"
                placeholder="grep ..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
                className="w-full border border-[#1a1a1a] bg-black py-1.5 pl-7 pr-2.5 text-[11px] sm:text-xs text-[#e0e0e0] placeholder:text-[#333] outline-none transition focus:border-[#33ff33]/40 font-mono"
              />
            </div>
            <label
              className="inline-flex items-center gap-1 border border-[#1a1a1a] bg-black px-2 py-1 text-[10px] sm:text-[11px] text-[#555] hover:text-[#33ff33] cursor-pointer shrink-0 font-mono"
              title="Load a payslip CSV. It stays in your browser."
            >
              <Upload className="h-3 w-3" />
              <span className="hidden sm:inline">load csv</span>
              <input type="file" accept=".csv,text/csv" onChange={handleFile} className="sr-only" />
            </label>
            <div className="inline-flex gap-0 border border-[#1a1a1a] bg-black shrink-0">
              {VIEWS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setView(id)}
                  className={`inline-flex items-center gap-1 px-2 py-1 text-[10px] sm:text-[11px] transition whitespace-nowrap font-mono border-r border-[#1a1a1a] last:border-r-0 ${
                    view === id
                      ? 'bg-[#33ff33] text-black font-semibold'
                      : 'text-[#555] hover:bg-[#0a0a0a] hover:text-[#888]'
                  }`}
                >
                  <Icon className="h-3 w-3" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-6 lg:px-8" style={{ minHeight: 'calc(100vh - 80px)' }}>
        {(isSample || loadError) && (
          <p className="mb-4 border border-[#ffaa00]/40 bg-[#ffaa00]/5 px-3 py-2 text-[11px] sm:text-xs text-[#ffaa00]">
            {loadError || 'Showing made-up sample data. Use "load csv" above, or save your file as public/payslips.csv, to see your own.'}
          </p>
        )}
        {view === 'summary' && (
          <>
            {/* KPI cards — only in Summary */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-6">
              <div className="card px-4 py-3">
                <p className="text-[10px] sm:text-xs uppercase tracking-[0.16em] text-[#5c5c5c]">Payslips</p>
                <p className="mt-1 text-lg sm:text-xl font-semibold text-[#e0e0e0]">{data.length}</p>
              </div>
              <div className="card px-4 py-3">
                <p className="text-[10px] sm:text-xs uppercase tracking-[0.16em] text-[#5c5c5c]">First</p>
                <p className="mt-1 text-lg sm:text-xl font-semibold text-[#e0e0e0]">{shortDate(data[0]?.period_ending)}</p>
              </div>
              <div className="card px-4 py-3">
                <p className="text-[10px] sm:text-xs uppercase tracking-[0.16em] text-[#5c5c5c]">Latest</p>
                <p className="mt-1 text-lg sm:text-xl font-semibold text-[#e0e0e0]">{shortDate(data[data.length - 1]?.period_ending)}</p>
              </div>
              <div className="card px-4 py-3">
                <p className="text-[10px] sm:text-xs uppercase tracking-[0.16em] text-[#5c5c5c]">Net Avg</p>
                <p className="mt-1 text-lg sm:text-xl font-semibold text-[#e0e0e0]">{fmtMoney(summary.net / Math.max(data.length, 1))}</p>
              </div>
            </div>

            {/* 6 stat cards */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 mb-6">
              {stats.map((s, i) => (
                <div key={i} className="card px-4 py-3">
                  <p className="text-[10px] sm:text-xs uppercase tracking-[0.16em] text-[#5c5c5c]">{s.label}</p>
                  <p className={`mt-1 text-lg sm:text-xl font-semibold ${s.accent}`}>{s.value}</p>
                </div>
              ))}
            </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <SectionCard title="Earnings breakdown" subtitle="How compensation was composed across the archive">
              <div className="space-y-4">
                {[
                  { label: 'Regular Salary', value: summary.salary, pct: summary.salary / summary.totalGross * 100, color: 'bg-[#33ff33]' },
                  { label: 'Stock Awards (RSU)', value: summary.stock, pct: summary.stock / summary.totalGross * 100, color: 'bg-[#22cc22]' },
                  { label: 'Cash bonus', value: summary.cbi, pct: summary.cbi / summary.totalGross * 100, color: 'bg-[#1a991a]' },
                  { label: 'Share bonus', value: summary.shsuc, pct: summary.shsuc / summary.totalGross * 100, color: 'bg-[#117722]' },
                ].map(item => (
                  <div key={item.label}>
                    <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                      <span className="text-[#888]">{item.label}</span>
                      <span className="font-medium text-[#e0e0e0]">{fmtMoney(item.value)} <span className="text-[#5c5c5c]">({masked ? '••.•' : item.pct.toFixed(1)}%)</span></span>
                    </div>
                    <div className="h-2 overflow-hidden  bg-[#1a1a1a]">
                      <div className={`h-full  ${item.color}`} style={{ width: `${Math.max(item.pct, 1)}%` }} />
                    </div>
                  </div>
                ))}
                <div className="pt-4 text-sm font-semibold text-[#e0e0e0]">
                  Total gross compensation: {fmtMoney(summary.totalGross)}
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Where it goes" subtitle="A quick split of net pay, tax, retirement, and deductions">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Net Pay', value: summary.net },
                      { name: 'Income Tax', value: summary.tax },
                      { name: 'RRSP (EE+ER)', value: summary.rrsp_ee + summary.rrsp_er },
                      { name: 'CPP+EI', value: summary.cpp + summary.ei },
                      { name: 'ESPP', value: summary.espp },
                      { name: 'Other Deductions', value: summary.ltd + summary.hlth + summary.fitness },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={68}
                    outerRadius={108}
                    paddingAngle={2}
                    dataKey="value"
                    labelLine={false}
                  >
                    {[0,1,2,3,4,5].map(i => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie>
                  <Tooltip formatter={v => fmtMoney(v)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </SectionCard>

            <SectionCard title="Salary progression" subtitle="The app’s built-in timeline summary">
              <div className="space-y-3">
                {[
                  { period: 'Jul 2023 – Aug 2024', rate: '$6,064.17/pay', annual: '$157,668', months: '14 pays', change: '+0.0%' },
                  { period: 'Sep 2024 – Aug 2025', rate: '$6,160.00/pay', annual: '$160,160', months: '26 pays', change: '+1.6%' },
                  { period: 'Sep 2025 – Present', rate: '$6,264.17/pay', annual: '$162,868', months: '28 pays', change: '+1.7%' },
                ].map((s, i) => (
                  <div key={i} className=" border border-[#1a1a1a] bg-black/50 p-4 transition hover:border-[#333]">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium text-[#e0e0e0]">{s.period}</p>
                        <p className="mt-1 text-sm text-[#888]">{m(s.rate)} · {m(s.annual)}/yr · {s.months}</p>
                      </div>
                      <span className=" bg-[#33ff33]/10 px-3 py-1 text-sm font-medium text-[#33ff33]">{s.change}</span>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Bonus history" subtitle="Bonus payouts only appear when they exist">
              {bonusData.length === 0 ? (
                <p className="text-sm text-[#5c5c5c]">No bonuses found.</p>
              ) : (
                <div className="space-y-3">
                  {bonusData.map((b, i) => (
                    <div key={i} className="flex items-center justify-between  border border-[#1a1a1a] bg-black/50 p-4">
                      <span className="text-sm text-[#a0a0a0]">{b.date}</span>
                      <div className="text-right">
                        {b.cbi > 0 && <div className="text-sm font-medium text-[#33ff33]">Cash bonus {fmtMoney(b.cbi)}</div>}
                        {b.shsuc > 0 && <div className="text-sm font-medium text-[#33ff33]">Share bonus {fmtMoney(b.shsuc)}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </div>
          </>
        )}

        {view === 'salary' && (
          <SectionCard title="Salary & gross pay over time" subtitle="Bar charts make monthly totals easy to compare">
            <ResponsiveContainer width="100%" height={420}>
              <BarChart data={monthlyAvg}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={m => {
                  const [y, mo] = m.split('-')
                  const months = ['J','F','M','A','M','J','J','A','S','O','N','D']
                  return `${months[parseInt(mo)-1]}'${y.slice(2)}`
                }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={v => `$$${m((v/1000).toFixed(0))}k`} />
                <Tooltip contentStyle={{ background: '#000', border: '1px solid #1a1a1a', borderRadius: '12px' }} formatter={v => fmtMoney(v)} />
                <Bar dataKey="salary" name="Salary" fill="#33ff33" radius={[8,8,0,0]} />
                <Bar dataKey="stock" name="Stock (RSU)" fill="#1d991d" radius={[8,8,0,0]} />
                <Bar dataKey="net" name="Net Pay" fill="#22cc22" radius={[8,8,0,0]} />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </SectionCard>
        )}

        {view === 'stock' && (
          <SectionCard title="RSU vesting history" subtitle={`${data.filter(r => r._stock > 0).length} payslips contained stock awards`}>
            <p className="mb-5 text-sm text-[#888]">Total RSU vested: {fmtMoney(summary.stock)}</p>
            <ResponsiveContainer width="100%" height={420}>
              <BarChart data={data.filter(r => r._stock > 0)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                <XAxis dataKey="_date" tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={d => {
                  const [y, mo] = d.split('-')
                  const months = ['J','F','M','A','M','J','J','A','S','O','N','D']
                  return `${months[parseInt(mo)-1]}'${y.slice(2)}`
                }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={v => `$$${m((v/1000).toFixed(0))}k`} />
                <Tooltip contentStyle={{ background: '#000', border: '1px solid #1a1a1a', borderRadius: '12px' }} formatter={v => fmtMoney(v)} />
                <Bar dataKey="_stock" name="RSU Value" fill="#1d991d" radius={[10,10,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </SectionCard>
        )}

        {view === 'bonus' && (
          <SectionCard title="Bonus events" subtitle="Cash and share bonus timing over the full archive">
            <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="card px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-[#5c5c5c]">Total cash bonus</p>
                <p className="mt-1 text-2xl font-semibold text-[#33ff33]">{fmtMoney(summary.cbi)}</p>
              </div>
              <div className="card px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-[#5c5c5c]">Total share bonus</p>
                <p className="mt-1 text-2xl font-semibold text-[#33ff33]">{fmtMoney(summary.shsuc)}</p>
              </div>
              <div className="card px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-[#5c5c5c]">Total bonuses</p>
                <p className="mt-1 text-2xl font-semibold text-[#e0e0e0]">{fmtMoney(summary.cbi + summary.shsuc)}</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={bonusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={v => `$$${m((v/1000).toFixed(0))}k`} />
                <Tooltip contentStyle={{ background: '#000', border: '1px solid #1a1a1a', borderRadius: '12px' }} formatter={v => fmtMoney(v)} />
                <Bar dataKey="cbi" name="Cash bonus" fill="#22cc22" radius={[8,8,0,0]} />
                <Bar dataKey="shsuc" name="Share bonus" fill="#117722" radius={[8,8,0,0]} />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </SectionCard>
        )}

        {view === 'tax' && (
          <div className="space-y-6">
            <SectionCard title="Tax & deductions over time" subtitle="Where the money goes each pay period">
              <ResponsiveContainer width="100%" height={420}>
                <BarChart data={monthlyAvg}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                  <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={m => {
                    const [y, mo] = m.split('-')
                    const months = ['J','F','M','A','M','J','J','A','S','O','N','D']
                    return `${months[parseInt(mo)-1]}'${y.slice(2)}`
                  }} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={v => `$$${m((v/1000).toFixed(0))}k`} />
                  <Tooltip contentStyle={{ background: '#000', border: '1px solid #1a1a1a', borderRadius: '12px' }} formatter={v => fmtMoney(v)} />
                  <Bar dataKey="net" name="Net Pay" fill="#22cc22" radius={[8,8,0,0]} />
                  <Legend />
                </BarChart>
              </ResponsiveContainer>
            </SectionCard>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {[
                { label: 'Total Tax Withheld', value: summary.tax, color: 'text-[#33ff33]' },
                { label: 'Total CPP', value: summary.cpp, color: 'text-orange-300' },
                { label: 'Total EI', value: summary.ei, color: 'text-[#33ff33]' },
                { label: 'Total RRSP (EE)', value: summary.rrsp_ee, color: 'text-[#33ff33]' },
                { label: 'Total RRSP (ER)', value: summary.rrsp_er, color: 'text-[#33ff33]' },
                { label: 'Total ESPP', value: summary.espp, color: 'text-[#33ff33]' },
              ].map(c => (
                <StatCard key={c.label} label={c.label} value={fmtMoney(c.value)} icon={ScrollText} accent={c.color} />
              ))}
            </div>
          </div>
        )}

        {view === 'table' && (
          <SectionCard title="Detailed payslip table" subtitle="Sortable, searchable, and tuned for scanning through the archive">
            <div className="overflow-hidden  border border-[#1a1a1a]">
              <div className="max-h-[600px] overflow-auto">
                <table className="min-w-full text-sm">
                  <thead className="sticky top-0 z-10 bg-[#080808] text-xs uppercase tracking-[0.16em] text-[#888]">
                    <tr>
                      {[
                        { label: 'Date', key: '_date' },
                        { label: 'Salary', key: '_salary' },
                        { label: 'Cash bonus', key: '_cbi' },
                        { label: 'Share bonus', key: '_shsuc' },
                        { label: 'Stock', key: '_stock' },
                        { label: 'Gross', key: '_gross' },
                        { label: 'Tax', key: '_tax' },
                        { label: 'CPP', key: '_cpp' },
                        { label: 'EI', key: '_ei' },
                        { label: 'RRSP EE', key: '_rrsp' },
                        { label: 'ESPP', key: '_espp' },
                        { label: 'Net', key: '_net' },
                        { label: 'Rate', key: '_tax_rate' },
                      ].map(col => (
                        <th
                          key={col.key}
                          className="cursor-pointer px-3 py-3 text-right whitespace-nowrap transition hover:text-[#e0e0e0]"
                          onClick={() => {
                            if (sortField === col.key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
                            else { setSortField(col.key); setSortDir('asc') }
                          }}
                        >
                          {col.label} {sortField === col.key && (sortDir === 'asc' ? '▲' : '▼')}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1a1a1a] bg-black/40">
                    {paged.map((r, i) => (
                      <tr key={i} className="transition hover:bg-white/[0.02]">
                        <td className="whitespace-nowrap px-3 py-3 text-[#a0a0a0]">{shortDate(r.period_ending)}</td>
                        <td className="px-3 py-3 text-right text-[#e4e4e4]">{r._salary ? fmtMoney(r._salary) : '—'}</td>
                        <td className="px-3 py-3 text-right text-[#a0a0a0]">{r._cbi ? fmtMoney(r._cbi) : '—'}</td>
                        <td className="px-3 py-3 text-right text-[#a0a0a0]">{r._shsuc ? fmtMoney(r._shsuc) : '—'}</td>
                        <td className="px-3 py-3 text-right text-[#a0a0a0]">{r._stock ? fmtMoney(r._stock) : '—'}</td>
                        <td className="px-3 py-3 text-right font-medium text-[#e0e0e0]">{fmtMoney(r._gross)}</td>
                        <td className="px-3 py-3 text-right text-[#666]">{r._tax ? `-${fmtMoney(r._tax)}` : '—'}</td>
                        <td className="px-3 py-3 text-right text-[#555]">{r._cpp ? `-${fmtMoney(r._cpp)}` : '—'}</td>
                        <td className="px-3 py-3 text-right text-[#555]">{r._ei ? `-${fmtMoney(r._ei)}` : '—'}</td>
                        <td className="px-3 py-3 text-right text-[#666]">{r._rrsp ? `-${fmtMoney(r._rrsp)}` : '—'}</td>
                        <td className="px-3 py-3 text-right text-[#555]">{r._espp ? `-${fmtMoney(r._espp)}` : '—'}</td>
                        <td className="px-3 py-3 text-right font-semibold text-[#33ff33]">{fmtMoney(r._net)}</td>
                        <td className="px-3 py-3 text-right text-[#5c5c5c]">{m(r._tax_rate.toFixed(1))}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {sorted.length > perPage && (
                <div className="flex items-center justify-between border-t border-[#1a1a1a] bg-black/70 px-4 py-3">
                  <span className="text-sm text-[#888]">Showing {Math.min(page * perPage, sorted.length)} of {sorted.length}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="inline-flex items-center gap-2  border border-[#1a1a1a] bg-[#080808] px-3 py-2 text-sm text-[#a0a0a0] transition hover:border-[#333] hover:text-[#e0e0e0] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronLeft className="h-4 w-4" /> Prev
                    </button>
                    <button
                      onClick={() => setPage(p => p + 1)}
                      className="inline-flex items-center gap-2 border border-[#33ff33] bg-black px-3 py-2 text-sm text-[#33ff33] transition hover:bg-[#33ff33] hover:text-black font-mono"
                    >
                      Load more <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </SectionCard>
        )}

        {view === 'insights' && (
          <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
            {insights.map((insight, i) => {
              const accentMap = {
                emerald: 'border-[#33ff33]/30 from-[#33ff33]/5',
                purple: 'border-[#33ff33]/30 from-[#33ff33]/5',
                amber: 'border-[#33ff33]/30 from-[#33ff33]/5',
                blue: 'border-[#33ff33]/30 from-[#33ff33]/5',
                rose: 'border-[#33ff33]/30 from-[#33ff33]/5',
                cyan: 'border-[#33ff33]/30 from-[#33ff33]/5',
                indigo: 'border-[#33ff33]/30 from-[#33ff33]/5',
              }
              const iconMap = {
                emerald: '💸', purple: '📈', amber: '🧠', blue: '🏦', rose: '📅', cyan: '💡', indigo: '🚀',
              }
              return (
                <div key={i} className={`terminal-card overflow-hidden border-l-2 ${accentMap[insight.accent]} animate-slide-up`}
                  style={{ animationDelay: `${i * 80}ms` }}>
                  <div className={`bg-gradient-to-br ${accentMap[insight.accent]} to-transparent p-5 sm:p-6`}>
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{iconMap[insight.accent]}</span>
                      <div>
                        <h3 className="text-base sm:text-lg font-semibold text-[#e0e0e0] leading-snug">{insight.title}</h3>
                        <p className="mt-2 text-sm leading-relaxed text-[#a0a0a0]">{insight.body}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

      </main>
    </div>
  )
}
