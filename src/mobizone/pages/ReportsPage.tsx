import { useMemo, useState } from "react";
import { MzCard, MzDateRangeChips, MzScreenTitle, MzSection } from "../components/ui";
import { MzShell } from "../MzShell";
import { formatPkr, getBusinessReport, monthStartDateInput, todayDateInput } from "../storeCore";
import { useMobizoneDb } from "../useMobizone";

export function ReportsPage() {
  const { branchCode } = useMobizoneDb();
  const [from, setFrom] = useState(monthStartDateInput);
  const [to, setTo] = useState(todayDateInput);

  const report = useMemo(
    () => getBusinessReport(branchCode, from || "1970-01-01", to || todayDateInput()),
    [branchCode, from, to],
  );
  const profitPct =
    report.saleAmountPkr > 0
      ? Math.round((report.profitPkr / report.saleAmountPkr) * 1000) / 10
      : 0;

  return (
    <MzShell>
      <div className="mz-page">
        <MzScreenTitle title="Reports" subtitle="Profit & Loss · dues · cash/bank" />
        <MzSection title="Date filter">
          <MzDateRangeChips
            fromDate={from}
            toDate={to}
            onChange={(f, t) => {
              setFrom(f);
              setTo(t);
            }}
          />
        </MzSection>

        <MzCard className="mz-navy-stat">
          <p className="mz-eyebrow light">NET PROFIT</p>
          <p className="mz-big-teal">{formatPkr(report.profitPkr)}</p>
          <p className="mz-muted light">Margin {profitPct}% · expenses already deducted</p>
        </MzCard>

        <div className="mz-tile-grid">
          <div className="mz-tile">
            <span>Purchase</span>
            <strong className="tone-rose">{formatPkr(report.purchaseAmountPkr)}</strong>
          </div>
          <div className="mz-tile">
            <span>Sales</span>
            <strong className="tone-teal">{formatPkr(report.saleAmountPkr)}</strong>
          </div>
          <div className="mz-tile">
            <span>Gross profit</span>
            <strong>{formatPkr(report.grossProfitPkr)}</strong>
          </div>
          <div className="mz-tile">
            <span>Expenses</span>
            <strong className="tone-rose">{formatPkr(report.expenseTotalPkr)}</strong>
          </div>
        </div>

        {[
          { label: "Stock value (maal)", value: formatPkr(report.stockValuePkr) },
          { label: "Cash Balance", value: formatPkr(report.cashBalancePkr) },
          { label: "Bank Balance", value: formatPkr(report.bankBalancePkr) },
          { label: "To receive", value: formatPkr(report.receivablesPkr) },
          { label: "To pay", value: formatPkr(report.payablesPkr) },
          { label: "Sale Count", value: String(report.saleCount) },
          { label: "Purchase Count", value: String(report.purchaseCount) },
        ].map((row) => (
          <MzCard key={row.label} className="mz-recent">
            <span className="mz-muted">{row.label}</span>
            <strong>{row.value}</strong>
          </MzCard>
        ))}
      </div>
    </MzShell>
  );
}
