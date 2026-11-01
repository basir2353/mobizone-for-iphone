import { useMemo, useState } from "react";
import {
  MzCard,
  MzDateRangeChips,
  MzEmpty,
  MzField,
  MzInput,
  MzPrimaryButton,
  MzScreenTitle,
  MzSection,
} from "../components/ui";
import { pickReferenceDocuments } from "../documentPick";
import { MzShell } from "../MzShell";
import {
  filterByDateRange,
  formatPkr,
  getCashBankBalances,
  monthStartDateInput,
  recordContraVoucher,
  todayDateInput,
  type MoneyAccountRef,
} from "../storeCore";
import type { MobizoneDocumentAttachment } from "../types";
import { useMobizoneDb } from "../useMobizone";

function parseRef(value: string): MoneyAccountRef {
  if (value === "cash") return { kind: "cash" };
  return { kind: "bank", accountId: value };
}

export function ContraPage() {
  const { branchCode, db, refresh, ready } = useMobizoneDb();
  const balances = useMemo(() => getCashBankBalances(db), [db]);
  const [from, setFrom] = useState("cash");
  const [to, setTo] = useState(db.bankAccounts[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [attachments, setAttachments] = useState<MobizoneDocumentAttachment[]>([]);
  const [fromDate, setFromDate] = useState(monthStartDateInput);
  const [toDate, setToDate] = useState(todayDateInput);

  const history = useMemo(
    () =>
      filterByDateRange(
        (db.vouchers ?? []).filter((v) => v.kind === "contra"),
        fromDate || null,
        toDate || null,
      ),
    [db.vouchers, fromDate, toDate],
  );

  const moneyOptions = [
    { id: "cash", label: "Cash on hand" },
    ...db.bankAccounts.map((a) => ({ id: a.id, label: `${a.bankName} — ${a.accountTitle}` })),
  ];

  async function onPickDocs(): Promise<void> {
    try {
      setAttachments(await pickReferenceDocuments(attachments));
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Could not pick file");
    }
  }

  function onSave(): void {
    if (!ready) return;
    if (!to) {
      window.alert("Select the To account.");
      return;
    }
    try {
      recordContraVoucher(branchCode, {
        from: parseRef(from),
        to: parseRef(to),
        amountPkr: Number(amount),
        reference: reference || null,
        note: note || null,
        attachments,
      });
      refresh();
      window.alert("Contra voucher saved.");
      setAmount("");
      setReference("");
      setNote("");
      setAttachments([]);
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Could not save");
    }
  }

  return (
    <MzShell>
      <div className="mz-page">
        <MzScreenTitle
          title="Contra Voucher"
          subtitle="Transfer money between Cash and Bank accounts"
        />
        <MzCard className="mz-navy-stat">
          <p className="mz-eyebrow light">CASH ON HAND</p>
          <p className="mz-big-teal">{formatPkr(balances.cash)}</p>
        </MzCard>

        <MzSection title="New contra entry">
          <p className="mz-label">From account *</p>
          <div className="mz-chip-row wrap">
            {moneyOptions.map((o) => (
              <button
                key={`from-${o.id}`}
                type="button"
                className={`mz-pill ${from === o.id ? "is-active" : ""}`}
                onClick={() => setFrom(o.id)}
              >
                {o.label}
              </button>
            ))}
          </div>
          <p className="mz-label">To account *</p>
          <div className="mz-chip-row wrap">
            {moneyOptions.map((o) => (
              <button
                key={`to-${o.id}`}
                type="button"
                className={`mz-pill ${to === o.id ? "is-active" : ""}`}
                onClick={() => setTo(o.id)}
              >
                {o.label}
              </button>
            ))}
          </div>
          <MzField label="Amount (PKR) *">
            <MzInput value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder="0" />
          </MzField>
          <MzField label="Reference">
            <MzInput value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Deposit slip / txn id" />
          </MzField>
          <MzField label="Details">
            <MzInput value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional note" />
          </MzField>
          <button type="button" className="mz-btn-secondary" onClick={() => void onPickDocs()}>
            Attach document ({attachments.length})
          </button>
          <MzPrimaryButton label="Save contra" onClick={onSave} />
        </MzSection>

        <MzSection title="History">
          <MzDateRangeChips
            fromDate={fromDate}
            toDate={toDate}
            onChange={(f, t) => {
              setFromDate(f);
              setToDate(t);
            }}
          />
        </MzSection>
        {history.length === 0 ? (
          <MzEmpty title="No contra vouchers" />
        ) : (
          history
            .slice()
            .reverse()
            .map((v) => (
              <MzCard key={v.id} className="mz-recent">
                <div>
                  <strong>{formatPkr(v.amountPkr)}</strong>
                  <p className="mz-muted">
                    {v.lines.map((l) => `${l.side} ${l.accountName}`).join(" · ")}
                  </p>
                </div>
                <span className="mz-muted">{new Date(v.createdAt).toLocaleDateString()}</span>
              </MzCard>
            ))
        )}
      </div>
    </MzShell>
  );
}
