import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, RequireAuth } from "./auth";
import { ContraPage } from "./mobizone/pages/ContraPage";
import { CustomersPage } from "./mobizone/pages/CustomersPage";
import { ExpenseAccountsPage } from "./mobizone/pages/ExpenseAccountsPage";
import { ExpensesPage } from "./mobizone/pages/ExpensesPage";
import { GeneralVoucherPage } from "./mobizone/pages/GeneralVoucherPage";
import { HomePage } from "./mobizone/pages/HomePage";
import { MorePage } from "./mobizone/pages/MorePage";
import { PurchasePage } from "./mobizone/pages/PurchasePage";
import { ReceiptSettingsPage } from "./mobizone/pages/ReceiptSettingsPage";
import { ReportsPage } from "./mobizone/pages/ReportsPage";
import { SalePage } from "./mobizone/pages/SalePage";
import { ScanPage } from "./mobizone/pages/ScanPage";
import { StockPage } from "./mobizone/pages/StockPage";
import { LoginPage } from "./pages/LoginPage";

function Protected({ children }: { children: React.ReactNode }) {
  return <RequireAuth>{children}</RequireAuth>;
}

export function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<Protected><HomePage /></Protected>} />
        <Route path="/stock" element={<Protected><StockPage /></Protected>} />
        <Route path="/scan" element={<Protected><ScanPage /></Protected>} />
        <Route path="/sale" element={<Protected><SalePage /></Protected>} />
        <Route path="/purchase" element={<Protected><PurchasePage /></Protected>} />
        <Route path="/more" element={<Protected><MorePage /></Protected>} />
        <Route path="/customers" element={<Protected><CustomersPage /></Protected>} />
        <Route path="/expenses" element={<Protected><ExpensesPage /></Protected>} />
        <Route path="/expense-accounts" element={<Protected><ExpenseAccountsPage /></Protected>} />
        <Route path="/contra" element={<Protected><ContraPage /></Protected>} />
        <Route path="/general-voucher" element={<Protected><GeneralVoucherPage /></Protected>} />
        <Route path="/reports" element={<Protected><ReportsPage /></Protected>} />
        <Route path="/receipt-settings" element={<Protected><ReceiptSettingsPage /></Protected>} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </AuthProvider>
  );
}
