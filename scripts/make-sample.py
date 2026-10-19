"""Generate public/sample-payslips.csv: three years of made-up biweekly
payslips for a fictional employee. No real data. Re-run to regenerate:

    python3 scripts/make-sample.py
"""
import csv
import datetime as dt
import random
from pathlib import Path

random.seed(7)
OUT = Path(__file__).resolve().parent.parent / "public" / "sample-payslips.csv"

FIELDS = [
    "pay_date", "pay_number", "salary", "stock_award", "cash_bonus", "share_bonus",
    "gross_pay", "income_tax", "cpp", "ei", "rrsp_employee", "rrsp_employer",
    "espp", "ltd", "health_dental", "fitness_reimbursement", "total_deductions",
    "net_pay", "tax_rate_pct",
]

base = {2023: 98_000, 2024: 101_000, 2025: 104_500}
cash_bonus = {2023: 9_200, 2024: 11_800, 2025: 13_400}
share_bonus = {2024: 4_000, 2025: 5_500}
stock_per_vest = {2023: 3_100, 2024: 5_200, 2025: 5_900}
CPP_MAX, EI_MAX = 3_867.50, 1_049.12

day = dt.date(2023, 1, 13)
rows, n = [], 0
cpp_ytd = ei_ytd = 0.0
year = day.year
while day.year <= 2025:
    if day.year != year:
        year, cpp_ytd, ei_ytd = day.year, 0.0, 0.0
    n += 1
    salary = round(base[year] / 26, 2)
    first_of_quarter_month = day.month in (2, 5, 8, 11) and day.day <= 14
    stock = round(stock_per_vest[year] * random.uniform(0.95, 1.05), 2) if first_of_quarter_month else 0.0
    sept = day.month == 9 and day.day <= 14
    cb = float(cash_bonus[year]) if sept else 0.0
    sb = float(share_bonus.get(year, 0)) if sept else 0.0
    gross = round(salary + stock + cb + sb, 2)
    tax = round(salary * 0.24 + (stock + cb + sb) * 0.40, 2)
    cpp = round(min(gross * 0.0595, CPP_MAX - cpp_ytd), 2)
    ei = round(min(gross * 0.0166, EI_MAX - ei_ytd), 2)
    cpp_ytd += cpp
    ei_ytd += ei
    # A stretch without RRSP contributions, so the insights have a gap to find.
    rrsp = 0.0 if dt.date(2024, 3, 1) <= day <= dt.date(2024, 7, 1) else round(salary * 0.05, 2)
    rrsp_er = rrsp
    espp = round(salary * 0.06, 2) if day.month in (3, 4, 5, 6, 9, 10, 11, 12) else 0.0
    ltd, health = 21.40, 38.75
    fitness = 150.0 if day.month == 6 and day.day <= 14 else 0.0
    deductions = round(cpp + ei + rrsp + espp + ltd + health, 2)
    # Stock is withheld and settled in shares, so it isn't paid out as cash.
    net = round(gross - stock - tax - deductions + fitness + stock * 0.40, 2)
    rows.append({
        "pay_date": day.isoformat(), "pay_number": f"{day.year}-{n:03d}",
        "salary": salary, "stock_award": stock, "cash_bonus": cb, "share_bonus": sb,
        "gross_pay": gross, "income_tax": tax, "cpp": cpp, "ei": ei,
        "rrsp_employee": rrsp, "rrsp_employer": rrsp_er, "espp": espp,
        "ltd": ltd, "health_dental": health, "fitness_reimbursement": fitness,
        "total_deductions": deductions, "net_pay": net,
        "tax_rate_pct": round(tax / gross * 100, 1),
    })
    day += dt.timedelta(days=14)

with OUT.open("w", newline="") as f:
    w = csv.DictWriter(f, fieldnames=FIELDS)
    w.writeheader()
    w.writerows(rows)
print(f"wrote {len(rows)} rows to {OUT}")
