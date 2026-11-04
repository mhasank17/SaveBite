import React, { useState, useEffect, useCallback } from 'react';
import CustomerLayout from './layouts/CustomerLayout';
import PartnerLayout from './layouts/PartnerLayout';
import AdminLayout from './layouts/AdminLayout';
import Toast from './components/common/Toast';
import { FoodDeal, Order } from './types';
import authApi, { AuthUser, PartnerRestaurantInfo } from './services/authApi';
import api from './services/api';
import partnerApi, { PartnerRestaurant } from './services/partnerApi';
import { MOCK_LOCATIONS, LocationOption, MOCK_ORDERS, MOCK_FOOD_DEALS } from './data/mockDeals';

// Customer Pages
import ExplorePage from './pages/customer/ExplorePage';
import DealDetailPage from './pages/customer/DealDetailPage';
import OrdersPage from './pages/customer/OrdersPage';
import AccountPage from './pages/customer/AccountPage';
import CustomerLoginPage from './pages/customer/CustomerLoginPage';
import CustomerRegisterPage from './pages/customer/CustomerRegisterPage';
import LocationPickerModal from './components/customer/LocationPickerModal';
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
import AdminDisputesPage from './pages/admin/AdminDisputesPage';
import AdminPayoutsPage from './pages/admin/AdminPayoutsPage';
import AdminAuditLogsPage from './pages/admin/AdminAuditLogsPage';

export const App: React.FC = () => {
  // Navigation & URL Routing
  const [currentPath, setCurrentPath] = useState<string>(
    typeof window !== 'undefined' ? window.location.pathname || '/' : '/'
  );

  // Authentication State
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => authApi.getUser());
  const [partnerRestaurant, setPartnerRestaurant] = useState<PartnerRestaurantInfo | null>(() =>
    authApi.getPartnerRestaurant()
  );

  // Active sub-tabs per portal with persistent tab restoration
  const [customerTab, setCustomerTab] = useState<string>('explore');
  const [partnerTab, setPartnerTabState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('savebite_partner_tab');
      if (stored) return stored;
    }
    return 'dashboard';
  });

  const setPartnerTab = useCallback((tab: string) => {
    setPartnerTabState(tab);
    if (typeof window !== 'undefined') {
      localStorage.setItem('savebite_partner_tab', tab);
    }
  }, []);

  const [adminTab, setAdminTab] = useState<string>('overview');

  // Customer Deal & Location State
  const [selectedDeal, setSelectedDeal] = useState<FoodDeal | null>(null);
  const [currentLocation, setCurrentLocation] = useState<LocationOption>(MOCK_LOCATIONS[0]);
  const [maxDistanceKm, setMaxDistanceKm] = useState<number>(3);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
  const [activePassOrder, setActivePassOrder] = useState<Order | null>(MOCK_ORDERS[0] || null);
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
    authApi
      .getMe()
      .then((data) => {
        if (data) {
          setCurrentUser(data.user);
          if (data.restaurant) {
            setPartnerRestaurant(data.restaurant);
          }
        }
      })
      .catch(() => {});
  }, []);

  // Refresh customer orders
  useEffect(() => {
    if (currentPath === '/' || currentPath.startsWith('/customer')) {
      api
        .getMyOrders()
        .then((backendOrders) => {
          if (Array.isArray(backendOrders)) {
            setOrders(backendOrders);
            setActivePassOrder(backendOrders[0] || null);
          }
        })
        .catch(() => {});
    }
  }, [currentPath, currentUser]);

  // Restore selected pickup location on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedLocationId = localStorage.getItem('savebite_selected_location_id');
      if (storedLocationId) {
        const found = MOCK_LOCATIONS.find((l) => l.id === storedLocationId);
        if (found) setCurrentLocation(found);
      }
    }
  }, []);

  const handleOrderHistoryCleared = async () => {
    try {
      const backendOrders = await api.getMyOrders();
      if (Array.isArray(backendOrders)) {
        setOrders(backendOrders);
        setActivePassOrder(backendOrders[0] || null);
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
        };
        setPartnerRestaurant(info);
        if (typeof window !== 'undefined') {
          localStorage.setItem('savebite_partner_restaurant', JSON.stringify(info));
        }
      })
      .catch(() => {});
  }, [currentUser]);

  useEffect(() => {
    if (currentPath.startsWith('/partner') && currentUser?.role === 'PARTNER') {
      refreshPartnerRestaurant();
    }
  }, [currentPath, currentUser, refreshPartnerRestaurant]);

  // Session Logout Handler
  const handleLogout = () => {
    const prevRole = currentUser?.role;
    authApi.logout();
    setCurrentUser(null);
    setPartnerRestaurant(null);
    setSelectedDeal(null);

    if (prevRole === 'ADMIN') {
      addToast('info', 'SuperAdmin session terminated.', 'Signed Out');
      navigate('/admin/login');
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

  // ---------------------------------------------------------------------------
  // 1. ADMIN PORTAL (Strictly Isolated)
  // ---------------------------------------------------------------------------
  if (currentPath === '/admin/login') {
    return (
      <>
        {toastContainer}
        <AdminLoginPage
          onSuccess={(adminUser) => {
            setCurrentUser(adminUser);
            navigate('/admin');
          }}
          onNavigateToCustomer={() => navigate('/')}
          onShowToast={addToast}
        />
      </>
    );
  }

  if (currentPath.startsWith('/admin')) {
    // Role Gate: Must be logged in as ADMIN
    if (!currentUser || currentUser.role !== 'ADMIN') {
      // If logged in as another role, block with notice
      if (currentUser && currentUser.role !== 'ADMIN') {
        return (
          <>
            {toastContainer}
            <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center text-white">
              <div className="w-16 h-16 rounded-2xl bg-red-900/60 text-red-400 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-[32px]">gpp_bad</span>
              </div>
              <h1 className="text-2xl font-bold mb-2">Access Restricted</h1>
              <p className="text-slate-400 text-sm max-w-md mb-6">
                Your account ({currentUser.role}) does not have administrative clearance for the University SuperAdmin Console.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate(currentUser.role === 'PARTNER' ? '/partner' : '/')}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-bold text-sm"
                >
                  Return to Authorized Portal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleLogout();
                    navigate('/admin/login');
                  }}
                  className="px-6 py-2.5 border border-slate-700 hover:bg-slate-800 text-slate-300 rounded-xl font-bold text-sm transition-all"
                >
                  Switch to SuperAdmin Login
                </button>
              </div>
            </div>
          </>
        );
      }

      // Not authenticated: Show secure admin login
      return (
        <>
          {toastContainer}
          <AdminLoginPage
            onSuccess={(adminUser) => {
              setCurrentUser(adminUser);
              navigate('/admin');
            }}
            onNavigateToCustomer={() => navigate('/')}
            onShowToast={addToast}
          />
        </>
      );
    }

    // Authenticated SuperAdmin Layout
    return (
      <AdminLayout
        activeTab={adminTab}
        onTabChange={setAdminTab}
        onLogout={handleLogout}
        currentUser={currentUser}
        onUserUpdate={(updated) => setCurrentUser(updated)}
        onShowToast={addToast}
      >
        {toastContainer}

        {adminTab === 'vendors' ? (
          <AdminVendorsPage onShowToast={addToast} />
        ) : adminTab === 'customers' ? (
          <AdminCustomersPage onShowToast={addToast} />
        ) : adminTab === 'orders' ? (
          <AdminOrdersPage onShowToast={addToast} />
        ) : adminTab === 'listings' ? (
          <AdminListingsPage onShowToast={addToast} />
        ) : adminTab === 'disputes' ? (
          <AdminDisputesPage onShowToast={addToast} />
        ) : adminTab === 'payouts' ? (
          <AdminPayoutsPage onShowToast={addToast} />
        ) : adminTab === 'audit' ? (
          <AdminAuditLogsPage onShowToast={addToast} />
        ) : (
          <AdminOverviewPage onNavigateTab={(tab) => setAdminTab(tab)} onShowToast={addToast} />
        )}
      </AdminLayout>
    );
  }

  // ---------------------------------------------------------------------------
  // 2. RESTAURANT OWNER PORTAL (Strictly Isolated)
  // ---------------------------------------------------------------------------
  if (currentPath === '/partner/register') {
    return (
      <>
        {toastContainer}
        <PartnerRegisterPage
          onSuccess={(partnerUser, restaurant) => {
            setCurrentUser(partnerUser);
            setPartnerRestaurant(restaurant);
            navigate('/partner');
          }}
          onNavigateToLogin={() => navigate('/partner/login')}
          onShowToast={addToast}
        />
      </>
    );
  }

  if (currentPath === '/partner/login') {
    return (
      <>
        {toastContainer}
        <PartnerLoginPage
          onSuccess={(partnerUser, restaurant) => {
            setCurrentUser(partnerUser);
            if (restaurant) setPartnerRestaurant(restaurant);
            navigate('/partner');
          }}
          onNavigateToRegister={() => navigate('/partner/register')}
          onNavigateToCustomer={() => navigate('/customer/login')}
          onShowToast={addToast}
        />
      </>
    );
  }

  if (currentPath.startsWith('/partner') || currentPath.startsWith('/restaurant')) {
    // Role Gate: Must be PARTNER (or ADMIN testing)
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
                  onClick={() => navigate('/')}
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

      // Not authenticated: Show partner login
      return (
        <>
          {toastContainer}
          <PartnerLoginPage
            onSuccess={(partnerUser, restaurant) => {
              setCurrentUser(partnerUser);
              if (restaurant) setPartnerRestaurant(restaurant);
              navigate('/partner');
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

    // Authenticated & Approved Partner Layout
    return (
      <PartnerLayout
        activeTab={partnerTab}
        onTabChange={setPartnerTab}
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

        {partnerTab === 'listings' ? (
          <PartnerListingsPage
            onOpenCreateDealModal={() => setIsPartnerCreateDealOpen(true)}
            onShowToast={addToast}
          />
        ) : partnerTab === 'orders' ? (
          <PartnerOrdersPage
            onOpenVerifyOtpModal={() => setIsPartnerVerifyOtpOpen(true)}
            onShowToast={addToast}
          />
        ) : partnerTab === 'earnings' ? (
          <PartnerEarningsPage onShowToast={addToast} />
        ) : partnerTab === 'settings' ? (
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
            onNavigateTab={(tab) => setPartnerTab(tab)}
            onShowToast={addToast}
          />
        )}

        {/* Modals */}
        <CreateDealModal
          isOpen={isPartnerCreateDealOpen}
          onClose={() => setIsPartnerCreateDealOpen(false)}
          onSuccess={(newDeal) => {
            addToast('success', `"${newDeal.title}" created successfully!`, 'Deal Published 🎉');
          }}
          onShowToast={addToast}
        />

        <VerifyOtpModal
          isOpen={isPartnerVerifyOtpOpen}
          onClose={() => setIsPartnerVerifyOtpOpen(false)}
          onVerificationSuccess={(orderData) => {
            addToast('success', `Order ${orderData.orderNumber} collected!`, 'Pickup Verified 🎉');
          }}
          onShowToast={addToast}
        />
      </PartnerLayout>
    );
  }

  // ---------------------------------------------------------------------------
  // 3. CUSTOMER PORTAL (Strictly Isolated)
  // ---------------------------------------------------------------------------
  if (currentPath === '/customer/login' || currentPath === '/login') {
    return (
      <>
        {toastContainer}
        <CustomerLoginPage
          currentUser={currentUser?.role === 'CUSTOMER' ? currentUser : null}
          onContinue={() => navigate('/')}
          onSwitchAccount={handleLogout}
          onSuccess={(customerUser) => {
            setCurrentUser(customerUser);
            // Restore any preserved pending deal from login redirect
            const pendingStr = sessionStorage.getItem('savebite_pending_deal');
            if (pendingStr) {
              try {
                const pending = JSON.parse(pendingStr);
                if (!selectedDeal && pending.dealId) {
                  const restored = MOCK_FOOD_DEALS.find((d) => d.id === pending.dealId);
                  if (restored) {
                    setSelectedDeal(restored);
                  }
                }
              } catch {}
            }
            navigate('/');
          }}
          onNavigateToRegister={() => navigate('/customer/register')}
          onNavigateToPartner={() => navigate('/partner/login')}
          onNavigateToAdmin={() => navigate('/admin/login')}
          onShowToast={addToast}
        />
      </>
    );
  }

  if (currentPath === '/customer/register' || currentPath === '/register') {
    return (
      <>
        {toastContainer}
        <CustomerRegisterPage
          onSuccess={(customerUser) => {
            setCurrentUser(customerUser);
            // Restore any preserved pending deal from login redirect
            const pendingStr = sessionStorage.getItem('savebite_pending_deal');
            if (pendingStr) {
              try {
                const pending = JSON.parse(pendingStr);
                if (!selectedDeal && pending.dealId) {
                  const restored = MOCK_FOOD_DEALS.find((d) => d.id === pending.dealId);
                  if (restored) {
                    setSelectedDeal(restored);
                  }
                }
              } catch {}
            }
            navigate('/');
          }}
          onNavigateToLogin={() => navigate('/customer/login')}
          onShowToast={addToast}
        />
      </>
    );
  }

  // Standard Customer Experience (Role Isolated)
  const isCustomer = currentUser?.role === 'CUSTOMER';
  const customerUser = isCustomer ? currentUser : null;

  return (
    <CustomerLayout
      activeTab={customerTab}
      onTabChange={(tabId) => {
        setSelectedDeal(null);
        setCustomerTab(tabId);
      }}
      onLocationClick={() => setIsLocationModalOpen(true)}
      ordersBadgeCount={customerUser ? orders.filter((o) => o.orderStatus === 'CONFIRMED').length : 0}
      subtitle={`Pickup near: ${currentLocation.name}`}
      onLogout={customerUser ? handleLogout : undefined}
      userAvatarUrl={customerUser?.avatarUrl}
      userName={customerUser?.fullName}
      onProfileClick={() => {
        if (customerUser) {
          setIsAvatarModalOpen(true);
        } else {
          navigate('/customer/login');
        }
      }}
    >
      {toastContainer}

      {/* Main Screen Router */}
      {selectedDeal ? (
        <DealDetailPage
          deal={selectedDeal}
          currentUser={customerUser}
          onBack={() => setSelectedDeal(null)}
          onRequireLogin={() => navigate('/customer/login')}
          onReserveSuccess={(deal, quantity) => {
            setCheckoutDeal({ deal, quantity, fulfillment: 'pickup' });
            setIsCheckoutOpen(true);
          }}
          onOpenCheckout={(deal, quantity) => {
            setCheckoutDeal({ deal, quantity, fulfillment: 'pickup' });
            setIsCheckoutOpen(true);
          }}
          onShowToast={addToast}
        />
      ) : customerTab === 'orders' ? (
        <OrdersPage
          orders={customerUser ? orders : []}
          currentUser={customerUser}
          onRequireLogin={() => navigate('/customer/login')}
          onOpenPass={(order) => {
            setActivePassOrder(order);
            setIsPassModalOpen(true);
          }}
          onExploreDeals={() => setCustomerTab('explore')}
          onRedeemOrder={(orderId) => {
            setOrders((prev) =>
              prev.map((o) => (o.id === orderId ? { ...o, orderStatus: 'COMPLETED' } : o))
            );
            addToast('success', 'Order marked as completed at the counter!', 'Order Collected');
          }}
          onOrderHistoryCleared={handleOrderHistoryCleared}
          onShowToast={addToast}
        />
      ) : customerTab === 'account' ? (
        <AccountPage
          onOpenLocationPicker={() => setIsLocationModalOpen(true)}
          currentLocationName={currentLocation.name}
          currentUser={customerUser}
          onLogout={customerUser ? handleLogout : () => navigate('/customer/login')}
          onOpenAvatarSelector={() => setIsAvatarModalOpen(true)}
          onShowToast={addToast}
        />
      ) : (
        <ExplorePage
          onSelectDeal={(deal) => {
            setSelectedDeal(deal);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onOpenLocationModal={() => setIsLocationModalOpen(true)}
          currentLocationName={currentLocation.name}
          maxDistanceKm={maxDistanceKm}
          onOpenAccount={() => {
            if (customerUser) {
              setCustomerTab('account');
            } else {
              navigate('/customer/login');
            }
          }}
        />
      )}

      {/* Customer Location Picker Modal */}
      <LocationPickerModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        currentLocation={currentLocation}
        currentRadiusKm={maxDistanceKm}
        onSelectLocation={(loc, radiusKm) => {
          setCurrentLocation(loc);
          if (radiusKm) setMaxDistanceKm(radiusKm);
          if (typeof window !== 'undefined') {
            localStorage.setItem('savebite_selected_location_id', loc.id);
          }
          addToast(
            'success',
            `Pickup location set to ${loc.name}.`,
            'Location Updated'
          );
        }}
        onShowToast={addToast}
      />

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
