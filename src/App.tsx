/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import CustomerOrder from './pages/CustomerOrder';
import CustomerStatus from './pages/CustomerStatus';
import StaffDashboard from './pages/StaffDashboard';
import StaffLogin from './pages/StaffLogin';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/order?table=1" replace />} />
        <Route path="/order" element={<CustomerOrder />} />
        <Route path="/status/:orderId" element={<CustomerStatus />} />
        <Route path="/staff" element={<StaffDashboard />} />
        <Route path="/staff/login" element={<StaffLogin />} />
      </Routes>
    </BrowserRouter>
  );
}
