import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { ToastProvider } from './contexts/ToastContext';

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
import CheckoutPage from './pages/customer/CheckoutPage';
import PromotionsPage from './pages/customer/PromotionsPage';
import AboutPage from './pages/customer/AboutPage';
import ContactPage from './pages/customer/ContactPage';
import CustomerProfilePage from './pages/customer/CustomerProfilePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import NotFoundPage from './pages/NotFoundPage';
import PaymentResultPage from './pages/customer/PaymentResultPage';

// Admin Pages
import DashboardPage from './pages/admin/DashboardPage';
import EmployeeManagementPage from './pages/admin/EmployeeManagementPage';
import MenuManagementPage from './pages/admin/MenuManagementPage';
import InventoryPage from './pages/admin/InventoryPage';
import PromotionManagementPage from './pages/admin/PromotionManagementPage';
import ComboManagementPage from './pages/admin/ComboManagementPage';
import SupplierManagementPage from './pages/admin/SupplierManagementPage';
import PurchaseHistoryPage from './pages/admin/PurchaseHistoryPage';
import RevenueReportPage from './pages/admin/RevenueReportPage';

// Staff Pages
import POSPage from './pages/staff/POSPage';

// Shared Pages
import CustomerManagementPage from './pages/shared/CustomerManagementPage.jsx';
import InvoiceDetailPage from './pages/shared/InvoiceDetailPage.jsx';
import CustomerOrdersPage from './pages/shared/CustomerOrdersPage';
import ShiftManagementPage from './pages/shared/ShiftManagementPage.jsx';
import ProfilePage from './pages/shared/ProfilePage.jsx';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              {/* ========== PUBLIC ROUTES (CUSTOMER SIDE) ========== */}
              <Route element={<CustomerLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/menu" element={<MenuPage />} />
                <Route path="/promotions" element={<PromotionsPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route
                  path="/profile"
                  element={
                    <RoleBasedRoute allowedRoles={['customer']}>
                      <CustomerProfilePage />
                    </RoleBasedRoute>
                  }
                />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
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
                <Route
                  path="/admin/dashboard"
                  element={
                    <RoleBasedRoute allowedRoles={['admin', 'staff']}>
                      <DashboardPage />
                    </RoleBasedRoute>
                  }
                />

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
                <Route
                  path="/admin/revenue"
                  element={
                    <RoleBasedRoute allowedRoles={['admin']}>
                      <RevenueReportPage />
                    </RoleBasedRoute>
                  }
                />

                <Route
                  path="/staff/pos"
                  element={
                    <RoleBasedRoute allowedRoles={['staff']}>
                      <POSPage />
                    </RoleBasedRoute>
                  }
                />

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
                      <CustomerOrdersPage />
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
                <Route
                  path="/admin/customer-orders"
                  element={
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
                <Route
                  path="/admin/profile"
                  element={
                    <RoleBasedRoute allowedRoles={['admin', 'staff']}>
                      <ProfilePage />
                    </RoleBasedRoute>
                  }
                />

                <Route
                  path="/admin"
                  element={
                    <RoleBasedRoute allowedRoles={['admin', 'staff']}>
                      <DashboardPage />
                    </RoleBasedRoute>
                  }
                />
              </Route>

              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
