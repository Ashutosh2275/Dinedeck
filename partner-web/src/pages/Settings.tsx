import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Building2,
  MapPin,
  Percent,
  Printer,
  ChefHat,
  Palette,
  Bell,
  Lock,
  Sun,
  Moon,
  Monitor,
  Volume2,
  VolumeX,
  Save,
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff,
  IndianRupee,
  Hash,
  Clock,
  Shield,
  Users,
  Smartphone,
  Phone
} from 'lucide-react';

type SettingsSection =
  | 'PROFILE'
  | 'BRANCH'
  | 'TAXATION'
  | 'BILLING'
  | 'OPERATIONS'
  | 'THEME'
  | 'NOTIFICATIONS'
  | 'SECURITY';

type AppTheme = 'DARK' | 'LIGHT' | 'SYSTEM';

interface SettingsState {
  displayName: string;
  legalName: string;
  tagline: string;
  cuisineType: string;
  contactPhone: string;
  contactEmail: string;
  websiteUrl: string;
  googleMapsLink: string;
  yearEstablished: string;
  branchName: string;
  branchFloor: string;
  branchAddress: string;
  branchCity: string;
  branchState: string;
  branchPincode: string;
  branchPhone: string;
  mondayHours: string;
  tuesdayHours: string;
  wednesdayHours: string;
  thursdayHours: string;
  fridayHours: string;
  saturdayHours: string;
  sundayHours: string;
  gstin: string;
  fssaiNumber: string;
  fssaiExpiry: string;
  panNumber: string;
  cgstRate: string;
  sgstRate: string;
  serviceChargePercent: string;
  packagingCharge: string;
  roundOffBills: boolean;
  invoicePrefix: string;
  invoiceStartNumber: string;
  printerWidth: '58mm' | '80mm';
  autoPrintKot: boolean;
  autoPrintBillOnSettle: boolean;
  receiptHeader1: string;
  receiptHeader2: string;
  receiptFooter1: string;
  receiptFooter2: string;
  showFssaiOnReceipt: boolean;
  showGstinOnReceipt: boolean;
  showQrOnReceipt: boolean;
  receiptQrLink: string;
  billCopies: '1' | '2';
  tableBookingEnabled: boolean;
  takeawayEnabled: boolean;
  orderAlertSound: boolean;
  alertVolume: string;
  kotLanguage: 'ENGLISH' | 'HINDI' | 'MARATHI';
  autoResolveServiceCallMins: string;
  minOrderValue: string;
  maxAdvanceBookingDays: string;
  lowStockAlertThreshold: string;
  criticalStockSms: boolean;
  criticalStockSmsNumber: string;
  newBookingAlert: boolean;
  billSettlementDigest: 'REALTIME' | 'DAILY';
  kdsOverdueAlertMins: string;
  pinForBillVoid: boolean;
  pinForDiscount: boolean;
  discountPinThreshold: string;
  voidPin: string;
  autoLogoutMins: string;
  viewOnlyPassword: string;
}

const STORAGE_KEY = 'dinedeck_restaurant_settings';
const THEME_KEY = 'dinedeck_app_theme';

const loadSettings = (): Partial<SettingsState> => {
  try {
    const r = localStorage.getItem(STORAGE_KEY);
    return r ? JSON.parse(r) : {};
  } catch {
    return {};
  }
};

const SETTINGS_NAV: { key: SettingsSection; label: string; icon: any; color: string }[] = [
  { key: 'PROFILE', label: 'Restaurant Profile', icon: Building2, color: 'text-orange-400' },
  { key: 'BRANCH', label: 'Branch & Address', icon: MapPin, color: 'text-blue-400' },
  { key: 'TAXATION', label: 'Taxation & Compliance', icon: Percent, color: 'text-emerald-400' },
  { key: 'BILLING', label: 'Billing & Receipts', icon: Printer, color: 'text-violet-400' },
  { key: 'OPERATIONS', label: 'Operations & Floor', icon: ChefHat, color: 'text-amber-400' },
  { key: 'THEME', label: 'Display & Theme', icon: Palette, color: 'text-pink-400' },
  { key: 'NOTIFICATIONS', label: 'Notifications & Alerts', icon: Bell, color: 'text-sky-400' },
  { key: 'SECURITY', label: 'Security & Access', icon: Lock, color: 'text-rose-400' }
];

export const Settings: React.FC = () => {
  const { restaurant, branch } = useAuth();
  const [activeSection, setActiveSection] = useState<SettingsSection>('PROFILE');
  const [savedSection, setSavedSection] = useState<SettingsSection | null>(null);
  const [showVoidPin, setShowVoidPin] = useState(false);
  const [receiptPreviewMode, setReceiptPreviewMode] = useState<'FINAL_BILL' | 'KITCHEN_KOT'>('FINAL_BILL');
  const [browserNotificationPerm, setBrowserNotificationPerm] = useState<NotificationPermission>('default');

  const { theme: appTheme, setTheme: setAppTheme } = useTheme();

  // Check notification permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      setBrowserNotificationPerm(Notification.permission);
    }
  }, []);

  const p = loadSettings();
  const [s, setS] = useState<SettingsState>({
    displayName: p.displayName ?? (restaurant?.name || ''),
    legalName: p.legalName ?? (restaurant?.legalBusinessName || ''),
    tagline: p.tagline ?? 'Authentic North Indian Cuisine',
    cuisineType: p.cuisineType ?? 'North Indian, Mughlai, Tandoor',
    contactPhone: p.contactPhone ?? (restaurant?.phone ? restaurant.phone.replace(/\D/g, '').slice(-10) : '9820012345'),
    contactEmail: p.contactEmail ?? '',
    websiteUrl: p.websiteUrl ?? '',
    googleMapsLink: p.googleMapsLink ?? '',
    yearEstablished: p.yearEstablished ?? '2010',
    branchName: p.branchName ?? (branch?.name || 'Main Branch'),
    branchFloor: p.branchFloor ?? 'Ground Floor',
    branchAddress: p.branchAddress ?? (restaurant?.fullAddress || 'Plot 42, Bandra Kurla Complex, Bandra West'),
    branchCity: p.branchCity ?? (restaurant?.city || 'Mumbai'),
    branchState: p.branchState ?? (restaurant?.state || 'Maharashtra'),
    branchPincode: p.branchPincode ?? (restaurant?.pincode || '400051'),
    branchPhone: p.branchPhone ?? (branch?.phone ? branch.phone.replace(/\D/g, '').slice(-10) : '9820012345'),
    mondayHours: p.mondayHours ?? '11:00 AM – 11:00 PM',
    tuesdayHours: p.tuesdayHours ?? '11:00 AM – 11:00 PM',
    wednesdayHours: p.wednesdayHours ?? '11:00 AM – 11:00 PM',
    thursdayHours: p.thursdayHours ?? '11:00 AM – 11:00 PM',
    fridayHours: p.fridayHours ?? '11:00 AM – 11:30 PM',
    saturdayHours: p.saturdayHours ?? '10:30 AM – 11:30 PM',
    sundayHours: p.sundayHours ?? '10:30 AM – 11:00 PM',
    gstin: p.gstin ?? (restaurant?.gstin || '27AABCT3518Q1ZP'),
    fssaiNumber: p.fssaiNumber ?? (restaurant?.fssaiNumber || '11521018000452'),
    fssaiExpiry: p.fssaiExpiry ?? '2027-05-14',
    panNumber: p.panNumber ?? 'AABCT3518Q',
    cgstRate: p.cgstRate ?? String(restaurant?.cgstRatePercent ?? 2.5),
    sgstRate: p.sgstRate ?? String(restaurant?.sgstRatePercent ?? 2.5),
    serviceChargePercent: p.serviceChargePercent ?? String(restaurant?.serviceChargePercent ?? 5.0),
    packagingCharge: p.packagingCharge ?? '20',
    roundOffBills: p.roundOffBills ?? true,
    invoicePrefix: p.invoicePrefix ?? 'INV/2026-27/',
    invoiceStartNumber: p.invoiceStartNumber ?? '001',
    printerWidth: '80mm',
    autoPrintKot: p.autoPrintKot ?? true,
    autoPrintBillOnSettle: p.autoPrintBillOnSettle ?? true,
    receiptHeader1: p.receiptHeader1 ?? 'Thank You for Dining With Us!',
    receiptHeader2: p.receiptHeader2 ?? 'Aapka Swagat Hai 🙏',
    receiptFooter1: p.receiptFooter1 ?? 'Please Share Your Feedback with Us',
    receiptFooter2: p.receiptFooter2 ?? 'Follow Us: @restaurantname',
    showFssaiOnReceipt: p.showFssaiOnReceipt ?? true,
    showGstinOnReceipt: p.showGstinOnReceipt ?? true,
    showQrOnReceipt: p.showQrOnReceipt ?? false,
    receiptQrLink: p.receiptQrLink ?? '',
    billCopies: p.billCopies ?? '1',
    tableBookingEnabled: p.tableBookingEnabled ?? true,
    takeawayEnabled: p.takeawayEnabled ?? true,
    orderAlertSound: p.orderAlertSound ?? true,
    alertVolume: p.alertVolume ?? '80',
    kotLanguage: p.kotLanguage ?? 'ENGLISH',
    autoResolveServiceCallMins: p.autoResolveServiceCallMins ?? '15',
    minOrderValue: p.minOrderValue ?? '0',
    maxAdvanceBookingDays: p.maxAdvanceBookingDays ?? '7',
    lowStockAlertThreshold: p.lowStockAlertThreshold ?? '5',
    criticalStockSms: p.criticalStockSms ?? false,
    criticalStockSmsNumber: p.criticalStockSmsNumber ?? '9820012345',
    newBookingAlert: p.newBookingAlert ?? true,
    billSettlementDigest: p.billSettlementDigest ?? 'REALTIME',
    kdsOverdueAlertMins: p.kdsOverdueAlertMins ?? '15',
    pinForBillVoid: p.pinForBillVoid ?? true,
    pinForDiscount: p.pinForDiscount ?? true,
    discountPinThreshold: p.discountPinThreshold ?? '10',
    voidPin: p.voidPin ?? '1234',
    autoLogoutMins: p.autoLogoutMins ?? '30',
    viewOnlyPassword: p.viewOnlyPassword ?? ''
  });

  const u = (patch: Partial<SettingsState>) => setS((prev) => ({ ...prev, ...patch }));

  // Helper for strictly 10-digit Indian phone numbers
  const handlePhoneChange = (key: keyof SettingsState, raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 10);
    u({ [key]: digits });
  };

  const handleSave = (section: SettingsSection) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    } catch {}
    setSavedSection(section);
    setTimeout(() => setSavedSection(null), 2500);
  };

  // Test sound chime
  const handleTestAudio = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const vol = Math.max(0.1, Math.min(1.0, Number(s.alertVolume) / 100));
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(vol * 0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {}
  };

  // Request browser desktop notification permission
  const handleRequestNotificationPerm = async () => {
    if (!('Notification' in window)) {
      alert('This browser does not support desktop notifications.');
      return;
    }
    const res = await Notification.requestPermission();
    setBrowserNotificationPerm(res);
    if (res === 'granted') {
      new Notification('DINEDECK Alerts Enabled', {
        body: 'You will now receive desktop alerts for incoming customer orders and waiter calls.',
        icon: '/favicon.ico'
      });
    }
  };

  const handleSendTestNotification = () => {
    if (browserNotificationPerm === 'granted') {
      new Notification('🔔 New Order Alert: Table #04', {
        body: 'Table #04 placed an order for 2x Paneer Tikka, 1x Butter Naan. Total: ₹450',
        icon: '/favicon.ico'
      });
    } else {
      handleRequestNotificationPerm();
    }
  };

  const ic =
    'w-full bg-slate-900/70 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/70 focus:ring-1 focus:ring-orange-500/30 transition';
  const lc = 'block text-xs text-slate-400 mb-1.5 font-medium';

  const Toggle = ({
    label,
    sub,
    val,
    onChange
  }: {
    label: string;
    sub?: string;
    val: boolean;
    onChange: (v: boolean) => void;
  }) => (
    <div className="flex items-center justify-between py-3 border-b border-slate-800/60 last:border-0">
      <div>
        <div className="text-sm font-semibold text-white">{label}</div>
        {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!val)}
        className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer flex-shrink-0 ${
          val ? 'bg-orange-500' : 'bg-slate-700'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
            val ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );

  const Hdr = ({ icon: I, title, sub, color }: { icon: any; title: string; sub: string; color: string }) => (
    <div className="flex items-center space-x-3 pb-4 border-b border-slate-700/80 mb-6">
      <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700">
        <I className={`w-5 h-5 ${color}`} />
      </div>
      <div>
        <h3 className="text-base font-black text-white">{title}</h3>
        <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
      </div>
    </div>
  );

  const Btn = ({ section }: { section: SettingsSection }) => (
    <button
      type="button"
      onClick={() => handleSave(section)}
      className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition border cursor-pointer ${
        savedSection === section
          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
          : 'bg-orange-500 hover:bg-orange-400 text-white border-orange-400 shadow-md'
      }`}
    >
      {savedSection === section ? (
        <>
          <CheckCircle2 className="w-4 h-4" />
          <span>Saved!</span>
        </>
      ) : (
        <>
          <Save className="w-4 h-4" />
          <span>Save Changes</span>
        </>
      )}
    </button>
  );

  const renderSection = () => {
    switch (activeSection) {
      case 'PROFILE':
        return (
          <div className="space-y-5">
            <Hdr
              icon={Building2}
              title="Restaurant Profile"
              sub="Your restaurant's brand identity — printed on thermal receipts, digital menus, and customer portals."
              color="text-orange-400"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={lc}>Display Name (Receipts & QR Menus)</label>
                <input
                  className={ic}
                  value={s.displayName}
                  onChange={(e) => u({ displayName: e.target.value })}
                  placeholder="The Heritage Kitchen"
                />
              </div>

              <div>
                <label className={lc}>Legal Business Name (For GST Tax Invoices)</label>
                <input
                  className={ic}
                  value={s.legalName}
                  onChange={(e) => u({ legalName: e.target.value })}
                  placeholder="Heritage Foods & Hospitality Pvt. Ltd."
                />
              </div>

              <div>
                <label className={lc}>Tagline / Brand Description</label>
                <input
                  className={ic}
                  value={s.tagline}
                  onChange={(e) => u({ tagline: e.target.value })}
                  placeholder="Authentic North Indian & Mughlai"
                />
              </div>

              <div>
                <label className={lc}>Cuisine Specialties</label>
                <input
                  className={ic}
                  value={s.cuisineType}
                  onChange={(e) => u({ cuisineType: e.target.value })}
                  placeholder="North Indian, Mughlai, Tandoor"
                />
              </div>

              {/* 10-Digit Phone Number with +91 */}
              <div>
                <label className={lc}>Restaurant Contact Phone (10 Digits)</label>
                <div className="flex items-center space-x-2">
                  <span className="px-3 py-2.5 bg-slate-900/70 border border-slate-700 rounded-xl text-slate-300 text-sm font-mono font-bold">
                    +91
                  </span>
                  <input
                    type="tel"
                    maxLength={10}
                    className={`${ic} font-mono font-bold`}
                    value={s.contactPhone}
                    onChange={(e) => handlePhoneChange('contactPhone', e.target.value)}
                    placeholder="9820012345"
                  />
                </div>
                <div className="mt-1 text-[11px]">
                  {s.contactPhone.length === 10 ? (
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Valid 10-digit Indian Mobile Number
                    </span>
                  ) : (
                    <span className="text-rose-400">
                      ⚠ Exactly 10 digits required ({10 - s.contactPhone.length} digits remaining)
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className={lc}>Official Contact Email</label>
                <input
                  type="email"
                  className={ic}
                  value={s.contactEmail}
                  onChange={(e) => u({ contactEmail: e.target.value })}
                  placeholder="contact@restaurant.com"
                />
              </div>

              <div>
                <label className={lc}>Google Maps Location Link</label>
                <input
                  className={ic}
                  value={s.googleMapsLink}
                  onChange={(e) => u({ googleMapsLink: e.target.value })}
                  placeholder="https://maps.app.goo.gl/..."
                />
              </div>

              <div>
                <label className={lc}>Year Established (Since XXXX)</label>
                <input
                  className={ic}
                  value={s.yearEstablished}
                  onChange={(e) => u({ yearEstablished: e.target.value })}
                  placeholder="2010"
                />
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-700/80 rounded-2xl p-4">
              <div className="text-xs text-slate-400 font-bold mb-3 flex items-center space-x-2">
                <Eye className="w-3.5 h-3.5 text-orange-400" />
                <span>LIVE BRAND HEADER PREVIEW</span>
              </div>
              <div className="font-mono text-xs text-center space-y-0.5 border-l-2 border-orange-500/40 pl-3">
                <div className="font-bold text-base text-white">{s.displayName || 'Restaurant Name'}</div>
                <div className="text-slate-400">{s.tagline}</div>
                <div className="text-slate-500">
                  Since {s.yearEstablished} • +91 {s.contactPhone || 'XXXXXXXXXX'}
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Btn section="PROFILE" />
            </div>
          </div>
        );

      case 'BRANCH':
        return (
          <div className="space-y-5">
            <Hdr
              icon={MapPin}
              title="Branch & Address"
              sub="Physical outlet address, operating timings, and direct store telephone."
              color="text-blue-400"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={lc}>Branch / Outlet Name</label>
                <input
                  className={ic}
                  value={s.branchName}
                  onChange={(e) => u({ branchName: e.target.value })}
                  placeholder="Main Branch"
                />
              </div>

              <div>
                <label className={lc}>Floor / Unit / Mall Name</label>
                <input
                  className={ic}
                  value={s.branchFloor}
                  onChange={(e) => u({ branchFloor: e.target.value })}
                  placeholder="Ground Floor, Main Hall"
                />
              </div>

              <div className="md:col-span-2">
                <label className={lc}>Full Street Address (Printed on GST Tax Invoices)</label>
                <textarea
                  rows={2}
                  className={`${ic} resize-none`}
                  value={s.branchAddress}
                  onChange={(e) => u({ branchAddress: e.target.value })}
                  placeholder="Plot 42, Bandra Kurla Complex, Bandra West"
                />
              </div>

              <div>
                <label className={lc}>City</label>
                <input
                  className={ic}
                  value={s.branchCity}
                  onChange={(e) => u({ branchCity: e.target.value })}
                  placeholder="Mumbai"
                />
              </div>

              <div>
                <label className={lc}>State</label>
                <input
                  className={ic}
                  value={s.branchState}
                  onChange={(e) => u({ branchState: e.target.value })}
                  placeholder="Maharashtra"
                />
              </div>

              <div>
                <label className={lc}>Pincode (6 Digits)</label>
                <input
                  maxLength={6}
                  className={`${ic} font-mono`}
                  value={s.branchPincode}
                  onChange={(e) => u({ branchPincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                  placeholder="400051"
                />
              </div>

              <div>
                <label className={lc}>Branch Direct Phone (10 Digits)</label>
                <div className="flex items-center space-x-2">
                  <span className="px-3 py-2.5 bg-slate-900/70 border border-slate-700 rounded-xl text-slate-300 text-sm font-mono font-bold">
                    +91
                  </span>
                  <input
                    type="tel"
                    maxLength={10}
                    className={`${ic} font-mono font-bold`}
                    value={s.branchPhone}
                    onChange={(e) => handlePhoneChange('branchPhone', e.target.value)}
                    placeholder="9820012345"
                  />
                </div>
                <div className="mt-1 text-[11px]">
                  {s.branchPhone.length === 10 ? (
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> 10 digits verified
                    </span>
                  ) : (
                    <span className="text-rose-400">
                      ⚠ Exactly 10 digits required ({10 - s.branchPhone.length} left)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Operating Hours */}
            <div className="bg-slate-900/40 border border-slate-700/80 rounded-2xl p-4 space-y-2">
              <div className="flex items-center space-x-2 text-slate-300 font-bold text-xs mb-3">
                <Clock className="w-4 h-4 text-blue-400" />
                <span>OUTLET OPERATING HOURS (Mon – Sun)</span>
              </div>
              {[
                { day: 'Monday', key: 'mondayHours' },
                { day: 'Tuesday', key: 'tuesdayHours' },
                { day: 'Wednesday', key: 'wednesdayHours' },
                { day: 'Thursday', key: 'thursdayHours' },
                { day: 'Friday', key: 'fridayHours' },
                { day: 'Saturday', key: 'saturdayHours' },
                { day: 'Sunday', key: 'sundayHours' }
              ].map(({ day, key }) => (
                <div key={day} className="flex items-center space-x-3">
                  <span className="text-xs text-slate-400 w-24 shrink-0 font-medium">{day}</span>
                  <input
                    className="flex-1 bg-slate-900/70 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500/70 transition"
                    value={s[key as keyof SettingsState] as string}
                    onChange={(e) => u({ [key]: e.target.value })}
                    placeholder="11:00 AM – 11:00 PM"
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <Btn section="BRANCH" />
            </div>
          </div>
        );

      case 'TAXATION':
        return (
          <div className="space-y-5">
            <Hdr
              icon={Percent}
              title="Taxation & Compliance"
              sub="GSTIN, FSSAI Food License, and GST tax rate cards for compliant Indian invoicing."
              color="text-emerald-400"
            />
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start space-x-2.5 text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-amber-200">
                <strong>Legal Requirement:</strong> GSTIN and FSSAI numbers are printed on every customer bill.
                Ensure tax rates match your business registration.
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={lc}>GSTIN (15-Character Identification Number)</label>
                <input
                  className={`${ic} font-mono tracking-wider`}
                  value={s.gstin}
                  onChange={(e) => u({ gstin: e.target.value.toUpperCase() })}
                  placeholder="27AABCT3518Q1ZP"
                  maxLength={15}
                />
                {s.gstin && s.gstin.length !== 15 && (
                  <p className="text-rose-400 text-[11px] mt-1">⚠ GSTIN must be exactly 15 characters</p>
                )}
              </div>

              <div>
                <label className={lc}>Business PAN Number (10 Characters)</label>
                <input
                  className={`${ic} font-mono uppercase`}
                  value={s.panNumber}
                  onChange={(e) => u({ panNumber: e.target.value.toUpperCase() })}
                  placeholder="AABCT3518Q"
                  maxLength={10}
                />
              </div>

              <div>
                <label className={lc}>FSSAI Food License Number (14 Digits)</label>
                <input
                  className={`${ic} font-mono`}
                  value={s.fssaiNumber}
                  onChange={(e) => u({ fssaiNumber: e.target.value.replace(/\D/g, '').slice(0, 14) })}
                  placeholder="11521018000452"
                  maxLength={14}
                />
              </div>

              <div>
                <label className={lc}>FSSAI License Expiry Date</label>
                <input
                  type="date"
                  className={ic}
                  value={s.fssaiExpiry}
                  onChange={(e) => u({ fssaiExpiry: e.target.value })}
                />
                {s.fssaiExpiry && new Date(s.fssaiExpiry) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) && (
                  <p className="text-amber-400 text-[11px] mt-1">⚠ FSSAI license renewal due within 30 days</p>
                )}
              </div>
            </div>

            {/* GST & Service Charge Rate Cards */}
            <div className="bg-slate-900/40 border border-slate-700/80 rounded-2xl p-4">
              <div className="text-xs text-slate-300 font-bold mb-4 flex items-center space-x-2">
                <IndianRupee className="w-3.5 h-3.5 text-emerald-400" />
                <span>GST TAX & SERVICE CHARGE RATE CARDS</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'CGST %', key: 'cgstRate', hint: 'Central GST (default 2.5%)' },
                  { label: 'SGST %', key: 'sgstRate', hint: 'State GST (default 2.5%)' },
                  { label: 'Service Charge %', key: 'serviceChargePercent', hint: 'Optional (typically 5–10%)' },
                  { label: 'Packaging ₹', key: 'packagingCharge', hint: 'Per takeaway order' }
                ].map(({ label, key, hint }) => (
                  <div key={key} className="bg-slate-900/60 rounded-xl p-3 space-y-1.5 border border-slate-800">
                    <div className="text-[11px] text-slate-400 font-semibold">{label}</div>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      className="w-full bg-transparent text-2xl font-black text-white focus:outline-none font-mono"
                      value={s[key as keyof SettingsState] as string}
                      onChange={(e) => u({ [key]: e.target.value })}
                    />
                    <div className="text-[10px] text-slate-500">{hint}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-slate-700/80">
                <Toggle
                  label="Round Off Bills to Nearest ₹1"
                  sub="Eliminates paise fractions for seamless cash & UPI settlements"
                  val={s.roundOffBills}
                  onChange={(v) => u({ roundOffBills: v })}
                />
              </div>
            </div>

            {/* Invoice Prefix Series */}
            <div className="bg-slate-900/40 border border-slate-700/80 rounded-2xl p-4">
              <div className="text-xs text-slate-300 font-bold mb-4 flex items-center space-x-2">
                <Hash className="w-3.5 h-3.5 text-emerald-400" />
                <span>INVOICE NUMBERING SERIES (FY 2026-27)</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={lc}>Invoice Prefix</label>
                  <input
                    className={`${ic} font-mono`}
                    value={s.invoicePrefix}
                    onChange={(e) => u({ invoicePrefix: e.target.value })}
                    placeholder="INV/2026-27/"
                  />
                </div>
                <div>
                  <label className={lc}>Starting Sequence #</label>
                  <input
                    className={`${ic} font-mono`}
                    value={s.invoiceStartNumber}
                    onChange={(e) => u({ invoiceStartNumber: e.target.value })}
                    placeholder="001"
                  />
                </div>
              </div>
              <div className="mt-3 p-3 bg-slate-950/50 rounded-xl text-xs font-mono text-slate-300">
                Sequence Sample:{' '}
                <span className="text-orange-400 font-bold">
                  {s.invoicePrefix}
                  {s.invoiceStartNumber}
                </span>{' '}
                →{' '}
                <span className="text-orange-400 font-bold">
                  {s.invoicePrefix}
                  {String(parseInt(s.invoiceStartNumber || '1', 10) + 1).padStart(s.invoiceStartNumber?.length || 3, '0')}
                </span>
              </div>
            </div>

            <div className="flex justify-end">
              <Btn section="TAXATION" />
            </div>
          </div>
        );

      case 'BILLING':
        return (
          <div className="space-y-5">
            <Hdr
              icon={Printer}
              title="Billing & Thermal Receipts"
              sub="Direct 1-click thermal printing engine — automatic layout for Tax Invoices, Kitchen KOTs, and Daily Summaries."
              color="text-violet-400"
            />

            {/* Smart Auto-Layout Banner */}
            <div className="p-4 bg-violet-500/10 border border-violet-500/30 rounded-2xl flex items-start space-x-3 text-xs">
              <div className="p-2 rounded-xl bg-violet-500/20 text-violet-300 shrink-0">
                <Printer className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-white text-sm">Smart Thermal Printer Auto-Layout</h4>
                <p className="text-slate-300 leading-relaxed">
                  The printer automatically generates the exact layout required:
                  <strong className="text-violet-300"> Tax Invoice</strong> on settlement,
                  <strong className="text-orange-300"> Kitchen KOT</strong> on order acceptance, and
                  <strong className="text-emerald-300"> Shift Z-Report</strong> at end of day on standard continuous roll.
                </p>
              </div>
            </div>

            {/* Auto Print Automation Toggles */}
            <div className="bg-slate-900/40 border border-slate-700/80 rounded-2xl p-4 space-y-0">
              <Toggle
                label="Auto-Print Kitchen KOT on Order Accepted"
                sub="Automatically sends slip to kitchen printer when chef accepts an order"
                val={s.autoPrintKot}
                onChange={(v) => u({ autoPrintKot: v })}
              />
              <Toggle
                label="Auto-Print Customer Bill on Settlement"
                sub="Immediately generates 80mm tax invoice upon cash / UPI / card payment"
                val={s.autoPrintBillOnSettle}
                onChange={(v) => u({ autoPrintBillOnSettle: v })}
              />
              <Toggle
                label="Show FSSAI License on Bill"
                sub="Mandatory food safety license display on customer receipts"
                val={s.showFssaiOnReceipt}
                onChange={(v) => u({ showFssaiOnReceipt: v })}
              />
              <Toggle
                label="Show GSTIN on Bill"
                sub="Prints 15-character GST identification number for input credit"
                val={s.showGstinOnReceipt}
                onChange={(v) => u({ showGstinOnReceipt: v })}
              />
            </div>

            {/* Custom Header & Footer Lines */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={lc}>Receipt Header Line 1</label>
                <input
                  className={ic}
                  value={s.receiptHeader1}
                  onChange={(e) => u({ receiptHeader1: e.target.value })}
                  placeholder="Thank You for Dining With Us!"
                />
              </div>

              <div>
                <label className={lc}>Receipt Header Line 2 (Hindi / Regional Supported ✓)</label>
                <input
                  className={ic}
                  value={s.receiptHeader2}
                  onChange={(e) => u({ receiptHeader2: e.target.value })}
                  placeholder="Aapka Swagat Hai 🙏"
                />
              </div>

              <div>
                <label className={lc}>Receipt Footer Line 1</label>
                <input
                  className={ic}
                  value={s.receiptFooter1}
                  onChange={(e) => u({ receiptFooter1: e.target.value })}
                  placeholder="Please Share Your Feedback"
                />
              </div>

              <div>
                <label className={lc}>Receipt Footer Line 2 (Social / Phone)</label>
                <input
                  className={ic}
                  value={s.receiptFooter2}
                  onChange={(e) => u({ receiptFooter2: e.target.value })}
                  placeholder="Follow Us: @restaurantname"
                />
              </div>
            </div>

            {/* Bill Copies */}
            <div className="grid grid-cols-2 gap-3">
              {(['1', '2'] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => u({ billCopies: c })}
                  className={`p-3.5 rounded-xl border text-center transition cursor-pointer ${
                    s.billCopies === c
                      ? 'bg-violet-500/20 border-violet-500/50 text-violet-300'
                      : 'bg-slate-900/60 border-slate-700 text-slate-400'
                  }`}
                >
                  <div className="font-black text-lg">{c} {c === '1' ? 'Copy' : 'Copies'}</div>
                  <div className="text-xs mt-0.5">
                    {c === '1' ? 'Customer copy only' : 'Customer + Accounts duplicate'}
                  </div>
                </button>
              ))}
            </div>

            {/* Interactive Live Thermal Slip Preview */}
            <div className="bg-slate-950/60 border border-slate-700/60 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs text-slate-400 font-bold flex items-center space-x-2">
                  <Eye className="w-3.5 h-3.5 text-violet-400" />
                  <span>LIVE THERMAL PRINTER PREVIEW</span>
                </div>

                <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 space-x-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setReceiptPreviewMode('FINAL_BILL')}
                    className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                      receiptPreviewMode === 'FINAL_BILL' ? 'bg-violet-600 text-white shadow' : 'text-slate-400'
                    }`}
                  >
                    Tax Invoice
                  </button>
                  <button
                    type="button"
                    onClick={() => setReceiptPreviewMode('KITCHEN_KOT')}
                    className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                      receiptPreviewMode === 'KITCHEN_KOT' ? 'bg-orange-600 text-white shadow' : 'text-slate-400'
                    }`}
                  >
                    Kitchen KOT
                  </button>
                </div>
              </div>

              {receiptPreviewMode === 'FINAL_BILL' ? (
                <div className="font-mono text-[10.5px] text-black mx-auto border border-gray-300 rounded-xl p-4 space-y-1 bg-white shadow-2xl max-w-[300px]">
                  <div className="text-center font-black text-sm">{s.displayName || 'The Heritage Kitchen'}</div>
                  <div className="text-center text-gray-600 text-[9.5px]">{s.branchAddress}</div>
                  {s.showGstinOnReceipt && <div className="text-center text-gray-600 text-[9.5px]">GSTIN: {s.gstin}</div>}
                  {s.showFssaiOnReceipt && <div className="text-center text-gray-600 text-[9.5px]">FSSAI: {s.fssaiNumber}</div>}
                  <div className="border-t border-dashed border-gray-400 my-1.5" />
                  <div className="text-center font-bold">{s.receiptHeader1}</div>
                  <div className="text-center text-gray-600 text-[9.5px]">{s.receiptHeader2}</div>
                  <div className="border-t border-dashed border-gray-400 my-1.5" />
                  <div className="flex justify-between font-bold">
                    <span>Table: T-04</span>
                    <span>Inv#: {s.invoicePrefix}001</span>
                  </div>
                  <div className="border-t border-dashed border-gray-300 my-1" />
                  <div className="flex justify-between font-bold">
                    <span>2x Paneer Butter Masala</span>
                    <span>₹560.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>4x Butter Naan</span>
                    <span>₹160.00</span>
                  </div>
                  <div className="border-t border-gray-300 mt-1 pt-1 space-y-0.5">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal</span>
                      <span>₹720.00</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>CGST ({s.cgstRate}%)</span>
                      <span>₹18.00</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>SGST ({s.sgstRate}%)</span>
                      <span>₹18.00</span>
                    </div>
                    <div className="flex justify-between font-black text-xs pt-1 border-t border-black">
                      <span>TOTAL PAYABLE</span>
                      <span>₹756.00</span>
                    </div>
                  </div>
                  <div className="border-t border-dashed border-gray-400 mt-2 pt-1 text-center">
                    <div className="font-bold">{s.receiptFooter1}</div>
                    <div className="text-gray-500 text-[9px]">{s.receiptFooter2}</div>
                  </div>
                </div>
              ) : (
                <div className="font-mono text-[10.5px] text-black mx-auto border border-gray-300 rounded-xl p-4 space-y-1 bg-white shadow-2xl max-w-[300px]">
                  <div className="text-center font-black text-sm tracking-wider">*** KITCHEN KOT ***</div>
                  <div className="flex justify-between font-bold border-b border-black pb-1">
                    <span>TABLE: T-04</span>
                    <span>KOT #102</span>
                  </div>
                  <div className="text-[9.5px] text-gray-600">Time: {new Date().toLocaleTimeString()}</div>
                  <div className="border-t border-dashed border-gray-400 my-1" />
                  <div className="space-y-1 font-bold">
                    <div className="flex justify-between">
                      <span>2x Paneer Butter Masala</span>
                      <span>MAIN</span>
                    </div>
                    <div className="text-[9.5px] text-gray-700 italic pl-3">★ Less spicy, Jain prep</div>
                    <div className="flex justify-between">
                      <span>4x Butter Naan</span>
                      <span>TANDOOR</span>
                    </div>
                  </div>
                  <div className="border-t border-dashed border-gray-400 mt-2 pt-1 text-center font-bold text-[9.5px]">
                    --- Send to Chef ---
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <Btn section="BILLING" />
            </div>
          </div>
        );

      case 'OPERATIONS':
        return (
          <div className="space-y-5">
            <Hdr
              icon={ChefHat}
              title="Operations & Floor Controls"
              sub="Table reservations, takeaway enablement, alert volumes, and service call dispatching."
              color="text-amber-400"
            />
            <div className="bg-slate-900/40 border border-slate-700/80 rounded-2xl p-4 space-y-0">
              <Toggle
                label="Table Reservation & Online Booking Enabled"
                sub="Allows guests to reserve tables online through the customer portal"
                val={s.tableBookingEnabled}
                onChange={(v) => u({ tableBookingEnabled: v })}
              />
              <Toggle
                label="Takeaway & Parcel Orders Enabled"
                sub="Accept pickup and parcel orders alongside regular dine-in guests"
                val={s.takeawayEnabled}
                onChange={(v) => u({ takeawayEnabled: v })}
              />
              <Toggle
                label="Audio Chime on New Orders"
                sub="Plays high-audibility chime when a customer places an order"
                val={s.orderAlertSound}
                onChange={(v) => u({ orderAlertSound: v })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={lc}>Max Advance Booking Window (Days)</label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  className={ic}
                  value={s.maxAdvanceBookingDays}
                  onChange={(e) => u({ maxAdvanceBookingDays: e.target.value })}
                />
              </div>

              <div>
                <label className={lc}>Minimum Order Value (₹)</label>
                <input
                  type="number"
                  min="0"
                  className={ic}
                  value={s.minOrderValue}
                  onChange={(e) => u({ minOrderValue: e.target.value })}
                  placeholder="0 (No minimum)"
                />
              </div>

              <div>
                <label className={lc}>Auto-Resolve Waiter Service Calls (Minutes)</label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  className={ic}
                  value={s.autoResolveServiceCallMins}
                  onChange={(e) => u({ autoResolveServiceCallMins: e.target.value })}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs text-slate-400 font-medium">
                    Alert Volume: <span className="text-white font-bold">{s.alertVolume}%</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleTestAudio}
                    className="text-[10px] font-bold text-orange-400 hover:text-orange-300 flex items-center gap-1 cursor-pointer"
                  >
                    <Volume2 className="w-3 h-3" /> Test Sound
                  </button>
                </div>
                <div className="flex items-center space-x-3 mt-2">
                  <VolumeX className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="range"
                    min="0"
                    max="100"
                    className="flex-1 accent-orange-500 cursor-pointer"
                    value={s.alertVolume}
                    onChange={(e) => u({ alertVolume: e.target.value })}
                  />
                  <Volume2 className="w-4 h-4 text-slate-400 shrink-0" />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Btn section="OPERATIONS" />
            </div>
          </div>
        );

      case 'THEME':
        return (
          <div className="space-y-5">
            <Hdr
              icon={Palette}
              title="Display & Theme"
              sub="Select your preferred UI appearance. Theme changes apply live across the whole application."
              color="text-pink-400"
            />

            <div>
              <label className="block text-xs text-slate-400 mb-3 font-bold tracking-wider">APP THEME</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    key: 'DARK' as AppTheme,
                    label: 'Dark Mode',
                    icon: Moon,
                    desc: 'Optimized for low-light kitchens and night shifts to reduce eye strain.',
                    preview: 'bg-slate-900 border-slate-700'
                  },
                  {
                    key: 'LIGHT' as AppTheme,
                    label: 'Light Mode',
                    icon: Sun,
                    desc: 'High contrast for bright daylight counters and outdoor cashier stations.',
                    preview: 'bg-white border-slate-300'
                  },
                  {
                    key: 'SYSTEM' as AppTheme,
                    label: 'System Adaptive',
                    icon: Monitor,
                    desc: 'Automatically matches your Windows/Mac/Android system appearance.',
                    preview: 'bg-gradient-to-br from-slate-900 to-slate-200 border-slate-500'
                  }
                ].map(({ key, label, icon: Icon, desc, preview }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setAppTheme(key)}
                    className={`p-4 rounded-2xl border-2 text-left transition cursor-pointer ${
                      appTheme === key
                        ? 'border-orange-500 bg-orange-500/10'
                        : 'border-slate-700 bg-slate-900/40 hover:border-slate-600'
                    }`}
                  >
                    <div className={`w-full h-10 rounded-xl mb-3 border ${preview}`} />
                    <div className="flex items-center space-x-2 mb-1">
                      <Icon className={`w-4 h-4 ${appTheme === key ? 'text-orange-400' : 'text-slate-400'}`} />
                      <span className={`font-black text-sm ${appTheme === key ? 'text-white' : 'text-slate-300'}`}>
                        {label}
                      </span>
                      {appTheme === key && (
                        <span className="px-1.5 py-0.5 bg-orange-500 text-white text-[9px] rounded-full font-bold">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Display Capabilities */}
            <div className="bg-slate-900/40 border border-slate-700/80 rounded-2xl p-4 space-y-3">
              <div className="text-xs font-bold text-slate-300">TERMINAL SYNC & STATUS</div>
              <div className="flex items-center justify-between text-sm border-b border-slate-800 pb-3">
                <div>
                  <div className="font-semibold text-white">WebSocket Real-Time Engine</div>
                  <div className="text-xs text-slate-400 mt-0.5">Instant sub-100ms sync for kitchen & billing</div>
                </div>
                <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded-full font-bold border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Live Connected
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div>
                  <div className="font-semibold text-white">Background Fail-Safe Polling</div>
                  <div className="text-xs text-slate-400 mt-0.5">4-second heartbeat sync for unstable Wi-Fi</div>
                </div>
                <span className="px-2.5 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full font-bold border border-blue-500/30">
                  Active (4s)
                </span>
              </div>
            </div>

            <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl text-xs text-orange-200">
              💡 <strong>Instant Application</strong> — Theme preferences are saved per device and apply immediately.
            </div>

            <div className="flex justify-end">
              <Btn section="THEME" />
            </div>
          </div>
        );

      case 'NOTIFICATIONS':
        return (
          <div className="space-y-5">
            <Hdr
              icon={Bell}
              title="Notifications & Alerts"
              sub="Configure Chrome desktop alerts, sound chimes, and SMS notifications for new orders and low inventory."
              color="text-sky-400"
            />

            {/* Desktop / Chrome Notifications Card */}
            <div className="p-4 bg-slate-900/60 border border-slate-700/80 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">Chrome & Desktop Push Notifications</h4>
                    <p className="text-xs text-slate-400">
                      Pop-up alert banners on your desktop even when DINEDECK is in the background
                    </p>
                  </div>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    browserNotificationPerm === 'granted'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : browserNotificationPerm === 'denied'
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  {browserNotificationPerm === 'granted'
                    ? '✓ Enabled'
                    : browserNotificationPerm === 'denied'
                    ? '✗ Blocked in Chrome'
                    : '⚠ Action Required'}
                </span>
              </div>

              <div className="flex items-center space-x-2 pt-1">
                {browserNotificationPerm !== 'granted' ? (
                  <button
                    type="button"
                    onClick={handleRequestNotificationPerm}
                    className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Enable Chrome Notifications
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendTestNotification}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Bell className="w-3.5 h-3.5 text-sky-400" />
                    <span>Send Test Notification</span>
                  </button>
                )}
              </div>
            </div>

            {/* Notification Event Toggles */}
            <div className="bg-slate-900/40 border border-slate-700/80 rounded-2xl p-4 space-y-0">
              <Toggle
                label="New Table Booking Alert"
                sub="Notify floor captain when an online reservation is placed"
                val={s.newBookingAlert}
                onChange={(v) => u({ newBookingAlert: v })}
              />
              <Toggle
                label="Critical Low Stock SMS Notification"
                sub="Send automated SMS alert to owner's mobile when items deplete"
                val={s.criticalStockSms}
                onChange={(v) => u({ criticalStockSms: v })}
              />
            </div>

            {/* 10-Digit SMS Recipient */}
            {s.criticalStockSms && (
              <div>
                <label className={lc}>SMS Alert Mobile Number (10 Digits)</label>
                <div className="flex items-center space-x-2">
                  <span className="px-3 py-2.5 bg-slate-900/70 border border-slate-700 rounded-xl text-slate-300 text-sm font-mono font-bold">
                    +91
                  </span>
                  <input
                    type="tel"
                    maxLength={10}
                    className={`${ic} font-mono font-bold`}
                    value={s.criticalStockSmsNumber}
                    onChange={(e) => handlePhoneChange('criticalStockSmsNumber', e.target.value)}
                    placeholder="9820012345"
                  />
                </div>
                <div className="mt-1 text-[11px]">
                  {s.criticalStockSmsNumber.length === 10 ? (
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Valid 10-digit mobile number
                    </span>
                  ) : (
                    <span className="text-rose-400">
                      ⚠ Exactly 10 digits required ({10 - s.criticalStockSmsNumber.length} left)
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={lc}>Low Stock Alert Threshold (Portions)</label>
                <input
                  type="number"
                  min="1"
                  className={ic}
                  value={s.lowStockAlertThreshold}
                  onChange={(e) => u({ lowStockAlertThreshold: e.target.value })}
                  placeholder="5"
                />
              </div>

              <div>
                <label className={lc}>KDS Overdue Cook Alert (Minutes)</label>
                <input
                  type="number"
                  min="5"
                  className={ic}
                  value={s.kdsOverdueAlertMins}
                  onChange={(e) => u({ kdsOverdueAlertMins: e.target.value })}
                  placeholder="15"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Btn section="NOTIFICATIONS" />
            </div>
          </div>
        );

      case 'SECURITY':
        return (
          <div className="space-y-5">
            <Hdr
              icon={Lock}
              title="Security & Manager PINs"
              sub="Prevent unauthorized bill cancellations, fraudulent voids, and excessive discount overrides."
              color="text-rose-400"
            />
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start space-x-2.5 text-xs">
              <Shield className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="text-rose-200">
                <strong>Revenue Protection:</strong> Manager PIN prevents staff from voiding settled bills or
                applying arbitrary discounts without supervisory approval.
              </div>
            </div>

            <div className="bg-slate-900/40 border border-slate-700/80 rounded-2xl p-4 space-y-0">
              <Toggle
                label="Require Manager PIN to Void / Cancel a Bill"
                sub="Prevents unauthorized deletion of customer invoices"
                val={s.pinForBillVoid}
                onChange={(v) => u({ pinForBillVoid: v })}
              />
              <Toggle
                label="Require Manager PIN for Discounts Above Threshold"
                sub="Cashier can only give up to the free discount limit without manager approval"
                val={s.pinForDiscount}
                onChange={(v) => u({ pinForDiscount: v })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(s.pinForBillVoid || s.pinForDiscount) && (
                <div>
                  <label className={lc}>Manager Override PIN (4–6 Digits)</label>
                  <div className="relative">
                    <input
                      type={showVoidPin ? 'text' : 'password'}
                      className={`${ic} font-mono pr-10`}
                      value={s.voidPin}
                      onChange={(e) => u({ voidPin: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                      placeholder="••••"
                      maxLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowVoidPin(!showVoidPin)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                    >
                      {showVoidPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {s.pinForDiscount && (
                <div>
                  <label className={lc}>Free Discount Limit (% — No PIN Required Below This)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className={ic}
                    value={s.discountPinThreshold}
                    onChange={(e) => u({ discountPinThreshold: e.target.value })}
                    placeholder="10"
                  />
                </div>
              )}

              <div>
                <label className={lc}>Auto-Logout Idle Timer (Minutes)</label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  className={ic}
                  value={s.autoLogoutMins}
                  onChange={(e) => u({ autoLogoutMins: e.target.value })}
                  placeholder="30"
                />
              </div>

              <div>
                <label className={lc}>View-Only Reports Password (For CA / Auditor)</label>
                <input
                  type="password"
                  className={ic}
                  value={s.viewOnlyPassword}
                  onChange={(e) => u({ viewOnlyPassword: e.target.value })}
                  placeholder="Set audit read-only password"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Btn section="SECURITY" />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full min-h-0">
      {/* Left Sidebar Navigation */}
      <aside className="w-full lg:w-60 shrink-0 space-y-1">
        <div className="mb-4">
          <h2 className="text-lg font-black text-white tracking-tight">Settings</h2>
          <p className="text-xs text-slate-400 mt-0.5">Restaurant & Terminal Preferences</p>
        </div>

        <div className="flex lg:flex-col overflow-x-auto lg:overflow-visible gap-1 pb-2 lg:pb-0 custom-scrollbar">
          {SETTINGS_NAV.map(({ key, label, icon: Icon, color }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveSection(key)}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-left transition text-sm font-semibold shrink-0 cursor-pointer ${
                activeSection === key
                  ? 'bg-slate-700/80 text-white border border-slate-600 shadow-sm'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${activeSection === key ? color : 'text-slate-500'}`} />
              <span className="truncate">{label}</span>
            </button>
          ))}
        </div>
      </aside>

      {/* Main Settings Content Panel */}
      <div className="flex-1 min-w-0 bg-[#1E293B] border border-slate-700/80 rounded-2xl p-6 shadow-xl overflow-y-auto">
        {renderSection()}
      </div>
    </div>
  );
};

