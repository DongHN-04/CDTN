import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';

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
import PaymentResultPage from './pages/customer/PaymentResultPage';

// Admin Pages
import DashboardPage from './pages/admin/DashboardPage';
import EmployeeManagementPage from './pages/admin/EmployeeManagementPage';
import MenuManagementPage from './pages/admin/MenuManagementPage';
import InventoryPage from './pages/admin/InventoryPage';
import ReportsPage from './pages/admin/ReportsPage';
import PromotionManagementPage from './pages/admin/PromotionManagementPage';
import ComboManagementPage from './pages/admin/ComboManagementPage';
import QRManagementPage from './pages/admin/QRManagementPage';
import SupplierManagementPage from './pages/admin/SupplierManagementPage';
import PurchaseHistoryPage from './pages/admin/PurchaseHistoryPage';

// Staff Pages
import POSPage from './pages/staff/POSPage';

// Shared Pages
import CustomerManagementPage from './pages/shared/CustomerManagementPage.jsx';
import InvoiceListPage from './pages/shared/InvoiceListPage';
import InvoiceDetailPage from './pages/shared/InvoiceDetailPage.jsx';
import CustomerOrdersPage from './pages/shared/CustomerOrdersPage';
import ShiftManagementPage from './pages/shared/ShiftManagementPage.jsx';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Routes>
            {/* ========== PUBLIC ROUTES (CUSTOMER SIDE) ========== */}
            <Route element={<CustomerLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/menu" element={<MenuPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/payment-result" element={<PaymentResultPage />} />
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
                path="/admin/promotions"
                element={
                  <RoleBasedRoute allowedRoles={['admin']}>
                    <PromotionManagementPage />
                  </RoleBasedRoute>
                }
              />
              <Route
                path="/admin/combos"
                element={
                  <RoleBasedRoute allowedRoles={['admin']}>
                    <ComboManagementPage />
                  </RoleBasedRoute>
                }
              />
              <Route
                path="/admin/suppliers"
                element={
                  <RoleBasedRoute allowedRoles={['admin']}>
                    <SupplierManagementPage />
                  </RoleBasedRoute>
                }
              />
              <Route
                path="/admin/purchases"
                element={
                  <RoleBasedRoute allowedRoles={['admin']}>
                    <PurchaseHistoryPage />
                  </RoleBasedRoute>
                }
              />
              <Route path="/admin/qrcodes" element={
                <RoleBasedRoute allowedRoles={['admin']}>
                  <QRManagementPage />
                </RoleBasedRoute>
              } />
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
                    <CustomerManagementPage />
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
              <Route
                path="/admin/invoices/:id"
                element={
                  <RoleBasedRoute allowedRoles={['admin', 'staff']}>
                    <InvoiceDetailPage />
                  </RoleBasedRoute>
                }
              />
              <Route path="/admin/customer-orders" element={
                <RoleBasedRoute allowedRoles={['admin', 'staff']}>
                  <CustomerOrdersPage />
                </RoleBasedRoute>
              }
              />
              <Route
                path="/admin/shifts"
                element={
                  <RoleBasedRoute allowedRoles={['admin', 'staff']}>
                    <ShiftManagementPage />
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
      </CartProvider>
    </AuthProvider>
  );
}

export default App;