import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  MzCard,
  MzEmpty,
  MzField,
  MzInput,
  MzPrimaryButton,
  MzScreenTitle,
  MzSection,
} from "../components/ui";
import { MzShell } from "../MzShell";
import { formatPkr, seedExpenseAccounts, upsertExpenseAccount } from "../storeCore";
import { useMobizoneDb } from "../useMobizone";

export function ExpenseAccountsPage() {
  const { branchCode, db, refresh, ready } = useMobizoneDb();
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [editId, setEditId] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || !branchCode) return;
    seedExpenseAccounts(branchCode);
    refresh();
  }, [ready, branchCode, refresh]);

  const accounts = db.expenseAccounts ?? [];
  const expenses = db.expenses ?? [];

  function spendFor(accountId: string, accountName: string): number {
    return expenses
      .filter(
        (x) =>
          x.accountId === accountId || x.title.toLowerCase() === accountName.toLowerCase(),
      )
      .reduce((a, x) => a + x.amountPkr, 0);
  }

  function onSave(): void {
    if (!ready) return;
    try {
      upsertExpenseAccount(branchCode, {
        id: editId ?? undefined,
        name,
        notes: notes || null,
      });
      refresh();
      window.alert(editId ? "Account updated." : "Expense account created.");
      setName("");
      setNotes("");
      setEditId(null);
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Could not save");
    }
  }

  return (
    <MzShell>
      <div className="mz-page">
        <MzScreenTitle
          title="Account Expense"
          subtitle="Create categories: Rent, Electricity, Food, Salary…"
        />
        <Link to="/expenses" className="mz-link">
          Go to Create Expense ›
        </Link>
        <MzSection title={editId ? "Edit account" : "New expense account"}>
          <MzField label="Account name *">
            <MzInput value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Rent" />
          </MzField>
          <MzField label="Notes">
            <MzInput value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" />
          </MzField>
          <MzPrimaryButton label={editId ? "Update account" : "Save account"} onClick={onSave} />
          {editId ? (
            <button
              type="button"
              className="mz-btn-ghost"
              onClick={() => {
                setEditId(null);
                setName("");
                setNotes("");
              }}
            >
              Cancel edit
            </button>
          ) : null}
        </MzSection>
        {accounts.length === 0 ? (
          <MzEmpty title="No expense accounts yet" />
        ) : (
          accounts.map((a) => (
            <MzCard key={a.id} className="mz-recent">
              <div>
                <strong>{a.name}</strong>
                <p className="mz-muted">Total spent: {formatPkr(spendFor(a.id, a.name))}</p>
              </div>
              <button
                type="button"
                className="mz-link"
                onClick={() => {
                  setEditId(a.id);
                  setName(a.name);
                  setNotes(a.notes ?? "");
                }}
              >
                Edit
              </button>
            </MzCard>
          ))
        )}
      </div>
    </MzShell>
  );
}
