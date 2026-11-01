import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MzShell } from "../MzShell";
import { formatPkr, getPositionMoneyHistory, getTotalPosition } from "../storeCore";
import { useMobizoneDb } from "../useMobizone";
import { MzCard, MzEmpty, MzNavyHeader } from "../components/ui";

type MoreAction = {
  title: string;
  note: string;
  to: string;
  metric?: "sales" | "purchase" | "profit" | "due";
};

const MORE: MoreAction[] = [
  { title: "Customers", note: "CNIC book", to: "/customers" },
  { title: "Stock", note: "IMEI list", to: "/stock" },
  { title: "Today Sales", note: "Live", to: "/reports", metric: "sales" },
  { title: "Today Buy", note: "Live", to: "/reports", metric: "purchase" },
  { title: "Profit", note: "Today", to: "/reports", metric: "profit" },
  { title: "Due", note: "Receivable", to: "/reports", metric: "due" },
  { title: "Create Expense", note: "By account", to: "/expenses" },
  { title: "Account Expense", note: "Categories", to: "/expense-accounts" },
  { title: "Contra", note: "Cash ↔ Bank", to: "/contra" },
  { title: "General Voucher", note: "Double entry", to: "/general-voucher" },
  { title: "Bill print", note: "Receipt", to: "/receipt-settings" },
];

export function HomePage() {
  const nav = useNavigate();
  const { dashboard, db, ready } = useMobizoneDb();
  const [bucket, setBucket] = useState<"all" | "cash" | "bank" | "stock">("all");
  const position = useMemo(() => getTotalPosition(db), [db]);
  const moneyLines = useMemo(() => getPositionMoneyHistory(db, 12), [db]);
  const filteredLines = useMemo(() => {
    if (bucket === "all" || bucket === "stock") return moneyLines;
    return moneyLines.filter((l) =>
      bucket === "cash"
        ? l.cashInPkr > 0 || l.cashOutPkr > 0
        : l.bankInPkr > 0 || l.bankOutPkr > 0,
    );
  }, [moneyLines, bucket]);

  const todayLabel = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const recent = [...db.sales, ...db.purchases]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  function metricValue(key?: MoreAction["metric"]): string | null {
    if (!key || !dashboard) return null;
    if (key === "sales") return formatPkr(dashboard.todaySalesPkr);
    if (key === "purchase") return formatPkr(dashboard.todayPurchasesPkr);
    if (key === "profit") return formatPkr(dashboard.todayProfitPkr);
    return formatPkr(dashboard.pendingReceivablesPkr);
  }

  return (
    <MzShell>
      <div className="mz-page">
        <MzNavyHeader
          title="Main Shop"
          subtitle={`Order counter · ${todayLabel}`}
          right={
            <button type="button" className="mz-icon-btn" onClick={() => nav("/scan")}>
              ⌖
            </button>
          }
        />

        <p className="mz-eyebrow">ORDER NOW</p>
        <Link to="/sale" className="mz-order-cta mz-order-cta--sale">
          <span className="mz-order-eyebrow">PRIMARY ORDER</span>
          <span className="mz-order-title">New Sale</span>
          <span className="mz-order-note">Sell phone · cash / bank / udhaar</span>
          <span className="mz-order-arrow">›</span>
        </Link>
        <Link to="/purchase" className="mz-order-cta mz-order-cta--buy">
          <span className="mz-order-eyebrow">STOCK ORDER</span>
          <span className="mz-order-title">Purchase</span>
          <span className="mz-order-note">Buy phone · IMEI into stock</span>
          <span className="mz-order-arrow">›</span>
        </Link>
        <Link to="/scan" className="mz-scan-link">
          <span className="mz-scan-ico">⎋</span>
          <span>
            <strong>Scan IMEI / CNIC</strong>
            <small>Barcode · ID camera · face photo</small>
          </span>
          <span>›</span>
        </Link>

        <div className="mz-position">
          <div className="mz-position-top">
            <p className="mz-eyebrow light">INVESTMENT · TOTAL POSITION</p>
            <p className="mz-position-value">{formatPkr(position.investmentPkr)}</p>
            <p className="mz-position-sub">Cash (gale) + Bank + Stock (maal)</p>
            <div className="mz-position-cards">
              {(
                [
                  { id: "cash" as const, label: "Cash", value: position.cashPkr },
                  { id: "bank" as const, label: "Bank", value: position.bankPkr },
                  { id: "stock" as const, label: "Stock", value: position.stockValuePkr },
                ] as const
              ).map((card) => (
                <button
                  key={card.id}
                  type="button"
                  className={`mz-position-card ${bucket === card.id ? "is-active" : ""}`}
                  onClick={() => setBucket((b) => (b === card.id ? "all" : card.id))}
                >
                  <span>{card.label}</span>
                  <strong>{formatPkr(card.value)}</strong>
                </button>
              ))}
            </div>
          </div>
          <div className="mz-position-bottom">
            <p className="mz-eyebrow">RECEIVE IN / OUT</p>
            {filteredLines.length === 0 ? (
              <p className="mz-muted">No money moves yet</p>
            ) : (
              filteredLines.slice(0, 6).map((line) => (
                <div key={line.id} className="mz-money-line">
                  <strong>{line.label}</strong>
                  <span className="mz-muted">
                    {line.cashInPkr > 0 ? `Cash in ${formatPkr(line.cashInPkr)}  ` : ""}
                    {line.cashOutPkr > 0 ? `Cash out ${formatPkr(line.cashOutPkr)}  ` : ""}
                    {line.bankInPkr > 0 ? `Bank in ${formatPkr(line.bankInPkr)}  ` : ""}
                    {line.bankOutPkr > 0 ? `Bank out ${formatPkr(line.bankOutPkr)}` : ""}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <p className="mz-eyebrow">ALL MODULES</p>
        <div className="mz-tile-grid">
          {MORE.map((a) => (
            <Link key={a.title} to={a.to} className="mz-tile">
              <strong>{a.title}</strong>
              <span>{metricValue(a.metric) ?? a.note}</span>
            </Link>
          ))}
        </div>

        <div className="mz-row-between">
          <h2 className="mz-h2">Recent orders</h2>
          <Link to="/reports" className="mz-link">
            View all
          </Link>
        </div>
        {!ready ? <p className="mz-muted">Loading…</p> : null}
        {recent.length === 0 ? (
          <MzEmpty
            title="No orders yet"
            note="Upar se New Sale ya Purchase dabao"
            actionLabel="New Sale"
            onAction={() => nav("/sale")}
          />
        ) : (
          recent.map((row) => {
            const isSale = "pricePkr" in row;
            const cash = row.payment?.cashPkr || 0;
            const bank = row.payment?.bankPkr || 0;
            const due = row.remainingPkr || 0;
            return (
              <MzCard key={row.id} className="mz-recent">
                <div>
                  <strong>
                    {isSale ? "Sale" : "Buy"} · {row.brand} {row.model}
                  </strong>
                  <p className="mz-muted">
                    Cash {formatPkr(cash)} · Bank {formatPkr(bank)}
                    {due > 0 ? ` · Due ${formatPkr(due)}` : ""}
                  </p>
                </div>
                <strong className={isSale ? "tone-teal" : "tone-orange"}>
                  {formatPkr(isSale ? row.pricePkr : row.purchasePricePkr)}
                </strong>
              </MzCard>
            );
          })
        )}
      </div>
    </MzShell>
  );
}
