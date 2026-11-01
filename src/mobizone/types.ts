/** Vendored Mobizone domain types (from packages/contracts mobizone.ts — no zod). */

export type MobizonePaymentChannel = "cash" | "bank" | "udhaar";
export type MobizoneCondition = "new" | "used";
export type MobizonePartyKind = "customer" | "shopkeeper";
export type MobizoneLedgerDirection = "receive" | "pay";
export type MobizoneVoucherAccountKind =
  | "cash"
  | "bank"
  | "customer"
  | "shopkeeper"
  | "expense";

export type MobizoneBankDetails = {
  bankAccountId?: string | null;
  bankName?: string | null;
  accountTitle?: string | null;
  accountNumber?: string | null;
  iban?: string | null;
  txnRef?: string | null;
  verified?: boolean;
};

export type MobizoneSplitPayment = {
  cashPkr: number;
  bankPkr: number;
  bankLabel?: string | null;
  bank?: MobizoneBankDetails;
};

export type MobizoneBankAccount = {
  id: string;
  bankName: string;
  accountTitle: string;
  accountNumber?: string | null;
  iban?: string | null;
  openingBalancePkr: number;
  notes?: string | null;
  createdAt: string;
};

export type MobizoneShopkeeper = {
  id: string;
  shopNo: string;
  name: string;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
  createdAt: string;
};

export type MobizoneCustomer = {
  id: string;
  name: string;
  cnic?: string | null;
  phone?: string | null;
  address?: string | null;
  photoDataUrl?: string | null;
  cnicFrontDataUrl?: string | null;
  cnicBackDataUrl?: string | null;
  pendingPkr: number;
  createdAt: string;
};

export type MobizoneDevice = {
  id: string;
  imei: string;
  imei2?: string | null;
  brand: string;
  model: string;
  colour?: string | null;
  storage?: string | null;
  batteryHealth?: string | null;
  etc?: string | null;
  condition: MobizoneCondition;
  purchasePricePkr: number;
  salePricePkr?: number | null;
  barcode?: string | null;
  status: "in_stock" | "sold" | "reserved";
  shopkeeperId?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MobizoneSale = {
  id: string;
  deviceId: string;
  customerId?: string | null;
  shopkeeperId?: string | null;
  customerName: string;
  customerPhone?: string | null;
  customerAddress?: string | null;
  customerCnic?: string | null;
  customerPhotoDataUrl?: string | null;
  cnicFrontDataUrl?: string | null;
  cnicBackDataUrl?: string | null;
  otherPhotoDataUrl?: string | null;
  note?: string | null;
  batteryHealth?: string | null;
  etc?: string | null;
  imei: string;
  brand: string;
  model: string;
  pricePkr: number;
  receivedPkr: number;
  remainingPkr: number;
  dueDate?: string | null;
  warrantyDays: number;
  returnedAt?: string | null;
  payment: MobizoneSplitPayment;
  costPkr: number;
  profitPkr: number;
  createdAt: string;
};

export type MobizoneExpenseAccount = {
  id: string;
  name: string;
  notes?: string | null;
  createdAt: string;
};

export type MobizoneExpense = {
  id: string;
  title: string;
  accountId?: string | null;
  amountPkr: number;
  method: "cash" | "bank";
  bankAccountId?: string | null;
  note?: string | null;
  createdAt: string;
};

export type MobizoneVoucherLine = {
  accountKind: MobizoneVoucherAccountKind;
  accountId?: string | null;
  accountName: string;
  side: "debit" | "credit";
  amountPkr: number;
};

export type MobizoneDocumentAttachment = {
  id: string;
  fileName: string;
  mimeType?: string | null;
  sizeBytes: number;
  dataUrl: string;
  uploadedAt: string;
};

export type MobizoneVoucher = {
  id: string;
  kind: "contra" | "general";
  createdAt: string;
  reference?: string | null;
  note?: string | null;
  amountPkr: number;
  lines: MobizoneVoucherLine[];
  attachments?: MobizoneDocumentAttachment[];
};

export type MobizonePurchase = {
  id: string;
  deviceId: string;
  customerId?: string | null;
  shopkeeperId?: string | null;
  sellerName: string;
  sellerCnic?: string | null;
  sellerPhone?: string | null;
  sellerAddress?: string | null;
  sellerPhotoDataUrl?: string | null;
  cnicFrontDataUrl?: string | null;
  cnicBackDataUrl?: string | null;
  otherPhotoDataUrl?: string | null;
  note?: string | null;
  imei: string;
  brand: string;
  model: string;
  colour?: string | null;
  storage?: string | null;
  batteryHealth?: string | null;
  etc?: string | null;
  condition: MobizoneCondition;
  purchasePricePkr: number;
  paidPkr: number;
  remainingPkr: number;
  dueDate?: string | null;
  returnedAt?: string | null;
  payment: MobizoneSplitPayment;
  createdAt: string;
};

export type MobizoneLedgerEntry = {
  id: string;
  partyKind: MobizonePartyKind;
  partyId: string;
  partyName: string;
  direction: MobizoneLedgerDirection;
  amountPkr: number;
  method: "cash" | "bank";
  bankAccountId?: string | null;
  bankName?: string | null;
  txnRef?: string | null;
  note?: string | null;
  relatedSaleId?: string | null;
  relatedPurchaseId?: string | null;
  createdAt: string;
};

export type MobizoneDashboard = {
  inStock: number;
  stockValuePkr: number;
  todaySalesPkr: number;
  todayPurchasesPkr: number;
  todayProfitPkr: number;
  pendingReceivablesPkr: number;
  pendingPayablesPkr: number;
  cashBalancePkr: number;
  bankBalancePkr: number;
};

export type MobizoneBusinessReport = {
  from: string;
  to: string;
  purchaseCount: number;
  saleCount: number;
  purchaseAmountPkr: number;
  saleAmountPkr: number;
  grossProfitPkr: number;
  expenseTotalPkr: number;
  profitPkr: number;
  stockValuePkr: number;
  receivablesPkr: number;
  payablesPkr: number;
  cashBalancePkr: number;
  bankBalancePkr: number;
};
