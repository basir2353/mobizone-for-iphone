import { useEffect, useState } from "react";
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
  buildWhatsAppPurchaseText,
  formatPkr,
  openWhatsApp,
  printPurchaseReceipt,
  recordPurchase,
} from "../storeCore";
import { useMobizoneDb } from "../useMobizone";

export function PurchasePage() {
  const { branchCode, db, refresh, ready } = useMobizoneDb();
  const [params] = useSearchParams();

  const [sellerName, setSellerName] = useState("");
  const [sellerPhone, setSellerPhone] = useState("");
  const [sellerCnic, setSellerCnic] = useState("");
  const [sellerAddress, setSellerAddress] = useState("");
  const [attach, setAttach] = useState<AttachBundle>({
    photoDataUrl: null,
    cnicFrontDataUrl: null,
    cnicBackDataUrl: null,
    otherPhotoDataUrl: null,
  });
  const [imei, setImei] = useState("");
  const [imei2, setImei2] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [colour, setColour] = useState("");
  const [batteryHealth, setBatteryHealth] = useState("");
  const [etc, setEtc] = useState("");
  const [storage, setStorage] = useState("");
  const [condition, setCondition] = useState<"new" | "used">("used");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [cash, setCash] = useState("");
  const [bank, setBank] = useState("");
  const [bankAccountId, setBankAccountId] = useState("");
  const [payMode, setPayMode] = useState<"cash" | "bank" | "split" | "udhaar">("cash");
  const [dueDate, setDueDate] = useState("");
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
    if (fromScan) setImei(fromScan);
  }, [params]);

  const priceN = Number(purchasePrice) || 0;
  const cashN = payMode === "bank" || payMode === "udhaar" ? 0 : Number(cash) || 0;
  const bankN = payMode === "cash" || payMode === "udhaar" ? 0 : Number(bank) || 0;
  const remaining = Math.max(0, priceN - cashN - bankN);

  function onSave(): void {
    if (!ready) {
      window.alert("Data abhi load ho raha hai — 1 second baad try karein.");
      return;
    }
    if (!sellerName.trim() || !imei.trim() || !brand.trim() || !model.trim() || !(priceN > 0)) {
      window.alert("Seller, IMEI, brand, model, and purchase price required.");
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
      const purchase = recordPurchase(branchCode, {
        sellerName: sellerName.trim(),
        sellerPhone: sellerPhone.trim() || null,
        sellerCnic: sellerCnic.trim() || null,
        sellerAddress: sellerAddress.trim() || null,
        sellerPhotoDataUrl: attach.photoDataUrl,
        cnicFrontDataUrl: attach.cnicFrontDataUrl,
        cnicBackDataUrl: attach.cnicBackDataUrl,
        imei: imei.trim(),
        imei2: imei2.trim() || null,
        brand: brand.trim(),
        model: model.trim(),
        colour: colour.trim() || null,
        batteryHealth: batteryHealth.trim() || null,
        etc: etc.trim() || null,
        storage: storage.trim() || null,
        condition,
        purchasePricePkr: priceN,
        salePricePkr: Number(salePrice) || null,
        dueDate: remaining > 0 ? dueDate.trim() : null,
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
      void printPurchaseReceipt(purchase, branchCode);
      if (shareWa) {
        const settings = loadMobizoneReceiptSettings(branchCode);
        openWhatsApp(
          resolveWhatsAppTarget(purchase.sellerPhone, settings),
          buildWhatsAppPurchaseText(purchase, branchCode),
        );
      }
      window.alert(`${purchase.brand} ${purchase.model} added to stock`);
      setSellerName("");
      setSellerPhone("");
      setSellerCnic("");
      setSellerAddress("");
      setAttach({ photoDataUrl: null, cnicFrontDataUrl: null, cnicBackDataUrl: null, otherPhotoDataUrl: null });
      setImei("");
      setImei2("");
      setBrand("");
      setModel("");
      setColour("");
      setBatteryHealth("");
      setEtc("");
      setStorage("");
      setPurchasePrice("");
      setSalePrice("");
      setCash("");
      setBank("");
      setDueDate("");
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Could not save purchase");
    }
  }

  return (
    <MzShell>
      <div className="mz-page">
        <MzScreenTitle title="New Purchase" subtitle="Seller · IMEI · Used/New · split payment" />
        {!ready ? <p className="mz-muted">Loading…</p> : null}

        <MzSection title="Seller details">
          <MzField label="Seller Name *">
            <MzInput value={sellerName} onChange={(e) => setSellerName(e.target.value)} placeholder="Seller / shop name" />
          </MzField>
          <MzField label="Seller Phone">
            <MzInput value={sellerPhone} onChange={(e) => setSellerPhone(e.target.value)} inputMode="tel" placeholder="03XXXXXXXXX" />
          </MzField>
          <MzField label="CNIC / ID">
            <MzInput value={sellerCnic} onChange={(e) => setSellerCnic(e.target.value)} placeholder="xxxxx-xxxxxxx-x" />
          </MzField>
          <MzField label="Address">
            <MzInput value={sellerAddress} onChange={(e) => setSellerAddress(e.target.value)} placeholder="Address" />
          </MzField>
          <MzAttachStrip value={attach} onChange={setAttach} photoLabel="Seller photo" />
        </MzSection>

        <MzSection title="Phone details">
          <MzField label="Scan or type IMEI *">
            <MzImeiScanField
              value={imei}
              onChange={setImei}
              onApply={(v) => setImei(normalizeImeiScan(v))}
            />
          </MzField>
          <MzField label="IMEI 2 (optional)">
            <MzInput value={imei2} onChange={(e) => setImei2(e.target.value)} placeholder="Second IMEI" autoCapitalize="off" />
          </MzField>
          <div className="mz-grid-2">
            <MzField label="Brand *">
              <MzInput value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Samsung" />
            </MzField>
            <MzField label="Model *">
              <MzInput value={model} onChange={(e) => setModel(e.target.value)} placeholder="A54" />
            </MzField>
          </div>
          <div className="mz-grid-2">
            <MzField label="Colour">
              <MzInput value={colour} onChange={(e) => setColour(e.target.value)} placeholder="Black" />
            </MzField>
            <MzField label="Storage">
              <MzInput value={storage} onChange={(e) => setStorage(e.target.value)} placeholder="128GB" />
            </MzField>
          </div>
          <MzField label="Battery health">
            <MzInput value={batteryHealth} onChange={(e) => setBatteryHealth(e.target.value)} placeholder="e.g. 87%" />
          </MzField>
          <MzField label="Etc / accessories note">
            <MzInput value={etc} onChange={(e) => setEtc(e.target.value)} placeholder="Box / Non PTA / notes" />
          </MzField>
          <div className="mz-chip-row">
            <MzChip label="Used" active={condition === "used"} onClick={() => setCondition("used")} />
            <MzChip label="New" active={condition === "new"} onClick={() => setCondition("new")} />
          </div>
        </MzSection>

        <MzSection title="Payment details">
          <MzField label="Purchase Price *">
            <MzInput value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} inputMode="decimal" placeholder="0" />
          </MzField>
          <MzField label="Expected Sale Price">
            <MzInput value={salePrice} onChange={(e) => setSalePrice(e.target.value)} inputMode="decimal" placeholder="0" />
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
            <MzField label="Cash Paid">
              <MzInput value={cash} onChange={(e) => setCash(e.target.value)} inputMode="decimal" placeholder="0" />
            </MzField>
          ) : null}
          {payMode === "bank" || payMode === "split" ? (
            <>
              <MzField label="Bank Paid">
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
            <MzRow label="Purchase" value={formatPkr(priceN)} />
            <MzRow label="Paid" value={formatPkr(cashN + bankN)} tone="#0F9B8E" />
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

        <MzPrimaryButton label="Save Purchase" onClick={onSave} />
      </div>
    </MzShell>
  );
}
