# Payslip Explorer

A terminal-style dashboard for your payslips. Point it at a CSV of your pay history and it charts salary, stock, bonuses, tax and deductions over time, with a few plain-English insights on top.

It runs entirely in your browser. Your CSV is read locally and never uploaded anywhere. Click the `~/payslip-explorer_` title to mask every number when you're sharing your screen.

Built for Canadian payslips (CPP, EI, RRSP), but any payslip works if you fill in the columns you have.

## Quick start

Requires Node.js 20 or later.

```sh
git clone https://github.com/bhaumikkaji/payslip-explorer.git
cd payslip-explorer
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173). You'll see made-up sample data first, so you can try everything before adding your own.

## Use your own payslips

Either:

- click **load csv** in the header and pick your file, or
- save it as `public/payslips.csv` and refresh. That path is gitignored, so it won't get committed.

## CSV format

One row per payslip, with a header row. Only `pay_date` is required. Leave out any column you don't have, and amounts can include commas.

| Column | Meaning |
|---|---|
| `pay_date` | Pay period end date, `YYYY-MM-DD` (or `DD.MM.YYYY`) |
| `pay_number` | Your payslip or period number (optional, searchable) |
| `salary` | Regular salary for the period |
| `stock_award` | Value of stock (RSUs) that vested on this payslip |
| `cash_bonus` | Cash bonus paid on this payslip |
| `share_bonus` | Any other bonus, e.g. one paid in shares |
| `gross_pay` | Total gross. If blank, it's salary + stock + bonuses |
| `income_tax` | Income tax withheld |
| `cpp` | CPP contribution |
| `ei` | EI premium |
| `rrsp_employee` | Your RRSP contribution |
| `rrsp_employer` | Your employer's RRSP contribution or match |
| `espp` | Employee stock purchase plan deduction |
| `ltd` | Long-term disability premium |
| `health_dental` | Health and dental premium |
| `fitness_reimbursement` | Any reimbursement paid back to you |
| `total_deductions` | All deductions combined |
| `net_pay` | What landed in your bank account |
| `tax_rate_pct` | Tax as a percentage of gross. If blank, it's worked out |

See `public/sample-payslips.csv` for a full example.

### Getting your payslips into a CSV

Most payroll portals only give you PDFs. The fastest route is to ask an AI agent to do it: point it at this repo's `AGENTS.md` and your folder of payslip PDFs, and it will extract each one into this format. Or copy the numbers in by hand into a spreadsheet and export it as CSV.

## Views

- **Summary:** earnings breakdown, where the money goes, salary progression, bonus history
- **Salary, Stock, Bonus, Tax:** charts over time
- **Table:** every payslip, sortable and searchable
- **Insights:** effective tax rate, biggest stock year, highest-paid month, RRSP gaps, ESPP, and growth across full years

## Scripts

```sh
npm run dev      # start the dev server
npm run build    # production build to dist/
npm run lint     # ESLint
python3 scripts/make-sample.py   # regenerate the sample CSV
```

## License

MIT
