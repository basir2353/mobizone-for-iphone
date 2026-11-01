import { useEffect, useMemo, useState } from "react";
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
  monthStartDateInput,
  recordGeneralVoucher,
  seedExpenseAccounts,
  todayDateInput,
  type GeneralVoucherLineInput,
} from "../storeCore";
import type { MobizoneDocumentAttachment } from "../types";
import { useMobizoneDb } from "../useMobizone";

type LineDraft = {
  accountKind: GeneralVoucherLineInput["accountKind"];
  accountId: string;
  side: "debit" | "credit";
  amount: string;
};

const emptyLine = (side: "debit" | "credit"): LineDraft => ({
  accountKind: "customer",
  accountId: "",
  side,
  amount: "",
});

export function GeneralVoucherPage() {
  const { branchCode, db, refresh, ready } = useMobizoneDb();
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [attachments, setAttachments] = useState<MobizoneDocumentAttachment[]>([]);
  const [lines, setLines] = useState<LineDraft[]>([emptyLine("debit"), emptyLine("credit")]);
  const [fromDate, setFromDate] = useState(monthStartDateInput);
  const [toDate, setToDate] = useState(todayDateInput);

  useEffect(() => {
    if (!ready || !branchCode) return;
    seedExpenseAccounts(branchCode);
    refresh();
  }, [ready, branchCode, refresh]);

  const history = useMemo(
    () =>
      filterByDateRange(
        (db.vouchers ?? []).filter((v) => v.kind === "general"),
        fromDate || null,
        toDate || null,
      ),
    [db.vouchers, fromDate, toDate],
  );

  const totals = useMemo(() => {
    let debit = 0;
    let credit = 0;
    for (const l of lines) {
      const n = Number(l.amount) || 0;
      if (l.side === "debit") debit += n;
      else credit += n;
    }
    return { debit, credit, balanced: Math.abs(debit - credit) < 0.001 && debit > 0 };
  }, [lines]);

  function accountOptions(kind: LineDraft["accountKind"]): { id: string; label: string }[] {
    if (kind === "cash") return [{ id: "cash", label: "Cash on hand" }];
    if (kind === "bank") return db.bankAccounts.map((a) => ({ id: a.id, label: `${a.bankName}` }));
    if (kind === "customer") return db.customers.map((c) => ({ id: c.id, label: c.name }));
    if (kind === "shopkeeper") {
      return db.shopkeepers.map((s) => ({ id: s.id, label: `Shop ${s.shopNo} — ${s.name}` }));
    }
    return (db.expenseAccounts ?? []).map((a) => ({ id: a.id, label: a.name }));
  }

  function updateLine(index: number, patch: Partial<LineDraft>): void {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  }

  async function onPickDocs(): Promise<void> {
    try {
      setAttachments(await pickReferenceDocuments(attachments));
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Could not pick file");
    }
  }

  function onSave(): void {
    if (!ready) return;
    try {
      recordGeneralVoucher(branchCode, {
        lines: lines.map((l) => ({
          accountKind: l.accountKind,
          accountId: l.accountKind === "cash" ? null : l.accountId || null,
          side: l.side,
          amountPkr: Number(l.amount),
        })),
        reference: reference || null,
        note: note || null,
        attachments,
      });
      refresh();
      window.alert("General voucher saved.");
      setLines([emptyLine("debit"), emptyLine("credit")]);
      setReference("");
      setNote("");
      setAttachments([]);
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Could not save");
    }
  }

  const kinds: LineDraft["accountKind"][] = [
    "customer",
    "shopkeeper",
    "expense",
    "cash",
    "bank",
  ];

  return (
    <MzShell>
      <div className="mz-page">
        <MzScreenTitle
          title="General Voucher"
          subtitle="Double-entry across customers, suppliers, expenses, cash & bank"
        />
        <MzSection title="New general voucher">
          <MzField label="Reference">
            <MzInput value={reference} onChange={(e) => setReference(e.target.value)} placeholder="JV-001" />
          </MzField>
          <MzField label="Details">
            <MzInput value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional note" />
          </MzField>

          {lines.map((line, index) => {
            const opts = accountOptions(line.accountKind);
            return (
              <div key={index} className="mz-line-box">
                <p className="mz-label">LINE {index + 1}</p>
                <div className="mz-chip-row">
                  {(["debit", "credit"] as const).map((side) => (
                    <button
                      key={side}
                      type="button"
                      className={`mz-pill dark ${line.side === side ? "is-active" : ""}`}
                      onClick={() => updateLine(index, { side })}
                    >
                      {side}
                    </button>
                  ))}
                </div>
                <div className="mz-chip-row wrap">
                  {kinds.map((k) => (
                    <button
                      key={k}
                      type="button"
                      className={`mz-pill ${line.accountKind === k ? "is-active" : ""}`}
                      onClick={() => updateLine(index, { accountKind: k, accountId: "" })}
                    >
                      {k}
                    </button>
                  ))}
                </div>
                {line.accountKind !== "cash" ? (
                  <select
                    className="mz-input"
                    value={line.accountId}
                    onChange={(e) => updateLine(index, { accountId: e.target.value })}
                  >
                    <option value="">Select account</option>
                    {opts.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                ) : null}
                <MzField label="Amount">
                  <MzInput
                    value={line.amount}
                    onChange={(e) => updateLine(index, { amount: e.target.value })}
                    inputMode="decimal"
                    placeholder="0"
                  />
                </MzField>
              </div>
            );
          })}

          <button
            type="button"
            className="mz-btn-secondary"
            onClick={() => setLines((prev) => [...prev, emptyLine("debit")])}
          >
            + Add line
          </button>
          <p className={totals.balanced ? "tone-teal" : "tone-rose"}>
            Debit {formatPkr(totals.debit)} · Credit {formatPkr(totals.credit)}
            {totals.balanced ? " · Balanced" : " · Not balanced"}
          </p>
          <button type="button" className="mz-btn-secondary" onClick={() => void onPickDocs()}>
            Attach document ({attachments.length})
          </button>
          <MzPrimaryButton label="Save voucher" onClick={onSave} disabled={!totals.balanced} />
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
          <MzEmpty title="No general vouchers" />
        ) : (
          history
            .slice()
            .reverse()
            .map((v) => (
              <MzCard key={v.id} className="mz-recent">
                <div>
                  <strong>{v.reference || "JV"} · {formatPkr(v.amountPkr)}</strong>
                  <p className="mz-muted">{v.note || v.lines.map((l) => l.accountName).join(", ")}</p>
                </div>
                <span className="mz-muted">{new Date(v.createdAt).toLocaleDateString()}</span>
              </MzCard>
            ))
        )}
      </div>
    </MzShell>
  );
}
