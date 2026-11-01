import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { MzAttachStrip, type AttachBundle } from "../components/MzAttachStrip";
import { MzImeiScanField } from "../components/MzImeiScan";
import {
  MzChip,
  MzField,
  MzInput,
  MzPrimaryButton,
  MzRow,
  MzScreenTitle,
  MzSection,
} from "../components/ui";
import { MzShell } from "../MzShell";
import { normalizeImeiScan } from "../normalizeImei";
import { loadMobizoneReceiptSettings, resolveWhatsAppTarget } from "../receiptSettings";
import {
  buildWhatsAppSaleText,
  findDeviceByImei,
  formatPkr,
  openWhatsApp,
  printSaleReceipt,
  recordSale,
} from "../storeCore";
import { useMobizoneDb } from "../useMobizone";

export function SalePage() {
  const { branchCode, db, refresh, ready } = useMobizoneDb();
  const [params] = useSearchParams();
  const inStock = useMemo(() => db.devices.filter((d) => d.status === "in_stock"), [db.devices]);

  const [scan, setScan] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerCnic, setCustomerCnic] = useState("");
  const [attach, setAttach] = useState<AttachBundle>({
    photoDataUrl: null,
    cnicFrontDataUrl: null,
    cnicBackDataUrl: null,
    otherPhotoDataUrl: null,
  });
  const [price, setPrice] = useState("");
  const [cash, setCash] = useState("");
  const [bank, setBank] = useState("");
  const [bankAccountId, setBankAccountId] = useState("");
  const [payMode, setPayMode] = useState<"cash" | "bank" | "split" | "udhaar">("cash");
  const [dueDate, setDueDate] = useState("");
  const [warrantyDays, setWarrantyDays] = useState("0");
  const [shareWa, setShareWa] = useState(true);

  useEffect(() => {
    setShareWa(loadMobizoneReceiptSettings(branchCode).whatsappDefaultOn);
  }, [branchCode, ready]);

  useEffect(() => {
    if (!bankAccountId && db.bankAccounts.length === 1) {
      setBankAccountId(db.bankAccounts[0]!.id);
    }
  }, [db.bankAccounts, bankAccountId]);

  useEffect(() => {
    const fromScan = normalizeImeiScan(params.get("imei") ?? "");
    if (!fromScan) return;
    setScan(fromScan);
    const found = findDeviceByImei(branchCode, fromScan);
    if (found && found.status === "in_stock") {
      setDeviceId(found.id);
      setPrice(String(found.salePricePkr ?? found.purchasePricePkr));
    }
  }, [params, branchCode]);

  const selected = inStock.find((d) => d.id === deviceId) ?? null;
  const priceN = Number(price) || 0;
  const cashN = payMode === "bank" || payMode === "udhaar" ? 0 : Number(cash) || 0;
  const bankN = payMode === "cash" || payMode === "udhaar" ? 0 : Number(bank) || 0;
  const remaining = Math.max(0, priceN - cashN - bankN);

  function applyScan(raw = scan): void {
    if (!ready) return;
    const code = normalizeImeiScan(raw);
    setScan(code);
    const found = findDeviceByImei(branchCode, code);
    if (!found || found.status !== "in_stock") {
      window.alert("No in-stock device matched that IMEI / barcode.");
      return;
    }
    setDeviceId(found.id);
    setPrice(String(found.salePricePkr ?? found.purchasePricePkr));
  }

  function onSave(): void {
    if (!ready) {
      window.alert("Data abhi load ho raha hai — 1 second baad try karein.");
      return;
    }
    if (!deviceId || !customerName.trim() || !(priceN > 0)) {
      window.alert("Select a phone, customer name, and sale price.");
      return;
    }
    if (!customerPhone.trim()) {
      window.alert("Customer phone bill / WhatsApp ke liye zaroori hai.");
      return;
    }
    const resolvedBankId =
      bankAccountId || (bankN > 0 && db.bankAccounts.length === 1 ? db.bankAccounts[0]!.id : "");
    if (bankN > 0 && !resolvedBankId) {
      window.alert("Bank amount ke liye account select karein.");
      return;
    }
    if (remaining > 0 && !dueDate.trim()) {
      window.alert("Udhaar / remaining balance ke liye due date likhein (YYYY-MM-DD).");
      return;
    }
    const acc = db.bankAccounts.find((a) => a.id === resolvedBankId);
    try {
      const sale = recordSale(branchCode, {
        deviceId,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim() || null,
        customerAddress: customerAddress.trim() || null,
        customerCnic: customerCnic.trim() || null,
        customerPhotoDataUrl: attach.photoDataUrl,
        cnicFrontDataUrl: attach.cnicFrontDataUrl,
        cnicBackDataUrl: attach.cnicBackDataUrl,
        pricePkr: priceN,
        dueDate: remaining > 0 ? dueDate.trim() : null,
        warrantyDays: Number(warrantyDays) || 0,
        payment: {
          cashPkr: cashN,
          bankPkr: bankN,
          bank:
            bankN > 0
              ? {
                  bankAccountId: resolvedBankId,
                  bankName: acc?.bankName ?? null,
                  accountTitle: acc?.accountTitle ?? null,
                  verified: true,
                }
              : undefined,
        },
      });
      refresh();
      void printSaleReceipt(sale, branchCode);
      if (shareWa) {
        const settings = loadMobizoneReceiptSettings(branchCode);
        openWhatsApp(
          resolveWhatsAppTarget(sale.customerPhone, settings),
          buildWhatsAppSaleText(sale, branchCode),
        );
      }
      window.alert(`Sale saved: ${sale.brand} ${sale.model} · ${formatPkr(sale.pricePkr)}`);
      setDeviceId("");
      setCustomerName("");
      setCustomerPhone("");
      setCustomerAddress("");
      setCustomerCnic("");
      setAttach({ photoDataUrl: null, cnicFrontDataUrl: null, cnicBackDataUrl: null, otherPhotoDataUrl: null });
      setPrice("");
      setCash("");
      setBank("");
      setScan("");
      setDueDate("");
      setWarrantyDays("0");
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Could not save sale");
    }
  }

  return (
    <MzShell>
      <div className="mz-page">
        <MzScreenTitle title="New Sale" subtitle="Select phone · customer · cash / bank / udhaar" />
        {!ready ? <p className="mz-muted">Loading…</p> : null}

        <MzSection title="Phone">
          <MzField label="Scan IMEI / Barcode">
            <MzImeiScanField value={scan} onChange={setScan} onApply={applyScan} />
          </MzField>
          <MzField label="Select Mobile">
            <div className="mz-chip-row wrap">
              {inStock.length === 0 ? (
                <span className="mz-muted">No stock — add a purchase first</span>
              ) : (
                inStock.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    className={`mz-pill ${deviceId === d.id ? "is-active" : ""}`}
                    onClick={() => {
                      setDeviceId(d.id);
                      setPrice(String(d.salePricePkr ?? d.purchasePricePkr));
                    }}
                  >
                    {d.brand} {d.model}
                    {d.storage ? ` · ${d.storage}` : ""}
                  </button>
                ))
              )}
            </div>
            {selected ? (
              <p className="mz-teal">
                IMEI {selected.imei}
                {selected.imei2 ? ` / ${selected.imei2}` : ""}
                {selected.colour ? ` · ${selected.colour}` : ""}
                {" · Cost "}
                {formatPkr(selected.purchasePricePkr)}
              </p>
            ) : null}
          </MzField>
        </MzSection>

        <MzSection title="Customer">
          <MzField label="Customer Name *">
            <MzInput value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Customer full name" />
          </MzField>
          <MzField label="Phone *">
            <MzInput value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} inputMode="tel" placeholder="03XXXXXXXXX" />
          </MzField>
          <MzField label="CNIC / ID">
            <MzInput value={customerCnic} onChange={(e) => setCustomerCnic(e.target.value)} placeholder="xxxxx-xxxxxxx-x" />
          </MzField>
          <MzField label="Address">
            <MzInput value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} placeholder="Customer address" />
          </MzField>
          <MzAttachStrip value={attach} onChange={setAttach} photoLabel="Customer photo" />
        </MzSection>

        <MzSection title="Payment">
          <MzField label="Sale Price">
            <MzInput value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" placeholder="0" />
          </MzField>
          <MzField label="Warranty (days)">
            <MzInput value={warrantyDays} onChange={(e) => setWarrantyDays(e.target.value)} inputMode="numeric" placeholder="0" />
          </MzField>
          <div className="mz-chip-row wrap">
            {(
              [
                ["cash", "Cash"],
                ["bank", "Bank"],
                ["split", "Split"],
                ["udhaar", "Udhaar"],
              ] as const
            ).map(([m, label]) => (
              <MzChip
                key={m}
                label={label}
                active={payMode === m}
                onClick={() => {
                  setPayMode(m);
                  if (m === "udhaar") {
                    setCash("");
                    setBank("");
                  }
                }}
              />
            ))}
          </div>
          {payMode === "cash" || payMode === "split" ? (
            <MzField label="Cash Received">
              <MzInput value={cash} onChange={(e) => setCash(e.target.value)} inputMode="decimal" placeholder="0" />
            </MzField>
          ) : null}
          {payMode === "bank" || payMode === "split" ? (
            <>
              <MzField label="Bank Received">
                <MzInput value={bank} onChange={(e) => setBank(e.target.value)} inputMode="decimal" placeholder="0" />
              </MzField>
              <MzField label="Bank Account">
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
              </MzField>
            </>
          ) : null}
          {remaining > 0 ? (
            <MzField label="Due date (udhaar)">
              <MzInput type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </MzField>
          ) : null}
          <div className="mz-summary">
            <MzRow label="Sale Price" value={formatPkr(priceN)} />
            <MzRow label="Received" value={formatPkr(cashN + bankN)} tone="#0F9B8E" />
            <MzRow
              label="Remaining balance"
              value={formatPkr(remaining)}
              tone={remaining > 0 ? "#E11D48" : "#0F9B8E"}
            />
          </div>
          <label className="mz-check">
            <input type="checkbox" checked={shareWa} onChange={(e) => setShareWa(e.target.checked)} />
            Share receipt on WhatsApp
          </label>
        </MzSection>

        <MzPrimaryButton label="Save Sale · Print bill" onClick={onSave} />
      </div>
    </MzShell>
  );
}
