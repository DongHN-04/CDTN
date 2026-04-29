import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';

// Layouts
import CustomerLayout from './components/Layout/CustomerLayout';
import AdminLayout from './components/Layout/AdminLayout';

// Route guards
import PrivateRoute from './components/PrivateRoute';
import RoleBasedRoute from './components/RoleBasedRoute';

// Public Pages
import HomePage from './pages/customer/HomePage';
import MenuPage from './pages/customer/MenuPage';
import CartPage from './pages/customer/CartPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import NotFoundPage from './pages/NotFoundPage';

// Admin Pages
import DashboardPage from './pages/admin/DashboardPage';
import EmployeeManagementPage from './pages/admin/EmployeeManagementPage';
import MenuManagementPage from './pages/admin/MenuManagementPage';
import InventoryPage from './pages/admin/InventoryPage';
import ReportsPage from './pages/admin/ReportsPage';

// Staff Pages
import POSPage from './pages/staff/POSPage';

// Shared Pages
import CustomerListPage from './pages/shared/CustomerListPage';
import InvoiceListPage from './pages/shared/InvoiceListPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* ========== PUBLIC ROUTES (CUSTOMER SIDE) ========== */}
          <Route element={<CustomerLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/menu" element={<MenuPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

          {/* ========== PROTECTED ROUTES (ADMIN & STAFF) ========== */}
          <Route
            element={
              <PrivateRoute>
                <AdminLayout />
              </PrivateRoute>
            }
          >
            {/* Dashboard - cả admin và staff */}
            <Route
              path="/admin/dashboard"
              element={
                <RoleBasedRoute allowedRoles={['admin', 'staff']}>
                  <DashboardPage />
                </RoleBasedRoute>
              }
            />

            {/* Admin only */}
            <Route
              path="/admin/employees"
              element={
                <RoleBasedRoute allowedRoles={['admin']}>
                  <EmployeeManagementPage />
                </RoleBasedRoute>
              }
            />
            <Route
              path="/admin/menu"
              element={
                <RoleBasedRoute allowedRoles={['admin']}>
                  <MenuManagementPage />
                </RoleBasedRoute>
              }
            />
            <Route
              path="/admin/inventory"
              element={
                <RoleBasedRoute allowedRoles={['admin']}>
                  <InventoryPage />
                </RoleBasedRoute>
              }
            />
            <Route
              path="/admin/reports"
              element={
                <RoleBasedRoute allowedRoles={['admin']}>
                  <ReportsPage />
                </RoleBasedRoute>
              }
            />

            {/* Staff only */}
            <Route
              path="/staff/pos"
              element={
                <RoleBasedRoute allowedRoles={['staff']}>
                  <POSPage />
                </RoleBasedRoute>
              }
            />

            {/* Shared routes */}
            <Route
              path="/admin/customers"
              element={
                <RoleBasedRoute allowedRoles={['admin', 'staff']}>
                  <CustomerListPage />
                </RoleBasedRoute>
              }
            />
            <Route
              path="/admin/invoices"
              element={
                <RoleBasedRoute allowedRoles={['admin', 'staff']}>
                  <InvoiceListPage />
                </RoleBasedRoute>
              }
            />

            {/* Fallback route cho /admin */}
            <Route path="/admin" element={<DashboardPage />} />
          </Route>

          {/* Catch-all route cho 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;