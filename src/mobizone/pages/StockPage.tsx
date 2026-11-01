import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MzBadge, MzCard, MzEmpty, MzInput, MzScreenTitle } from "../components/ui";
import { MzShell } from "../MzShell";
import { formatPkr } from "../storeCore";
import { useMobizoneDb } from "../useMobizone";

export function StockPage() {
  const nav = useNavigate();
  const { db } = useMobizoneDb();
  const [q, setQ] = useState("");

  const stock = useMemo(() => {
    const rows = db.devices.filter((d) => d.status === "in_stock");
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter(
      (d) =>
        d.brand.toLowerCase().includes(needle) ||
        d.model.toLowerCase().includes(needle) ||
        d.imei.toLowerCase().includes(needle),
    );
  }, [db.devices, q]);

  const newCount = stock.filter((d) => d.condition === "new").length;
  const usedCount = stock.length - newCount;

  return (
    <MzShell>
      <div className="mz-page">
        <MzScreenTitle
          title="Stock"
          subtitle={`${stock.length} in stock · New ${newCount} · Used ${usedCount}`}
          right={
            <button type="button" className="mz-btn-primary" onClick={() => nav("/purchase")}>
              + Add
            </button>
          }
        />
        <MzInput
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Type IMEI, brand, model"
          autoCapitalize="off"
        />
        <div className="mz-stat-pills">
          <div className="mz-stat-pill">
            <span>In stock</span>
            <strong>{stock.length}</strong>
          </div>
          <div className="mz-stat-pill">
            <span>New</span>
            <strong>{newCount}</strong>
          </div>
          <div className="mz-stat-pill">
            <span>Used</span>
            <strong>{usedCount}</strong>
          </div>
        </div>
        {stock.length === 0 ? (
          <MzEmpty title="No stock yet" note="Purchase se phone add karein" actionLabel="Purchase" onAction={() => nav("/purchase")} />
        ) : (
          stock.map((d) => (
            <MzCard key={d.id} className="mz-stock-row">
              <div className="mz-stock-ico">PHONE</div>
              <div className="mz-stock-body">
                <div className="mz-row-gap">
                  <strong>
                    {d.brand} {d.model}
                  </strong>
                  <MzBadge label={d.condition} tone={d.condition === "new" ? "teal" : "orange"} />
                </div>
                <p className="mz-muted">
                  IMEI {d.imei}
                  {d.colour ? ` · ${d.colour}` : ""}
                  {d.storage ? ` · ${d.storage}` : ""}
                </p>
                <p className="mz-muted">Cost {formatPkr(d.purchasePricePkr)}</p>
              </div>
              <div className="mz-stock-price">
                <strong>{formatPkr(d.salePricePkr ?? d.purchasePricePkr)}</strong>
                <span>sale</span>
                <Link to={`/sale?imei=${encodeURIComponent(d.imei)}`} className="mz-link">
                  Sell
                </Link>
              </div>
            </MzCard>
          ))
        )}
      </div>
    </MzShell>
  );
}
