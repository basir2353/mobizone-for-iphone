import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth";
import { API_BASE } from "../../api";
import { MzCard, MzScreenTitle } from "../components/ui";
import { MzShell } from "../MzShell";
import { useMobizoneDb } from "../useMobizone";

const LINKS = [
  { to: "/scan", title: "Scan & capture", note: "IMEI · CNIC · face photo" },
  { to: "/stock", title: "Stock / Inventory", note: "In-stock phones & IMEI" },
  { to: "/reports", title: "Reports", note: "Profit, dues, balances" },
  { to: "/expenses", title: "Create Expense", note: "Record by expense account" },
  { to: "/expense-accounts", title: "Account Expense", note: "Rent, Electricity, Food…" },
  { to: "/contra", title: "Contra Voucher", note: "Cash ↔ Bank transfer" },
  { to: "/general-voucher", title: "General Voucher", note: "Double entry + documents" },
  { to: "/receipt-settings", title: "Bill print settings", note: "Thermal receipt layout" },
  { to: "/sale", title: "New sale", note: "Sell + WhatsApp receipt" },
  { to: "/purchase", title: "Purchase entry", note: "Buy phone · add stock" },
  { to: "/customers", title: "Customers", note: "CNIC / phone book" },
] as const;

export function MorePage() {
  const nav = useNavigate();
  const { claims, logout } = useAuth();
  const { db } = useMobizoneDb();

  return (
    <MzShell>
      <div className="mz-page">
        <MzScreenTitle title="More" subtitle="Shop tools & settings" />
        <MzCard className="mz-user-card">
          <div className="mz-stock-ico">MZ</div>
          <div>
            <strong>{claims?.role ? `Signed in · ${claims.role}` : "Shop user"}</strong>
            <p className="mz-muted">Main · Connected · branch MAIN</p>
          </div>
        </MzCard>

        {LINKS.map((link) => (
          <Link key={link.to} to={link.to} className="mz-more-link">
            <div>
              <strong>{link.title}</strong>
              <span>{link.note}</span>
            </div>
            <span>›</span>
          </Link>
        ))}

        <p className="mz-footer-meta">
          API {API_BASE}
          <br />
          Banks {db.bankAccounts.length} · Devices {db.devices.length} · MobiZone iPhone
        </p>

        <button
          type="button"
          className="mz-btn-danger"
          onClick={() => {
            logout();
            nav("/login", { replace: true });
          }}
        >
          Sign out
        </button>
      </div>
    </MzShell>
  );
}
