import React, { useState, useEffect, useCallback } from 'react';
import CustomerLayout from './layouts/CustomerLayout';
import PartnerLayout from './layouts/PartnerLayout';
import AdminLayout from './layouts/AdminLayout';
import SuperAdminLayout from './layouts/SuperAdminLayout';
import Toast from './components/common/Toast';
import { FoodDeal, Order } from './types';
import authApi, { AuthUser, PartnerRestaurantInfo } from './services/authApi';
import api from './services/api';
import partnerApi, { PartnerRestaurant } from './services/partnerApi';

// Customer Pages
import DashboardPage from './pages/customer/DashboardPage';
import ExplorePage from './pages/customer/ExplorePage';
import DealDetailPage from './pages/customer/DealDetailPage';
import OrdersPage from './pages/customer/OrdersPage';
import AccountPage from './pages/customer/AccountPage';
import CustomerNotificationsPage from './pages/customer/CustomerNotificationsPage';
import CustomerLoginPage from './pages/customer/CustomerLoginPage';
import CustomerRegisterPage from './pages/customer/CustomerRegisterPage';
import PickupPassModal from './components/customer/PickupPassModal';
import CheckoutModal from './components/customer/CheckoutModal';
import AvatarSelectorModal from './components/customer/AvatarSelectorModal';

// Partner Pages
import PartnerLoginPage from './pages/partner/PartnerLoginPage';
import PartnerRegisterPage from './pages/partner/PartnerRegisterPage';
import PartnerPendingApprovalPage from './pages/partner/PartnerPendingApprovalPage';
import PartnerDashboardPage from './pages/partner/PartnerDashboardPage';
import PartnerListingsPage from './pages/partner/PartnerListingsPage';
import PartnerOrdersPage from './pages/partner/PartnerOrdersPage';
import PartnerEarningsPage from './pages/partner/PartnerEarningsPage';
import PartnerSettingsPage from './pages/partner/PartnerSettingsPage';
import CreateDealModal from './components/partner/CreateDealModal';
import VerifyOtpModal from './components/partner/VerifyOtpModal';

// Admin Pages
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminOverviewPage from './pages/admin/AdminOverviewPage';
import AdminVendorsPage from './pages/admin/AdminVendorsPage';
import AdminCustomersPage from './pages/admin/AdminCustomersPage';
import AdminOrdersPage from './pages/admin/AdminOrdersPage';
import AdminListingsPage from './pages/admin/AdminListingsPage';
import AdminReportsPage from './pages/admin/AdminReportsPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';

// Super Admin Pages
import SuperAdminDashboardPage from './pages/super-admin/SuperAdminDashboardPage';
import SuperAdminAdminsPage from './pages/super-admin/SuperAdminAdminsPage';
import SuperAdminPartnersPage from './pages/super-admin/SuperAdminPartnersPage';
import SuperAdminCustomersPage from './pages/super-admin/SuperAdminCustomersPage';
import SuperAdminOrdersPage from './pages/super-admin/SuperAdminOrdersPage';
import SuperAdminReportsPage from './pages/super-admin/SuperAdminReportsPage';
import SuperAdminSettingsPage from './pages/super-admin/SuperAdminSettingsPage';

export const App: React.FC = () => {
  // Navigation & URL Routing
  const [currentPath, setCurrentPath] = useState<string>(
    typeof window !== 'undefined' ? window.location.pathname || '/' : '/'
  );

  // Authentication State
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    const token = typeof window !== 'undefined' ? authApi.getToken() : null;
    return token ? authApi.getUser() : null;
  });
  const [partnerRestaurant, setPartnerRestaurant] = useState<PartnerRestaurantInfo | null>(() => {
    const token = typeof window !== 'undefined' ? authApi.getToken() : null;
    return token ? authApi.getPartnerRestaurant() : null;
  });

  // Authentication initialization state (verifying token with backend on startup)
  const [isAuthInitializing, setIsAuthInitializing] = useState<boolean>(() => {
    return typeof window !== 'undefined' && Boolean(authApi.getToken());
  });

  // Guest deal browsing toggle (only active if user explicitly clicks "Explore Deals as Guest")
  const [isGuestBrowsing, setIsGuestBrowsing] = useState<boolean>(false);

  // Partner refresh trigger for listings/orders updates
  const [partnerRefreshTrigger, setPartnerRefreshTrigger] = useState<number>(0);

  // Customer Deal & Modal State
  const [selectedDeal, setSelectedDeal] = useState<FoodDeal | null>(null);
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activePassOrder, setActivePassOrder] = useState<Order | null>(null);
  const [checkoutDeal, setCheckoutDeal] = useState<{
    deal: FoodDeal;
    quantity: number;
    fulfillment?: 'pickup';
  } | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

  // Partner Modals
  const [isPartnerCreateDealOpen, setIsPartnerCreateDealOpen] = useState(false);
  const [isPartnerVerifyOtpOpen, setIsPartnerVerifyOtpOpen] = useState(false);

  // Toast System
  const [toasts, setToasts] = useState<
    Array<{ id: string; type: 'success' | 'warning' | 'error' | 'info'; message: string; title?: string }>
  >([]);

  const addToast = (type: 'success' | 'warning' | 'error' | 'info', message: string, title?: string) => {
    const id = Date.now().toString() + Math.random().toString();
    setToasts((prev) => [...prev, { id, type, message, title }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Safe client navigation helper
  const navigate = useCallback((path: string) => {
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', path);
    }
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Listen for browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Check and refresh session on mount
  useEffect(() => {
    const token = authApi.getToken();
    if (!token) {
      setIsAuthInitializing(false);
      return;
    }

    authApi
      .getMe()
      .then((data) => {
        if (data && data.user) {
          setCurrentUser(data.user);
          if (data.restaurant) {
            setPartnerRestaurant(data.restaurant);
          }
        } else {
          setCurrentUser(null);
          setPartnerRestaurant(null);
        }
      })
      .catch(() => {
        if (!authApi.getToken()) {
          setCurrentUser(null);
          setPartnerRestaurant(null);
        }
      })
      .finally(() => {
        setIsAuthInitializing(false);
      });
  }, []);

  // Helper to resolve redirect path post-login
  const getRedirectPathForRole = useCallback((role: string, defaultPath: string): string => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('savebite_redirect_path');
      if (saved) {
        sessionStorage.removeItem('savebite_redirect_path');
        if (role === 'CUSTOMER' && saved.startsWith('/app/customer')) return saved;
        if (role === 'PARTNER' && saved.startsWith('/app/partner')) return saved;
        if (role === 'ADMIN' && (saved.startsWith('/app/admin') || saved.startsWith('/app/super-admin'))) return saved;
      }
    }
    return defaultPath;
  }, []);

  // Role-based automatic redirection when visiting '/' or legacy root routes
  useEffect(() => {
    if (!isAuthInitializing) {
      if (currentPath === '/') {
        if (currentUser) {
          if (currentUser.role === 'ADMIN') {
            navigate('/app/admin/dashboard');
          } else if (currentUser.role === 'PARTNER') {
            navigate('/app/partner/dashboard');
          } else {
            navigate('/app/customer/dashboard');
          }
        }
      } else if (currentPath === '/partner' || currentPath === '/app/partner') {
        navigate('/app/partner/dashboard');
      } else if (currentPath === '/admin' || currentPath === '/app/admin') {
        navigate('/app/admin/dashboard');
      } else if (currentPath === '/super-admin' || currentPath === '/app/super-admin') {
        navigate('/app/super-admin/dashboard');
      } else if (currentPath === '/customer' || currentPath === '/app/customer') {
        navigate('/app/customer/dashboard');
      }
    }
  }, [currentUser, currentPath, isAuthInitializing, navigate]);

  // Refresh customer orders ONLY for authenticated customer users on customer views
  useEffect(() => {
    if (
      currentUser?.role === 'CUSTOMER' &&
      (currentPath === '/' || currentPath.startsWith('/app/customer') || currentPath.startsWith('/customer'))
    ) {
      api
        .getMyOrders()
        .then((backendOrders) => {
          if (Array.isArray(backendOrders)) {
            setOrders(backendOrders);
            const active = backendOrders.find(
              (o) => o.orderStatus === 'CONFIRMED' || o.orderStatus === 'READY_FOR_PICKUP'
            );
            setActivePassOrder(active || backendOrders[0] || null);
          }
        })
        .catch(() => {});
    } else if (!currentUser) {
      setOrders([]);
      setActivePassOrder(null);
    }
  }, [currentPath, currentUser]);

  const handleOrderHistoryCleared = async () => {
    try {
      const backendOrders = await api.getMyOrders();
      if (Array.isArray(backendOrders)) {
        setOrders(backendOrders);
        const active = backendOrders.find(
          (o) => o.orderStatus === 'CONFIRMED' || o.orderStatus === 'READY_FOR_PICKUP'
        );
        setActivePassOrder(active || backendOrders[0] || null);
      } else {
        setOrders((prev) =>
          prev.filter(
            (o) =>
              o.orderStatus !== 'COMPLETED' &&
              o.orderStatus !== 'REFUNDED' &&
              o.orderStatus !== 'CANCELLED'
          )
        );
      }
    } catch {
      setOrders((prev) =>
        prev.filter(
          (o) =>
            o.orderStatus !== 'COMPLETED' &&
            o.orderStatus !== 'REFUNDED' &&
            o.orderStatus !== 'CANCELLED'
        )
      );
    }
  };

  // Refresh partner restaurant details if on partner portal
  const refreshPartnerRestaurant = useCallback(() => {
    partnerApi
      .getRestaurant()
      .then((res: PartnerRestaurant) => {
        const info: PartnerRestaurantInfo = {
          id: res.id,
          ownerUserId: (res as any).ownerUserId || currentUser?.id || '',
          name: res.name,
          branchName: res.branchName,
          address: res.address,
          city: res.city,
          phone: res.phone,
          hygieneGrade: res.hygieneGrade,
          licenseNumber: res.licenseNumber,
          licenseDocumentUrl: res.licenseDocumentUrl,
          kycStatus: res.kycStatus as any,
          isStoreLive: res.isStoreLive,
          rating: res.rating,
          reviewCount: res.reviewCount,
          metrics: res.metrics,
        };
        setPartnerRestaurant(info);
        if (typeof window !== 'undefined') {
          localStorage.setItem('savebite_partner_restaurant', JSON.stringify(info));
        }
      })
      .catch(() => {});
  }, [currentUser]);

  useEffect(() => {
    if (
      (currentPath.startsWith('/app/partner') || currentPath.startsWith('/partner')) &&
      currentUser?.role === 'PARTNER'
    ) {
      refreshPartnerRestaurant();
    }
  }, [currentPath, currentUser, refreshPartnerRestaurant]);

  // Session Logout Handler
  const handleLogout = () => {
    const prevRole = currentUser?.role;
    authApi.logout();
    setCurrentUser(null);
    setPartnerRestaurant(null);
    setOrders([]);
    setActivePassOrder(null);
    setSelectedDeal(null);
    setCheckoutDeal(null);
    setIsGuestBrowsing(false);

    if (prevRole === 'ADMIN') {
      addToast('info', 'Admin session terminated.', 'Signed Out');
      navigate('/secure-admin-access');
    } else if (prevRole === 'PARTNER') {
      addToast('info', 'Restaurant Partner session terminated.', 'Signed Out');
      navigate('/partner/login');
    } else {
      addToast('info', 'Signed out successfully.', 'Signed Out');
      navigate('/customer/login');
    }
  };

  // Toast Container
  const toastContainer = (
    <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast
            id={toast.id}
            type={toast.type}
            message={toast.message}
            title={toast.title}
            onClose={removeToast}
          />
        </div>
      ))}
    </div>
  );

  // Session verification screen (only visible during token validation on startup)
  if (isAuthInitializing) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-[#006030] flex items-center justify-center mb-4 shadow-xs">
          <span className="material-symbols-outlined text-[30px] animate-spin">
            progress_activity
          </span>
        </div>
        <p className="text-sm font-semibold text-slate-600">Verifying SaveBite session...</p>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // AUTHENTICATION ROUTES (Login & Register)
  // ---------------------------------------------------------------------------

  // Redirect old public admin login paths to customer login to conceal administrative portals
  if (currentPath === '/admin/login' || currentPath === '/super-admin/login') {
    return (
      <>
        {toastContainer}
        <CustomerLoginPage
          currentUser={null}
          onContinue={() => navigate('/app/customer/dashboard')}
          onSwitchAccount={handleLogout}
          onSuccess={(customerUser) => {
            setCurrentUser(customerUser);
            setIsGuestBrowsing(false);
            navigate('/app/customer/dashboard');
          }}
          onNavigateToRegister={() => navigate('/customer/register')}
          onNavigateToPartner={() => navigate('/partner/login')}
          onBrowseGuest={() => {
            setIsGuestBrowsing(true);
            navigate('/app/customer/food-deals');
          }}
          onShowToast={addToast}
        />
      </>
    );
  }

  // Dedicated unadvertised route for Admin and Super Admin login
  if (currentPath === '/secure-admin-access' || currentPath === '/secure-admin-access/') {
    // If already authenticated as ADMIN, redirect directly to appropriate dashboard
    if (currentUser?.role === 'ADMIN') {
      const isSuper = Boolean(
        currentUser.isSuperAdmin ||
        currentUser.email?.toLowerCase() === 'admin@savebite.in'
      );
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-white">
          <div className="w-16 h-16 rounded-2xl bg-purple-950/80 border border-purple-800 text-purple-400 flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-[32px]">verified_user</span>
          </div>
          <h1 className="text-2xl font-bold mb-2">Active Administrator Session</h1>
          <p className="text-slate-400 text-sm max-w-md mb-6">
            Signed in as {currentUser.fullName} ({currentUser.email}).
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate(isSuper ? '/app/super-admin/dashboard' : '/app/admin/dashboard')}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-bold text-sm"
            >
              Enter {isSuper ? 'SuperAdmin' : 'Admin'} Console
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="px-6 py-2.5 border border-slate-700 hover:bg-slate-800 text-slate-300 rounded-xl font-bold text-sm"
            >
              Sign Out
            </button>
          </div>
        </div>
      );
    }

    // If currently authenticated as non-admin, notify with switch option
    if (currentUser) {
      return (
        <>
          {toastContainer}
          <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center text-white">
            <div className="w-16 h-16 rounded-2xl bg-amber-900/60 text-amber-400 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-[32px]">gpp_bad</span>
            </div>
            <h1 className="text-2xl font-bold mb-2">Administrative Console Access</h1>
            <p className="text-slate-400 text-sm max-w-md mb-6">
              You are currently signed in as a {currentUser.role}. Please sign out to log in with administrative credentials.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => navigate(currentUser.role === 'PARTNER' ? '/app/partner/dashboard' : '/app/customer/dashboard')}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-bold text-sm"
              >
                Return to My Dashboard
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="px-6 py-2.5 border border-slate-700 hover:bg-slate-800 text-slate-300 rounded-xl font-bold text-sm"
              >
                Sign Out to Switch
              </button>
            </div>
          </div>
        </>
      );
    }

    // Unauthenticated: Render dedicated secure admin access login
    return (
      <>
        {toastContainer}
        <AdminLoginPage
          onSuccess={(adminUser) => {
            setCurrentUser(adminUser);
            const isSuper = Boolean(
              adminUser.isSuperAdmin ||
              adminUser.email?.toLowerCase() === 'admin@savebite.in'
            );
            const target = getRedirectPathForRole(
              'ADMIN',
              isSuper ? '/app/super-admin/dashboard' : '/app/admin/dashboard'
            );
            navigate(target);
          }}
          onNavigateToCustomer={() => navigate('/app/customer/dashboard')}
          onShowToast={addToast}
        />
      </>
    );
  }

  // Partner Registration
  if (currentPath === '/partner/register') {
    return (
      <>
        {toastContainer}
        <PartnerRegisterPage
          onSuccess={(partnerUser, restaurant) => {
            setCurrentUser(partnerUser);
            if (restaurant) setPartnerRestaurant(restaurant);
            navigate('/app/partner/dashboard');
          }}
          onNavigateToLogin={() => navigate('/partner/login')}
          onShowToast={addToast}
        />
      </>
    );
  }

  // Partner Login
  if (currentPath === '/partner/login') {
    return (
      <>
        {toastContainer}
        <PartnerLoginPage
          onSuccess={(partnerUser, restaurant) => {
            setCurrentUser(partnerUser);
            if (restaurant) setPartnerRestaurant(restaurant);
            const target = getRedirectPathForRole('PARTNER', '/app/partner/dashboard');
            navigate(target);
          }}
          onNavigateToRegister={() => navigate('/partner/register')}
          onNavigateToCustomer={() => navigate('/customer/login')}
          onShowToast={addToast}
        />
      </>
    );
  }

  // Customer Login
  if (currentPath === '/customer/login' || currentPath === '/login') {
    return (
      <>
        {toastContainer}
        <CustomerLoginPage
          currentUser={currentUser?.role === 'CUSTOMER' ? currentUser : null}
          onContinue={() => {
            setIsGuestBrowsing(false);
            const target = getRedirectPathForRole('CUSTOMER', '/app/customer/dashboard');
            navigate(target);
          }}
          onSwitchAccount={handleLogout}
          onSuccess={(customerUser) => {
            setCurrentUser(customerUser);
            setIsGuestBrowsing(false);
            const pendingStr = sessionStorage.getItem('savebite_pending_deal');
            if (pendingStr) {
              try {
                const pending = JSON.parse(pendingStr);
                if (!selectedDeal && pending.deal) {
                  setSelectedDeal(pending.deal);
                }
              } catch {}
            }
            const target = getRedirectPathForRole('CUSTOMER', '/app/customer/dashboard');
            navigate(target);
          }}
          onNavigateToRegister={() => navigate('/customer/register')}
          onNavigateToPartner={() => navigate('/partner/login')}
          onBrowseGuest={() => {
            setIsGuestBrowsing(true);
            navigate('/app/customer/food-deals');
          }}
          onShowToast={addToast}
        />
      </>
    );
  }

  // Customer Registration
  if (currentPath === '/customer/register' || currentPath === '/register') {
    return (
      <>
        {toastContainer}
        <CustomerRegisterPage
          onSuccess={(customerUser) => {
            setCurrentUser(customerUser);
            setIsGuestBrowsing(false);
            const pendingStr = sessionStorage.getItem('savebite_pending_deal');
            if (pendingStr) {
              try {
                const pending = JSON.parse(pendingStr);
                if (!selectedDeal && pending.deal) {
                  setSelectedDeal(pending.deal);
                }
              } catch {}
            }
            const target = getRedirectPathForRole('CUSTOMER', '/app/customer/dashboard');
            navigate(target);
          }}
          onNavigateToLogin={() => navigate('/customer/login')}
          onShowToast={addToast}
        />
      </>
    );
  }

  // ---------------------------------------------------------------------------
  // 1. SUPER ADMIN PORTAL (Strictly Role-Protected: ADMIN only)
  // Routes: /app/super-admin/dashboard, /app/super-admin/admins, /app/super-admin/partners,
  //         /app/super-admin/customers, /app/super-admin/orders, /app/super-admin/reports,
  //         /app/super-admin/settings
  // ---------------------------------------------------------------------------
  if (currentPath.startsWith('/app/super-admin') || currentPath.startsWith('/super-admin')) {
    // 1. Unauthenticated users cannot access protected routes, even if they know the URL
    if (!currentUser) {
      return (
        <>
          {toastContainer}
          <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-white">
            <div className="w-16 h-16 rounded-2xl bg-red-950/80 border border-red-800 text-red-400 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-[32px]">gpp_bad</span>
            </div>
            <h1 className="text-2xl font-bold mb-2">403 Forbidden: Administrative Clearance Required</h1>
            <p className="text-slate-400 text-sm max-w-md mb-6">
              Direct access to this platform governance console is restricted to authorized platform personnel only.
            </p>
            <button
              type="button"
              onClick={() => navigate('/app/customer/dashboard')}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-bold text-sm"
            >
              Return to Homepage
            </button>
          </div>
        </>
      );
    }

    // 2. Customer or Partner role barrier
    if (currentUser.role !== 'ADMIN') {
      return (
        <>
          {toastContainer}
          <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-white">
            <div className="w-16 h-16 rounded-2xl bg-purple-950/80 border border-purple-800 text-purple-400 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-[32px]">shield_lock</span>
            </div>
            <h1 className="text-2xl font-bold mb-2">SuperAdmin Access Restricted</h1>
            <p className="text-slate-400 text-sm max-w-md mb-6">
              Your account role ({currentUser.role}) does not have administrative clearance for the SuperAdmin Console.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => navigate(currentUser.role === 'PARTNER' ? '/app/partner/dashboard' : '/app/customer/dashboard')}
                className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 rounded-xl font-bold text-sm"
              >
                Return to Authorized Portal
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="px-6 py-2.5 border border-slate-700 hover:bg-slate-800 text-slate-300 rounded-xl font-bold text-sm transition-all"
              >
                Sign Out
              </button>
            </div>
          </div>
        </>
      );
    }

    // 3. Regular Admin barrier: Admin cannot access Super Admin functionality
    const isSuperAdminUser = Boolean(
      currentUser.isSuperAdmin ||
      currentUser.email?.toLowerCase() === 'admin@savebite.in'
    );

    if (!isSuperAdminUser) {
      return (
        <>
          {toastContainer}
          <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-white">
            <div className="w-16 h-16 rounded-2xl bg-purple-950/80 border border-purple-800 text-purple-400 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-[32px]">shield_lock</span>
            </div>
            <h1 className="text-2xl font-bold mb-2">SuperAdmin Clearance Required</h1>
            <p className="text-slate-400 text-sm max-w-md mb-6">
              Your administrator account ({currentUser.email}) has standard operations clearance. SuperAdmin master governance requires elevated root platform authorization.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/app/admin/dashboard')}
                className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 rounded-xl font-bold text-sm"
              >
                Return to Admin Console
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="px-6 py-2.5 border border-slate-700 hover:bg-slate-800 text-slate-300 rounded-xl font-bold text-sm transition-all"
              >
                Sign Out
              </button>
            </div>
          </div>
        </>
      );
    }

    // Authenticated SuperAdmin Layout
    const normalizedSuperPath = currentPath === '/super-admin' || currentPath === '/app/super-admin'
      ? '/app/super-admin/dashboard'
      : currentPath;

    return (
      <SuperAdminLayout
        activePath={normalizedSuperPath}
        onNavigate={(path) => navigate(path)}
        onLogout={handleLogout}
        currentUser={currentUser}
        onUserUpdate={(updated) => setCurrentUser(updated)}
        onShowToast={addToast}
      >
        {toastContainer}

        {normalizedSuperPath === '/app/super-admin/admins' ? (
          <SuperAdminAdminsPage onShowToast={addToast} />
        ) : normalizedSuperPath === '/app/super-admin/partners' ? (
          <SuperAdminPartnersPage onShowToast={addToast} />
        ) : normalizedSuperPath === '/app/super-admin/customers' ? (
          <SuperAdminCustomersPage onShowToast={addToast} />
        ) : normalizedSuperPath === '/app/super-admin/orders' ? (
          <SuperAdminOrdersPage onShowToast={addToast} />
        ) : normalizedSuperPath === '/app/super-admin/reports' ? (
          <SuperAdminReportsPage onShowToast={addToast} />
        ) : normalizedSuperPath === '/app/super-admin/settings' ? (
          <SuperAdminSettingsPage currentUser={currentUser} onShowToast={addToast} onLogout={handleLogout} />
        ) : (
          <SuperAdminDashboardPage onNavigate={(path) => navigate(path)} onShowToast={addToast} />
        )}
      </SuperAdminLayout>
    );
  }

  // ---------------------------------------------------------------------------
  // 2. ADMIN PORTAL (Strictly Role-Protected: ADMIN only)
  // Routes: /app/admin/dashboard, /app/admin/partners, /app/admin/customers,
  //         /app/admin/food-deals, /app/admin/orders, /app/admin/reports,
  //         /app/admin/settings
  // ---------------------------------------------------------------------------
  if (currentPath.startsWith('/app/admin') || currentPath.startsWith('/admin')) {
    // 1. Unauthenticated users cannot access protected routes, even if they know the URL
    if (!currentUser) {
      return (
        <>
          {toastContainer}
          <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center text-white">
            <div className="w-16 h-16 rounded-2xl bg-red-900/60 text-red-400 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-[32px]">gpp_bad</span>
            </div>
            <h1 className="text-2xl font-bold mb-2">403 Forbidden: Administrative Clearance Required</h1>
            <p className="text-slate-400 text-sm max-w-md mb-6">
              Direct access to this platform console is restricted to authorized platform personnel only.
            </p>
            <button
              type="button"
              onClick={() => navigate('/app/customer/dashboard')}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-bold text-sm"
            >
              Return to Homepage
            </button>
          </div>
        </>
      );
    }

    // 2. Customer or Partner role barrier
    if (currentUser.role !== 'ADMIN') {
      return (
        <>
          {toastContainer}
          <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center text-white">
            <div className="w-16 h-16 rounded-2xl bg-red-900/60 text-red-400 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-[32px]">gpp_bad</span>
            </div>
            <h1 className="text-2xl font-bold mb-2">Access Restricted</h1>
            <p className="text-slate-400 text-sm max-w-md mb-6">
              Your account ({currentUser.role}) does not have administrative clearance for the Admin Console.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => navigate(currentUser.role === 'PARTNER' ? '/app/partner/dashboard' : '/app/customer/dashboard')}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-bold text-sm"
              >
                Return to Authorized Portal
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="px-6 py-2.5 border border-slate-700 hover:bg-slate-800 text-slate-300 rounded-xl font-bold text-sm transition-all"
              >
                Sign Out
              </button>
            </div>
          </div>
        </>
      );
    }

    // Authenticated Admin Layout
    const normalizedAdminPath = currentPath === '/admin' || currentPath === '/app/admin'
      ? '/app/admin/dashboard'
      : currentPath;

    const handleAdminOverviewNavigate = (tabId: string) => {
      switch (tabId) {
        case 'vendors':
        case 'partners':
          navigate('/app/admin/partners');
          break;
        case 'customers':
          navigate('/app/admin/customers');
          break;
        case 'listings':
        case 'food-deals':
          navigate('/app/admin/food-deals');
          break;
        case 'orders':
          navigate('/app/admin/orders');
          break;
        case 'disputes':
        case 'payouts':
        case 'reports':
        case 'audit':
          navigate('/app/admin/reports');
          break;
        case 'settings':
          navigate('/app/admin/settings');
          break;
        default:
          navigate('/app/admin/dashboard');
          break;
      }
    };

    return (
      <AdminLayout
        activePath={normalizedAdminPath}
        onNavigate={(path) => navigate(path)}
        onLogout={handleLogout}
        currentUser={currentUser}
        onUserUpdate={(updated) => setCurrentUser(updated)}
        onShowToast={addToast}
      >
        {toastContainer}

        {normalizedAdminPath === '/app/admin/partners' ? (
          <AdminVendorsPage onShowToast={addToast} />
        ) : normalizedAdminPath === '/app/admin/customers' ? (
          <AdminCustomersPage onShowToast={addToast} />
        ) : normalizedAdminPath === '/app/admin/food-deals' ? (
          <AdminListingsPage onShowToast={addToast} />
        ) : normalizedAdminPath === '/app/admin/orders' ? (
          <AdminOrdersPage onShowToast={addToast} />
        ) : normalizedAdminPath === '/app/admin/reports' ? (
          <AdminReportsPage onShowToast={addToast} onNavigateTab={(path) => navigate(path)} />
        ) : normalizedAdminPath === '/app/admin/settings' ? (
          <AdminSettingsPage currentUser={currentUser} onShowToast={addToast} onLogout={handleLogout} />
        ) : (
          <AdminOverviewPage onNavigateTab={handleAdminOverviewNavigate} onShowToast={addToast} />
        )}
      </AdminLayout>
    );
  }

  // ---------------------------------------------------------------------------
  // 3. RESTAURANT PARTNER PORTAL (Strictly Role-Protected: PARTNER only)
  // Routes: /app/partner/dashboard, /app/partner/listings, /app/partner/orders,
  //         /app/partner/earnings, /app/partner/settings
  // ---------------------------------------------------------------------------
  if (currentPath.startsWith('/app/partner') || currentPath.startsWith('/partner') || currentPath.startsWith('/restaurant')) {
    // Gate: Must be PARTNER (or ADMIN testing)
    if (!currentUser || (currentUser.role !== 'PARTNER' && currentUser.role !== 'ADMIN')) {
      if (currentUser && currentUser.role === 'CUSTOMER') {
        return (
          <>
            {toastContainer}
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-[32px]">block</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">Customer Account Detected</h1>
              <p className="text-slate-500 text-sm max-w-md mb-6">
                Customer accounts cannot access the Restaurant Partner Portal. If you manage a restaurant, please sign in with your merchant credentials or register your restaurant.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/app/customer/dashboard')}
                  className="px-5 py-2.5 bg-[#006030] text-white rounded-xl font-bold text-sm"
                >
                  Return to Deals
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleLogout();
                    navigate('/partner/login');
                  }}
                  className="px-5 py-2.5 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl font-bold text-sm"
                >
                  Switch Account
                </button>
              </div>
            </div>
          </>
        );
      }

      // Not authenticated: Save intended path & show partner login
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('savebite_redirect_path', currentPath);
      }
      return (
        <>
          {toastContainer}
          <PartnerLoginPage
            onSuccess={(partnerUser, restaurant) => {
              setCurrentUser(partnerUser);
              if (restaurant) setPartnerRestaurant(restaurant);
              const target = getRedirectPathForRole('PARTNER', '/app/partner/dashboard');
              navigate(target);
            }}
            onNavigateToRegister={() => navigate('/partner/register')}
            onNavigateToCustomer={() => navigate('/customer/login')}
            onShowToast={addToast}
          />
        </>
      );
    }

    // Pending Approval Screen: If restaurant is PENDING or REJECTED
    if (partnerRestaurant && (partnerRestaurant.kycStatus === 'PENDING' || partnerRestaurant.kycStatus === 'REJECTED')) {
      return (
        <>
          {toastContainer}
          <PartnerPendingApprovalPage
            restaurant={partnerRestaurant}
            onRefresh={refreshPartnerRestaurant}
            onLogout={handleLogout}
          />
        </>
      );
    }

    // Authenticated Partner Layout
    const normalizedPartnerPath = currentPath === '/partner' || currentPath === '/app/partner'
      ? '/app/partner/dashboard'
      : currentPath;

    const partnerActiveTab = normalizedPartnerPath === '/app/partner/listings'
      ? 'listings'
      : normalizedPartnerPath === '/app/partner/orders'
      ? 'orders'
      : normalizedPartnerPath === '/app/partner/earnings'
      ? 'earnings'
      : normalizedPartnerPath === '/app/partner/settings'
      ? 'settings'
      : 'dashboard';

    const handlePartnerTabChange = (tabId: string) => {
      switch (tabId) {
        case 'listings':
          navigate('/app/partner/listings');
          break;
        case 'orders':
          navigate('/app/partner/orders');
          break;
        case 'earnings':
          navigate('/app/partner/earnings');
          break;
        case 'settings':
          navigate('/app/partner/settings');
          break;
        case 'dashboard':
        default:
          navigate('/app/partner/dashboard');
          break;
      }
    };

    return (
      <PartnerLayout
        activeTab={partnerActiveTab}
        onTabChange={handlePartnerTabChange}
        restaurantName={partnerRestaurant?.name || 'The Daily Dough Bakery'}
        branchName={partnerRestaurant?.branchName || 'North Gate Campus Plaza'}
        currentUser={currentUser}
        partnerRestaurant={partnerRestaurant}
        onUpdateUser={(updatedUser) => {
          setCurrentUser(updatedUser);
        }}
        onUpdateRestaurant={(updatedRest) => {
          if (partnerRestaurant && updatedRest) {
            setPartnerRestaurant({
              ...partnerRestaurant,
              ...updatedRest,
            });
          }
        }}
        onShowToast={addToast}
        onLogout={handleLogout}
      >
        {toastContainer}

        {partnerActiveTab === 'listings' ? (
          <PartnerListingsPage
            onOpenCreateDealModal={() => setIsPartnerCreateDealOpen(true)}
            onShowToast={addToast}
            refreshTrigger={partnerRefreshTrigger}
          />
        ) : partnerActiveTab === 'orders' ? (
          <PartnerOrdersPage
            onOpenVerifyOtpModal={() => setIsPartnerVerifyOtpOpen(true)}
            onShowToast={addToast}
            refreshTrigger={partnerRefreshTrigger}
          />
        ) : partnerActiveTab === 'earnings' ? (
          <PartnerEarningsPage onShowToast={addToast} refreshTrigger={partnerRefreshTrigger} />
        ) : partnerActiveTab === 'settings' ? (
          <PartnerSettingsPage
            restaurant={partnerRestaurant as any}
            onShowToast={addToast}
            onLogout={handleLogout}
          />
        ) : (
          <PartnerDashboardPage
            restaurant={partnerRestaurant as any}
            onOpenCreateDealModal={() => setIsPartnerCreateDealOpen(true)}
            onOpenVerifyOtpModal={() => setIsPartnerVerifyOtpOpen(true)}
            onNavigateTab={handlePartnerTabChange}
            onShowToast={addToast}
            refreshTrigger={partnerRefreshTrigger}
          />
        )}

        {/* Partner Modals */}
        <CreateDealModal
          isOpen={isPartnerCreateDealOpen}
          onClose={() => setIsPartnerCreateDealOpen(false)}
          onSuccess={(newDeal) => {
            refreshPartnerRestaurant();
            setPartnerRefreshTrigger((prev) => prev + 1);
            addToast('success', `"${newDeal.title}" created successfully!`, 'Deal Published 🎉');
          }}
          onShowToast={addToast}
        />

        <VerifyOtpModal
          isOpen={isPartnerVerifyOtpOpen}
          onClose={() => setIsPartnerVerifyOtpOpen(false)}
          onVerificationSuccess={(orderData) => {
            refreshPartnerRestaurant();
            setPartnerRefreshTrigger((prev) => prev + 1);
            addToast('success', `Order ${orderData.orderNumber} collected!`, 'Pickup Verified 🎉');
          }}
          onShowToast={addToast}
        />
      </PartnerLayout>
    );
  }

  // ---------------------------------------------------------------------------
  // 4. CUSTOMER PORTAL
  // Routes: /app/customer/dashboard, /app/customer/food-deals, /app/customer/orders,
  //         /app/customer/profile, /app/customer/notifications
  // ---------------------------------------------------------------------------

  // If no authenticated session exists and user is not explicitly exploring as guest,
  // show customer login with redirect memory
  if (!currentUser && !isGuestBrowsing) {
    if (typeof window !== 'undefined' && currentPath.startsWith('/app/customer')) {
      sessionStorage.setItem('savebite_redirect_path', currentPath);
    }
    return (
      <>
        {toastContainer}
        <CustomerLoginPage
          currentUser={null}
          onContinue={() => {
            setIsGuestBrowsing(false);
            const target = getRedirectPathForRole('CUSTOMER', '/app/customer/dashboard');
            navigate(target);
          }}
          onSwitchAccount={handleLogout}
          onSuccess={(customerUser) => {
            setCurrentUser(customerUser);
            setIsGuestBrowsing(false);
            const pendingStr = sessionStorage.getItem('savebite_pending_deal');
            if (pendingStr) {
              try {
                const pending = JSON.parse(pendingStr);
                if (!selectedDeal && pending.deal) {
                  setSelectedDeal(pending.deal);
                }
              } catch {}
            }
            const target = getRedirectPathForRole('CUSTOMER', '/app/customer/dashboard');
            navigate(target);
          }}
          onNavigateToRegister={() => navigate('/customer/register')}
          onNavigateToPartner={() => navigate('/partner/login')}
          onBrowseGuest={() => {
            setIsGuestBrowsing(true);
            navigate('/app/customer/food-deals');
          }}
          onShowToast={addToast}
        />
      </>
    );
  }

  // Authenticated or Guest Customer Experience
  const isCustomer = currentUser?.role === 'CUSTOMER';
  const customerUser = isCustomer ? currentUser : null;

  // Determine active customer section based on URL
  const normalizedCustomerPath = currentPath === '/' || currentPath === '/app/customer' || currentPath === '/customer'
    ? '/app/customer/dashboard'
    : currentPath;

  const customerActiveTab = normalizedCustomerPath === '/app/customer/food-deals'
    ? 'food-deals'
    : normalizedCustomerPath === '/app/customer/orders'
    ? 'orders'
    : normalizedCustomerPath === '/app/customer/profile'
    ? 'profile'
    : normalizedCustomerPath === '/app/customer/notifications'
    ? 'notifications'
    : 'dashboard';

  const handleCustomerTabChange = (tabId: string) => {
    setSelectedDeal(null);
    switch (tabId) {
      case 'food-deals':
      case 'explore':
        navigate('/app/customer/food-deals');
        break;
      case 'orders':
        navigate('/app/customer/orders');
        break;
      case 'profile':
      case 'account':
        navigate('/app/customer/profile');
        break;
      case 'notifications':
        navigate('/app/customer/notifications');
        break;
      case 'dashboard':
      default:
        navigate('/app/customer/dashboard');
        break;
    }
  };

  return (
    <CustomerLayout
      activeTab={customerActiveTab}
      onTabChange={handleCustomerTabChange}
      ordersBadgeCount={customerUser ? orders.filter((o) => o.orderStatus === 'CONFIRMED').length : 0}
      subtitle="Direct Restaurant Counter Pickup"
      onLogout={customerUser ? handleLogout : undefined}
      userAvatarUrl={customerUser?.avatarUrl}
      userName={customerUser?.fullName}
      onProfileClick={() => {
        if (customerUser) {
          navigate('/app/customer/profile');
        } else {
          setIsGuestBrowsing(false);
          navigate('/customer/login');
        }
      }}
      onNotificationsClick={() => navigate('/app/customer/notifications')}
    >
      {toastContainer}

      {/* Main Screen Router */}
      {selectedDeal ? (
        <DealDetailPage
          deal={selectedDeal}
          currentUser={customerUser}
          onBack={() => setSelectedDeal(null)}
          onRequireLogin={() => {
            setIsGuestBrowsing(false);
            navigate('/customer/login');
          }}
          onReserveSuccess={(deal, quantity) => {
            if (!customerUser) {
              setIsGuestBrowsing(false);
              navigate('/customer/login');
              return;
            }
            setCheckoutDeal({ deal, quantity, fulfillment: 'pickup' });
            setIsCheckoutOpen(true);
          }}
          onOpenCheckout={(deal, quantity) => {
            if (!customerUser) {
              setIsGuestBrowsing(false);
              navigate('/customer/login');
              return;
            }
            setCheckoutDeal({ deal, quantity, fulfillment: 'pickup' });
            setIsCheckoutOpen(true);
          }}
          onShowToast={addToast}
        />
      ) : customerActiveTab === 'food-deals' ? (
        <ExplorePage
          onSelectDeal={(deal) => {
            setSelectedDeal(deal);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onOpenAccount={() => {
            if (customerUser) {
              navigate('/app/customer/profile');
            } else {
              setIsGuestBrowsing(false);
              navigate('/customer/login');
            }
          }}
          onNavigate={(path) => navigate(path)}
        />
      ) : customerActiveTab === 'orders' ? (
        <OrdersPage
          orders={customerUser ? orders : []}
          currentUser={customerUser}
          onRequireLogin={() => {
            setIsGuestBrowsing(false);
            navigate('/customer/login');
          }}
          onOpenPass={(order) => {
            setActivePassOrder(order);
            setIsPassModalOpen(true);
          }}
          onExploreDeals={() => navigate('/app/customer/food-deals')}
          onRedeemOrder={(orderId) => {
            setOrders((prev) =>
              prev.map((o) => (o.id === orderId ? { ...o, orderStatus: 'COMPLETED' } : o))
            );
            addToast('success', 'Order marked as completed at the counter!', 'Order Collected');
          }}
          onOrderHistoryCleared={handleOrderHistoryCleared}
          onShowToast={addToast}
        />
      ) : customerActiveTab === 'profile' ? (
        <AccountPage
          currentUser={customerUser}
          onLogout={customerUser ? handleLogout : () => {
            setIsGuestBrowsing(false);
            navigate('/customer/login');
          }}
          onOpenAvatarSelector={() => setIsAvatarModalOpen(true)}
          onShowToast={addToast}
        />
      ) : customerActiveTab === 'notifications' ? (
        <CustomerNotificationsPage
          onNavigate={(path) => navigate(path)}
          onShowToast={addToast}
        />
      ) : (
        <DashboardPage
          onSelectDeal={(deal) => {
            setSelectedDeal(deal);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onShowPassModal={(order) => {
            if (order) setActivePassOrder(order);
            setIsPassModalOpen(true);
          }}
          onNavigate={(path) => navigate(path)}
        />
      )}

      {/* Checkout & Razorpay Sandbox Modal */}
      {checkoutDeal && (
        <CheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          deal={checkoutDeal.deal}
          initialQuantity={checkoutDeal.quantity}
          initialFulfillment={checkoutDeal.fulfillment}
          onCheckoutSuccess={(confirmedOrder) => {
            setOrders((prev) => [confirmedOrder, ...prev]);
            setActivePassOrder(confirmedOrder);
            setSelectedDeal(null);
            setIsCheckoutOpen(false);
            setIsPassModalOpen(true);
            addToast(
              'success',
              `Payment verified! Order ${confirmedOrder.orderNumber} confirmed. Digital pickup pass is ready.`,
              'Order Confirmed 🎉'
            );
          }}
        />
      )}

      {/* Digital Pass Modal */}
      <PickupPassModal
        isOpen={isPassModalOpen}
        onClose={() => setIsPassModalOpen(false)}
        order={activePassOrder}
        onOrderStatusChange={(updatedOrder) => {
          setActivePassOrder(updatedOrder);
          setOrders((prev) =>
            prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
          );
        }}
      />

      {/* Avatar Selector Modal */}
      <AvatarSelectorModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        currentAvatarUrl={currentUser?.avatarUrl}
        onSelectAvatar={async (newAvatarUrl) => {
          try {
            const updated = await authApi.updateAvatar(newAvatarUrl);
            setCurrentUser(updated);
            addToast('success', 'Your profile cartoon avatar has been updated!', 'Avatar Saved');
          } catch (err: any) {
            addToast('error', err.message || 'Failed to update avatar', 'Update Failed');
            throw err;
          }
        }}
      />
    </CustomerLayout>
  );
};

export default App;
