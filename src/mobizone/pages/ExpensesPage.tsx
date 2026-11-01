import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  MzCard,
  MzChip,
  MzDateRangeChips,
  MzEmpty,
  MzField,
  MzInput,
  MzPrimaryButton,
  MzScreenTitle,
  MzSection,
} from "../components/ui";
import { MzShell } from "../MzShell";
import {
  filterByDateRange,
  formatPkr,
  monthStartDateInput,
  recordExpense,
  seedExpenseAccounts,
  todayDateInput,
} from "../storeCore";
import { useMobizoneDb } from "../useMobizone";

export function ExpensesPage() {
  const { branchCode, db, refresh, ready } = useMobizoneDb();
  const [accountId, setAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"cash" | "bank">("cash");
  const [bankAccountId, setBankAccountId] = useState("");
  const [note, setNote] = useState("");
  const [filterAccountId, setFilterAccountId] = useState("");
  const [fromDate, setFromDate] = useState(monthStartDateInput);
  const [toDate, setToDate] = useState(todayDateInput);

  useEffect(() => {
    if (!ready || !branchCode) return;
    seedExpenseAccounts(branchCode);
    refresh();
  }, [ready, branchCode, refresh]);

  const accounts = db.expenseAccounts ?? [];
  const filtered = useMemo(() => {
    let rows = filterByDateRange(db.expenses ?? [], fromDate || null, toDate || null);
    if (filterAccountId) {
      const name = (accounts.find((a) => a.id === filterAccountId)?.name ?? "").toLowerCase();
      rows = rows.filter(
        (x) => x.accountId === filterAccountId || x.title.toLowerCase() === name,
      );
    }
    return rows;
  }, [db.expenses, filterAccountId, accounts, fromDate, toDate]);
  const total = filtered.reduce((a, x) => a + x.amountPkr, 0);

  function onSave(): void {
    if (!ready) return;
    if (!accountId) {
      window.alert("Select an expense account first.");
      return;
    }
    if (!(Number(amount) > 0)) {
      window.alert("Enter a valid amount.");
      return;
    }
    const resolvedBankId =
      bankAccountId ||
      (method === "bank" && db.bankAccounts.length === 1 ? db.bankAccounts[0]!.id : "");
    if (method === "bank" && !resolvedBankId) {
      window.alert("Select the bank account money was paid from.");
      return;
    }
    try {
      recordExpense(branchCode, {
        accountId,
        amountPkr: Number(amount),
        method,
        bankAccountId: method === "bank" ? resolvedBankId || null : null,
        note: note.trim() || null,
      });
      refresh();
      window.alert("Expense saved.");
      setAmount("");
      setNote("");
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Could not save expense");
    }
  }

  return (
    <MzShell>
      <div className="mz-page">
        <MzScreenTitle
          title="Create Expense"
          subtitle="Select account (Rent, Electricity…) — account name is the title"
        />
        <Link to="/expense-accounts" className="mz-link">
          Manage Account Expense ›
        </Link>
        <MzCard className="mz-navy-stat">
          <p className="mz-eyebrow light">FILTERED TOTAL</p>
          <p className="mz-big-teal">{formatPkr(total)}</p>
        </MzCard>

        <MzSection title="New expense">
          <p className="mz-label">Expense account *</p>
          <div className="mz-chip-row wrap">
            {accounts.map((a) => (
              <button
                key={a.id}
                type="button"
                className={`mz-pill ${accountId === a.id ? "is-active" : ""}`}
                onClick={() => setAccountId(a.id)}
              >
                {a.name}
              </button>
            ))}
          </div>
          <MzField label="Amount (PKR) *">
            <MzInput value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder="0" />
          </MzField>
          <div className="mz-chip-row">
            <MzChip
              label="Cash"
              active={method === "cash"}
              onClick={() => {
                setMethod("cash");
                setBankAccountId("");
              }}
            />
            <MzChip label="Bank" active={method === "bank"} onClick={() => setMethod("bank")} />
          </div>
          {method === "bank" ? (
            <div className="mz-chip-row wrap">
              {db.bankAccounts.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  className={`mz-pill dark ${bankAccountId === a.id ? "is-active" : ""}`}
                  onClick={() => setBankAccountId(a.id)}
                >
                  {a.bankName}
                </button>
              ))}
            </div>
          ) : null}
          <MzField label="Note">
            <MzInput value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional" />
          </MzField>
          <MzPrimaryButton label="Save expense" onClick={onSave} />
        </MzSection>

        <MzSection title="History filter">
          <MzDateRangeChips
            fromDate={fromDate}
            toDate={toDate}
            onChange={(f, t) => {
              setFromDate(f);
              setToDate(t);
            }}
          />
          <div className="mz-chip-row wrap">
            <MzChip label="All accounts" active={!filterAccountId} onClick={() => setFilterAccountId("")} />
            {accounts.map((a) => (
              <MzChip
                key={a.id}
                label={a.name}
                active={filterAccountId === a.id}
                onClick={() => setFilterAccountId(a.id)}
              />
            ))}
          </div>
        </MzSection>

        {filtered.length === 0 ? (
          <MzEmpty title="No expenses in range" />
        ) : (
          filtered
            .slice()
            .reverse()
            .map((x) => (
              <MzCard key={x.id} className="mz-recent">
                <div>
                  <strong>{x.title}</strong>
                  <p className="mz-muted">
                    {x.method} · {new Date(x.createdAt).toLocaleDateString()}
                    {x.note ? ` · ${x.note}` : ""}
                  </p>
                </div>
                <strong className="tone-rose">{formatPkr(x.amountPkr)}</strong>
              </MzCard>
            ))
        )}
      </div>
    </MzShell>
  );
}
