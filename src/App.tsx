import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import OfficeLayout from './layouts/OfficeLayout';
import CreateAgent from './pages/office/CreateAgent';
import CreateLoan from './pages/office/CreateLoan';
import LoanRepayment from './pages/office/LoanRepayment';
import CloseLoan from './pages/office/CloseLoan';
import PaymentReport from './pages/office/PaymentReport';
import LoanStatusReport from './pages/office/LoanStatusReport';
import DashboardHome from './pages/office/DashboardHome';
import ExecutiveLayout from './layouts/ExecutiveLayout';
import ExecutiveDashboard from './pages/executive/ExecutiveDashboard';
import OfflineAlert from './components/OfflineAlert';

function App() {
  return (
    <>
      <OfflineAlert />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/office" element={<OfficeLayout />}>
            <Route index element={<DashboardHome />} />
            <Route path="create-agent" element={<CreateAgent />} />
            <Route path="create-loan" element={<CreateLoan />} />
            <Route path="repayment" element={<LoanRepayment />} />
            <Route path="close-loan" element={<CloseLoan />} />
            <Route path="report" element={<PaymentReport />} />
            <Route path="loan-status" element={<LoanStatusReport />} />
          </Route>

          {/* Executive Routes */}
          <Route path="/executive" element={<ExecutiveLayout />}>
            <Route index element={<ExecutiveDashboard />} />
          </Route>
          <Route path="/" element={<Login />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
