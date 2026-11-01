import { useMemo, useState } from "react";
import {
  MzCard,
  MzChip,
  MzEmpty,
  MzField,
  MzInput,
  MzPrimaryButton,
  MzScreenTitle,
  MzSection,
} from "../components/ui";
import { MzShell } from "../MzShell";
import { formatPkr, upsertCustomer } from "../storeCore";
import { useMobizoneDb } from "../useMobizone";

export function CustomersPage() {
  const { branchCode, db, refresh } = useMobizoneDb();
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"all" | "due" | "add">("all");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [cnic, setCnic] = useState("");
  const [address, setAddress] = useState("");

  const filtered = useMemo(() => {
    let rows = db.customers;
    if (tab === "due") rows = rows.filter((c) => (c.pendingPkr || 0) > 0);
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter(
      (c) =>
        c.name.toLowerCase().includes(needle) ||
        (c.phone ?? "").includes(needle) ||
        (c.cnic ?? "").includes(needle),
    );
  }, [db.customers, q, tab]);

  function onAdd(): void {
    if (!name.trim()) {
      window.alert("Name required");
      return;
    }
    upsertCustomer(branchCode, {
      name: name.trim(),
      phone: phone.trim() || null,
      cnic: cnic.trim() || null,
      address: address.trim() || null,
    });
    refresh();
    setName("");
    setPhone("");
    setCnic("");
    setAddress("");
    setTab("all");
    window.alert("Customer added");
  }

  return (
    <MzShell>
      <div className="mz-page">
        <MzScreenTitle
          title="Customers"
          subtitle="Search name, phone or CNIC"
          right={
            <button type="button" className="mz-btn-primary" onClick={() => setTab("add")}>
              + Add
            </button>
          }
        />
        {tab !== "add" ? (
          <>
            <div className="mz-chip-row">
              <MzChip label="All Customers" active={tab === "all"} onClick={() => setTab("all")} />
              <MzChip label="Outstanding" active={tab === "due"} onClick={() => setTab("due")} />
            </div>
            <MzInput
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name, phone or CNIC"
            />
            {filtered.length === 0 ? (
              <MzEmpty
                title="No customers yet"
                note="CNIC / phone book yahan manage hoga"
                actionLabel="Add Customer"
                onAction={() => setTab("add")}
              />
            ) : (
              filtered.map((c) => (
                <MzCard key={c.id} className="mz-user-card">
                  <div className="mz-avatar">{c.name.slice(0, 1).toUpperCase()}</div>
                  <div className="grow">
                    <strong>{c.name}</strong>
                    <p className="mz-muted">
                      {c.phone || "No phone"}
                      {c.cnic ? ` · ${c.cnic}` : ""}
                    </p>
                  </div>
                  <strong className={(c.pendingPkr || 0) > 0 ? "tone-rose" : "tone-teal"}>
                    {(c.pendingPkr || 0) > 0 ? formatPkr(c.pendingPkr) : "Clear"}
                  </strong>
                </MzCard>
              ))
            )}
          </>
        ) : (
          <MzSection title="New customer">
            <MzField label="Name *">
              <MzInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Customer name" />
            </MzField>
            <MzField label="Phone">
              <MzInput value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="03XXXXXXXXX" />
            </MzField>
            <MzField label="CNIC">
              <MzInput value={cnic} onChange={(e) => setCnic(e.target.value)} placeholder="XXXXX-XXXXXXX-X" />
            </MzField>
            <MzField label="Address">
              <MzInput value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address" />
            </MzField>
            <MzPrimaryButton label="Save Customer" onClick={onAdd} />
            <button type="button" className="mz-btn-ghost" onClick={() => setTab("all")}>
              Cancel
            </button>
          </MzSection>
        )}
      </div>
    </MzShell>
  );
}
