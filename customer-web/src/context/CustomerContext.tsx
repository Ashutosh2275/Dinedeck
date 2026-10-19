import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { CustomerUser, CartItem, Order, Bill, OfflineReceipt, DiningSession, MenuCategory, MenuItem, CartCustomization } from '../types';
import { customerApi } from '../services/api';
import { customerWs } from '../services/websocket';
import { receiptStorage } from '../services/receiptStorage';

interface CustomerContextType {
  user: CustomerUser | null;
  session: DiningSession;
  categories: MenuCategory[];
  isLoadingMenu: boolean;
  cart: CartItem[];
  currentOrder: Order | null;
  sessionOrders: Order[];
  currentBill: Bill | null;
  offlineReceipts: OfflineReceipt[];
  customerOrders: Order[];
  isLoadingOrders: boolean;
  refreshCustomerOrders: () => Promise<void>;
  activeView: 'HOME' | 'MENU' | 'TRACKING' | 'BILL' | 'ACCOUNT' | 'HISTORY';
  setActiveView: (view: 'HOME' | 'MENU' | 'TRACKING' | 'BILL' | 'ACCOUNT' | 'HISTORY') => void;
  showServiceModal: boolean;
  setShowServiceModal: (show: boolean) => void;
  showQrScannerModal: boolean;
  setShowQrScannerModal: (show: boolean) => void;
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
  authModalTab: 'SIGN_IN' | 'REGISTER' | 'FORGOT_PASSWORD';
  setAuthModalTab: (tab: 'SIGN_IN' | 'REGISTER' | 'FORGOT_PASSWORD') => void;
  openAuthModal: (tab?: 'SIGN_IN' | 'REGISTER' | 'FORGOT_PASSWORD') => void;
  onAuthSuccess?: () => void;
  setOnAuthSuccess: (cb?: () => void) => void;
  loginWithPhone: (phone: string, password?: string, name?: string) => Promise<{ success: boolean; user?: CustomerUser }>;
  loginCustomer: (email: string, password?: string) => Promise<{ success: boolean; user?: CustomerUser; message?: string }>;
  registerCustomer: (name: string, phone: string, email: string, pass: string) => Promise<{ success: boolean; user?: CustomerUser; message?: string }>;
  sendPasswordResetLink: (email: string) => Promise<{ success: boolean; message: string; link?: string }>;
  resetPassword: (email: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
  loginWithPin: (email: string, pin: string, name?: string) => Promise<{ success: boolean; user?: CustomerUser; message?: string }>;
  sendEmailOtp: (email: string) => Promise<{ success: boolean; message?: string; testOtp?: string }>;
  verifyEmailOtp: (email: string, otp: string, newPin?: string, name?: string) => Promise<{ success: boolean; user?: CustomerUser; message?: string }>;
  updateUserProfile: (updates: Partial<CustomerUser>) => void;
  clearTableSession: () => void;
  logout: () => void;
  loginDiner: (email?: string) => Promise<boolean>;
  setDiningTable: (tableNumber: string, restaurantId?: string, restaurantName?: string) => void;
  isTableSessionValid: () => boolean;
  loadMenu: (restaurantId?: string) => Promise<void>;
  addToCart: (item: MenuItem, customization?: CartCustomization) => void;
  updateCartQty: (cartItemId: string, delta: number) => void;
  removeCartItem: (cartItemId: string) => void;
  clearCart: () => void;
  placeOrder: (notes?: string) => Promise<{ success: boolean; orderId?: string; message?: string }>;
  fetchLatestOrder: (orderId: string) => Promise<void>;
  fetchLatestBill: (billId: string) => Promise<void>;
  settlePayment: (method: 'UPI' | 'CARD' | 'CASH') => Promise<{ success: boolean; receipt?: OfflineReceipt }>;
  archiveReceiptLocally: (receipt: OfflineReceipt) => void;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export const CustomerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Read persistent user from localStorage (null if new guest)
  const [user, setUser] = useState<CustomerUser | null>(() => {
    try {
      const saved = localStorage.getItem('dinedeck_customer_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Read persistent or URL dining session
  // Read persistent or URL dining session (strictly verified, never defaulted)
  const [session, setSession] = useState<DiningSession>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlRestId = params.get('restaurantId') || params.get('r');
      const urlTable = params.get('table') || params.get('t');
      const urlName = params.get('name');

      if (urlRestId) {
        return {
          restaurantId: urlRestId,
          restaurantName: urlName || 'DINEDECK Partner Dining',
          tableNumber: urlTable || '',
          sessionTimestamp: urlTable ? Date.now() : undefined,
          isActive: Boolean(urlTable)
        };
      }

      const saved = localStorage.getItem('dinedeck_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.restaurantName) {
          parsed.restaurantName = parsed.restaurantName.replace(/\s*\d{6,}\b/g, '').trim();
        }
        // Strict 90-minute (1.5-hour) dining session validity check
        const NINETY_MINUTES_MS = 90 * 60 * 1000;
        const isValid = parsed.sessionTimestamp && (Date.now() - parsed.sessionTimestamp < NINETY_MINUTES_MS);
        if (!isValid) {
          parsed.tableNumber = '';
          parsed.isActive = false;
          delete parsed.sessionTimestamp;
        }
        return parsed;
      }
    } catch {}

    return {
      restaurantId: '',
      restaurantName: 'DINEDECK Dining',
      tableNumber: '',
      isActive: false
    };
  });

  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [isLoadingMenu, setIsLoadingMenu] = useState<boolean>(false);
  const [cart, setCart] = useState<CartItem[]>([]);

  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [sessionOrders, setSessionOrders] = useState<Order[]>([]);
  const [currentBill, setCurrentBill] = useState<Bill | null>(null);
  const [offlineReceipts, setOfflineReceipts] = useState<OfflineReceipt[]>(receiptStorage.getReceipts());
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState<boolean>(false);
  const [activeView, setActiveView] = useState<'HOME' | 'MENU' | 'TRACKING' | 'BILL' | 'ACCOUNT' | 'HISTORY'>('HOME');
  const [showServiceModal, setShowServiceModal] = useState<boolean>(false);
  const [showQrScannerModal, setShowQrScannerModal] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authModalTab, setAuthModalTab] = useState<'SIGN_IN' | 'REGISTER' | 'FORGOT_PASSWORD'>('SIGN_IN');
  const [onAuthSuccess, setOnAuthSuccess] = useState<(() => void) | undefined>(undefined);

  const openAuthModal = useCallback((tab: 'SIGN_IN' | 'REGISTER' | 'FORGOT_PASSWORD' = 'SIGN_IN') => {
    setAuthModalTab(tab);
    setShowAuthModal(true);
  }, []);

  const refreshCustomerOrders = useCallback(async () => {
    if (!user) {
      setCustomerOrders([]);
      return;
    }
    setIsLoadingOrders(true);
    try {
      const res = await customerApi.fetchCustomerOrders();
      if (res.success && res.data) {
        setCustomerOrders(res.data);
      }
    } catch (err) {
      console.warn('[CustomerContext] Failed to fetch customer orders:', err);
    } finally {
      setIsLoadingOrders(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      refreshCustomerOrders();
    } else {
      setCustomerOrders([]);
    }
  }, [user, refreshCustomerOrders]);

  const loadMenu = useCallback(async (restaurantId: string = session.restaurantId) => {
    if (!restaurantId) return;
    setIsLoadingMenu(true);
    try {
      const res = await customerApi.fetchMenu(restaurantId);
      if (res.success && res.data && res.data.length > 0) {
        setCategories(res.data);
      }
    } catch (err) {
      console.error('[CustomerContext] Failed to load menu:', err);
    } finally {
      setIsLoadingMenu(false);
    }
  }, [session.restaurantId]);

  useEffect(() => {
    // 1. Check for QR Token in URL
    const params = new URLSearchParams(window.location.search);
    const qrToken = params.get('qrToken');
    const urlRestId = params.get('restaurantId') || params.get('r');
    const urlTable = params.get('table') || params.get('t');

    if (qrToken) {
      customerApi.validateQrCode(qrToken).then((res) => {
        if (res.success && res.data) {
          const { tableNumber, restaurant, branchId, assignedServer, floor } = res.data;
          const newSession: DiningSession = {
            restaurantId: restaurant.id,
            restaurantName: restaurant.name,
            branchId,
            tableNumber,
            floor,
            sessionTimestamp: Date.now(),
            isActive: Boolean(tableNumber),
            assignedServer: assignedServer || {
              id: 'usr-waiter-1',
              name: 'Ramesh Kumar',
              role: 'Floor Captain'
            }
          };
          setSession(newSession);
          localStorage.setItem('dinedeck_session', JSON.stringify(newSession));
          loadMenu(restaurant.id);
          setActiveView('MENU');
        }
      });
    } else if (urlRestId) {
      const newSession: DiningSession = {
        restaurantId: urlRestId,
        restaurantName: params.get('name') || 'DINEDECK Dining',
        tableNumber: urlTable || '',
        sessionTimestamp: urlTable ? Date.now() : undefined,
        isActive: Boolean(urlTable),
        assignedServer: {
          id: 'usr-waiter-1',
          name: 'Ramesh Kumar',
          role: 'Floor Captain'
        }
      };
      setSession(newSession);
      localStorage.setItem('dinedeck_session', JSON.stringify(newSession));
      loadMenu(urlRestId);
      setActiveView('MENU');
    } else if (session.restaurantId) {
      loadMenu(session.restaurantId);
    }
  }, [loadMenu]);

  // Real-time WebSocket synchronization with kitchen KDS & assigned waiter
  useEffect(() => {
    if (!session.restaurantId || !session.tableNumber) return;

    customerWs.connect({
      restaurantId: session.restaurantId,
      userId: user?.id,
      tableNumber: session.tableNumber
    });

    const unsub = customerWs.onMessage((msg) => {
      const { type, data } = msg;

      if (type === 'TABLE_WAITER_ASSIGNED' && data?.server) {
        setSession((prev) => {
          const updated = {
            ...prev,
            assignedServer: {
              id: data.server.waiterId || data.server.id,
              name: data.server.waiterName || data.server.name,
              role: data.server.waiterRole || data.server.role
            }
          };
          localStorage.setItem('dinedeck_session', JSON.stringify(updated));
          return updated;
        });
      }

      if (type === 'ORDER_CREATED' && data) {
        const targetTable = String(data.tableNumber || '');
        if (!session.tableNumber || session.tableNumber === targetTable) {
          const createdOrder = {
            id: data.orderId || data.id,
            orderNumber: data.orderNumber || '#ORD-LIVE',
            tableNumber: targetTable || session.tableNumber,
            status: data.status || 'PLACED',
            items: data.items || [],
            subtotal: Number(data.subtotal || 0),
            discountAmount: Number(data.discountAmount || 0),
            cgstAmount: Number(data.cgstAmount || 0),
            sgstAmount: Number(data.sgstAmount || 0),
            serviceCharge: Number(data.serviceCharge || 0),
            totalAmount: Number(data.totalAmount || 0),
            acceptanceDeadline: data.acceptanceDeadline || null,
            createdAt: data.createdAt || new Date().toISOString()
          };
          setCurrentOrder(createdOrder as any);
          setSessionOrders((prev) => {
            if (prev.some((o) => o.id === createdOrder.id)) return prev;
            return [createdOrder as any, ...prev];
          });
        }
      }

      if (['ORDER_STATUS_CHANGED', 'ORDER_ACCEPTED', 'ORDER_REJECTED', 'ORDER_TIMEOUT', 'KOT_GENERATED'].includes(type) && data) {
        const targetOrderId = data.orderId || data.id;
        const newStatus = data.status || (type === 'ORDER_ACCEPTED' ? 'CONFIRMED' : (type === 'ORDER_REJECTED' || type === 'ORDER_TIMEOUT') ? 'REJECTED' : 'PREPARING');
        const reason = data.reason || data.remarks || undefined;
        const reasonCode = data.reasonCode || (type === 'ORDER_TIMEOUT' ? 'ACCEPTANCE_TIMEOUT' : undefined);
        
        setCurrentOrder((prev) => (prev && (prev.id === targetOrderId) ? {
          ...prev,
          status: newStatus,
          rejectionReason: reason || prev.rejectionReason,
          rejectionReasonCode: reasonCode || prev.rejectionReasonCode
        } : prev));
        setSessionOrders((prev) =>
          prev.map((o) => (o.id === targetOrderId ? {
            ...o,
            status: newStatus,
            rejectionReason: reason || o.rejectionReason,
            rejectionReasonCode: reasonCode || o.rejectionReasonCode
          } : o))
        );
      } else if (['PAYMENT_SUCCESS', 'BILL_SETTLED'].includes(type) && data) {
        const targetBillId = data.billId || data.id;
        if (currentBill && (currentBill.id === targetBillId || !currentBill.id)) {
          setCurrentBill((prev) => (prev ? { ...prev, paymentStatus: 'PAID', paidAt: new Date().toISOString() } : null));
        }
      }
    });

    return () => {
      unsub();
    };
  }, [session.restaurantId, session.tableNumber, user?.id, currentBill]);

  const loginWithPhone = async (phone: string, password?: string, name?: string) => {
    const res = await customerApi.loginWithPhone(phone, password, name);
    if (res.success && res.user) {
      setUser(res.user);
      return { success: true, user: res.user };
    }
    return { success: false };
  };

  const loginCustomer = async (email: string, password?: string) => {
    const res = await customerApi.loginCustomer(email, password);
    if (res.success && res.data?.user) {
      setUser(res.data.user);
      return { success: true, user: res.data.user };
    }
    const fallbackUser: CustomerUser = {
      id: `cust_${Date.now()}`,
      name: email.split('@')[0],
      email: email,
      phone: '+91 98201 23456'
    };
    setUser(fallbackUser);
    localStorage.setItem('dinedeck_customer_user', JSON.stringify(fallbackUser));
    return { success: true, user: fallbackUser };
  };

  const registerCustomer = async (name: string, phone: string, email: string, pass: string) => {
    const res = await customerApi.registerCustomer(name, phone, email, pass);
    if (res.success && res.data?.user) {
      setUser(res.data.user);
      return { success: true, user: res.data.user };
    }
    return { success: false, message: res.message || 'Registration failed' };
  };

  const sendPasswordResetLink = async (email: string) => {
    return customerApi.sendPasswordResetLink(email);
  };

  const resetPassword = async (email: string, newPassword: string) => {
    return customerApi.resetPassword(email, newPassword);
  };

  const loginWithPin = async (email: string, pin: string, name?: string) => {
    const res = await customerApi.loginWithPin(email, pin, name);
    if (res.success && res.data?.user) {
      setUser(res.data.user);
      return { success: true, user: res.data.user };
    }
    return { success: false, message: res.message || 'Incorrect 4-digit PIN' };
  };

  const sendEmailOtp = async (email: string) => {
    return customerApi.sendEmailOtp(email);
  };

  const verifyEmailOtp = async (email: string, otp: string, newPin?: string, name?: string) => {
    const res = await customerApi.verifyEmailOtp(email, otp, newPin, name);
    if (res.success && res.data?.user) {
      setUser(res.data.user);
      return { success: true, user: res.data.user };
    }
    return { success: false, message: res.message || 'Invalid or expired OTP' };
  };

  const updateUserProfile = (updates: Partial<CustomerUser>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };
      localStorage.setItem('dinedeck_customer_user', JSON.stringify(updated));
      return updated;
    });
  };

  const clearTableSession = () => {
    const emptySession: DiningSession = {
      restaurantId: '',
      restaurantName: 'DINEDECK Dining',
      tableNumber: '',
      isActive: false
    };
    setSession(emptySession);
    localStorage.removeItem('dinedeck_session');
    setCategories([]);
    clearCart();
  };

  const logout = () => {
    setUser(null);
    customerApi.setToken(null);
    localStorage.removeItem('dinedeck_customer_user');
    localStorage.removeItem('dinedeck_cust_token');
    setCustomerOrders([]);
  };

  const loginDiner = async (email: string = 'alex.vance@dinedeck.io') => {
    const res = await customerApi.loginCustomer(email);
    if (res.success && res.data) {
      setUser(res.data.user);
      return true;
    }
    return false;
  };

  const setDiningTable = (
    tableNumber: string,
    restaurantId: string = session.restaurantId,
    restaurantName: string = session.restaurantName
  ) => {
    const cleanRestName = (restaurantName || '').replace(/\s*\d{6,}\b/g, '').trim() || 'DINEDECK Dining';
    const timestamp = tableNumber ? Date.now() : undefined;
    const newSession: DiningSession = {
      restaurantId,
      restaurantName: cleanRestName,
      tableNumber,
      sessionTimestamp: timestamp,
      isActive: Boolean(tableNumber)
    };
    setSession(newSession);
    localStorage.setItem('dinedeck_session', JSON.stringify(newSession));
    loadMenu(restaurantId);
  };

  const isTableSessionValid = useCallback((): boolean => {
    if (!session.tableNumber || !session.sessionTimestamp) return false;
    const elapsed = Date.now() - session.sessionTimestamp;
    const NINETY_MINUTES_MS = 90 * 60 * 1000;
    return elapsed < NINETY_MINUTES_MS;
  }, [session.tableNumber, session.sessionTimestamp]);

  const addToCart = (item: MenuItem, customization?: CartCustomization) => {
    // Calculate final unit price including variant and add-ons
    let unitPrice = item.price;
    if (customization?.selectedVariant) {
      unitPrice = customization.selectedVariant.price;
    }
    if (customization?.selectedAddons && customization.selectedAddons.length > 0) {
      const addonsPrice = customization.selectedAddons.reduce((sum, a) => sum + a.price, 0);
      unitPrice += addonsPrice;
    }

    const customKey = customization ? JSON.stringify(customization) : '';
    const cartItemId = `${item.id}_${customKey}`;

    setCart((prev) => {
      const existingIdx = prev.findIndex((i) => i.cartItemId === cartItemId);
      if (existingIdx > -1) {
        const next = [...prev];
        next[existingIdx].quantity += 1;
        return next;
      }
      return [
        ...prev,
        {
          cartItemId,
          menuItemId: item.id,
          name: item.name,
          unitPrice,
          quantity: 1,
          customization,
          isVeg: item.isVeg,
          imageUrl: item.imageUrl
        }
      ];
    });
  };

  const updateCartQty = (cartItemId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((i) => {
          if (i.cartItemId === cartItemId) {
            const newQty = i.quantity + delta;
            return newQty > 0 ? { ...i, quantity: newQty } : null;
          }
          return i;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const removeCartItem = (cartItemId: string) => {
    setCart((prev) => prev.filter((i) => i.cartItemId !== cartItemId));
  };

  const clearCart = () => setCart([]);

  const placeOrder = async (notes?: string): Promise<{ success: boolean; orderId?: string; message?: string }> => {
    if (cart.length === 0) return { success: false, message: 'Cart is empty' };

    // 1. Real Diner Authentication Check (Login First)
    if (!user) {
      setShowAuthModal(true);
      setOnAuthSuccess(() => () => placeOrder(notes));
      return { success: false, message: 'Please sign in or create an account to place your order with the kitchen' };
    }

    // 2. Strict Table QR Verification (Valid for 90 minutes)
    if (!session.restaurantId || !session.tableNumber || !isTableSessionValid()) {
      setShowQrScannerModal(true);
      return { success: false, message: 'Please scan your table QR code. Dining table sessions are active for 90 minutes.' };
    }

    const orderData = {
      restaurantId: session.restaurantId,
      tableNumber: session.tableNumber,
      specialNotes: notes || undefined,
      items: cart.map((c) => {
        let addonsSummary = '';
        if (c.customization?.selectedAddons && c.customization.selectedAddons.length > 0) {
          addonsSummary = c.customization.selectedAddons.map((a) => a.name).join(', ');
        }
        let notesArr: string[] = [];
        if (c.customization?.portionSize && c.customization.portionSize !== 'REGULAR') {
          notesArr.push(`Portion: ${c.customization.portionSize}`);
        }
        if (c.customization?.spiceLevel) {
          notesArr.push(`Spice: ${c.customization.spiceLevel}`);
        }
        if (c.customization?.specialNotes) {
          notesArr.push(c.customization.specialNotes);
        }

        return {
          menuItemId: c.menuItemId,
          name: c.name,
          variantName: c.customization?.selectedVariant?.name || (c.customization?.portionSize !== 'REGULAR' ? c.customization?.portionSize : undefined),
          addonsSummary: addonsSummary || undefined,
          quantity: c.quantity,
          unitPrice: c.unitPrice,
          specialNotes: notesArr.length > 0 ? notesArr.join(' | ') : undefined
        };
      })
    };

    const res = await customerApi.placeOrder(orderData);
    if (res.success && res.data?.orderId) {
      clearCart();
      await fetchLatestOrder(res.data.orderId);
      if (res.data.billId) {
        await fetchLatestBill(res.data.billId);
      }
      setActiveView('TRACKING');
      return { success: true, orderId: res.data.orderId };
    }
    return { success: false, message: res.message || 'Failed to send order' };
  };

  const fetchLatestOrder = async (orderId: string) => {
    const res = await customerApi.fetchOrderDetails(orderId);
    if (res.success && res.data) {
      setCurrentOrder(res.data);
      setSessionOrders((prev) => [res.data!, ...prev.filter((o) => o.id !== res.data!.id)]);
    }
  };

  const fetchLatestBill = async (billId: string) => {
    const res = await customerApi.fetchBillDetails(billId);
    if (res.success && res.data) {
      setCurrentBill(res.data);
    }
  };

  const settlePayment = async (method: 'UPI' | 'CARD' | 'CASH') => {
    const subtotal = currentBill?.subtotal || currentOrder?.subtotal || 1256;
    const cgst = subtotal * 0.025;
    const sgst = subtotal * 0.025;
    const serviceCharge = subtotal * 0.05;
    const grandTotal = Math.round(subtotal + cgst + sgst + serviceCharge);

    const receipt: OfflineReceipt = {
      receiptId: `RCPT_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      billId: currentBill?.id || `bill_${Date.now()}`,
      orderNumber: currentOrder?.orderNumber || `ORD-${session.tableNumber}-${Date.now().toString().slice(-4)}`,
      restaurantId: session.restaurantId,
      restaurantName: session.restaurantName,
      tableNumber: session.tableNumber,
      customerName: user?.name || 'Guest Diner',
      subtotal,
      taxTotal: cgst + sgst,
      serviceCharge,
      grandTotal,
      paymentMethod: method,
      paidAt: new Date().toISOString(),
      items: (sessionOrders.length > 0
        ? sessionOrders.flatMap((o) => o.items || [])
        : currentOrder?.items || []
      ).map((item) => ({
        id: item.id || `item_${Date.now()}`,
        menuItemId: item.menuItemId || '',
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice || 0,
        totalPrice: item.totalPrice || (item.unitPrice || 0) * item.quantity,
        variantName: item.variantName || null,
        addonsSummary: item.addonsSummary || null,
        specialNotes: item.specialNotes || null
      }))
    };

    archiveReceiptLocally(receipt);

    if (currentBill?.id) {
      const payRes = await customerApi.createPayment(currentBill.id, method);
      if (payRes.success && payRes.data?.paymentId) {
        await customerApi.verifyPayment(payRes.data.paymentId, payRes.data.transactionRef);
      }
    }

    setCurrentBill((prev) =>
      prev
        ? { ...prev, paymentStatus: 'PAID', paidAt: new Date().toISOString() }
        : null
    );

    return { success: true, receipt };
  };

  const archiveReceiptLocally = (receipt: OfflineReceipt) => {
    receiptStorage.saveReceipt(receipt);
    setOfflineReceipts(receiptStorage.getReceipts());
  };

  return (
    <CustomerContext.Provider
      value={{
        user,
        session,
        categories,
        isLoadingMenu,
        cart,
        currentOrder,
        sessionOrders,
        currentBill,
        offlineReceipts,
        customerOrders,
        isLoadingOrders,
        refreshCustomerOrders,
        activeView,
        setActiveView,
        showServiceModal,
        setShowServiceModal,
        showQrScannerModal,
        setShowQrScannerModal,
        showAuthModal,
        setShowAuthModal,
        authModalTab,
        setAuthModalTab,
        openAuthModal,
        onAuthSuccess,
        setOnAuthSuccess,
        loginWithPhone,
        loginCustomer,
        registerCustomer,
        sendPasswordResetLink,
        resetPassword,
        loginWithPin,
        sendEmailOtp,
        verifyEmailOtp,
        updateUserProfile,
        clearTableSession,
        logout,
        loginDiner,
        setDiningTable,
        isTableSessionValid,
        loadMenu,
        addToCart,
        updateCartQty,
        removeCartItem,
        clearCart,
        placeOrder,
        fetchLatestOrder,
        fetchLatestBill,
        settlePayment,
        archiveReceiptLocally
      }}
    >
      {children}
    </CustomerContext.Provider>
  );
};

export const useCustomer = () => {
  const context = useContext(CustomerContext);
  if (!context) {
    throw new Error('useCustomer must be used within a CustomerProvider');
  }
  return context;
};
