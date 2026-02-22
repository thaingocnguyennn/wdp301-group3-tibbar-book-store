import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { WishlistProvider } from "./context/WishlistContext";
import { useAuth } from "./hooks/useAuth";
import Navbar from "./components/common/Navbar";
import Footer from "./components/common/Footer";
import HomePage from "./pages/HomePage";
import NewestPage from "./pages/NewestPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import BookDetailPage from "./pages/BookDetailPage";
import ProfilePage from "./pages/ProfilePage";
import AddressPage from "./pages/AddressPage";
import ShipperHomePage from "./pages/ShipperHomePage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import BooksManagement from "./pages/admin/BooksManagement";
import CategoriesManagement from "./pages/admin/CategoriesManagement";
import SlidersManagement from "./pages/admin/SlidersManagement";
import UsersManagement from "./pages/admin/UsersManagement";
import Wishlist from "./pages/Wishlist";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrderSuccessPage from "./pages/OrderSuccessPage";
import PaymentReturnPage from "./pages/PaymentReturnPage";
import OrderHistoryPage from "./pages/OrderHistoryPage";
import OrderDetailPage from "./pages/OrderDetailPage";
import AdminWishlist from "./pages/admin/AdminWishlist";
import AdminShippers from "./pages/admin/AdminShippers";
import AdminRevenue from "./pages/admin/AdminRevenue";
import OrdersManagement from "./pages/admin/OrdersManagement";
import VouchersManagement from "./pages/admin/VouchersManagement";
// Protected Route Component - Only for authenticated routes
const ProtectedRoute = ({ children, adminOnly = false, shipperOnly = false }) => {
  const { isAuthenticated, isAdmin, user, loading } = useAuth();

  if (loading) {
    return <div style={styles.loading}>Loading...</div>;
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        state={{ from: window.location.pathname }}
        replace
      />
    );
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (shipperOnly && user?.role !== 'shipper') {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Redirect authenticated users away from login/register
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div style={styles.loading}>Loading...</div>;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Role-based home page component
const RoleBasedHome = () => {
  const { isAuthenticated, user } = useAuth();

  // Redirect shippers to their dashboard
  if (isAuthenticated && user?.role === 'shipper') {
    return <Navigate to="/shipper/dashboard" replace />;
  }

  // Redirect admins to admin dashboard
  if (isAuthenticated && (user?.role === 'admin' || user?.role === 'manager')) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  // Default to customer home page
  return <HomePage />;
};

function AppContent() {
  return (
    <div style={styles.app}>
      <Navbar />
      <Routes>
        {/* Public Routes - No authentication required */}
        <Route path="/" element={<RoleBasedHome />} />
        <Route path="/newest" element={<NewestPage />} />
        <Route path="/books/:id" element={<BookDetailPage />} />

        {/* Auth Routes - Redirect to home if already logged in */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          }
        />

        {/* Protected Routes - Authentication required */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/address"
          element={
            <ProtectedRoute>
              <AddressPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <OrderHistoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders/:id"
          element={
            <ProtectedRoute>
              <OrderDetailPage />
            </ProtectedRoute>
          }
        />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/wishlist" element={<Wishlist />} />

        {/* Checkout Routes */}
        <Route
          path="/checkout"
          element={
            <ProtectedRoute>
              <CheckoutPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/order-success/:orderNumber"
          element={
            <ProtectedRoute>
              <OrderSuccessPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/checkout/payment-return"
          element={<PaymentReturnPage />}
        />

        {/* Admin Routes - Admin role required */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute adminOnly>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Shipper Routes - Shipper role required */}
        <Route
          path="/shipper/dashboard"
          element={
            <ProtectedRoute shipperOnly>
              <ShipperHomePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/books"
          element={
            <ProtectedRoute adminOnly>
              <BooksManagement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/categories"
          element={
            <ProtectedRoute adminOnly>
              <CategoriesManagement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/sliders"
          element={
            <ProtectedRoute adminOnly>
              <SlidersManagement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/orders"
          element={
            <ProtectedRoute adminOnly>
              <OrdersManagement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/vouchers"
          element={
            <ProtectedRoute adminOnly>
              <VouchersManagement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/users"
          element={
            <ProtectedRoute adminOnly>
              <UsersManagement />x
            </ProtectedRoute>
          }
        />
        <Route path="/admin/wishlist" element={<AdminWishlist />} />
        <Route path="/admin/shippers" element={<AdminShippers />} />
        <Route path="/admin/revenue" element={<AdminRevenue />} />

        {/* 404 - Redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Footer />
    </div>
  );
}

function App() {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  if (!googleClientId) {
    console.warn('Google Client ID not found. Please set VITE_GOOGLE_CLIENT_ID in your .env file');
  }

  return (
    <GoogleOAuthProvider clientId={googleClientId || ''}>
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <AppContent />
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}

const styles = {
  app: {
    minHeight: "100vh",
    backgroundColor: "#ecf0f1",
  },
  loading: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    fontSize: "1.5rem",
    color: "#7f8c8d",
  },
};

export default App;
