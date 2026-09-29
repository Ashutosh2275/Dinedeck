import React from 'react';
import { CustomerProvider, useCustomer } from './context/CustomerContext';
import { Header } from './components/Header';
import { MobileBottomNav } from './components/MobileBottomNav';
import { ServiceModal } from './components/ServiceModal';
import { QrScannerModal } from './components/QrScannerModal';
import { CustomerAuthModal } from './components/CustomerAuthModal';
import { CustomerHome } from './pages/CustomerHome';
import { CustomerMenu } from './pages/CustomerMenu';
import { CustomerTracking } from './pages/CustomerTracking';
import { CustomerBill } from './pages/CustomerBill';
import { CustomerAccount } from './pages/CustomerAccount';

const CustomerMain: React.FC = () => {
  const { activeView } = useCustomer();

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col selection:bg-orange-500 selection:text-white antialiased">
      <Header />
      <ServiceModal />
      <QrScannerModal />
      <CustomerAuthModal />

      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 pt-4 pb-24 md:pb-12">
        {activeView === 'HOME' && <CustomerHome />}
        {activeView === 'MENU' && <CustomerMenu />}
        {activeView === 'TRACKING' && <CustomerTracking />}
        {(activeView === 'BILL' || activeView === 'HISTORY') && <CustomerBill />}
        {activeView === 'ACCOUNT' && <CustomerAccount />}
      </main>

      <MobileBottomNav />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <CustomerProvider>
      <CustomerMain />
    </CustomerProvider>
  );
};
