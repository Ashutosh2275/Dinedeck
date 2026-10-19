import React from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { CustomerProvider, useCustomer } from './context/CustomerContext';
import { Header } from './components/Header';
import { MobileBottomNav } from './components/MobileBottomNav';
import { ServiceModal } from './components/ServiceModal';
import { QrScannerModal } from './components/QrScannerModal';
import { CustomerAuthModal } from './components/CustomerAuthModal';
import { CustomerWelcomeModal } from './components/CustomerWelcomeModal';
import { CustomerHome } from './pages/CustomerHome';
import { CustomerMenu } from './pages/CustomerMenu';
import { CustomerTracking } from './pages/CustomerTracking';
import { CustomerBill } from './pages/CustomerBill';
import { CustomerHistory } from './pages/CustomerHistory';
import { CustomerAccount } from './pages/CustomerAccount';

const CustomerMain: React.FC = () => {
  const { activeView } = useCustomer();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 flex flex-col selection:bg-orange-500 selection:text-white antialiased transition-colors duration-150">
      <Header />
      <ServiceModal />
      <QrScannerModal />
      <CustomerAuthModal />
      <CustomerWelcomeModal />

      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 pt-4 pb-24 md:pb-12">
        {activeView === 'HOME' && <CustomerHome />}
        {activeView === 'MENU' && <CustomerMenu />}
        {activeView === 'TRACKING' && <CustomerTracking />}
        {activeView === 'BILL' && <CustomerBill />}
        {activeView === 'HISTORY' && <CustomerHistory />}
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
