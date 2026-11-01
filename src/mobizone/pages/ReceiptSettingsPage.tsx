import { useEffect, useState } from "react";
import {
  MzCard,
  MzField,
  MzInput,
  MzPrimaryButton,
  MzScreenTitle,
  MzSection,
} from "../components/ui";
import { MzShell } from "../MzShell";
import {
  DEFAULT_MOBIZONE_RECEIPT_SETTINGS,
  loadMobizoneReceiptSettings,
  saveMobizoneReceiptSettings,
  type MobizoneReceiptFields,
  type MobizoneReceiptSettings,
} from "../receiptSettings";
import { useMobizoneDb } from "../useMobizone";

const TOGGLES: { key: keyof MobizoneReceiptFields; label: string }[] = [
  { key: "device", label: "Device brand/model" },
  { key: "imei", label: "IMEI" },
  { key: "salePrice", label: "Price / TOTAL" },
  { key: "cash", label: "Cash" },
  { key: "bank", label: "Bank" },
  { key: "remaining", label: "Remaining udhaar" },
  { key: "footer", label: "Footer" },
];

export function ReceiptSettingsPage() {
  const { branchCode } = useMobizoneDb();
  const [settings, setSettings] = useState<MobizoneReceiptSettings>(DEFAULT_MOBIZONE_RECEIPT_SETTINGS);

  useEffect(() => {
    setSettings(loadMobizoneReceiptSettings(branchCode));
  }, [branchCode]);

  function save(): void {
    saveMobizoneReceiptSettings(branchCode, settings);
    window.alert("Bill settings saved.");
  }

  return (
    <MzShell>
      <div className="mz-page">
        <MzScreenTitle
          title="Bill print settings"
          subtitle="Restaurant thermal bill · customer block always ON"
        />
        <MzCard className="mz-navy-stat">
          <strong className="tone-teal">Always on bill</strong>
          <p className="mz-muted light">
            Customer Name · Phone · CNIC · Address — restaurant style dashed layout
          </p>
        </MzCard>

        <MzSection title="Shop header">
          <MzField label="Shop name">
            <MzInput
              value={settings.shopName}
              onChange={(e) => setSettings((s) => ({ ...s, shopName: e.target.value }))}
            />
          </MzField>
          <MzField label="Shop phone">
            <MzInput
              value={settings.shopPhone}
              onChange={(e) => setSettings((s) => ({ ...s, shopPhone: e.target.value }))}
            />
          </MzField>
          <MzField label="Shop address">
            <MzInput
              value={settings.shopAddress}
              onChange={(e) => setSettings((s) => ({ ...s, shopAddress: e.target.value }))}
            />
          </MzField>
          <MzField label="WhatsApp number">
            <MzInput
              value={settings.whatsappNumber}
              onChange={(e) => setSettings((s) => ({ ...s, whatsappNumber: e.target.value }))}
            />
          </MzField>
          <MzField label="Footer">
            <MzInput
              value={settings.footerText}
              onChange={(e) => setSettings((s) => ({ ...s, footerText: e.target.value }))}
            />
          </MzField>
          <label className="mz-check">
            <input
              type="checkbox"
              checked={settings.whatsappDefaultOn}
              onChange={(e) => setSettings((s) => ({ ...s, whatsappDefaultOn: e.target.checked }))}
            />
            WhatsApp default ON after sale/purchase
          </label>
        </MzSection>

        <MzSection title="Optional fields">
          {TOGGLES.map((t) => (
            <label key={t.key} className="mz-toggle-row">
              <span>{t.label}</span>
              <input
                type="checkbox"
                checked={settings.fields[t.key]}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    fields: { ...s.fields, [t.key]: e.target.checked },
                  }))
                }
              />
            </label>
          ))}
        </MzSection>

        <MzPrimaryButton label="Save settings" onClick={save} />
      </div>
    </MzShell>
  );
}
